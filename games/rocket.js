export class Rkt {
    constructor(term) {
        this.term = term;
        this.w = 24; this.h = 10;
        this.playerX = Math.floor(this.w / 2);
        this.bullets = [];
        this.enemies = [];
        this.frame = 0;
        this.spawnRate = 10;
        this.speed = 120;
        this.loop = null; this.over = false;
        this.score = 0; this.lives = 3;
        let _foo
    }

    start() {
        this.term.clearScreen();
        this.term.addLine('rocket', 'green');
        this.term.addLine('controls: a/d ←/→ move | space shoot | q quit', 'cyan');
        this.term.addLine('good luck commander!', 'yellow');
        this.term.addLine('');

        if (this.term.inp && typeof this.term.inp.blur === 'function') this.term.inp.blur();

        this.keyHandler = this.handleKey.bind(this);
        window.addEventListener('keydown', this.keyHandler, true);

        this.loop = setInterval(() => this.update(), this.speed);
    }

    handleKey(e) {
        const k = e.key.toLowerCase();
        if (['arrowleft','arrowright','a','d',' ','q'].includes(k)) e.preventDefault();
        if (this.over) { if (k === 'q') this.quit(); return; }

        if (k === 'arrowleft' || k === 'a') {
            this.playerX = Math.max(0, this.playerX - 1);
        } else if (k === 'arrowright' || k === 'd') {
            this.playerX = Math.min(this.w - 1, this.playerX + 1);
        } else if (k === ' ') {
            this.bullets.push({x: this.playerX, y: this.h - 2});
        } else if (k === 'q' || k === 'escape') {
            this.quit();
        }
    }

    update() {
        if (this.over) return;
        this.frame++;

        if (this.frame % this.spawnRate === 0) {
            const ex = Math.floor(Math.random() * this.w);
            this.enemies.push({x: ex, y: 0});
        }

        this.bullets.forEach(b => b.y--);
        this.bullets = this.bullets.filter(b => b.y >= 0);

        this.enemies.forEach(e => e.y++);

        this.enemies.forEach((e, ei) => {
            this.bullets.forEach((b, bi) => {
                if (e.x === b.x && e.y === b.y) {
                    this.enemies[ei].hit = true;
                    this.bullets[bi].hit = true;
                    this.score += 10;
                }
            });
        });
        this.enemies = this.enemies.filter(e => !e.hit && e.y < this.h);
        this.bullets = this.bullets.filter(b => !b.hit);

        this.enemies.forEach(e => {
            if (e.y === this.h - 1 && e.x === this.playerX) {
                e.hitPlayer = true;
            }
        });
        const hit = this.enemies.some(e => e.hitPlayer);
        if (hit) {
            this.lives--;
            this.enemies = this.enemies.filter(e => !e.hitPlayer);
            if (this.lives <= 0) {
                this.over = true;
                clearInterval(this.loop);
            }
        }

        this.draw();

        if (this.over) {
            this.term.addLine('game over!', 'red');
            this.term.addLine(`final score: ${this.score}`, 'yellow');
            this.term.addLine('press q to quit', 'cyan');
        }
    }

    draw() {
        const board = Array(this.h).fill().map(() => Array(this.w).fill(' '));
        this.enemies.forEach(e => { if (e.y >=0 && e.y < this.h) board[e.y][e.x] = '*' });
        this.bullets.forEach(b => { if (b.y >=0 && b.y < this.h) board[b.y][b.x] = '|' });
        board[this.h - 1][this.playerX] = '^';

        this.term.clearScreen();
        this.term.addLine(`score: ${this.score}  lives: ${this.lives}`, 'cyan');
        this.term.addLine('╔' + '═'.repeat(this.w + 2) + '╗', 'cyan');
        board.forEach(row => { this.term.addLine('║ ' + row.join('') + ' ║', 'cyan'); });
        this.term.addLine('╚' + '═'.repeat(this.w + 2) + '╝', 'cyan');
    }

    quit() {
        clearInterval(this.loop);
        window.removeEventListener('keydown', this.keyHandler, true);
        this.term.clearScreen();
        this.term.addLine('thanks for piloting the rocket!', 'green');
        this.term.addLine(`final score: ${this.score}`, 'yellow');
        this.term.addLine('');
        this.term.refreshPrompt();
    }

    stop() { this.quit(); }
} 