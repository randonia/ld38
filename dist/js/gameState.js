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
// Uses fsm to handle game looping
var currFSMState;
var scoreController;
class GameState extends BaseState {
  preload() {
    game.load.spritesheet('rain', 'assets/sprites/rain.png', 8, 8);
    game.load.spritesheet('player', 'assets/sprites/player.png', 16, 16, 8);
    game.load.spritesheet('tiles', 'assets/sprites/tiles.png', 32, 32, 16);
    game.load.spritesheet('timer', 'assets/sprites/timer.png', 32, 32, 16);
    game.load.spritesheet('fish', 'assets/sprites/fish.png', 16, 16, 16);
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
      () => {
        // Create the order window
        console.log('entering daystart:neworder');
      },
      () => {
        // Kill the order window
        console.log('exiting daystart:neworder');
      });

    var dayStartGetSpawnReport = new FSMState('daystart:getspawnreport',
      () => {},
      () => {
        // Create spawn report window
        console.log('Entering getspawnreport');
      },
      () => {
        // Kill spawn report window
        console.log('Exiting getspawnreport');
      });

    var dayPhaseFishing = new FSMState('daystate:fishing',
      function() {
        for (var i = gameObjects.length - 1; i >= 0; i--) {
          gameObjects[i].update();
        }
        this.completed = this.clock.update();
      },
      // Because we reference 'this', we need to use an anonymous function instead of a lambda
      function() {
        // Create timer
        this.clock = new Timer(DEFAULT_DAY_DURATION);
      },
      function() {
        // Kill timer
        console.log('Exiting fishing');
        this.clock.destroy();
        this.clock = null;
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

    dayStartGetOrder.addEdge(dayStartGetSpawnReport, () => true);
    dayStartGetSpawnReport.addEdge(dayPhaseFishing, () => true);
    dayPhaseFishing.addEdge(openStoreConsumeOrders, function() {
      return dayPhaseFishing.completed;
    });
    openStoreConsumeOrders.addEdge(openStoreGetPaid, () => true);
    openStoreGetPaid.addEdge(dayStartGetOrder, () => true);

    return dayStartGetOrder;
  }
  createFishHabitats() {
    habitats = [];
    // Map each group of habitats into groups based on the habitat_clusters
    var habitatClusterKeys = {};
    var habitatClustersCSV = game.cache.getText('habitat_clusters');
    var habitatClustersArray = habitatClustersCSV.split('\n');
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
      var newHabitat = new FishHabitat(tilesInGroup);
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
