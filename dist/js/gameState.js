const DEFAULT_FONT = 'Courier New';
const DEFAULT_FONT_ALIGN = 'start';
const DEFAULT_FONT_COLOR = '#00ff00';
const DEFAULT_FONT_SIZE = 11;
// 30 second day timers
const DEFAULT_DAY_DURATION = 30000;

var player;
var gameObjects;
var cursors;
var map;
var layer;
// Tile variables
var tilesByType;
var habitats;
var habitatsGroup;
// Uses fsm to handle game looping
var currFSMState;
class GameState extends BaseState {
  preload() {
    game.load.spritesheet('player', 'assets/sprites/player.png', 16, 16, 1);
    game.load.spritesheet('tiles', 'assets/sprites/tiles.png', 32, 32, 16);
    game.load.spritesheet('timer', 'assets/sprites/timer.png', 32, 32, 16);
    game.load.spritesheet('fish', 'assets/sprites/fish.png', 16, 16, 16);
    game.load.tilemap('map', 'assets/maps/mainmap.csv', null, Phaser.Tilemap.CSV);
  }
  create() {
    gameObjects = [];

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
    layer.debug = true;
    for (var tIdx in TILES) {
      if (TILES[tIdx].collide) {
        map.setCollision(TILES[tIdx].tileIndex);
      }
    }
    this.createFishHabitats();

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
    openStoreConsumeOrders.addEdge(openStoreGetPaid, () => false);
    openStoreGetPaid.addEdge(dayStartGetOrder, () => false);

    return dayStartGetOrder;
  }
  createFishHabitats() {
    tilesByType = {};
    habitats = [];
    habitatsGroup = game.add.group();
    for (var mapX = 0; mapX < map.width; ++mapX) {
      for (var mapY = 0; mapY < map.height; ++mapY) {
        var tile = map.getTile(mapX, mapY, layer);
        if (!tilesByType[tile.index]) {
          tilesByType[tile.index] = [];
        }
        tilesByType[tile.index].push(tile);
        if (FishHabitat.tileRequiresHabitat(tile)) {
          var newHabitat = new FishHabitat(tile)
          habitats.push(newHabitat);
          habitatsGroup.add(newHabitat.sprite);
        }
      }
    }
  }
  update() {
    game.physics.arcade.collide(player.sprite, layer);
    game.physics.arcade.collide(player.sprite, habitatsGroup);
    if (currFSMState) {
      currFSMState = currFSMState.update()
    }
    drawText(0, 10, sprintf('Current State: %s', currFSMState.id));
  }
  render() {
    game.debug.quadTree(game.physics.arcade.quadTree);
    game.debug.body(player.sprite);
    for (var hIdx = habitats.length - 1; hIdx >= 0; hIdx--) {
      game.debug.body(habitats[hIdx].sprite);
    }
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
