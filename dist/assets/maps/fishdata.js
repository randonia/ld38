// Make sure these align across the board
const FISH_TYPE_1 = 'salmon';
const FISH_TYPE_2 = 'yellowtail';
const FISH_TYPE_3 = 'tuna';

const FISH_SPAWN_DATA = {};

FISH_SPAWN_DATA[FISH_TYPE_1] = {
  startingQuantity: 5, // Flat starting quantity for the habitat
  chanceNoSpawn: 0.35, // Percentage chance no spawning happens this day
  spawnPerDay: 2, // Flat quantity of spawning per day
  perTileBonus: 0.25, //Bonus per-tile to spawning
}
FISH_SPAWN_DATA[FISH_TYPE_2] = {
  startingQuantity: 5, // Flat starting quantity for the habitat
  chanceNoSpawn: 0.25, // Percentage chance no spawning happens this day
  spawnPerDay: 1, // Flat quantity of spawning per day
  perTileBonus: 0.45, //Bonus per-tile to spawning
};
FISH_SPAWN_DATA[FISH_TYPE_3] = {
  startingQuantity: 2, // Flat starting quantity for the habitat
  chanceNoSpawn: 0.75, // Percentage chance no spawning happens this day
  spawnPerDay: 1, // Flat quantity of spawning per day
  perTileBonus: 0.15, //Bonus per-tile to spawning
};
