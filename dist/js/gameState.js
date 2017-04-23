const DEFAULT_FONT = 'Courier New';
const DEFAULT_FONT_ALIGN = 'start';
const DEFAULT_FONT_COLOR = '#00ff00';
const DEFAULT_FONT_SIZE = 11;
// 30 second day timers
const DEFAULT_DAY_DURATION = 90000;

var player;
var gameObjects;
var cursors;
var map;
var layer;
// Habitat/Tile variables
var habitats;
var habitatsGroup;
var habitatNames;
// Uses fsm to handle game looping
var currFSMState;
var scoreController;

function makeText(text, x, y, size = undefined) {
  var newText = game.add.text(x, y, text);
  newText.font = 'Indie Flower';
  newText.lineSpacing = -10;
  newText.fontSize = size || 14;
  return newText;
}
class GameState extends BaseState {
  preload() {
    game.load.spritesheet('super-legit-menu', 'assets/sprites/super-legit-menu.png', 256, 128, 2);
    game.load.spritesheet('super-legit-button', 'assets/sprites/super-legit-button.png', 128, 32, 1);
    game.load.spritesheet('order-bar', 'assets/sprites/order-bar.png', 32, 54, 1);
    game.load.spritesheet('player', 'assets/sprites/player.png', 16, 16, 8);
    game.load.spritesheet('tiles', 'assets/sprites/tiles.png', 32, 32, 16);
    game.load.spritesheet('timer', 'assets/sprites/timer.png', 32, 32, 16);
    game.load.spritesheet('fish', 'assets/sprites/fish.png', 16, 16, 16);
    game.load.spritesheet('rain', 'assets/sprites/rain.png', 8, 8);
    game.load.tilemap('map', 'assets/maps/mainmap.csv', null, Phaser.Tilemap.CSV);
    game.load.text('habitat_clusters', 'assets/maps/habitat_clusters.csv');
  }
  create() {
    gameObjects = [];
    scoreController = new ScoreController();

    // Create cursor keys
    cursors = game.input.keyboard.createCursorKeys();

    // Create the physics
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.skipQuadTree = false;

    // Create the tile map
    map = game.add.tilemap('map', 32, 32);
    map.addTilesetImage('tiles');
    layer = map.createLayer(0);
    layer.resizeWorld();
    for (var tIdx in TILES) {
      if (TILES[tIdx].collide) {
        map.setCollision(TILES[tIdx].tileIndex);
      }
    }
    this.createFishHabitats();

    // Make a rain emitter for flavortown
    var rainEmitter = game.add.emitter(game.world.centerX, 0, 4000);
    rainEmitter.width = game.world.width;
    rainEmitter.makeParticles('rain');
    rainEmitter.setXSpeed(-10, 10);
    rainEmitter.setYSpeed(300, 500);
    rainEmitter.minParticleScale = 0.1;
    rainEmitter.maxParticleScale = 0.5;
    rainEmitter.minRotation = rainEmitter.maxRotation = 0;
    // rainEmitter.start(false, 1600, 0, 0);
    rainEmitter.flow(1600, 16, 5, -1);
    this.rainEmitter = rainEmitter;

    // Create the player
    player = new Player();
    gameObjects.push(player);
    game.camera.follow(player.sprite);
    currFSMState = this.buildStateGraph();
    currFSMState.enter();
  }

  // Builds the entire gameplay loop
  buildStateGraph() {
    var dayStartGetOrder = new FSMState('daystart:neworder',
      () => {},
      function() {
        // Create the order window
        console.log('entering daystart:neworder');
        var _this = this;
        dayStartGetOrder.readyToGo = false;
        var orders = scoreController.makeOrders();
        // This is *super* busy and pretty lame. It should just have raw sprite images instead.
        // That's for polish step
        this.keyAccept = game.input.keyboard.addKey(Phaser.Keyboard.F);
        var _this = this;
        this.keyAccept.onDown.add(function(event) {
          _this.readyToGo = true;
        }, this);

        var ordersText = '';
        for (var oIdx = 0; oIdx < orders.length; oIdx++) {
          var currOrder = orders[oIdx];
          ordersText += sprintf('%s: %s\n', currOrder.name, currOrder.ingredients.join(', '));
        }
        var totals = scoreController.currentTotals;
        ordersText += sprintf('%s\n', JSON.stringify(totals));
        this.header = game.add.sprite(WIDTH * 0.5, 30, 'super-legit-menu', 1);
        this.header.pivot.set(this.header.width * 0.5, 0);
        this.headerText = makeText('Today\'s Orders', WIDTH * 0.5, this.header.position.y + 10, 14);
        this.headerText.anchor.x = 0.5;
        this.menu = game.add.sprite(WIDTH * 0.5, this.header.position.y + 30, 'super-legit-menu');
        this.menu.pivot.set(this.menu.width * 0.5, 0);
        this.button = game.add.button(WIDTH * 0.5, this.menu.y + 128, 'super-legit-button', function() {
          _this.readyToGo = true;
        });
        this.menuText = makeText(ordersText,
          10 + this.menu.position.x - this.menu.pivot.x,
          10 + this.menu.position.y - this.menu.pivot.y
        );

        this.button.pivot.set(this.button.width * 0.5, 0);
        this.buttonText = makeText('Press F to Continue', WIDTH * 0.5, this.button.y + 7);
        this.buttonText.anchor.x = 0.5;
      },
      function() {
        // Kill the order window
        console.log('exiting daystart:neworder');
        dayStartGetOrder.readyToGo = false;
        this.header.destroy();
        this.header = null;
        this.headerText.destroy();
        this.headerText = null;
        this.menu.destroy();
        this.menu = null;
        this.menuText.destroy();
        this.menuText = null;
        this.button.destroy();
        this.button = null;
        this.buttonText.destroy();
        this.buttonText = null;
        this.readyToGo = false;
        this.keyAccept.reset();
      });

    var dayStartGetSpawnReport = new FSMState('daystart:getspawnreport',
      function() {},
      function() {
        console.log('Entering getspawnreport');
        this.readyToGo = false;
        var spawnResults = [];
        // Add a key listener on this for setting readyToGo to true
        this.keyAccept = game.input.keyboard.addKey(Phaser.Keyboard.F);
        var _this = this;
        this.keyAccept.onDown.add(function(event) {
          _this.readyToGo = true;
        }, this);

        for (var hIdx = 0; hIdx < habitats.length; hIdx++) {
          var newResult = habitats[hIdx].spawnFish();
          spawnResults.push(newResult);
        }
        // Create spawn report window
        // This is *super* busy and pretty lame. It should just have raw sprite images instead.
        // That's for polish step
        this.header = game.add.sprite(WIDTH * 0.5, 30, 'super-legit-menu', 1);
        this.header.pivot.set(this.header.width * 0.5, 0);
        this.headerText = makeText('Fish Spawn Report', WIDTH * 0.5, this.header.position.y + 10, 14);
        this.headerText.anchor.x = 0.5;
        this.menu = game.add.sprite(WIDTH * 0.5, this.header.position.y + 30, 'super-legit-menu');
        this.menu.pivot.set(this.menu.width * 0.5, 0);
        var reportText = '';
        for (var resultIdx = 0; resultIdx < spawnResults.length; resultIdx++) {
          var currResult = spawnResults[resultIdx];
          var joinedReportStr = '';
          for (var jrsIdx = 0; jrsIdx < currResult.results.length; jrsIdx++) {
            var latest = currResult.results[jrsIdx];
            joinedReportStr += sprintf('%s: %d (+%d), ', latest.fishType, latest.reports.count, latest.reports.deltaFish);
          }
          reportText += sprintf('%s:\n%s\n', currResult.groupName, joinedReportStr);
        }
        this.menuText = makeText(reportText,
          10 + this.menu.position.x - this.menu.pivot.x,
          10 + this.menu.position.y - this.menu.pivot.y);
        this.button = game.add.button(WIDTH * 0.5, this.menu.y + 128, 'super-legit-button', function() {
          _this.readyToGo = true;
        });
        this.button.pivot.set(this.button.width * 0.5, 0);
        this.buttonText = makeText('Press F to Start', WIDTH * 0.5, this.button.y + 7);
        this.buttonText.anchor.x = 0.5;
      },
      function() {
        // Kill all the windows
        console.log('Exiting getspawnreport');
        this.header.destroy();
        this.header = null;
        this.headerText.destroy();
        this.headerText = null;
        this.menu.destroy();
        this.menu = null;
        this.menuText.destroy();
        this.menuText = null;
        this.button.destroy();
        this.button = null;
        this.buttonText.destroy();
        this.buttonText = null;
        this.readyToGo = false;
        this.keyAccept.reset();
      });

    var dayPhaseFishing = new FSMState('daystate:fishing',
      function() {
        for (var i = gameObjects.length - 1; i >= 0; i--) {
          gameObjects[i].update();
        }
        this.completed = this.clock.update();
        if (this.timeLastOrderBarCalculated + 2500 < Date.now()) {
          this.orderBarText.text = this.calculateOrderBarTextString();
        }
      },
      // Because we reference 'this', we need to use an anonymous function instead of a lambda
      function() {
        // This assumes it's in order 1,2,3. Do not change or you'll be in dire straights
        this.calculateOrderBarTextString = function() {
          // Prevent it from being too laggy
          this.timeLastOrderBarCalculated = Date.now();
          var orders = scoreController.currentTotals
          var currentInventory = scoreController.currentInventory;
          var fish1Delta = Math.max(orders[FISH_TYPE_1] - currentInventory[FISH_TYPE_1], 0);
          var fish2Delta = Math.max(orders[FISH_TYPE_2] - currentInventory[FISH_TYPE_2], 0);
          var fish3Delta = Math.max(orders[FISH_TYPE_3] - currentInventory[FISH_TYPE_3], 0);
          return sprintf('%d\n%d\n%d', fish1Delta, fish2Delta, fish3Delta);
        };
        // Create timer
        this.clock = new Timer(DEFAULT_DAY_DURATION);
        player.activate();
        // Create the order bar
        this.orderBar = game.add.sprite(0, HEIGHT - 60, 'order-bar');
        this.orderBarSpriteGroup = game.add.group();
        var fish1 = game.add.sprite(0, 0, 'fish', FishHabitat.getFishSpriteIndex(FISH_TYPE_1));
        this.orderBarSpriteGroup.add(fish1);
        var fish2 = game.add.sprite(0, 0, 'fish', FishHabitat.getFishSpriteIndex(FISH_TYPE_2));
        this.orderBarSpriteGroup.add(fish2);
        var fish3 = game.add.sprite(0, 0, 'fish', FishHabitat.getFishSpriteIndex(FISH_TYPE_3));
        this.orderBarSpriteGroup.add(fish3);
        this.orderBarSpriteGroup.align(1, -1, 16, 16, Phaser.CENTER);
        this.orderBarSpriteGroup.position.set(this.orderBar.x + 3, this.orderBar.y + 3);
        var orderBarTextString = this.calculateOrderBarTextString();
        this.orderBarText = makeText(orderBarTextString,
          this.orderBarSpriteGroup.position.x + 17,
          this.orderBarSpriteGroup.position.y
        );
        this.orderBarText.lineSpacing = -7;
      },
      function() {
        // Kill timer
        console.log('Exiting fishing');
        this.clock.destroy();
        this.clock = null;
        player.deactivate();
        // Destroy the order bar
        this.orderBar.destroy();
        this.orderBar = null;
        this.orderBarSpriteGroup.destroy();
        this.orderBarSpriteGroup = null;
        this.orderBarText.destroy();
        this.orderBarText = null;
      });

    var openStoreConsumeOrders = new FSMState('openstore:consume',
      () => {},
      () => {
        console.log('Entering store consume');
      },
      () => {
        console.log('Exiting store consume');
      });

    var openStoreGetPaid = new FSMState('openstore:getpaid',
      () => {},
      () => {},
      () => {});

    dayStartGetOrder.addEdge(dayStartGetSpawnReport, function() {
      return dayStartGetOrder.readyToGo;
    });
    dayStartGetSpawnReport.addEdge(dayPhaseFishing, function() {
      return dayStartGetSpawnReport.readyToGo;
    });
    dayPhaseFishing.addEdge(openStoreConsumeOrders, function() {
      return dayPhaseFishing.completed;
    });
    openStoreConsumeOrders.addEdge(openStoreGetPaid, () => true);
    openStoreGetPaid.addEdge(dayStartGetOrder, () => true);

    return dayStartGetOrder;
  }
  createFishHabitats() {
    habitats = [];
    habitatNames = {};
    // Map each group of habitats into groups based on the habitat_clusters
    var habitatClusterKeys = {};
    var habitatClustersCSV = game.cache.getText('habitat_clusters');
    var habitatClustersArray = habitatClustersCSV.split('\n');
    // Yeee #LDJAM
    var habitatNamesTuples = habitatClustersArray.shift().replace('#names#', '').split(',').map((item) => item.split(':'));
    for (var nameIdx = 0; nameIdx < habitatNamesTuples.length; nameIdx++) {
      var habitatId = habitatNamesTuples[nameIdx][0].trim();
      var habitatName = habitatNamesTuples[nameIdx][1].trim();
      habitatNames[habitatId] = habitatName;
    }
    for (var hCAY = 0; hCAY < habitatClustersArray.length; ++hCAY) {
      var habitatClustersLine = habitatClustersArray[hCAY].split(',').map((item) => item.trim());
      if (habitatClustersLine.length <= 1) continue;
      for (var hCAX = 0; hCAX < habitatClustersLine.length; hCAX++) {
        var groupId = habitatClustersLine[hCAX];
        if (groupId !== '_') {
          if (!habitatClusterKeys[groupId]) habitatClusterKeys[groupId] = [];
          habitatClusterKeys[groupId].push({
            x: hCAX,
            y: hCAY
          });
        }
      }
    }
    habitatsGroup = game.add.group();
    for (var habitatGroupKey in habitatClusterKeys) {
      var clusterTileIdxs = habitatClusterKeys[habitatGroupKey];
      var tilesInGroup = [];
      for (var i = 0; i < clusterTileIdxs.length; i++) {
        var tilePosition = clusterTileIdxs[i]
        tilesInGroup.push(map.getTile(tilePosition.x, tilePosition.y));
      }
      var newHabitat = new FishHabitat(tilesInGroup, habitatGroupKey);
      habitats.push(newHabitat);
      habitatsGroup.add(newHabitat.group);
    }
  }
  update() {
    game.physics.arcade.collide(player.sprite, layer);
    for (var habIdx = 0; habIdx < habitats.length; habIdx++) {
      game.physics.arcade.collide(player.sprite, habitats[habIdx].sprite);
    }
    if (currFSMState) {
      currFSMState = currFSMState.update()
    }
    drawText(0, 10, sprintf('Current State: %s', currFSMState.id));
  }
  render() {
    // Just leaving this in here for debug text
    // game.debug.text('', 0, 0);
    // game.debug.body(player.sprite);
  }
}

function drawText(x, y, message, options = {}) {
  var bmd = game.debug.bmd;
  bmd.ctx.font = sprintf("%spx %s", (options['size'] || DEFAULT_FONT_SIZE), DEFAULT_FONT);
  bmd.ctx.textAlign = options['align'] || DEFAULT_FONT_ALIGN;
  bmd.ctx.fillStyle = 'black';
  bmd.ctx.fillText(message, x + 1, y + 1);
  bmd.ctx.fillStyle = options['color'] || DEFAULT_FONT_COLOR;
  bmd.ctx.fillText(message, x, y);
}
