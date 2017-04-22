const DEFAULT_FONT = 'Courier New';
const DEFAULT_FONT_ALIGN = 'start';
const DEFAULT_FONT_COLOR = '#00ff00';
const DEFAULT_FONT_SIZE = 11;

var player;
var player2;
var gameObjects;
var cursors;
class GameState extends BaseState {
  preload() {
    game.load.spritesheet('player', 'assets/sprites/player.png', 16, 16, 1);
  }
  create() {
    cursors = game.input.keyboard.createCursorKeys();
    // Create the physics
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.skipQuadTree = false;
    // Create the player
    gameObjects = [];
    player = new Player();
    gameObjects.push(player);
  }
  update() {
    for (var i = gameObjects.length - 1; i >= 0; i--) {
      gameObjects[i].update();
    }
    game.physics.arcade.collide(player);
  }
  render() {
    game.debug.quadTree(game.physics.arcade.quadTree);
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
