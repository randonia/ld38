class Backpack {
  get isFull() {
    return this.capacity <= this.fishSlots.length;
  }
  constructor(capacity) {
    this.capacity = capacity || 3;
    this.sprite = game.add.sprite(WIDTH - (capacity + 1) * 16, 0, 'player', 4);
    this.sprite.fixedToCamera = true;
    this.iceSlots = [];
    this.fishSlots = [];
    for (var c = 0; c < capacity; ++c) {
      var icebox = game.add.sprite((c + 1) * 16 + this.sprite.position.x, this.sprite.position.y, 'player', 5);
      icebox.fixedToCamera = true;
      this.iceSlots.push(icebox);
    }
  }
  update() {}
  addFish(fishType) {
    if (this.fishSlots.length < this.capacity) {
      var spriteIndex = FishHabitat.getFishSpriteIndex(fishType);
      var iceboxCount = this.fishSlots.length;
      var newSprite = game.add.sprite(this.iceSlots[iceboxCount].position.x, this.sprite.position.y, 'fish', spriteIndex);
      newSprite.pivot.set(8, 0);
      newSprite.fixedToCamera = true;
      this.fishSlots.push(newSprite);
      return true;
    }
    return false;
  }
}
