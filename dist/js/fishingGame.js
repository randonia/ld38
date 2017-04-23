class FishingGame {
  get complete() {
    return this.progressBar.complete;
  }
  constructor() {
    this.progressBar = new ProgressBar();
    this.fishingBar = new FishingBar();

    // TODO: CHANGE THIS
    this.fishingBar.x = WIDTH * 0.5 - 50 + game.camera.position.x;
    this.fishingBar.y = HEIGHT * 0.5 - 50 + game.camera.position.y;
    this.progressBar.x = WIDTH * 0.5 + 25 + game.camera.position.x;
    // MAGIC ASS NUMBER FOR SCALING
    this.progressBar.y = 50 + game.camera.position.y;
  }
  update() {
    this.progressBar.update();
    this.fishingBar.update();

    if (this.fishingBar.inBounds) {
      this.progressBar.increase();
    } else {
      this.progressBar.reduce();
    }
  }
  destroy() {
    this.progressBar.destroy();
    this.fishingBar.destroy();
  }
}

class ProgressBar {
  set x(value) {
    this._x = value;
  }
  set y(value) {
    this._y = value;
  }
  get complete() {
    return this.percentage >= 1;
  }
  static getTint(percentage) {
    return Phaser.Color.interpolateColor(0xa81000, 0x00b800, 100, percentage * 100, 1);
  }
  constructor() {
    // Make sprites
    this.bg = game.add.sprite(0, 0, 'progress-bar-vertical');
    this.percentBMPd = game.add.bitmapData(11, 91);
    this.percentBMPd.ctx.fillStyle = 'white';
    this.percentBMPd.ctx.fillRect(0, 0, 11, 91);
    this.percentSprite = game.add.sprite(3, 94, this.percentBMPd);
    // this.percentSprite.pivot.y = this.percentSprite.height;
    this.percentage = 0.5;
  }
  increase() {
    this.percentage = Math.min(1, this.percentage + 0.01);
  }
  reduce() {
    this.percentage = Math.max(0, this.percentage - 0.01);
  }
  update() {
    this.bg.position.set(this._x, this._y);
    this.percentSprite.position.set(this._x + 3, this._y + 94 - 91 * this.percentage);
    this.percentSprite.scale.y = this.percentage;
    this.percentSprite.tint = ProgressBar.getTint(this.percentage);
  }
  destroy() {
    this.bg.destroy();
    this.bg = null;
    this.percentBMPd.destroy();
    this.percentBMPd = null;
    this.percentSprite.destroy();
    this.percentSprite = null;
  }
}

class FishingBar {
  set x(value) {
    this._x = value;
  }
  set y(value) {
    this._y = value;
  }
  getFishBounds() {
    return {
      top: this.bg.y + 10,
      bottom: this.bg.y + this.bg.height - 10,
    };
  }
  getRodBounds() {
    return {
      top: this.bg.y + this.rodRect.height + 2,
      bottom: this.bg.y + this.bg.height - 2,
    }
  }
  constructor() {
    this.keyReader = game.input.keyboard.addKey(Phaser.Keyboard.E);
    // Make sprites
    this.bg = game.add.sprite(0, 0, 'progress-bar-vertical');
    var bounds = this.getFishBounds();
    var fishStartY = Math.random() * bounds.bottom + bounds.top;
    this.rodRect = game.add.sprite(3, 5000, 'fishing-rod-zone');
    this.rodRect.pivot.x = -3;
    this.rodRect.pivot.y = this.rodRect.height;
    this.rodRect.alpha = 0.75;
    this.fishSprite = game.add.sprite(0, fishStartY, 'fish', 12);
    this.fishSprite.pivot.set(0, 8);
    this.fishAnim = this.fishSprite.animations.add('fishbob', [12, 13]);
    this.fishSprite.animations.play('fishbob', 5, true);
    // -1 or 1
    this.fishDir = 1;
    this.rodDir = 1;
    this.speed = 0.5;
    this.changeRate = 500;
    this.lastChange = Number.NEGATIVE_INFINITY;
  }
  get inBounds() {
    var rodRect = this.rodRect.getBounds();
    var fishRect = this.fishSprite.getBounds()
    return rodRect.top < fishRect.centerY && rodRect.bottom > fishRect.centerY;
  }
  update() {
    // Framing
    this.bg.position.set(this._x, this._y);
    this.fishSprite.position.x = this._x;
    this.rodRect.position.x = this._x;
    // Move the rod
    var rodBounds = this.getRodBounds();
    // accelerate the rod
    var accel = 0.05;
    if (this.keyReader.isDown) {
      accel *= -1;
    }
    this.rodDir += accel;
    this.rodRect.y += this.rodDir;
    if (this.rodRect.y < rodBounds.top) {
      this.rodDir *= -0.3;
      this.rodRect.y = rodBounds.top;
    }
    // Dampen on bounce
    if (this.rodRect.y > rodBounds.bottom) {
      this.rodDir *= -0.5;
      this.rodRect.y = rodBounds.bottom;
    }
    // Move the fish
    var fishBounds = this.getFishBounds();
    this.fishSprite.y += this.fishDir * this.speed;
    if (this.fishSprite.y < fishBounds.top) {
      this.fishDir = 1;
      this.fishSprite.y = fishBounds.top;
    }
    if (this.fishSprite.y > fishBounds.bottom) {
      this.fishDir = -1;
      this.fishSprite.y = fishBounds.bottom;
    }
    this.changeDir();
  }
  changeDir() {
    var now = Date.now();
    if (this.lastChange + this.changeRate < now) {
      this.lastChange = now;
      this.changeRate = Math.random() * 5000 + 1500;
      var newSpeed = 0.25 + Math.random() * 0.5;

      game.add.tween(this).to({
        speed: newSpeed
      }, this.changeRate, 'Linear', true);
      this.fishDir *= -1;
    }
  }
  destroy() {
    this.keyReader.reset();
    this.keyReader = null;
    this.bg.destroy();
    this.bg = null;
    this.rodRect.destroy();
    this.rodRect = null;
    this.fishAnim.destroy();
    this.fishAnim = null;
    this.fishSprite.destroy();
    this.fishSprite = null;
  }
}
