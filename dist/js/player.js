const PLAYER_SPEED = 150.0;
const DIR_UP = 8;
const DIR_DOWN = 2;
const DIR_LEFT = 4;
const DIR_RIGHT = 6;
const CURR_TILE = 5;

class Player {
  get X() {
    return this.sprite.body.position.x;
  }
  get Y() {
    return this.sprite.body.position.y;
  }
  get vX() {
    return this.sprite.body.velocity.x;
  }
  get vY() {
    return this.sprite.body.velocity.y;
  }
  constructor() {
    this.sprite = game.add.sprite(32, 64, 'player');
    game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
    this.sprite.body.collideWorldBounds = true;
    this.directions = {};
  }
  update() {
    this.directions[DIR_UP] = cursors.up.isDown;
    this.directions[DIR_DOWN] = cursors.down.isDown;
    this.directions[DIR_LEFT] = cursors.left.isDown;
    this.directions[DIR_RIGHT] = cursors.right.isDown;
    var dir = {
      x: 0,
      y: 0,
    }
    if (this.directions[DIR_UP]) {
      dir.y -= 1;
    }
    if (this.directions[DIR_DOWN]) {
      dir.y += 1;
    }
    if (this.directions[DIR_LEFT]) {
      dir.x -= 1;
    }
    if (this.directions[DIR_RIGHT]) {
      dir.x += 1;
    }

    this.sprite.body.velocity.x = dir.x * PLAYER_SPEED;
    this.sprite.body.velocity.y = dir.y * PLAYER_SPEED;

    // some sicknasty debugging here
    var textOpts = {
      align: 'left'
    };
    drawText(0, HEIGHT - 20, sprintf('Player Position: {%d, %d}', this.X, this.Y), textOpts);
    var tileX = layer.getTileX(this.X);
    var tileY = layer.getTileY(this.Y);
    var tiles = {
      DIR_LEFT: map.getTileLeft(0, tileX, tileY),
      DIR_RIGHT: map.getTileRight(0, tileX, tileY),
      DIR_UP: map.getTileAbove(0, tileX, tileY),
      DIR_DOWN: map.getTileBelow(0, tileX, tileY),
      CURR_TILE: map.getTile(tileX, tileY, 0)
    }
    var l = (tiles.DIR_LEFT) ? tiles.DIR_LEFT.index : -1;
    var r = (tiles.DIR_RIGHT) ? tiles.DIR_RIGHT.index : -1;
    var a = (tiles.DIR_UP) ? tiles.DIR_UP.index : -1;
    var b = (tiles.DIR_DOWN) ? tiles.DIR_DOWN.index : -1;
    var c = (tiles.CURR_TILE) ? tiles.CURR_TILE.index : -1;
    drawText(0, HEIGHT - 10, sprintf('L: %s R: %s U: %s D: %s C: %s', l, r, a, b, c));
  }
}
