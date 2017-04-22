const PLAYER_SPEED = 50.0;
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
    this.sprite = game.add.sprite(game.world.randomX, game.world.randomY, 'player');
    game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
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
    drawText(600, 10, sprintf('Player Position: {%d, %d}', this.X, this.Y), textOpts);
    drawText(600, 20, sprintf('Player Velocity: {%d, %d}', this.vX, this.vY), textOpts);
  }
}
