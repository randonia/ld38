const DEFAULT_FONT = 'Courier New';
const DEFAULT_FONT_ALIGN = 'start';
const DEFAULT_FONT_COLOR = '#00ff00';
const DEFAULT_FONT_SIZE = 11;

var player;
var player2;
var gameObjects;
var cursors;
var map;
var layer;
// Uses fsm to handle game looping
var currFSMState;
class GameState extends BaseState {
  preload() {
    game.load.spritesheet('player', 'assets/sprites/player.png', 16, 16, 1);
    game.load.spritesheet('tiles', 'assets/sprites/tiles.png', 32, 32, 16);
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
    for (var tIdx = TILES.length - 1; tIdx >= 0; tIdx--) {
      if (TILES[tIdx].collide) {
        map.setCollision(TILES[tIdx].index);
      }
    }

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
      () => {
        for (var i = gameObjects.length - 1; i >= 0; i--) {
          gameObjects[i].update();
        }

      },
      () => {
        // Create timer
        console.log('Entering fishing');
      },
      () => {
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

    dayStartGetOrder.addEdge(dayStartGetSpawnReport, () => false);
    dayStartGetSpawnReport.addEdge(dayPhaseFishing, () => false);
    dayPhaseFishing.addEdge(openStoreConsumeOrders, () => false);
    openStoreConsumeOrders.addEdge(openStoreGetPaid, () => false);
    openStoreGetPaid.addEdge(dayStartGetOrder, () => false);

    return dayStartGetOrder;
  }
  update() {
    game.physics.arcade.collide(player.sprite, layer);
    if (currFSMState) {
      currFSMState = currFSMState.update()
    }
    drawText(0, 10, sprintf('Current State: %s', currFSMState.id));
  }
  render() {
    game.debug.quadTree(game.physics.arcade.quadTree);
    game.debug.body(player.sprite);
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
