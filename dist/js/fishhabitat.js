const FISH_TYPE_1 = 'salmon';
const FISH_TYPE_2 = 'yellowtail';
const FISH_TYPE_3 = 'tuna';

// A data representation of a tile group's fish
class FishHabitat {
  constructor(tiles) {
    this.tiles = tiles;
    this.group = game.add.group();
    this.init();
  }
  init() {
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
    }
    this.groupCentroid = Phaser.Point.centroid(this.tiles.map((tile) => new Phaser.Point(tile.worldX + tile.centerX, tile.worldY + tile.centerY)));
    this.group.position.set(this.groupCentroid.x, this.groupCentroid.y);
    this.group.align(1, -1, 16, 16, Phaser.CENTER);
    this.group.pivot.set(8, 8);
  }

}
