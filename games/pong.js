export class Pong {
    constructor(term) {
        this.term = term; this.w = 40; this.h = 10; this.padH = 3; this.padSpeed = 2;
        this.padL = Math.floor(this.h / 2) - Math.floor(this.padH / 2);
        this.padR = this.padL; this.ballX = this.w / 2; this.ballY = this.h / 2;
        this.dx = 0; this.dy = 0; this.ballSpeed = 0.5;
        this.score = [0, 0]; this.loop = null; this.speed = 100;
        this.ai = true; this.frame = 0; this.aiRate = 3;

        this.reset();
        this.handleInput = this.handleInput.bind(this);
    }

    reset() {
        this.ballX = this.w / 2; this.ballY = this.h / 2;
        this.ballSpeed = 0.4 + Math.random() * 0.4;
        const angle = (Math.random() * Math.PI / 3) + Math.PI / 12;
        this.dx = this.ballSpeed * (Math.random() > 0.5 ? Math.cos(angle) : -Math.cos(angle));
        this.dy = this.ballSpeed * (Math.random() > 0.5 ? Math.sin(angle) : -Math.sin(angle));
        this.padL = Math.floor(this.h / 2) - Math.floor(this.padH / 2);
        this.padR = this.padL;
    }

    start() {
        this.term.addLine('pong - classic table tennis', 'green');
        this.term.addLine('');
        this.term.addLine('controls:', 'yellow');
        this.term.addLine('left player:  w/s', 'white');
        this.term.addLine('right player: up/down arrow', 'white');
        this.term.addLine('m: toggle ai opponent', 'white');
        this.term.addLine('q: quit', 'white');
        this.term.addLine('');
        this.term.addLine('press any key to start...', 'cyan');

        document.addEventListener('keydown', this.handleInput);
        this.loop = setInterval(() => this.update(), this.speed);
    }

    stop() {
        document.removeEventListener('keydown', this.handleInput);
        if (this.loop) { clearInterval(this.loop); this.loop = null; }
        this.term.addLine('game over!', 'yellow');
        this.term.addLine(`final score: ${this.score[0]} - ${this.score[1]}`, 'cyan');
    }

    handleInput(e) {
        const k = e.key.toLowerCase();
        
        if (k === 'w') {
            this.padL = Math.max(0, this.padL - this.padSpeed);
        } else if (k === 's') {
            this.padL = Math.min(this.h - this.padH, this.padL + this.padSpeed);
        }
        
        if (k === 'm') {
            this.ai = !this.ai;
            const state = this.ai ? 'enabled' : 'disabled';
            this.term.addLine(`ai opponent ${state}`, 'yellow');
        }

        if (!this.ai) {
            if (k === 'arrowup') {
                this.padR = Math.max(0, this.padR - this.padSpeed);
            } else if (k === 'arrowdown') {
                this.padR = Math.min(this.h - this.padH, this.padR + this.padSpeed);
            }
        }

        if (k === 'q') this.stop();
        if (['arrowup', 'arrowdown', 'w', 's'].includes(k)) e.preventDefault();
    }

    update() {
        this.ballX += this.dx; this.ballY += this.dy;

        // wall bounce
        if (this.ballY <= 0 || this.ballY >= this.h - 1) {
            this.dy *= -1; this.dy += (Math.random() - 0.5) * 0.1;
        }

        const ballL = Math.floor(this.ballX); const ballR = Math.ceil(this.ballX);
        const ballYPos = Math.floor(this.ballY);

        // paddle collision
        if (ballL === 1 && ballYPos >= this.padL && ballYPos < this.padL + this.padH) {
            this.dx = Math.abs(this.dx);
            const relY = (this.padL + (this.padH / 2)) - this.ballY;
            const normY = relY / (this.padH / 2);
            const angle = normY * Math.PI / 3;
            const spd = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx = spd * Math.cos(angle); this.dy = -spd * Math.sin(angle);
            this.dy += (Math.random() - 0.5) * 0.3;
            const inc = 1.05; const curSpd = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
            this.dx = (this.dx / curSpd) * curSpd * inc;
            this.dy = (this.dy / curSpd) * curSpd * inc;
        }

        if (ballR === this.w - 2 && ballYPos >= this.padR && ballYPos < this.padR + this.padH) {
            this.dx = -Math.abs(this.dx);
            const relY = (this.padR + (this.padH / 2)) - this.ballY;
            const normY = relY / (this.padH / 2);
            const angle = normY * Math.PI / 3;
            const spd = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx = -spd * Math.cos(angle); this.dy = -spd * Math.sin(angle);
            this.dy += (Math.random() - 0.5) * 0.3;
            const inc = 1.05; const curSpd = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
            this.dx = (this.dx / curSpd) * curSpd * inc;
            this.dy = (this.dy / curSpd) * curSpd * inc;
        }

        // ai movement
        if (this.ai && this.frame % this.aiRate === 0) {
            const padCenter = this.padR + this.padH / 2;
            if (padCenter < this.ballY - 1) {
                this.padR = Math.min(this.h - this.padH, this.padR + this.padSpeed);
            } else if (padCenter > this.ballY + 1) {
                this.padR = Math.max(0, this.padR - this.padSpeed);
            }
        }

        if (this.ballX < 0) { this.score[1]++; this.reset(); }
        else if (this.ballX >= this.w) { this.score[0]++; this.reset(); }

        this.draw(); this.frame++;
    }

    draw() {
        const board = Array(this.h).fill().map(() => Array(this.w).fill(' '));
        
        for (let y = 0; y < this.h; y++) {
            if (y % 2 === 0) board[y][Math.floor(this.w / 2)] = '│';
        }
        
        for (let i = 0; i < this.padH; i++) {
            board[this.padL + i][0] = '█';
            board[this.padR + i][this.w - 1] = '█';
        }
        
        const ballX = Math.round(this.ballX); const ballY = Math.round(this.ballY);
        if (ballY >= 0 && ballY < this.h && ballX >= 0 && ballX < this.w) {
            board[ballY][ballX] = '●';
        }
        
        this.term.clearScreen();
        this.term.addLine(`score: ${this.score[0]} - ${this.score[1]}`, 'cyan');
        this.term.addLine('╔' + '═'.repeat(this.w + 2) + '╗', 'cyan');
        board.forEach(row => { this.term.addLine('║ ' + row.join('') + ' ║', 'cyan'); });
        this.term.addLine('╚' + '═'.repeat(this.w + 2) + '╝', 'cyan');
    }
} 