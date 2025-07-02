class TerminalGameHub {
    constructor() {
        this.output = document.getElementById('terminal-output');
        this.input = document.getElementById('terminal-input');
        this.gameRunning = null;
        this.hacking = false;
        
        this.setupStuff();
        this.showWelcome();
    }
    
    setupStuff() {
        this.cursor = document.querySelector('.cursor');
        
        // Set up input event listeners
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.input.value.trim();
                if (cmd) {
                    this.runCommand(cmd);
                }
                this.input.value = '';
                this.updateCursorPosition();
            }
        });
        
        // Real-time cursor positioning
        this.input.addEventListener('input', () => this.updateCursorPosition());
        this.input.addEventListener('keyup', () => this.updateCursorPosition());
        this.input.addEventListener('paste', () => setTimeout(() => this.updateCursorPosition(), 10));
        
        // Initialize cursor position
        setTimeout(() => this.updateCursorPosition(), 100);
    }
    
    updateCursorPosition() {
        if (!this.cursor || !this.input) return;
        
        const text = this.input.value || '';
        
        // Create a temporary span that exactly matches the input styling
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.fontSize = '14px';
        tempSpan.style.fontFamily = '"JetBrains Mono", monospace';
        tempSpan.style.whiteSpace = 'pre';
        tempSpan.style.letterSpacing = 'normal';
        tempSpan.textContent = text;
        
        // Temporarily add to the input container for accurate measurement
        const container = this.input.parentElement;
        container.appendChild(tempSpan);
        const textWidth = tempSpan.offsetWidth;
        container.removeChild(tempSpan);
        
        // Position cursor exactly at the end of the text (insertion point)
        this.cursor.style.left = textWidth + 'px';
    }
    
    runCommand(command) {
        this.addLine(`$ ${command}`, 'user-input');
        
        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        if (cmd === 'help') {
            this.showHelp();
        } else if (cmd === 'clear') {
            this.output.innerHTML = '';
        } else if (cmd === 'snake') {
            this.startSnake();
        } else if (cmd === 'about') {
            this.showAbout();
        } else if (cmd === 'hack') {
            if (args.length === 0) {
                this.addLine('usage: hack <target_name>', 'yellow');
                this.addLine('example: hack john_doe', 'gray');
            } else {
                this.startHackSim(args[0]);
            }
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
        this.addLine('  help          - this thing');
        this.addLine('  clear         - wipe screen');
        this.addLine('  snake         - super snake 2.0');
        this.addLine('  about         - random info');
        this.addLine('  hack <name>   - hack someone');
        this.addLine('');
    }
    
    showAbout() {
        this.addLine('ate-bit v0.1.0', 'cyan');
        this.addLine('');
        this.addLine('web terminal experiment with enhanced snake + hacking sim');
        this.addLine('try hack paperclip for an easter egg');
        this.addLine('');
        this.addLine('vanilla js, arrow keys to move, esc to quit', 'gray');
        this.addLine('');
    }
    
    startSnake() {
        if (this.hacking) this.endHackSim();
        if (this.gameRunning) return;
        this.gameRunning = 'snake';
        document.querySelector('.input-container').style.display = 'none';
        this.addLine('🐍 SUPER SNAKE 2.0 🐍', 'green');
        this.addLine('● = apple (1pt) | ◉ = power-up (5pts) | ★ = bonus (10pts)', 'cyan');
        this.addLine('speed increases every 5 points!', 'gray');
        this.addLine('');
        
        const board = this.makeBoard(32, 16);
        let snake = [{x: 16, y: 8}];
        let food = {x: 20, y: 8, type: 'apple'};
        let dir = {x: 1, y: 0};
        let points = 0;
        let speed = 180;
        let powerUpTimer = 0;
        let invincible = false;
        let lastEaten = '';
        
        const spawnFood = () => {
            let x, y;
            do {
                x = Math.floor(Math.random() * 32);
                y = Math.floor(Math.random() * 16);
            } while (snake.some(bit => bit.x === x && bit.y === y));
            
            const rand = Math.random();
            if (rand < 0.6) {
                food = {x, y, type: 'apple'};
            } else if (rand < 0.85) {
                food = {x, y, type: 'powerup'};
            } else {
                food = {x, y, type: 'bonus'};
            }
        };
        
        const getFoodChar = () => {
            switch(food.type) {
                case 'apple': return '●';
                case 'powerup': return '◉';
                case 'bonus': return '★';
                default: return '●';
            }
        };
        
        const getSnakeChar = (i) => {
            if (i === 0) return invincible ? '◇' : '◆';
            return invincible ? '□' : '■';
        };
        
        const draw = () => {
            for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) board[y][x] = ' ';
            
            snake.forEach((bit, i) => {
                if (bit.x >= 0 && bit.x < 32 && bit.y >= 0 && bit.y < 16) {
                    board[bit.y][bit.x] = getSnakeChar(i);
                }
            });
            
            if (food.x >= 0 && food.x < 32 && food.y >= 0 && food.y < 16) {
                board[food.y][food.x] = getFoodChar();
            }
            
            let status = `score: ${points} | speed: ${Math.round((200-speed)/20)}x`;
            if (invincible) status += ' | 🔥 INVINCIBLE';
            if (lastEaten) status += ` | ${lastEaten}`;
            
            this.showBoard(board, status);
        };
        
        const tick = () => {
            if (this.gameRunning !== 'snake') return;
            
            const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
            
            // Wall collision (unless invincible)
            if (!invincible && (head.x < 0 || head.x >= 32 || head.y < 0 || head.y >= 16)) {
                this.gameOver(`💥 hit the wall! final score: ${points}`);
                return;
            }
            
            // Wrap around if invincible
            if (invincible) {
                if (head.x < 0) head.x = 31;
                if (head.x >= 32) head.x = 0;
                if (head.y < 0) head.y = 15;
                if (head.y >= 16) head.y = 0;
            }
            
            // Self collision (unless invincible)
            if (!invincible && snake.some(bit => bit.x === head.x && bit.y === head.y)) {
                this.gameOver(`🌀 ate yourself! final score: ${points}`);
                return;
            }
            
            snake.unshift(head);
            
            // Food collision
            if (head.x === food.x && head.y === food.y) {
                let foodPoints = 0;
                
                switch(food.type) {
                    case 'apple':
                        foodPoints = 1;
                        lastEaten = '🍎 +1';
                        break;
                    case 'powerup':
                        foodPoints = 5;
                        powerUpTimer = 50; // 50 ticks of invincibility
                        invincible = true;
                        lastEaten = '⚡ +5 POWER!';
                        break;
                    case 'bonus':
                        foodPoints = 10;
                        lastEaten = '✨ +10 BONUS!';
                        break;
                }
                
                points += foodPoints;
                
                // Speed increase every 5 points
                const newSpeed = Math.max(80, 180 - Math.floor(points / 5) * 20);
                if (newSpeed !== speed) {
                    speed = newSpeed;
                    lastEaten += ' 🚀 SPEED UP!';
                }
                
                spawnFood();
                
                // Achievement messages
                if (points === 10) lastEaten = '🎉 FIRST MILESTONE!';
                if (points === 25) lastEaten = '🔥 ON FIRE!';
                if (points === 50) lastEaten = '👑 SNAKE MASTER!';
                if (points === 100) lastEaten = '🚀 LEGENDARY!';
                
            } else {
                snake.pop();
                if (lastEaten && Math.random() < 0.3) lastEaten = ''; // Clear message sometimes
            }
            
            // Handle power-up timer
            if (powerUpTimer > 0) {
                powerUpTimer--;
                if (powerUpTimer === 0) {
                    invincible = false;
                    lastEaten = '⚡ power ended';
                }
            }
            
            draw();
            setTimeout(tick, speed);
        };
        
        const keys = (e) => {
            if (this.gameRunning !== 'snake') return;
            if (e.key === 'Escape') { this.quitGame(); return; }
            switch(e.key) {
                case 'ArrowUp': if (dir.y !== 1) dir = {x: 0, y: -1}; break;
                case 'ArrowDown': if (dir.y !== -1) dir = {x: 0, y: 1}; break;
                case 'ArrowLeft': if (dir.x !== 1) dir = {x: -1, y: 0}; break;
                case 'ArrowRight': if (dir.x !== -1) dir = {x: 1, y: 0}; break;
            }
        };
        
        document.addEventListener('keydown', keys);
        spawnFood();
        draw();
        tick();
        this._snakeKeyHandler = keys;
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
        document.querySelector('.input-container').style.display = '';
        this.input.focus();
        this.updateCursorPosition();
        document.removeEventListener('keydown', this._snakeKeyHandler);
        this.addLine('');
        this.addLine(msg, 'yellow');
        this.addLine('type "snake" to play super snake again! 🐍🚀');
        this.addLine('');
    }
    
    quitGame() {
        this.gameRunning = null;
        document.querySelector('.input-container').style.display = '';
        this.input.focus();
        this.updateCursorPosition();
        document.removeEventListener('keydown', this._snakeKeyHandler);
        this.addLine('');
        this.addLine('ok quitting');
        this.addLine('');
    }
    
    startHackSim(target = 'anonymous') {
        if (this.gameRunning) this.quitGame();
        if (this.hacking) return;
        this.hacking = true;
        document.querySelector('.input-container').style.display = 'none';
        
        const isClippy = target.toLowerCase() === 'paperclip';
        
        // Generate random ports for this hack session
        const randomPort1 = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
        const randomPort2 = Math.floor(Math.random() * 9000) + 1000;
        const randomPort3 = Math.floor(Math.random() * 9000) + 1000;
        const handlerPort = Math.floor(Math.random() * 9000) + 1000;
        const serverPort = Math.floor(Math.random() * 9000) + 1000;
        
        if (isClippy) {
            this.addLine(`$ sudo ./exploit-kit --target=clippy.microsoft.com`, 'cyan');
            this.addLine(`[INFO] "It looks like you're trying to hack me!" - Clippy`, 'yellow');
        } else {
            this.addLine(`$ sudo ./exploit-kit --target=${target}.social.com`, 'cyan');
            this.addLine(`[INFO] Gathering intel on target: ${target}`, 'gray');
        }
        
        const phases = [
            {
                title: 'INITIALIZING PENETRATION SUITE',
                messages: isClippy ? [
                    'npm WARN deprecated clippy-helper@97.0.0: "I see you\'re trying to hack!"',
                    'npm WARN deprecated office-assistant@2000.1.0: this library is no longer supported',
                    '+ metasploit-framework@6.3.25',
                    '+ nmap-scanner@7.94.1',
                    `+ ${target}@1.9.0`,
                    'added 847 packages in 12.3s',
                    '[CLIPPY] "Would you like help with that?"'
                ] : [
                    'npm WARN deprecated request@2.88.2: request has been deprecated',
                    'npm WARN deprecated har-validator@5.1.5: this library is no longer supported',
                    '+ metasploit-framework@6.3.25',
                    '+ nmap-scanner@7.94.1',
                    `+ ${target}@1.9.0`,
                    'added 847 packages in 12.3s'
                ]
            },
            {
                title: 'NETWORK RECONNAISSANCE',
                messages: isClippy ? [
                    'nmap -sS -O clippy.microsoft.com',
                    'Starting Nmap 7.94 ( https://nmap.org )',
                    'Host is up (0.0001s latency). "Hi there!"',
                    'PORT     STATE SERVICE    VERSION',
                    `${randomPort1}/tcp   open  clippy     Office Assistant 97`,
                    `${randomPort2}/tcp open  office     Microsoft Office 2000`,
                    `${randomPort3}/tcp  open  cloud      Office 365 Suite`,
                    '[CLIPPY] "I see you\'re scanning my ports!"'
                ] : [
                    `nmap -sS -O ${target}.social.com`,
                    'Starting Nmap 7.94 ( https://nmap.org )',
                    'Host is up (0.0012s latency).',
                    'PORT     STATE SERVICE    VERSION',
                    `${randomPort1}/tcp   open  ssh        OpenSSH 8.2p1`,
                    `${randomPort2}/tcp   open  http       Apache httpd 2.4.41`,
                    `${randomPort3}/tcp  open  https      Apache httpd 2.4.41`,
                    `WARN: ${target}'s personal server detected on port ${randomPort2}`,
                    `Found: ${target}-laptop.local (192.168.1.105)`,
                    `Found: ${target}-phone.local (192.168.1.106)`
                ]
            },
            {
                title: 'EXPLOITING VULNERABILITIES',
                messages: isClippy ? [
                    'msfconsole -q',
                    'use exploit/windows/office/clippy_buffer_overflow',
                    'set RHOSTS clippy.microsoft.com',
                    'set LHOST 10.0.0.15',
                    'exploit',
                    `[*] Started reverse TCP handler on 10.0.0.15:${handlerPort}`,
                    '[CLIPPY] "It looks like you\'re exploiting me!"',
                    '[*] Clippy shell session 1 opened',
                    'ERROR: "I don\'t think you should do that!" - Clippy',
                    '[+] Office Assistant bypass successful!'
                ] : [
                    'msfconsole -q',
                    'use exploit/linux/http/apache_mod_cgi_bash_env_exec',
                    `set RHOSTS ${target}.social.com`,
                    'set LHOST 10.0.0.15',
                    'exploit',
                    `[*] Started reverse TCP handler on 10.0.0.15:${handlerPort}`,
                    '[*] Command shell session 1 opened',
                    `ERROR: ${target}'s firewall blocking. Trying alternate vector...`,
                    `use auxiliary/scanner/social/${target}_profile_enum`,
                    `[+] Found ${target}'s password: ${target}123!`
                ]
            },
            {
                title: 'PRIVILEGE ESCALATION',
                messages: isClippy ? [
                    'searchsploit microsoft office assistant',
                    'cp /usr/share/exploitdb/exploits/windows/clippy_priv_esc.exe .',
                    'gcc -o clippy_exploit clippy_priv_esc.c',
                    './clippy_exploit',
                    '[CLIPPY] "Would you like me to help you escalate privileges?"',
                    'echo "clippy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers',
                    'su clippy',
                    'clippy@microsoft:~# whoami',
                    'clippy (with admin privileges!)'
                ] : [
                    'searchsploit linux kernel 5.4',
                    'cp /usr/share/exploitdb/exploits/linux/local/47163.c .',
                    'gcc -o exploit 47163.c',
                    './exploit',
                    `WARN: ${target}'s antivirus detected. Switching to stealth mode...`,
                    `echo "${target} ALL=(ALL) NOPASSWD:ALL" >> /etc/security/limits.conf`,
                    `su ${target}`,
                    `${target}@personal-server:~# whoami`,
                    `${target}`
                ]
            },
            {
                title: 'DATA EXFILTRATION',
                messages: isClippy ? [
                    'find /home -name "*.tip" -o -name "*.hlp" -o -name "*.ani"',
                    `Found: ${target}_office_tips.docx`,
                    `Found: ${target}_animations.zip`,
                    'tar -czf /tmp/clippy_files.tar.gz /home/clippy/office/',
                    `python3 -m http.server ${serverPort} &`,
                    `wget http://clippy.microsoft.com:${serverPort}/clippy_files.tar.gz`,
                    'npm WARN: Large animation file transfer detected',
                    'ERROR: "It looks like your download is slow!" - Clippy',
                    '██████████████████████████████ 100% | 1TB office tips transferred',
                    'md5sum clippy_files.tar.gz: c11ppy_h3lp3r...'
                ] : [
                    'find /home -name "*.txt" -o -name "*.doc" -o -name "*.pdf"',
                    `Found: ${target}_personal_emails.mbox`,
                    `Found: ${target}_bank_statements.pdf`,
                    `Found: ${target}_private_photos.zip`,
                    `tar -czf /tmp/${target}_stolen.tar.gz /home/${target}/documents/`,
                    `python3 -m http.server ${serverPort} &`,
                    `wget http://${target}.social.com:${serverPort}/${target}_stolen.tar.gz`,
                    'npm WARN: Large file transfer detected',
                    'ERROR: Connection unstable. Retrying...',
                    '██████████████████████████████ 100% | 1.2GB transferred',
                    `md5sum ${target}_stolen.tar.gz: a3f7b2c4e8d9...`
                ]
            }
        ];
        
        let phaseIndex = 0;
        let msgIndex = 0;
        let interval;
        
        const printNext = () => {
            if (!this.hacking) return;
            
            if (phaseIndex >= phases.length) {
                this.addLine('');
                if (isClippy) {
                    this.addLine('[SUCCESS] CLIPPY SUCCESSFULLY HACKED', 'green');
                    this.addLine('[CLIPPY] "It looks like you hacked me! Need help cleaning up?"', 'yellow');
                    this.addLine('[SUCCESS] Downloaded: 1TB of office tips and animations', 'green');
                    this.addLine('[WARNING] Clippy.exe has been terminated.', 'yellow');
                } else {
                    this.addLine(`[SUCCESS] ${target.toUpperCase()}'S SYSTEM COMPROMISED`, 'green');
                    this.addLine(`[SUCCESS] Downloaded ${target}'s personal files`, 'green');
                    this.addLine(`[SUCCESS] Accessed ${target}'s email accounts`, 'green');
                    this.addLine(`[WARNING] ${target}'s connection terminated.`, 'yellow');
                }
                this.addLine('');
                this.addLine('press ESC to exit', 'gray');
                
                this.hackExitHandler = (e) => {
                    if (e.key === 'Escape') {
                        this.endHackSim();
                    }
                };
                document.addEventListener('keydown', this.hackExitHandler);
                return;
            }
            
            const currentPhase = phases[phaseIndex];
            
            if (msgIndex === 0) {
                this.addLine('');
                this.addLine(`[${currentPhase.title}]`, 'cyan');
            }
            
            if (msgIndex < currentPhase.messages.length) {
                const msg = currentPhase.messages[msgIndex];
                let color = '';
                
                if (msg.includes('WARN') || msg.includes('ERROR')) {
                    color = 'yellow';
                } else if (msg.includes('[+]') || msg.includes('root@') || msg.includes('100%') || msg.includes('SUCCESS')) {
                    color = 'green';
                } else if (msg.includes('npm') || msg.includes('added')) {
                    color = 'gray';
                }
                
                this.addLine(msg, color);
                msgIndex++;
                interval = setTimeout(printNext, 300 + Math.random() * 600);
            } else {
                phaseIndex++;
                msgIndex = 0;
                interval = setTimeout(printNext, 800);
            }
        };
        
        setTimeout(printNext, 500);
        
        this.hackSimCleanup = () => {
            clearTimeout(interval);
            if (this.hackExitHandler) {
                document.removeEventListener('keydown', this.hackExitHandler);
            }
        };
    }
    
    endHackSim() {
        this.hacking = false;
        if (this.hackSimCleanup) this.hackSimCleanup();
        document.querySelector('.input-container').style.display = '';
        this.input.focus();
        this.updateCursorPosition();
        this.addLine('Exited hacking simulator.', 'gray');
        this.addLine('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TerminalGameHub();
});
