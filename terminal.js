import { GameManager } from './games/game-manager.js';
import { BasicCommands } from './commands/basic.js';

export class Terminal {
    constructor() {
        this.out = document.getElementById('terminal-output');
        this.inp = document.getElementById('terminal-input');
        this.prompt = document.getElementById('terminal-prompt');
        
        this.out.innerHTML = '';
        
        this.setup = { step: 'name', complete: false };
        this.hist = []; this.histIdx = -1;
        
        this.gm = new GameManager(this);
        this.bc = new BasicCommands(this);
        
        const theme = localStorage.getItem('theme') || 'matrix';
        document.documentElement.setAttribute('data-theme', theme);
        
        this.inp.addEventListener('keydown', this.handleKey.bind(this));
        this.inp.addEventListener('input', () => {
            if (this.inp.childNodes.length > 1 || this.inp.firstChild?.nodeName !== '#text') {
                this.inp.textContent = this.inp.textContent;
            }
        });
        
        this.welcome();
        
        if (!localStorage.getItem('username')) {
            this.startSetup();
        } else {
            this.username = localStorage.getItem('username');
            this.displayName = localStorage.getItem('displayName');
            const n = this.displayName || this.username;
            this.setup.complete = true;
            this.updatePrompt(`${this.username}:~$ `);
            this.addLine('');
            this.addLine(`welcome back, ${n}!`, 'cyan');
            this.addLine('type "help" for available commands', 'yellow');
        }
    }

    welcome() {
        const art = [
            '  _         _        _ _     _   ',
            ' / \\  _   _| |_ ___ | | | __| |  ',
            '/ _ \\| | | | __/ _ \\| | |/ _` | ',
            '/ ___ \\ |_| | || (_) | | | (_| | ',
            '/_/   \\_\\__,_|\\__\\___/|_|_|\\__,_|',
            '           ate-bit'
        ];
        const div = document.createElement('div');
        div.className = 'ascii-art accent';
        div.textContent = art.join('\n');
        this.out.appendChild(div);
        this.addLine('welcome to ate-bit!', 'accent');
        this.addLine('a retro-style gaming console', 'main');
        this.addLine('');
    }

    handleKey(e) {
        if (e.key === 'Tab') { e.preventDefault(); this.tab(); return; }

        if (e.key === 'Enter') {
            e.preventDefault();
            const inp = this.inp.textContent.trim();
            this.inp.textContent = '';

            if (!this.setup.complete) { this.handleSetup(inp); return; }

            this.addLine(this.prompt.textContent + inp);

            if (inp) {
                this.hist.unshift(inp);
                if (this.hist.length > 50) this.hist.pop();
                this.histIdx = -1;
            }

            this.processCmd(inp);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            if (!this.gm.currentGame) {
                e.preventDefault();
                this.navHist(e.key === 'ArrowUp');
            }
        }
    }

    tab() {
        const inp = this.inp.textContent.trim().toLowerCase();
        const cmds = [...Object.keys(this.bc.cmds), ...this.gm.getAvailableGames()];
        
        const matches = cmds.filter(c => c.startsWith(inp));

        if (matches.length === 1) {
            this.inp.textContent = matches[0];
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(this.inp);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (matches.length > 1) {
            this.addLine('');
            this.addLine('available commands:', 'system');
            matches.forEach(m => { this.addLine(`  ${m}`, 'system'); });
            this.addLine('');
            this.addLine(this.prompt.textContent + inp, 'command');
        }
    }

    navHist(up) {
        if (!this.hist.length) return;

        if (up && this.histIdx < this.hist.length - 1) {
            this.histIdx++;
        } else if (!up && this.histIdx >= 0) {
            this.histIdx--;
        }

        if (this.histIdx >= 0 && this.histIdx < this.hist.length) {
            this.inp.textContent = this.hist[this.histIdx];
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(this.inp);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (this.histIdx < 0) {
            this.inp.textContent = '';
        }
    }

    processCmd(inp) {
        if (!inp) return;

        if (this.bc.handleCommand(inp)) return;

        const [cmd, ...args] = inp.toLowerCase().split(' ');

        if (this.gm.isValidGame(cmd)) {
            this.gm.startGame(cmd);
            return;
        }

        this.addLine(`command not found: ${cmd}`, 'red');
        this.addLine('type "help" for available commands', 'yellow');
    }

    startSetup() {
        this.addLine('lets set up your profile!', 'cyan');
        this.addLine('enter your username:', 'yellow');
        this.setup.step = 'name';
    }

    handleSetup(inp) {
        switch (this.setup.step) {
            case 'name':
                if (inp.length < 3) {
                    this.addLine('username must be at least 3 characters long.', 'red');
                    return;
                }
                this.username = inp.toLowerCase();
                this.displayName = inp;
                localStorage.setItem('username', this.username);
                localStorage.setItem('displayName', this.displayName);
                
                this.setup.complete = true;
                this.updatePrompt(`${this.username}:~$ `);
                
                this.addLine('');
                this.addLine(`welcome, ${this.displayName}!`, 'cyan');
                this.addLine('type "help" for available commands', 'yellow');
                break;
        }
    }

    addLine(txt, color = 'white') {
        const line = document.createElement('div');
        line.className = `terminal-line ${color}`;
        line.textContent = txt;
        this.out.appendChild(line);
        this.out.scrollTop = this.out.scrollHeight;
    }

    updatePrompt(txt) { this.prompt.textContent = txt; }

    clearScreen() { this.out.innerHTML = ''; }
} 