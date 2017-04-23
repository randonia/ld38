// A data representation of a tile group's fish
class FishHabitat {
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

}

class FishData {
  constructor(fishType, habitat) {
    this.fishType = fishType;
    this.count = 0;
    this.lastSpawn = NaN;
    this.lastCount = 0;
    this.habitat = habitat;
    this.states = [];
  }
  // Let's do this by deltas
  applyState(state) {
    this.lastCount = this.count;
    this.lastSpawn = state.spawnTime;
    this.count += state.newSpawned;
    this.states.push(state);
    console.log(sprintf('[%s]: [%d]', this.fishType, this.count));
  }
  spawn() {
    var fishData = FISH_SPAWN_DATA[this.fishType];

    var spawnDelta = {
      spawnTime: Date.now(),
      newSpawned: 0,
    };

    // Initialize if there's no history
    if (this.states.length == 0) {
      spawnDelta.newSpawned = fishData.startingQuantity; // * this.habitat.tiles.length;
    } else {
      // Growth time
      if (Math.random() > fishData.chanceNoSpawn) {
        spawnDelta.newSpawned = fishData.spawnPerDay + (fishData.perTileBonus + this.habitat.tiles.length);
      }
    }

    this.applyState(spawnDelta);
  }
}
