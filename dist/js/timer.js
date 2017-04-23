class Timer {
  constructor(duration) {
    this.startTime = Date.now();
    this.duration = duration;
    this.sprite = game.add.sprite(0, 0, 'timer');
    this.sprite.fixedToCamera = true;
    this.animation = this.sprite.animations.add('tick');
  }
  update() {
    var elapsed = Date.now() - this.startTime;
    var floatCompleted = (elapsed / this.duration);
    var frameNum = Math.floor(floatCompleted * this.animation.frameTotal);
    // Tick based on duration
    this.animation.frame = Math.min(frameNum, this.animation.frameTotal - 1);
    return floatCompleted > 1;
  }
  destroy() {
    this.animation.destroy();
    this.animation = null;
    this.sprite.destroy();
    this.sprite = null;
  }
}
