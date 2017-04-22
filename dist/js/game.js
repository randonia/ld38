var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-container');
game.state.add('game', new GameState());
game.state.start('game');
