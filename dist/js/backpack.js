class Backpack {
  get isFull() {
    return this.capacity <= this.fishSlots.length;
  }
  get isEmpty() {
    return this.fishSlots.length === 0;
  }
  constructor(capacity) {
    this.capacity = capacity || 3;
    this.sprite = game.add.sprite(WIDTH - (capacity + 1) * 16, 0, 'player', 4);
    this.sprite.fixedToCamera = true;
    this.iceSlots = [];
    this.fishSlots = [];
    this.items = [];
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
      this.items.push(fishType);
      return true;
    }
    return false;
  }
  popItem() {
    if (this.isEmpty) {
      return null;
    }
    var fish = this.items.pop();
    var fishSprite = this.fishSlots.pop();
    var newItem = new InventoryItem(fish, fishSprite);
    return newItem;
  }
}
