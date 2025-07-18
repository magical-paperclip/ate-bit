import { Gm } from './games/game-manager.js';
import { Cmd } from './commands/basic.js';
import { TYPES, encode, decode, makeMsg } from './protocol.js';

// default websocket port; can be overridden by setting window.wsPort or localStorage.wsPort
const WS_DEFAULT_PORT = 8080;

export class Terminal {
    constructor() {
        this.out = document.getElementById('terminal-output');
        this.inp = document.getElementById('terminal-input');
        this.prompt = document.getElementById('terminal-prompt');
        
        this.out.innerHTML = '';
        
        this.setup = { step: 'name', complete: false };
        this.hist = []; this.histIdx = -1;
        
        this.gm = new Gm(this);
        this.bc = new Cmd(this);
        
        // track current working directory (shell simulation) and session start for uptime
        this.cwd = '~';
        this.startTime = Date.now();
        
        const theme = localStorage.getItem('theme') || 'matrix';
        document.documentElement.setAttribute('data-theme', theme);
        
        this.inp.addEventListener('keydown', this.handleKey.bind(this));
        this.inp.addEventListener('input', () => {
            if (this.inp.childNodes.length > 1 || this.inp.firstChild?.nodeName !== '#text') {
                this.inp.textContent = this.inp.textContent;
            }
        });
        
        // no banner
        
        if (!localStorage.getItem('username')) {
            this.startSetup();
        } else {
            this.username = localStorage.getItem('username');
            this.displayName = localStorage.getItem('displayName');
            const n = this.displayName || this.username;
            this.setup.complete = true;
            this.refreshPrompt();
            this.addLine('');
            this.addLine(`sup ${n}`, 'cyan');
            this.addLine('help for cmds', 'yellow');
        }

        this.ws = null; this.room = null;
    }

    welcome() {}

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
            this.addLine('cmds:', 'systm');
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

        const parts = inp.toLowerCase().split(' ');
        const cmd = parts[0];
        const arg = parts[1];

        if (this.gm.isValidGame(cmd)) {
            if (arg === 'mp') {
                this.room = Math.random().toString(36).slice(2, 7);
                this.addLine(`room id: ${this.room}`, 'yellow');
                this.pendingGame = cmd;
                this.connectWs();
                this.wsSend(makeMsg(TYPES.JOIN, cmd, this.room, { name: this.username || 'guest' }));
            } else if (arg === 'join') {
                const rid = parts[2];
                if (!rid) { this.addLine('how? ' + cmd + ' join id', 'red'); return }
                this.room = rid;
                this.addLine(`joining room ${rid}`, 'yellow');
                this.pendingGame = cmd;
                this.connectWs();
            } else {
                // local single-player game: ensure we leave any previous room context
                this.room = null;
                this.pendingGame = null;
            }
            this.gm.startGame(cmd);
            return;
        }

        // simple chat command when in a multiplayer room
        if ((cmd === 'chat' || cmd === 'say') && this.room) {
            const msgText = inp.slice(cmd.length).trim();
            if (!msgText) { this.addLine('chat what?', 'yelow'); return }
            const payload = { text: msgText, name: this.displayName || this.username || 'guest' };
            this.wsSend(makeMsg(TYPES.CHAT, this.pendingGame || '', this.room, payload));
            this.addLine(`[you] ${msgText}`, 'accent');
            return;
        }

        this.addLine(`command not found: ${cmd}`, 'red');
        this.addLine('help for cmds', 'yelow');
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
                this.refreshPrompt();
                
                this.addLine('');
                this.addLine(`welcome, ${this.displayName}!`, 'cyan');
                this.addLine('help for cmds', 'yellow');
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

    // update prompt text directly
    updatePrompt(txt) { this.prompt.textContent = txt; }

    refreshPrompt() {
        const user = this.username || 'guest';
        this.updatePrompt(`${user}:${this.cwd}$ `);
    }

    clearScreen() { this.out.innerHTML = ''; }

    connectWs() {
        if (this.ws && this.ws.readyState <= 1) return;
        const portOverride = (typeof window !== 'undefined' && window.wsPort) || localStorage.getItem('wsPort');
        const wsPort = portOverride || WS_DEFAULT_PORT;
        this.ws = new WebSocket(`ws://${location.hostname}:${wsPort}`);
        this.ws.addEventListener('open', () => {
            if (this.room) this.ws.send(encode(makeMsg(TYPES.JOIN, this.pendingGame, this.room, { name: this.username || 'guest' })));
        });
        this.ws.addEventListener('message', (e)=>{
            const msg = decode(e.data);
            if (!msg) return;
            if (msg.type === TYPES.CHAT) {
                const { text, name } = msg.payload || {};
                if (text) {
                    this.addLine(`[${name || 'player'}] ${text}`, 'cyan');
                }
                return;
            }
            if (this.gm.currentGame && this.gm.currentGame.onNet) {
                this.gm.currentGame.onNet(msg);
            }
        });
        this.ws.addEventListener('close', ()=>{
            setTimeout(()=>this.connectWs(),1000);
        });
    }

    wsSend(obj){ if(this.ws&&this.ws.readyState===1) this.ws.send(encode(obj)); }
} 