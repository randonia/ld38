const PLAYER_SPEED = 150.0;
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
  }
  update() {
    var dir = {
      x: (cursors.left.isDown) ? -1 : (cursors.right.isDown) ? 1 : 0,
      y: (cursors.up.isDown) ? -1 : (cursors.down.isDown) ? 1 : 0,
    }
    this.sprite.body.velocity.x = dir.x * PLAYER_SPEED;
    this.sprite.body.velocity.y = dir.y * PLAYER_SPEED;
    var textOpts = {
      align: 'left'
    };
    drawText(0, HEIGHT - 20, sprintf('Player Position: {%d, %d}', this.X, this.Y), textOpts);
  }
}
