import { Snake } from './snake.js';
import { Tetris } from './tetris.js';
import { Pong } from './pong.js';
import { Breakout } from './breakout.js';

export class GameManager {
    constructor(term) {
        this.term = term; this.currentGame = null;
        this.games = {
            'snake': Snake,
            'tetris': Tetris,
            'pong': Pong,
            'breakout': Breakout
        };
    }

    startGame(name) {
        if (this.currentGame) { this.currentGame.stop(); }
        
        const GameClass = this.games[name];
        if (!GameClass) {
            this.term.addLine(`game "${name}" not found`, 'red');
            return;
        }
        
        this.currentGame = new GameClass(this.term);
        this.currentGame.start();
    }

    isValidGame(name) { return this.games.hasOwnProperty(name); }

    getAvailableGames() { return Object.keys(this.games); }

    stopCurrentGame() {
        if (this.currentGame) {
            this.currentGame.stop(); this.currentGame = null;
        }
    }
} 