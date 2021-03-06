// AKA The restaurant
class ScoreController {
  get currentTotals() {
    var orders = this.orders;
    var totals = {};
    totals[FISH_TYPE_1] = totals[FISH_TYPE_2] = totals[FISH_TYPE_3] = 0;
    for (var oIdx = 0; oIdx < orders.length; oIdx++) {
      var currOrder = orders[oIdx];
      // Count up totals
      for (var ingIdx = 0; ingIdx < currOrder.ingredients.length; ingIdx++) {
        var currIngredient = currOrder.ingredients[ingIdx];
        totals[currIngredient] += 1;
      }
    }
    return totals;
  }
  get currentOrders() {
    return this.orders;
  }
  get currentInventory() {
    var results = {};
    results[FISH_TYPE_1] = results[FISH_TYPE_2] = results[FISH_TYPE_3] = 0;
    for (var itemIdx = 0; itemIdx < this.inventory.items.length; itemIdx++) {
      var currItemId = this.inventory.items[itemIdx].id;
      results[currItemId] += 1;
    }
    return results;
  }
  get tooManyFailures() {
    return this.totalFailures >= 5;
  }
  constructor() {
    this.totalFailures = 0;
    this.score = 0;
    this.inventory = {
      items: [],
      capacity: 1000,
    };
    this.orders = [];
  }
  storeItem(item) {
    console.log(sprintf('storing %s', item.id));
    if (this.inventory.items.length >= this.inventory.capacity) {
      return false;
    }
    this.inventory.items.push(item);
    return true;
  }
  checkInventory(itemId) {
    var itemInventoryIdx = undefined;
    var item = undefined;
    for (var itemIdx = 0; itemIdx < this.inventory.items.length; itemIdx++) {
      var currItem = this.inventory.items[itemIdx];
      if (currItem.id === itemId) {
        itemInventoryIdx = itemIdx;
        break;
      }
    }
    if (itemInventoryIdx !== undefined) {
      item = this.inventory.items.splice(itemInventoryIdx, 1);
    }
    return item;
  }
  checkOrder(order) {
    var result = true;
    // Do the order checking here
    // See if we have the ingredients
    for (var ingIdx = 0; ingIdx < order.ingredients.length; ingIdx++) {
      var item = this.checkInventory(order.ingredients[ingIdx]);
      if (!item) {
        result = false;
        break;
      }
    }
    // Remove it from the list
    this.orders.splice(this.orders.indexOf(order), 1);
    return result;
  }
  makeOrders() {
    var numToMake = 2 + Math.floor(Math.random() * 4);
    if (this.orders.length > 0) {
      console.log('WARNING: MAKING NEW ORDERS WHILE OTHERS EXIST');
    }
    for (var c = 0; c < numToMake; ++c) {
      var newOrder = new Order();
      this.orders.push(newOrder);
    }
    return this.orders;
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

class Order {
  static generateIngredients() {
    var result = [];
    // Only require single orders
    var numToRequire = 1;
    var ingredientPossibilities = [
      FISH_TYPE_1,
      FISH_TYPE_2,
      FISH_TYPE_3,
    ];
    do {
      result.push(ingredientPossibilities[Math.floor(Math.random() * ingredientPossibilities.length)]);
    } while (result.length < numToRequire)
    return result;
  }
  static getValueFromIngredient(ingredient) {
    return FISH_SPAWN_DATA[ingredient] || 0;
  }
  static getValueOfIngredients(ingredients) {
    var value = 0;
    for (var iIdx = 0; iIdx < ingredients.length; iIdx++) {
      value += Order.getValueFromIngredient(ingredients[iIdx]);
    }
    return value;
  }
  constructor(id, ingredients) {
    this.id = id || Math.random().toString(36).substr(2, 6);
    this.ingredients = ingredients || Order.generateIngredients();
    this.name = makeRandomName();
  }

}
