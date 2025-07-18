import { Snk } from './snake.js';
import { Tet } from './tetris.js';
import { Png } from './pong.js';
import { Brk } from './breakout.js';
import { Rkt } from './rocket.js';
import { encode, makeMsg, TYPES } from '../protocol.js'; // rel path

export class Gm {
    constructor(term) {
        this.term = term; this.currentGame = null;
        this.games = {
            'snake': Snk,
            'tetris': Tet,
            'pong': Png,
            'breakout': Brk,
            'rocket': Rkt
        }
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