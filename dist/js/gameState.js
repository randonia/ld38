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
var fadeSprite;
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

function fadeScreen(toAlpha, duration = 500) {
  game.add.tween(fadeSprite).to({
    alpha: toAlpha
  }, duration, 'Linear', true);
}
class GameState extends BaseState {
  preload() {
    game.load.spritesheet('progress-bar-vertical', 'assets/sprites/progress-bar-vertical.png', 16, 96, 1);
    game.load.spritesheet('super-legit-button', 'assets/sprites/super-legit-button.png', 128, 32, 1);
    game.load.spritesheet('super-legit-menu', 'assets/sprites/super-legit-menu.png', 256, 128, 2);
    game.load.spritesheet('fishing-rod-zone', 'assets/sprites/fishing-rod-zone.png', 11, 32, 1);
    game.load.spritesheet('order-bar', 'assets/sprites/order-bar.png', 32, 54, 1);
    game.load.spritesheet('player', 'assets/sprites/player.png', 16, 16, 8);
    game.load.spritesheet('tiles', 'assets/sprites/tiles.png', 32, 32, 16);
    game.load.spritesheet('timer', 'assets/sprites/timer.png', 32, 32, 16);
    game.load.spritesheet('fish', 'assets/sprites/fish.png', 16, 16, 16);
    game.load.spritesheet('rain', 'assets/sprites/rain.png', 8, 8);
    game.load.tilemap('map', 'assets/maps/mainmap.csv', null, Phaser.Tilemap.CSV);
    game.load.text('habitat_clusters', 'assets/maps/habitat_clusters.csv');
    game.time.advancedTiming = true;
  }
  create() {
    gameObjects = [];
    scoreController = new ScoreController();

    this.fpsText = game.add.text(WIDTH - 40, HEIGHT - 10, 'FPS');
    this.fpsText.fontSize = 10;
    this.fpsText.fill = 'white';
    this.fpsText.setShadow(1, 1, 'black', 1);
    this.fpsText.font = 'Courier New';
    this.fpsText.fixedToCamera = true;
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
    this.fadeBMPd = game.add.bitmapData(WIDTH, HEIGHT);
    // Draw random background?
    this.fadeBMPd.ctx.fillRect(0, 0, WIDTH, HEIGHT);
    fadeSprite = game.add.sprite(0, 0, this.fadeBMPd);
    fadeSprite.alpha = 0.9;
    fadeSprite.fixedToCamera = true;
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
      function() {},
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
        fadeScreen(0.9);
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

        fadeScreen(0.9);
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
        if (this.fishingGame) {
          this.fishingGame.update();
        }
      },
      // Because we reference 'this', we need to use an anonymous function instead of a lambda
      function() {
        // Skip day function helper
        this.skipDayFunc = function() {
          // You must press it twice in under 1/2 a second to skip
          if (!this.skipDayLastSkipPress) {
            this.skipDayLastSkipPress = Date.now();
            return;
          }
          var timeSinceLastPress = Date.now() - this.skipDayLastSkipPress;
          this.skipDayLastSkipPress = Date.now();
          console.log(sprintf('Day Skip Double Tap: %s', timeSinceLastPress));
          if (timeSinceLastPress < 250) {
            this.clock.duration = 300;
            // Make sure we don't duplicate
            this.skipDayLastSkipPress = undefined;
            this.skipDayAction.reset();
          }
        }
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
        this.orderBar.fixedToCamera = true;
        var fishY = HEIGHT - 56;
        var fish1 = game.add.sprite(5, fishY, 'fish', FishHabitat.getFishSpriteIndex(FISH_TYPE_1));
        fish1.fixedToCamera = true;
        fishY += 15;
        var fish2 = game.add.sprite(5, fishY, 'fish', FishHabitat.getFishSpriteIndex(FISH_TYPE_2));
        fish2.fixedToCamera = true;
        fishY += 15;
        var fish3 = game.add.sprite(5, fishY, 'fish', FishHabitat.getFishSpriteIndex(FISH_TYPE_3));
        fish3.fixedToCamera = true;
        var orderBarTextString = this.calculateOrderBarTextString();
        this.orderBarText = makeText(orderBarTextString,
          20,
          HEIGHT - 58
        );
        this.orderBarText.fixedToCamera = true;
        this.orderBarText.lineSpacing = -7;

        // Bind T to force end the day - testing but also in case you're done fishing
        this.skipDayAction = game.input.keyboard.addKey(Phaser.Keyboard.T);
        this.skipDayAction.onDown.add(this.skipDayFunc, this);
        this.skipDayLastSkipPress = undefined;
        fadeScreen(0);
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
        this.skipDayLastSkipPress = undefined;
        this.skipDayAction.reset();
        this.skipDayAction = null;
        fadeScreen(0.9);
      });

    var openStoreConsumeOrders = new FSMState('openstore:consume',
      () => {},
      function() {
        console.log('Entering store consume');
        var failedOrders = [];
        var fulfilledOrders = [];
        // Grab all the current orders
        var orders = scoreController.currentOrders.slice();
        // Sort them by fewest ingredients so we don't have to deal with anything annoying
        orders.sort((l, r) => l.ingredients.length - r.ingredients.length)
        for (var oIdx = 0; oIdx < orders.length; oIdx++) {
          var currOrder = orders[oIdx];
          if (scoreController.checkOrder(currOrder)) {
            fulfilledOrders.push(currOrder);
          } else {
            failedOrders.push(currOrder);
          }
        }
        // Tally up the scores
        console.log('Tally: success: ', fulfilledOrders);
        console.log('Tally: failures: ', failedOrders);

        // Create order results
        // This is *super* busy and pretty lame. It should just have raw sprite images instead.
        // That's for polish step
        this.header = game.add.sprite(WIDTH * 0.5, 30, 'super-legit-menu', 1);
        this.header.pivot.set(this.header.width * 0.5, 0);
        this.headerText = makeText('Order Fulfillment Report', WIDTH * 0.5, this.header.position.y + 10, 14);
        this.headerText.anchor.x = 0.5;
        this.menu = game.add.sprite(WIDTH * 0.5, this.header.position.y + 30, 'super-legit-menu');
        this.menu.pivot.set(this.menu.width * 0.5, 0);
        var reportText = '';
        for (var ffOrderIdx = 0; ffOrderIdx < fulfilledOrders.length; ffOrderIdx++) {
          var order = fulfilledOrders[ffOrderIdx];
          reportText += sprintf('Fulfilled: %s\'s order\n', order.name);
        }
        for (var failOrderIdx = 0; failOrderIdx < failedOrders.length; failOrderIdx++) {
          var order = failedOrders[failOrderIdx];
          reportText += sprintf('Failed: %s\'s order\n', order.name);
        }

        var _this = this;
        this.menuText = makeText(reportText,
          10 + this.menu.position.x - this.menu.pivot.x,
          10 + this.menu.position.y - this.menu.pivot.y);
        this.button = game.add.button(WIDTH * 0.5, this.menu.y + 128, 'super-legit-button', function() {
          _this.readyToGo = true;
        });
        this.button.pivot.set(this.button.width * 0.5, 0);
        this.buttonText = makeText('Press F to Start', WIDTH * 0.5, this.button.y + 7);
        this.buttonText.anchor.x = 0.5;

        // Add a key listener on this for setting readyToGo to true
        this.keyAccept = game.input.keyboard.addKey(Phaser.Keyboard.F);
        var _this = this;
        this.keyAccept.onDown.add(function(event) {
          _this.readyToGo = true;
        }, this);
        fadeScreen(0.9);
      },
      function() {
        console.log('Exiting store consume');
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

    dayStartGetOrder.addEdge(dayStartGetSpawnReport, function() {
      return dayStartGetOrder.readyToGo;
    });
    dayStartGetSpawnReport.addEdge(dayPhaseFishing, function() {
      return dayStartGetSpawnReport.readyToGo;
    });
    dayPhaseFishing.addEdge(openStoreConsumeOrders, function() {
      return dayPhaseFishing.completed;
    });
    openStoreConsumeOrders.addEdge(dayStartGetOrder, function() {
      return openStoreConsumeOrders.readyToGo;
    });

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
    this.fpsText.bringToTop();
    this.fpsText.text = sprintf('FPS %d', game.time.fps);
    game.physics.arcade.collide(player.sprite, layer);
    for (var habIdx = 0; habIdx < habitats.length; habIdx++) {
      game.physics.arcade.collide(player.sprite, habitats[habIdx].sprite);
    }
    if (currFSMState) {
      currFSMState = currFSMState.update();
      drawText(0, 10, sprintf('Current State: %s', currFSMState.id));
    }

  }
  render() {
    if (currFSMState) {
      currFSMState.render();
    }
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
