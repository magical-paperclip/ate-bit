export class Cmd {
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
            'sudo': () => this.sudo(),
            'cd': () => {},
            'history': () => this.history(),
            'uptime': () => this.uptime(),
            'uname': () => this.uname()
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

        if (c === 'chat') {
            return false;
        }

        if (c === 'cd') { this.cd(parts[1]); return true; }

        if (c === 'history') { this.history(); return true; }
        if (c === 'uptime') { this.uptime(); return true; }
        if (c === 'uname') { this.uname(); return true; }

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
        this.term.addLine('cmds:', 'yelow');
        this.term.addLine('');
        this.term.addLine('sys:', 'cyan');
        this.term.addLine('  about  - info', 'white');
        this.term.addLine('  help          - show this help message', 'white');
        this.term.addLine('  clear         - clear the terminal', 'white');
        this.term.addLine('  whoami        - show current user', 'white');
        this.term.addLine('  profile       - show your profile', 'white');
        this.term.addLine('  profile reset - reset your profile', 'white');
        this.term.addLine('  ls / dir      - list files and folders', 'white');
        this.term.addLine('  pwd           - print working directory', 'white');
        this.term.addLine('  cd            - change directory', 'white');
        this.term.addLine('  date          - show current date/time', 'white');
        this.term.addLine('  uptime        - show session uptime', 'white');
        this.term.addLine('  uname         - system information', 'white');
        this.term.addLine('  history       - show command history', 'white');
        this.term.addLine('  fortune       - random quote', 'white');
        this.term.addLine('  sudo          - simulate privilege escalation', 'white');
        this.term.addLine('  chat <msg>    - send message to room', 'white');
        this.term.addLine('  theme         - change terminal theme', 'white');
        this.term.addLine('');
        this.term.addLine('fun:', 'cyan');
        this.term.addLine('  hello         - say hello', 'white');
        this.term.addLine('  hack          - pseudo hacking sequence', 'white');
        this.term.addLine('  cowsay <msg>  - ascii cow says something', 'white');
        this.term.addLine('');
        this.term.addLine('play:', 'cayn');
        this.term.addLine('  snake         - classic snake game', 'white');
        this.term.addLine('  tetris        - ascii tetris', 'white');
        this.term.addLine('  rocket        - dodge asteroids and shoot', 'white');
    }

    profile() {
        this.term.addLine(`username: ${this.term.username}`, 'cyan');
        this.term.addLine(`display name: ${this.term.displayName}`, 'cyan');
    }

    themes() {
        this.term.addLine('themes:', 'yelow');
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
        this.term.addLine('just a lil js term.', 'cyan');
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
        const dir = this.term.cwd === '~' ? `/home/${this.term.username || 'guest'}` : `/home/${this.term.username || 'guest'}/${this.term.cwd}`;
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

    cd(dir) {
        if (!dir || dir === '~') {
            this.term.cwd = '~';
        } else if (dir === '..') {
            if (this.term.cwd !== '~') {
                const parts = this.term.cwd.split('/');
                parts.pop();
                this.term.cwd = parts.length ? parts.join('/') : '~';
            }
        } else {
            if (this.term.cwd === '~') {
                this.term.cwd = dir;
            } else {
                this.term.cwd += '/' + dir;
            }
        }
        this.term.refreshPrompt();
    }

    history() {
        this.term.hist.slice(0).reverse().forEach((cmd, idx) => {
            this.term.addLine(`${idx + 1}  ${cmd}`, 'white');
        });
    }

    uptime() {
        const secs = Math.floor((Date.now() - this.term.startTime) / 1000);
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        this.term.addLine(`uptime: ${hrs}h ${mins}m ${s}s`, 'white');
    }

    uname() {
        this.term.addLine('js term', 'wite');
    }
} 