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
  }
  update() {
    game.physics.arcade.collide(player.sprite, layer);
    for (var i = gameObjects.length - 1; i >= 0; i--) {
      gameObjects[i].update();
    }
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
