const PLAYER_SPEED = 150.0;
const DIR_UP = 8;
const DIR_DOWN = 2;
const DIR_LEFT = 4;
const DIR_RIGHT = 6;
const CURR_TILE = 5;

var keyAction;

class Player {
  get X() {
    return this.sprite.body.position.x + this.sprite.width * 0.5;
  }
  get Y() {
    return this.sprite.body.position.y + this.sprite.height * 0.5;
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
    this.backpack = new Backpack(3);
    this.directions = {};
    this.facingDirection = DIR_DOWN;
    keyAction = game.input.keyboard.addKey(Phaser.Keyboard.F);
  }
  activate() {
    keyAction.onDown.add(this.actionHandler, this);
  }
  deactivate() {
    this.directions[DIR_UP] = false;
    this.directions[DIR_DOWN] = false;
    this.directions[DIR_LEFT] = false;
    this.directions[DIR_RIGHT] = false;
    this.sprite.body.velocity.set(0, 0);
    keyAction.reset();
  }
  actionHandler(event) {
    switch (event.keyCode) {
      case Phaser.Keyboard.F:
        this.doActionInteractWithFacingTile(event);
        break;
    }
  }
  doActionInteractWithFacingTile(event) {
    var facingTile = this.adjacentTiles[this.facingDirection];
    if (!facingTile) {
      return;
    }
    // Is it the restaurant?
    if (TILES[facingTile.index].name === 'store') {
      var item = this.backpack.popItem();
      if (item) {
        // Store it in the restaurant
        if (!scoreController.storeItem(item)) {
          // Something bad happened, handle this later
          console.log('Failed to store an item');
        }
      }
    } else {
      var habitat = this.adjacentTiles[this.facingDirection].habitat;
      if (habitat) {
        if (this.backpack.isFull) {
          return;
        }

        var fishType = habitat.canFish();
        if (fishType) {
          this.fishingGameType = fishType;
          this.habitat = habitat;
          this.fishingGame = new FishingGame();
          this.deactivate();
          fadeScreen(0.9);
        }
      }
    }
  }
  update() {
    // If we're fishing, don't do the rest
    // Lol best game logic
    if (this.fishingGame) {
      this.fishingGame.update();
      if (this.fishingGame.complete) {
        this.activate();
        var success = this.fishingGame.success;
        if (success) {
          this.backpack.addFish(this.habitat.fish(this.fishingGameType));
        } else {
          // Cause something bad to happen
        }
        // Clean up
        this.fishingGame.destroy();
        this.fishingGame = null;
        this.fishingGameType = null;

        fadeScreen(0);
      }
    } else {

      this.backpack.update();
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
        this.facingDirection = DIR_UP;
      }
      if (this.directions[DIR_DOWN]) {
        dir.y += 1;
        this.facingDirection = DIR_DOWN;
      }
      if (this.directions[DIR_LEFT]) {
        dir.x -= 1;
        this.facingDirection = DIR_LEFT;
      }
      if (this.directions[DIR_RIGHT]) {
        dir.x += 1;
        this.facingDirection = DIR_RIGHT;
      }

      this.sprite.body.velocity.x = dir.x * PLAYER_SPEED;
      this.sprite.body.velocity.y = dir.y * PLAYER_SPEED;

      // some sicknasty debugging here
      var textOpts = {
        align: 'left'
      };
      // Keep these off due to performance issues
      //drawText(0, HEIGHT - 20, sprintf('Player Position: {%d, %d}', this.X, this.Y), textOpts);
      var tileX = layer.getTileX(this.X);
      var tileY = layer.getTileY(this.Y);
      var tiles = {};
      tiles[DIR_LEFT] = map.getTileLeft(0, tileX, tileY);
      tiles[DIR_RIGHT] = map.getTileRight(0, tileX, tileY);
      tiles[DIR_UP] = map.getTileAbove(0, tileX, tileY);
      tiles[DIR_DOWN] = map.getTileBelow(0, tileX, tileY);
      tiles[CURR_TILE] = map.getTile(tileX, tileY, 0);
      this.adjacentTiles = tiles;
      var l = (tiles[DIR_LEFT]) ? tiles[DIR_LEFT].index : -1;
      var lH = (tiles[DIR_LEFT]) ? tiles[DIR_LEFT].habitat : -1;
      var r = (tiles[DIR_RIGHT]) ? tiles[DIR_RIGHT].index : -1;
      var rH = (tiles[DIR_RIGHT]) ? tiles[DIR_RIGHT].habitat : -1;
      var a = (tiles[DIR_UP]) ? tiles[DIR_UP].index : -1;
      var aH = (tiles[DIR_UP]) ? tiles[DIR_UP].habitat : -1;
      var b = (tiles[DIR_DOWN]) ? tiles[DIR_DOWN].index : -1;
      var bH = (tiles[DIR_DOWN]) ? tiles[DIR_DOWN].habitat : -1;
      var c = (tiles[CURR_TILE]) ? tiles[CURR_TILE].index : -1;
      var cH = (tiles[CURR_TILE]) ? tiles[CURR_TILE].habitat : -1;
      // Keep these off due to performance issues
      //drawText(0, HEIGHT - 10, sprintf('L: %s R: %s U: %s D: %s C: %s', l, r, a, b, c));
      // Keep these off due to performance issues
      //drawText(0, HEIGHT, sprintf('L: %s R: %s U: %s D: %s', lH, rH, aH, bH));
    }
  }
}
