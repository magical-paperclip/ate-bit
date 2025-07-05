export class Tetris {
    constructor(term) {
        this.term = term; this.w = 10; this.h = 14;
        this.board = Array(this.h).fill().map(() => Array(this.w).fill(' '));
        this.cur = null; this.next = null; this.held = null;
        this.canHold = true; this.interval = null;
        this.score = 0; this.over = false; this.speed = 800;

        // tetris pieces
        this.pieces = [
            { shape: [['■','■','■','■']], symbol: '■', color: 'accent' },
            { shape: [['■','■'],['■','■']], symbol: '■', color: 'warn' },
            { shape: [['■','■','■'],[' ','■',' ']], symbol: '■', color: 'main' },
            { shape: [['■',' '],['■',' '],['■','■']], symbol: '■', color: 'accent' },
            { shape: [[' ','■'],[' ','■'],['■','■']], symbol: '■', color: 'main' },
            { shape: [[' ','■','■'],['■','■',' ']], symbol: '■', color: 'warn' },
            { shape: [['■','■',' '],[' ','■','■']], symbol: '■', color: 'error' }
        ];

        this.boundInput = this.handleInput.bind(this);
    }

    start() {
        if (this.interval) return;
        this.reset(); this.spawn(); this.next = this.getRandom();
        
        document.addEventListener('keydown', this.boundInput);
        this.interval = setInterval(() => this.tick(), this.speed);
        
        this.draw();
        this.term.addLine('tetris started!', 'cyan');
        this.term.addLine('controls:', 'yellow');
        this.term.addLine('  ← →     - move left/right', 'white');
        this.term.addLine('  ↓       - soft drop', 'white');
        this.term.addLine('  space   - hard drop', 'white');
        this.term.addLine('  ↑       - rotate', 'white');
        this.term.addLine('  c       - hold piece', 'white');
        this.term.addLine('  q       - quit', 'white');
        this.term.addLine('');
    }

    reset() {
        this.board = Array(this.h).fill().map(() => Array(this.w).fill(' '));
        this.score = 0; this.over = false; this.speed = 800;
        clearInterval(this.interval); this.interval = null;
    }

    spawn() {
        if (this.next === null) this.next = this.getRandom();
        
        this.cur = {
            ...this.next,
            x: Math.floor(this.w / 2) - Math.floor(this.next.shape[0].length / 2),
            y: 0
        };
        
        this.next = this.getRandom(); this.canHold = true;
    }

    handleInput(e) {
        if (this.over) return;
        const k = e.key;
        switch(k) {
            case 'ArrowLeft':
                e.preventDefault();
                if (this.canMove(-1, 0)) { this.cur.x--; this.draw(); }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (this.canMove(1, 0)) { this.cur.x++; this.draw(); }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (this.canMove(0, 1)) { this.cur.y++; this.draw(); }
                break;
            case 'ArrowUp':
                e.preventDefault(); this.rotate(); this.draw();
                break;
            case ' ':
                e.preventDefault(); this.hardDrop();
                break;
            case 'c': case 'C':
                e.preventDefault(); this.hold();
                break;
            case 'q': case 'Q':
                this.stop();
                break;
        }
    }

    canMove(dx, dy) {
        const p = this.cur;
        for (let y = 0; y < p.shape.length; y++) {
            for (let x = 0; x < p.shape[y].length; x++) {
                if (p.shape[y][x] !== ' ') {
                    const newX = p.x + x + dx; const newY = p.y + y + dy;
                    if (newX < 0 || newX >= this.w || newY >= this.h) return false;
                    if (newY >= 0 && this.board[newY][newX] !== ' ') return false;
                }
            }
        }
        return true;
    }

    rotate() {
        const p = this.cur;
        const newShape = Array(p.shape[0].length).fill()
            .map((_, i) => p.shape.map(row => row[p.shape[0].length - 1 - i]));
        const orig = p.shape; p.shape = newShape;
        if (!this.canMove(0, 0)) p.shape = orig;
    }

    tick() {
        if (this.over) return;
        if (this.canMove(0, 1)) {
            this.cur.y++;
        } else {
            this.place(); this.clearLines(); this.spawn();
            if (!this.canMove(0, 0)) { this.over = true; this.stop(); return; }
        }
        this.draw();
    }

    place() {
        const p = this.cur;
        for (let y = 0; y < p.shape.length; y++) {
            for (let x = 0; x < p.shape[y].length; x++) {
                if (p.shape[y][x] !== ' ') {
                    const boardY = p.y + y;
                    if (boardY >= 0) this.board[boardY][p.x + x] = { symbol: p.symbol, color: p.color };
                }
            }
        }
    }

    clearLines() {
        // line clearing logic
        for (let y = this.h - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== ' ')) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.w).fill(' '));
                this.score += 100;
                if (this.score % 500 === 0) {
                    this.speed = Math.max(100, this.speed - 100);
                    clearInterval(this.interval);
                    this.interval = setInterval(() => this.tick(), this.speed);
                }
            }
        }
    }

    hardDrop() {
        while (this.canMove(0, 1)) this.cur.y++;
        this.place(); this.clearLines(); this.spawn();
        if (!this.canMove(0, 0)) { this.over = true; this.stop(); }
        this.draw();
    }

    hold() {
        if (!this.canHold) return;
        
        const curPiece = {
            shape: this.cur.shape,
            symbol: this.cur.symbol,
            color: this.cur.color
        };
        
        if (this.held === null) {
            this.held = curPiece;
            this.spawn();
        } else {
            const temp = this.held;
            this.held = curPiece;
            this.cur = {
                shape: temp.shape,
                symbol: temp.symbol,
                color: temp.color,
                x: Math.floor(this.w / 2) - Math.floor(temp.shape[0].length / 2),
                y: 0
            };
        }
        
        this.canHold = false;
        this.draw();
    }

    getRandom() {
        const idx = Math.floor(Math.random() * this.pieces.length);
        return {
            shape: JSON.parse(JSON.stringify(this.pieces[idx].shape)),
            symbol: this.pieces[idx].symbol,
            color: this.pieces[idx].color
        };
    }

    draw() {
        // Clear terminal and draw frame
        this.term.clearScreen();
        
        // Draw stats
        this.term.addLine(`score: ${this.score}`, 'cyan');
        
        // Create the game board
        const display = Array(this.h).fill().map(() => Array(this.w).fill(' '));
        
        // Draw current board state
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                display[y][x] = this.board[y][x];
            }
        }
        
        // Draw current piece
        if (this.cur) {
            const p = this.cur;
            p.shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell !== ' ' && p.y + y >= 0) {
                        display[p.y + y][p.x + x] = p.symbol;
                    }
                });
            });
        }
        
        // Draw the board with border
        this.term.addLine('╔' + '═'.repeat(this.w + 2) + '╗', 'cyan');
        display.forEach(row => {
            this.term.addLine('║ ' + row.join('') + ' ║', 'cyan');
        });
        this.term.addLine('╚' + '═'.repeat(this.w + 2) + '╝', 'cyan');
        
        // Draw next piece preview to the side
        if (this.next) {
            this.term.addLine('next:', 'cyan');
            this.next.shape.forEach(row => {
                this.term.addLine('  ' + row.map(cell => cell === ' ' ? ' ' : this.next.symbol).join(' '), this.next.color);
            });
        }
        
        // Game over message
        if (this.over) {
            this.term.addLine('game over!', 'red');
            this.term.addLine('press r to restart', 'yellow');
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        // Remove key event listener
        document.removeEventListener('keydown', this.boundInput);
        
        // Show final score if game is over
        if (this.over) {
            this.term.addLine(`game over! score: ${this.score}`, 'cyan');
        }
        
        // Reset terminal prompt
        this.term.updatePrompt(`${this.term.username}:~$ `);
    }
}