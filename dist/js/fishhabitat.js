// A data representation of a tile group's fish
class FishHabitat {
  static getFishSpriteIndex(fishType) {
    switch (fishType) {
      case FISH_TYPE_1:
        return 0;
        break;
      case FISH_TYPE_2:
        return 4;
        break;
      case FISH_TYPE_3:
        return 8;
        break;
    }
    throw Error(sprintf('Unknown fish type %s', fishType));
  }
  constructor(tiles) {
    this.tiles = tiles;
    this.group = game.add.group();
    this.spawnData = [];
    this.initSpriteSpawnData();
    this.fishData = {};
    this.spawnFish();
  }
  initSpriteSpawnData() {
    this.pool = {};
    // Get the spawn data based on all the tiles
    var spawnData = [];
    for (var tileIdx = 0; tileIdx < this.tiles.length; tileIdx++) {
      var currTile = this.tiles[tileIdx];
      var tileSpawnData = TILES[currTile.index].spawns;
      if (tileSpawnData) {
        spawnData = spawnData.concat(tileSpawnData).filter((value, index, self) => self.indexOf(value) === index);
        currTile.habitat = this;
      }
    }
    if (spawnData.length > 0) {
      for (var sIdx = spawnData.length - 1; sIdx >= 0; sIdx--) {
        var type = spawnData[sIdx];
        var newSprite = undefined;
        switch (type) {
          case FISH_TYPE_1:
            newSprite = game.add.sprite(0, 0, 'fish', 0);
            break;
          case FISH_TYPE_2:
            newSprite = game.add.sprite(0, 0, 'fish', 4);
            break;
          case FISH_TYPE_3:
            newSprite = game.add.sprite(0, 0, 'fish', 8);
            break;
        }
        if (newSprite) {
          newSprite.pivot.set(0, newSprite.height * 0.5);
          this.group.add(newSprite);
        }
      }
      this.spawnData = spawnData;
    }
    this.groupCentroid = Phaser.Point.centroid(this.tiles.map((tile) => new Phaser.Point(tile.worldX + tile.centerX, tile.worldY + tile.centerY)));
    this.group.position.set(this.groupCentroid.x, this.groupCentroid.y);
    this.group.align(1, -1, 16, 16, Phaser.CENTER);
    this.group.pivot.set(8, 8);
  }
  spawnFish() {
    for (var spawnIdx = 0; spawnIdx < this.spawnData.length; spawnIdx++) {
      var fishType = this.spawnData[spawnIdx];
      if (!this.fishData[fishType]) {
        this.fishData[fishType] = new FishData(fishType, this);
      }
      this.fishData[fishType].spawn();
    }
  }
  // Player has successfully interacted with a fishing action
  fish() {
    // Pick a random fish to provide
    var randFishIdx = Math.floor(Math.random() * this.spawnData.length);
    var randFish = this.spawnData[randFishIdx];
    if (this.fishData[randFish].fish()) {
      return randFish;
    }
    return null;
  }

}

class FishData {
  constructor(fishType, habitat) {
    this.fishType = fishType;
    this.count = 0;
    this.lastChange = NaN;
    this.lastCount = 0;
    this.habitat = habitat;
    this.states = [];
  }
  // Let's do this by deltas
  applyState(state) {
    this.lastCount = this.count;
    this.lastChange = state.timestamp;
    this.count += state.deltaFish;
    this.states.push(state);
  }
  spawn() {
    var fishData = FISH_SPAWN_DATA[this.fishType];

    var spawnDelta = {
      timestamp: Date.now(),
      deltaFish: 0,
    };

    // Initialize if there's no history
    if (this.states.length == 0) {
      spawnDelta.deltaFish = fishData.startingQuantity; // * this.habitat.tiles.length;
    } else {
      // Growth time
      if (Math.random() > fishData.chanceNoSpawn) {
        spawnDelta.deltaFish = fishData.spawnPerDay + (fishData.perTileBonus + this.habitat.tiles.length);
      }
    }

    this.applyState(spawnDelta);
  }
  fish() {
    if (this.count > 0) {
      var fishDelta = {
        timestamp: Date.now(),
        deltaFish: -1
      }
      this.applyState(fishDelta);
      return true;
    }
    return false;
  }
}
