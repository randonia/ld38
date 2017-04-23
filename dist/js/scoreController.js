// AKA The restaurant
class ScoreController {
  constructor() {
    this.score = 0;
    this.inventory = {
      items: [],
      capacity: 10,
    };
  }
  storeItem(item) {
    console.log(sprintf('storing %s', item.id));
    if (this.inventory.items.length >= this.inventory.capacity) {
      return false;
    }
    this.inventory.items.push(item);
    return true;
  }
}

class InventoryItem {
  constructor(id, sprite) {
    this.id = id;
    this.created = Date.now();
    this.sprite = sprite || this.createSpriteFromItem();
    this.sprite.renderable = false;
  }
  createSpriteFromItem() {
    var newSprite = undefined;
    switch (this.id) {
      case FISH_TYPE_1:
      case FISH_TYPE_2:
      case FISH_TYPE_3:
        newSprite = game.add.sprite(0, 0, 'fish', FishHabitat.getFishSpriteIndex(this.id));
        break;
    }
    if (!newSprite) {
      throw Error(sprintf('Unknown type of id %s', this.id));
    }
    this.sprite = newSprite;
  }
}
