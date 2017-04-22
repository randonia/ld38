const FISH_TYPE_1 = 'salmon';
const FISH_TYPE_2 = 'yellowtail';
const FISH_TYPE_3 = 'tuna';

// A data representation of a tile's fish
class FishHabitat {
  static tileRequiresHabitat(tile) {
    return TILES[tile.index].spawns != undefined;
  }
  constructor(tile) {
    this.tile = tile;
    this.group = game.add.group();
    this.init();
    this.initPhysics();
  }
  init() {
    this.pool = {};
    var spawnData = TILES[this.tile.index].spawns;
    if (spawnData) {
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
    this.group.position.set(this.tile.worldX, this.tile.worldY);
    this.group.align(1, 3, 8, 8, Phaser.LEFT)
  }
  initPhysics() {
    var shape = game.add.graphics();
    shape.moveTo(0, 0);
    shape.lineTo(this.tile.width, this.tile.height);
    shape.boundsPadding = 0;
    this.sprite = game.add.sprite(this.group.position.x, this.group.position.y);
    this.sprite.addChild(shape);
    game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
    this.sprite.body.immovable = true;
  }
}
