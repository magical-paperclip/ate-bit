class TerminalGameHub {
    constructor() {
        this.output = document.getElementById('output');
        this.input = document.getElementById('input');
        this.gameRunning = null;
        
        this.setupStuff();
        this.showWelcome();
    }
    
    setupStuff() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.input.value.trim();
                if (cmd) {
                    this.runCommand(cmd);
                }
                this.input.value = '';
            }
        });
    }
    
    runCommand(command) {
        this.addLine(`$ ${command}`, 'user-input');
        
        const cmd = command.toLowerCase();
        
        if (cmd === 'help') {
            this.showHelp();
        } else if (cmd === 'clear') {
            this.output.innerHTML = '';
        } else if (cmd === 'snake') {
            this.startSnake();
        } else if (cmd === 'about') {
            this.showAbout();
        } else {
            this.addLine(`bash: ${command}: command not found`, 'error');
            this.addLine('try "help" lol');
        }
    }
    
    addLine(text, className = '') {
        const div = document.createElement('div');
        div.className = `terminal-line ${className}`;
        div.textContent = text;
        this.output.appendChild(div);
        this.output.scrollTop = this.output.scrollHeight;
    }
    
    addHTML(html) {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML = html;
        this.output.appendChild(div);
        this.output.scrollTop = this.output.scrollHeight;
    }
    
    showWelcome() {
        this.addHTML(`
            <div class="ascii-art green">
 █████╗ ████████╗███████╗       ██████╗ ██╗████████╗
██╔══██╗╚══██╔══╝██╔════╝       ██╔══██╗██║╚══██╔══╝
███████║   ██║   █████╗   █████╗██████╔╝██║   ██║   
██╔══██║   ██║   ██╔══╝   ╚════╝██╔══██╗██║   ██║   
██║  ██║   ██║   ███████╗       ██████╔╝██║   ██║   
╚═╝  ╚═╝   ╚═╝   ╚══════╝       ╚═════╝ ╚═╝   ╚═╝   
            </div>
        `);
        
        this.addLine('ate-bit v0.1.0 - terminal experiment', 'cyan');
        this.addLine('threw together a quick snake game bc why not', 'gray');
        this.addLine('');
        this.addLine('type "help" or whatever');
        this.addLine('');
    }
    
    showHelp() {
        this.addLine('commands that work:', 'cyan');
        this.addLine('');
        this.addLine('  help     - this thing');
        this.addLine('  clear    - wipe screen');
        this.addLine('  snake    - snake game');
        this.addLine('  about    - random info');
        this.addLine('');
    }
    
    showAbout() {
        this.addLine('ate-bit v0.1.0', 'cyan');
        this.addLine('');
        this.addLine('messing around with web terminal stuff');
        this.addLine('snake game was easy to add so did that too');
        this.addLine('');
        this.addLine('arrow keys move, esc quits, etc');
        this.addLine('');
    }
    
    startSnake() {
        if (this.gameRunning) return;
        
        this.gameRunning = 'snake';
        this.addLine('starting snake...', 'green');
        this.addLine('arrow keys to move, esc to rage quit', 'gray');
        this.addLine('');
        
        const board = this.makeBoard(40, 20);
        
        let snake = [{x: 20, y: 10}];
        let apple = {x: 25, y: 10};
        let dir = {x: 1, y: 0};
        let points = 0;
        
        const draw = () => {
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 40; x++) {
                    board[y][x] = ' ';
                }
            }
            
            snake.forEach((bit, i) => {
                if (bit.x >= 0 && bit.x < 40 && bit.y >= 0 && bit.y < 20) {
                    board[bit.y][bit.x] = i === 0 ? '◆' : '■';
                }
            });
            
            if (apple.x >= 0 && apple.x < 40 && apple.y >= 0 && apple.y < 20) {
                board[apple.y][apple.x] = '●';
            }
            
            this.showBoard(board, `score: ${points}`);
        };
        
        const tick = () => {
            if (this.gameRunning !== 'snake') return;
            
            const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
            
            if (head.x < 0 || head.x >= 40 || head.y < 0 || head.y >= 20) {
                this.gameOver(`rip. score: ${points}`);
                return;
            }
            
            if (snake.some(bit => bit.x === head.x && bit.y === head.y)) {
                this.gameOver(`ate yourself lol. score: ${points}`);
                return;
            }
            
            snake.unshift(head);
            
            if (head.x === apple.x && head.y === apple.y) {
                points++;
                apple = {
                    x: Math.floor(Math.random() * 40),
                    y: Math.floor(Math.random() * 20)
                };
            } else {
                snake.pop();
            }
            
            draw();
            setTimeout(tick, 200);
        };
        
        const keys = (e) => {
            if (this.gameRunning !== 'snake') return;
            
            if (e.key === 'Escape') {
                this.quitGame();
                return;
            }
            
            switch(e.key) {
                case 'ArrowUp':
                    if (dir.y !== 1) dir = {x: 0, y: -1};
                    break;
                case 'ArrowDown':
                    if (dir.y !== -1) dir = {x: 0, y: 1};
                    break;
                case 'ArrowLeft':
                    if (dir.x !== 1) dir = {x: -1, y: 0};
                    break;
                case 'ArrowRight':
                    if (dir.x !== -1) dir = {x: 1, y: 0};
                    break;
            }
        };
        
        document.addEventListener('keydown', keys);
        draw();
        tick();
    }
    
    makeBoard(w, h) {
        const board = [];
        for (let y = 0; y < h; y++) {
            board[y] = new Array(w).fill(' ');
        }
        return board;
    }
    
    showBoard(board, status = '') {
        const old = this.output.querySelector('.game-display');
        if (old) old.remove();
        
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game-display';
        
        gameDiv.innerHTML = `<div class="game-border">┌${'─'.repeat(board[0].length)}┐</div>`;
        
        board.forEach(row => {
            gameDiv.innerHTML += `<div class="game-line">│${row.join('')}│</div>`;
        });
        
        gameDiv.innerHTML += `<div class="game-border">└${'─'.repeat(board[0].length)}┘</div>`;
        if (status) {
            gameDiv.innerHTML += `<div class="game-status">${status}</div>`;
        }
        
        this.output.appendChild(gameDiv);
        this.output.scrollTop = this.output.scrollHeight;
    }
    
    gameOver(msg) {
        this.gameRunning = null;
        this.addLine('');
        this.addLine(msg, 'yellow');
        this.addLine('type "snake" to play again or whatever');
        this.addLine('');
    }
    
    quitGame() {
        this.gameRunning = null;
        this.addLine('');
        this.addLine('ok quitting');
        this.addLine('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TerminalGameHub();
});
