export class BasicCommands {
    constructor(term) {
        this.term = term;
        this.cmds = {
            'help': () => this.help(),
            'clear': () => this.term.clearScreen(),
            'whoami': () => this.profile(),
            'theme': () => this.themes(),
            'theme matrix': () => this.setTheme('matrix'),
            'theme amber': () => this.setTheme('amber'),
            'theme blue': () => this.setTheme('blue'),
            'theme white': () => this.setTheme('white'),
            'about': () => this.about(),
            'profile reset': () => this.resetProfile(),
            'ls': () => this.ls(),
            'dir': () => this.ls(),
            'profile': () => this.profile(),
            'hello': () => this.hello(),
            'hack': () => this.hack(),
            'pwd': () => this.pwd(),
            'date': () => this.date(),
            'fortune': () => this.fortune(),
            'sudo': () => this.sudo()
        };
    }

    handleCommand(cmd) {
        const parts = cmd.toLowerCase().trim().split(/\s+/);
        const c = parts[0];
        const full = parts.join(' ');
        
        if (c === 'echo') {
            const txt = cmd.slice(4).trim();
            this.term.addLine(txt, 'white');
            return true;
        }

        if (c === 'cat') { this.cat(parts[1]); return true; }
        if (c === 'touch') { this.touch(parts[1]); return true; }
        if (c === 'mkdir') { this.mkdir(parts[1]); return true; }
        if (c === 'rm') { this.rm(parts[1]); return true; }

        if (c === 'ping') {
            const host = parts[1] || '127.0.0.1';
            for (let i = 1; i <= 4; i++) {
                const t = (Math.random() * 100).toFixed(1);
                this.term.addLine(`reply from ${host}: bytes=32 time=${t}ms ttl=64`, 'white');
            }
            this.term.addLine(`ping statistics for ${host}:`, 'white');
            this.term.addLine('    packets: sent = 4, received = 4, lost = 0 (0% loss)', 'white');
            return true;
        }

        if (c === 'cowsay') {
            const txt = cmd.slice(6).trim();
            this.cow(txt);
            return true;
        }

        if (this.cmds[full]) {
            this.cmds[full]();
            return true;
        } else if (this.cmds[c]) {
            this.cmds[c]();
            return true;
        }
        return false;
    }

    help() {
        this.term.addLine('available commands:', 'yellow');
        this.term.addLine('');
        this.term.addLine('system:', 'cyan');
        this.term.addLine('  about         - about this terminal', 'white');
        this.term.addLine('  help          - show this help message', 'white');
        this.term.addLine('  clear         - clear the terminal', 'white');
        this.term.addLine('  whoami        - show current user', 'white');
        this.term.addLine('  profile       - show your profile', 'white');
        this.term.addLine('  profile reset - reset your profile', 'white');
        this.term.addLine('  ls / dir      - list files and folders', 'white');
        this.term.addLine('  pwd           - print working directory', 'white');
        this.term.addLine('  date          - show current date/time', 'white');
        this.term.addLine('  fortune       - random quote', 'white');
        this.term.addLine('  sudo          - simulate privilege escalation', 'white');
        this.term.addLine('  theme         - change terminal theme', 'white');
        this.term.addLine('');
        this.term.addLine('fun:', 'cyan');
        this.term.addLine('  hello         - say hello', 'white');
        this.term.addLine('  hack          - pseudo hacking sequence', 'white');
        this.term.addLine('  cowsay <msg>  - ascii cow says something', 'white');
        this.term.addLine('');
        this.term.addLine('games:', 'cyan');
        this.term.addLine('  snake         - classic snake game', 'white');
        this.term.addLine('  tetris        - ascii tetris', 'white');
    }

    profile() {
        this.term.addLine(`username: ${this.term.username}`, 'cyan');
        this.term.addLine(`display name: ${this.term.displayName}`, 'cyan');
    }

    themes() {
        this.term.addLine('available themes:', 'yellow');
        this.term.addLine('  theme matrix - classic green on black', 'white');
        this.term.addLine('  theme amber  - retro amber terminal', 'white');
        this.term.addLine('  theme blue   - cool blue interface', 'white');
        this.term.addLine('  theme white  - modern light theme', 'white');
    }

    setTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
        this.term.addLine(`theme set to ${t}`, 'cyan');
    }

    about() {
        this.term.addLine('╔════════════════════════════════════════╗', 'green');
        this.term.addLine('║          about ate-bit                 ║', 'green');
        this.term.addLine('╚════════════════════════════════════════╝', 'green');
        this.term.addLine('');
        this.term.addLine('a retro-style terminal interface featuring:', 'cyan');
        this.term.addLine('• classic terminal aesthetics', 'white');
        this.term.addLine('• multiple color themes', 'white');
        this.term.addLine('• retro games (snake, tetris)', 'white');
        this.term.addLine('');
        this.term.addLine('type "help" to see available commands', 'yellow');
    }

    resetProfile() {
        localStorage.removeItem('username');
        localStorage.removeItem('displayName');
        window.location.reload();
    }

    hello() {
        const n = this.term.displayName || this.term.username || 'guest';
        this.term.addLine(`hello, ${n}!`, 'cyan');
    }

    ls() {
        const stuff = ['games/', 'assets/', 'style.css', 'readme.md', 'index.html'];
        this.term.addLine(stuff.join('  '), 'white');
    }

    pwd() {
        const dir = `/home/${this.term.username || 'guest'}`;
        this.term.addLine(dir, 'white');
    }

    date() {
        const now = new Date();
        this.term.addLine(now.toString().toLowerCase(), 'white');
    }

    hack() {
        this.term.addLine('initializing superuser access...', 'yellow');
        for (let i = 0; i < 20; i++) {
            const line = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            this.term.addLine(line, 'green');
        }
        this.term.addLine('access granted ✓', 'accent');
    }

    fortune() {
        const quotes = [
            'the cake is a lie.',
            'fortune favors the bold.',
            'to iterate is human, to recurse divine.',
            'there is no place like 127.0.0.1.',
            'beware of bugs in the above code; i have only proved it correct, not tried it. (knuth)'
        ];
        const msg = quotes[Math.floor(Math.random() * quotes.length)];
        this.term.addLine(msg, 'cyan');
    }

    sudo() {
        this.term.addLine('sudo: permission denied. you are not in the sudoers file.', 'red');
    }

    cow(txt) {
        const msg = txt || 'moo';
        const top = ' ' + '_'.repeat(msg.length + 2);
        const mid = `< ${msg} >`;
        const bot = ' ' + '-'.repeat(msg.length + 2);
        const cow = "        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||";
        this.term.addLine(top, 'white');
        this.term.addLine(mid, 'white');
        this.term.addLine(bot, 'white');
        cow.split('\n').forEach(l => this.term.addLine(l, 'white'));
    }

    cat(f) {
        if (!f) {
            this.term.addLine('cat: missing file operand', 'red');
            return;
        }
        this.term.addLine(`pretend content of ${f}`, 'white');
    }

    touch(f) {
        if (!f) {
            this.term.addLine('touch: missing file operand', 'red');
            return;
        }
        this.term.addLine(`${f} created`, 'white');
    }

    mkdir(d) {
        if (!d) {
            this.term.addLine('mkdir: missing operand', 'red');
            return;
        }
        this.term.addLine(`directory ${d} created`, 'white');
    }

    rm(target) {
        if (!target) {
            this.term.addLine('rm: missing operand', 'red');
            return;
        }
        this.term.addLine(`${target} removed`, 'white');
    }
} 