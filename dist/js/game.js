const HEIGHT = 250;
const WIDTH = 400;
var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'game-container');
game.state.add('game', new GameState());
game.state.start('game');
