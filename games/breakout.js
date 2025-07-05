export class Breakout {
    constructor(term) {
        this.term = term; this.w = 30; this.h = 12;
        this.padW = 5; this.padX = Math.floor(this.w / 2) - Math.floor(this.padW / 2);
        this.padY = this.h - 2; this.ballX = this.w / 2; this.ballY = this.h - 3;
        this.dx = 0.5; this.dy = -0.5; this.speed = 100;
        this.score = 0; this.lives = 3; this.loop = null; this.over = false;
        this.bricks = []; this.colors = ['red', 'yellow', 'green', 'blue'];
        this.brickRows = 4; this.brickCols = 10;
        this.brickW = Math.floor(this.w / this.brickCols); this.brickH = 1;
        this.keys = {}; this.frame = 0;
        this.initBricks();
        this.handleInput = this.handleInput.bind(this);
    }

    initBricks() {
        this.bricks = [];
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                this.bricks.push({
                    x: col * this.brickW, y: row + 1,
                    w: this.brickW, h: this.brickH,
                    color: this.colors[row % this.colors.length], active: true
                });
            }
        }
    }

    start() {
        this.term.addLine('breakout - destroy all bricks!', 'green');
        this.term.addLine('');
        this.term.addLine('controls:', 'yellow');
        this.term.addLine('a/d or left/right arrow keys - move paddle', 'white');
        this.term.addLine('space - launch ball', 'white');
        this.term.addLine('q - quit', 'white');
        this.term.addLine('');
        this.term.addLine('press space to launch ball...', 'cyan');

        document.addEventListener('keydown', this.handleInput);
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        this.loop = setInterval(() => this.update(), this.speed);
    }

    stop() {
        document.removeEventListener('keydown', this.handleInput);
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        if (this.loop) { clearInterval(this.loop); this.loop = null; }
        this.term.addLine('game over!', 'yellow');
        this.term.addLine(`final score: ${this.score}`, 'cyan');
    }

    handleInput(e) {
        const k = e.key.toLowerCase();
        this.keys[k] = true;
        
        if (k === 'q') this.stop();
        if (['arrowleft', 'arrowright', 'a', 'd', ' '].includes(k)) e.preventDefault();
    }

    handleKeyUp(e) { this.keys[e.key.toLowerCase()] = false; }

    update() {
        if (this.over) return;

        if (this.keys['a'] || this.keys['arrowleft']) {
            this.padX = Math.max(0, this.padX - 1);
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.padX = Math.min(this.w - this.padW, this.padX + 1);
        }

        if (this.keys[' '] && this.ballY === this.h - 3) {
            this.dx = (Math.random() - 0.5) * 0.8; this.dy = -0.6;
        }

        this.ballX += this.dx; this.ballY += this.dy;

        if (this.ballX <= 0 || this.ballX >= this.w - 1) this.dx *= -1;
        if (this.ballY <= 0) this.dy *= -1;

        const ballXInt = Math.floor(this.ballX); const ballYInt = Math.floor(this.ballY);
        if (ballYInt === this.padY && ballXInt >= this.padX && ballXInt < this.padX + this.padW) {
            this.dy = -Math.abs(this.dy);
            const relX = (this.padX + this.padW / 2) - this.ballX;
            const normX = relX / (this.padW / 2);
            this.dx = -normX * 0.5;
        }

        // brick collision
        this.bricks.forEach(brick => {
            if (!brick.active) return;
            
            if (ballXInt >= brick.x && ballXInt < brick.x + brick.w &&
                ballYInt >= brick.y && ballYInt < brick.y + brick.h) {
                brick.active = false; this.score += 10;
                this.dy *= -1;
                if (Math.random() > 0.5) this.dx += (Math.random() - 0.5) * 0.2;
            }
        });

        if (this.ballY >= this.h) {
            this.lives--; this.ballX = this.w / 2; this.ballY = this.h - 3;
            this.dx = 0; this.dy = 0;
            if (this.lives <= 0) { this.over = true; this.stop(); }
        }

        if (this.bricks.every(b => !b.active)) {
            this.over = true;
            this.term.addLine('you win!', 'green');
            this.stop();
        }

        this.draw(); this.frame++;
    }

    draw() {
        const board = Array(this.h).fill().map(() => Array(this.w).fill(' '));
        
        this.bricks.forEach(brick => {
            if (brick.active) {
                for (let x = brick.x; x < brick.x + brick.w; x++) {
                    for (let y = brick.y; y < brick.y + brick.h; y++) {
                        if (x < this.w && y < this.h) board[y][x] = '█';
                    }
                }
            }
        });
        
        for (let i = 0; i < this.padW; i++) {
            board[this.padY][this.padX + i] = '▬';
        }
        
        const ballX = Math.round(this.ballX); const ballY = Math.round(this.ballY);
        if (ballY >= 0 && ballY < this.h && ballX >= 0 && ballX < this.w) {
            board[ballY][ballX] = '●';
        }
        
        this.term.clearScreen();
        this.term.addLine(`score: ${this.score}  lives: ${this.lives}`, 'cyan');
        this.term.addLine('╔' + '═'.repeat(this.w + 2) + '╗', 'cyan');
        board.forEach(row => { this.term.addLine('║ ' + row.join('') + ' ║', 'cyan'); });
        this.term.addLine('╚' + '═'.repeat(this.w + 2) + '╝', 'cyan');
    }
}