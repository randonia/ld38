const TILES = {
  0: {
    tileIndex: 0,
    name: 'grass',
    collide: false
  },
  1: {
    tileIndex: 1,
    name: 'store',
    collide: true
  },
  2: {
    tileIndex: 2,
    name: 'river-up',
    collide: true,
    spawns: ['salmon', 'yellowtail']
  },
  3: {
    tileIndex: 3,
    name: 'river-up-bridge',
    collide: false,
    spawns: ['salmon', 'yellowtail']
  },
  4: {
    tileIndex: 4,
    name: 'pond-NW',
    collide: true
  },
  5: {
    tileIndex: 5,
    name: 'pond-N',
    collide: true
  },
  6: {
    tileIndex: 6,
    name: 'pond-NE',
    collide: true
  },
  8: {
    tileIndex: 8,
    name: 'pond-W',
    collide: true
  },
  9: {
    tileIndex: 9,
    name: 'pond-C',
    collide: true
  },
  10: {
    tileIndex: 10,
    name: 'pond-E',
    collide: true
  },
  12: {
    tileIndex: 12,
    name: 'pond-SW',
    collide: true
  },
  13: {
    tileIndex: 13,
    name: 'pond-S',
    collide: true
  },
  14: {
    tileIndex: 14,
    name: 'pond-SE',
    collide: true
  },

};
