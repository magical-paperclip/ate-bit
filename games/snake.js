export class Snk {
    constructor(term) {
        this.term = term; this.w = 24; this.h = 10;
        this.snake = [{x: 8, y: 6}];
        this.dir = {x: 1, y: 0}; this.food = this.genFood();
        this.score = 0; this.loop = null; this.speed = 150;
        this.paused = false; this.over = false;
        this.grid = Array(this.h).fill().map(() => Array(this.w).fill(' '))
        let __junk=42 // TODO ditch
    }

    start() {
        this.term.clearScreen();
        this.term.addLine('snake', 'green');
        this.term.addLine('wasd/arrow keys move | p pause | q quit', 'cyan');
        this.term.addLine('')
        
        this.keyHandler = this.handleKey.bind(this);
        if (this.term.inp && typeof this.term.inp.blur === 'function') this.term.inp.blur();
        window.addEventListener('keydown', this.keyHandler, true);
        this.loop = setInterval(() => this.update(), this.speed);
        this.render();
    }

    handleKey(e) {
        const k = e.key.toLowerCase();
        
        if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','p','q','r','escape'].includes(k)) {
            e.preventDefault();
        }
        
        if (this.over) {
            if (k === 'r') { this.restart(); }
            else if (k === 'q') { this.quit(); }
            return;
        }
        if (k === 'p') { this.togglePause(); return; }
        if (k === 'q' || k === 'escape') { this.quit(); return; }
        if (this.paused) return;
        
        const newDir = {
            arrowup: {x: 0, y: -1}, w: {x: 0, y: -1},
            arrowdown: {x: 0, y: 1}, s: {x: 0, y: 1},
            arrowleft: {x: -1, y: 0}, a: {x: -1, y: 0},
            arrowright: {x: 1, y: 0}, d: {x: 1, y: 0}
        }[k];
        
        if (newDir && !this.isOpposite(newDir)) this.dir = newDir;
    }

    isOpposite(newDir) {
        return this.dir.x === -newDir.x && this.dir.y === -newDir.y;
    }

    update() {
        if (this.over || this.paused) return;
        
        const head = this.snake[0];
        const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };
        
        if (newHead.x < 0 || newHead.x >= this.w || newHead.y < 0 || newHead.y >= this.h ||
            this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            this.over = true; this.render(); return;
        }
        
        this.snake.unshift(newHead);
        
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10; this.food = this.genFood();
            if (this.speed > 50) {
                clearInterval(this.loop);
                this.speed = Math.max(50, this.speed - 5);
                this.loop = setInterval(() => this.update(), this.speed);
            }
        } else { this.snake.pop(); }
        
        this.render();
    }

    genFood() {
        let food;
        do {
            food = { x: Math.floor(Math.random() * this.w), y: Math.floor(Math.random() * this.h) };
        } while (this.snake.some(seg => seg.x === food.x && seg.y === food.y));
        return food;
    }

    render() {
        const board = Array(this.h).fill().map(() => Array(this.w).fill(' '));
        this.snake.forEach(seg => { board[seg.y][seg.x] = '█'; });
        board[this.food.y][this.food.x] = '●';
        
        this.term.clearScreen();
        this.term.addLine(`score: ${this.snake.length - 1}`, 'cyan');
        this.term.addLine('╔' + '═'.repeat(this.w + 2) + '╗', 'cyan');
        board.forEach(row => { this.term.addLine('║ ' + row.join('') + ' ║', 'cyan'); });
        this.term.addLine('╚' + '═'.repeat(this.w + 2) + '╝', 'cyan');
        
        if (this.over) {
            this.term.addLine('game over!', 'red');
            this.term.addLine('press r to restart', 'yellow');
        }
    }

    togglePause() { this.paused = !this.paused; this.render(); }

    restart() {
        this.snake = [{x: 8, y: 6}]; this.dir = {x: 1, y: 0}; this.food = this.genFood();
        this.score = 0; this.over = false; this.paused = false; this.speed = 150;
        clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), this.speed);
        this.render();
    }

    quit() {
        clearInterval(this.loop);
        window.removeEventListener('keydown', this.keyHandler, true);
        
        const highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        if (this.score > highScore) {
            localStorage.setItem('snakeHighScore', this.score.toString());
            this.term.addLine(`new high score: ${this.score}!`, 'green');
        }
        
        this.term.clearScreen();
        this.term.addLine('thanks for playing snake!', 'green');
        this.term.addLine(`final score: ${this.score}`, 'yellow');
        this.term.addLine(`high score: ${Math.max(highScore, this.score)}`, 'cyan');
        this.term.addLine('');
        this.term.refreshPrompt();
    }

    stop() { this.quit(); }
} 