class TerminalGameHub {
    constructor() {
        this.output = document.getElementById('terminal-output');
        this.input = document.getElementById('terminal-input');
        this.prompt = document.getElementById('terminal-prompt');
        this.cursor = null;
        
        // yo this is where all the magic happens
        this.currentTheme = localStorage.getItem('terminalTheme') || 'matrix';
        this.setupMode = false;
        this.userProfile = this.loadUserProfile();
        this.isHacking = false;
        
        // konami cheat code - classic easter egg ftw
        this.konamiSequence = [];
        this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        this.secretsUnlocked = false;
        
        // game state vars and whatnot
        this.snakeGame = null;
        this.gameActive = false;
        this.gameBoard = null;
        
        if (!this.userProfile) {
            this.startSetup();
        } else {
            this.setupStuff();
            this.showWelcome();
        }
        
        // theme configs - if it ain't broke don't fix it
        this.themes = {
            'matrix': 'green matrix vibes',
            'cyberpunk': 'neon pink style', 
            'minimalist': 'clean white mode',
            'neon': 'cyan glow',
            'noir': 'retro gray style'
        };
    }
    
    loadUserProfile() {
        let saved = localStorage.getItem('terminalUserProfile');
        return saved ? JSON.parse(saved) : null;
    }
    
    saveUserProfile(profile) {
        localStorage.setItem('terminalUserProfile', JSON.stringify(profile));
        this.userProfile = profile;
    }
    
    updatePrompt() {
        if (this.userProfile && this.prompt) {
            this.prompt.textContent = `${this.userProfile.username}@ate-bit:~$ `;
        }
    }
    
    startSetup() {
        this.setupMode = true;
        this.setupStep = 'name';
        this.tempProfile = {};
        
        this.output.innerHTML = `
<pre style="color: #00ff00;">
 ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ 
█       █       █       █
█   ▄   █▄     ▄█    ▄▄▄█
█  █▄█  █ █   █ █   █▄▄▄ 
█       █ █   █ █    ▄▄▄█
█   ▄   █ █   █ █   █▄▄▄ 
█▄▄█ █▄▄█ █▄▄▄█ █▄▄▄▄▄▄▄█
           ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ 
          █  ▄    █       █       █
          █ █▄█   █   ▄   █▄     ▄█
          █       █  █▄█  █ █   █  
          █  ▄   ██       █ █   █  
          █ █▄█   █   ▄   █ █   █  
          █▄▄▄▄▄▄▄█▄▄█ █▄▄█ █▄▄▄█  
</pre>
hey there! looks like ur new here
let's get u setup real quick...

what should i call you? (display name):`;
        
        this.setupStuff();
    }
    
    handleSetupInput(input) {
        if (this.setupStep === 'name') {
            this.tempProfile.name = input;
            this.addLine(`nice to meet u ${input}!`, 'green');
            this.addLine('');
            this.addLine('now pick a username (no spaces, keep it cool):');
            this.setupStep = 'username';
        } else if (this.setupStep === 'username') {
            if (input.includes(' ') || input.length < 2) {
                this.addLine('nah mate, username needs to be solid (no spaces, 2+ chars)', 'error');
                this.addLine('try again:');
                return;
            }
            this.tempProfile.username = input;
            this.addLine(`@${input} looks sick!`, 'cyan');
            this.addLine('');
            this.addLine('password? (optional, press enter to skip):');
            this.setupStep = 'password';
        } else if (this.setupStep === 'password') {
            if (input.trim()) {
                this.tempProfile.password = input;
                this.addLine('password saved (totally secure trust me)', 'yellow');
            } else {
                this.addLine('no password, living dangerously i see', 'gray');
            }
            
            // wrap it up
            this.tempProfile.createdAt = new Date().toISOString();
            this.tempProfile.loginCount = 1;
            this.saveUserProfile(this.tempProfile);
            
            this.setupMode = false;
            this.addLine('');
            this.addLine('setup complete! welcome to the matrix kiddo', 'green');
            this.addLine('type "help" if ur lost', 'gray');
            this.addLine('');
            
            this.updatePrompt();
            this.showWelcome();
        }
    }
    
    setupStuff() {
        this.cursor = document.querySelector('.cursor');
        
        // wire up the theme buttons - this took me way too long to figure out
        document.querySelectorAll('.theme-preview').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.switchTheme(theme);
            });
        });
        
        this.input.addEventListener('keydown', (e) => {
            this.trackKonamiCode(e);
            
            if (e.key === 'Enter') {
                const cmd = this.input.value.trim();
                if (cmd) {
                    if (this.setupMode) {
                        this.handleSetupInput(cmd);
                    } else {
                        this.runCommand(cmd);
                    }
                }
                this.input.value = '';
                this.updateCursorPosition();
            }
        });
        
        this.input.addEventListener('input', () => this.updateCursorPosition());
        this.input.addEventListener('keyup', () => this.updateCursorPosition());
        this.input.addEventListener('paste', () => setTimeout(() => this.updateCursorPosition(), 10));
        
        setTimeout(() => {
            this.updateCursorPosition();
            this.updatePrompt();
        }, 100);
    }
    
    trackKonamiCode(e) {
        this.konamiSequence.push(e.code);
        if (this.konamiSequence.length > this.konamiCode.length) {
            this.konamiSequence.shift();
        }
        
        if (this.konamiSequence.length === this.konamiCode.length) {
            let matches = true;
            for (let i = 0; i < this.konamiCode.length; i++) {
                if (this.konamiSequence[i] !== this.konamiCode[i]) {
                    matches = false;
                    break;
                }
            }
            
            if (matches && !this.secretsUnlocked) {
                this.secretsUnlocked = true;
                this.addLine('');
                this.addLine('KONAMI CODE ACTIVATED!', 'cyan');
                this.addLine(`${this.userProfile?.name || 'user'} just unlocked secret commands...`, 'yellow');
                this.addLine('try: secret, clippy, paperclip, magic', 'green');
                this.addLine('');
            }
        }
    }
    
    updateCursorPosition() {
        if (!this.cursor || !this.input) return;
        
        var txt = this.input.value || '';
        
        // this cursor positioning is jank but it works so dont touch it
        let span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.fontSize = '14px';
        span.style.fontFamily = '"JetBrains Mono", monospace';
        span.style.whiteSpace = 'pre';
        span.style.letterSpacing = 'normal';
        span.textContent = txt;
        
        const container = this.input.parentElement;
        container.appendChild(span);
        const w = span.offsetWidth;
        container.removeChild(span);
        
        this.cursor.style.left = w + 'px';
    }
    
    runCommand(command) {
        this.addLine(`$ ${command}`, 'user-input');
        
        let bits = command.trim().split(' ');
        var cmd = bits[0].toLowerCase();
        const args = bits.slice(1);
        
        // main commands
        if(cmd === 'help') {
            this.showHelp();
        } 
        else if(cmd === 'clear' || cmd === 'cls') {
            this.output.innerHTML = '';
        } 
        else if(cmd === 'snake') {
            this.startSnake();
        } else if(cmd === 'about') {
            this.showAbout();
        } 
        else if(cmd === 'theme') {
            this.handleThemeCommand(args);
        } 
        else if(cmd === 'themes') {
            this.showThemes();
        } else if(cmd === 'matrix') {
            this.startMatrixEffect(); 
        } 
        else if(cmd === 'hack') {
            if (args.length === 0) {
                this.addLine('usage: hack <target_name>', 'yellow');
                this.addLine('example: hack john_doe', 'gray');
            } else {
                this.startHackSim(args[0]);
            }
        }
        else if(cmd === 'profile') {
            if (args.length > 0 && args[0] === 'reset') {
                this.addLine('u sure u wanna nuke ur profile? (y/n)', 'yellow');
                this.addLine('this will delete everything mate', 'red');
                this.addLine('> ', 'yellow');
                
                this.confirmReset = true;
                this.input.addEventListener('keydown', this.handleResetConfirm = (e) => {
                    if (e.key === 'Enter') {
                        const resp = this.input.value.trim().toLowerCase();
                        this.addLine(`$ ${this.input.value}`, 'user-input');
                        
                        if (resp === 'y' || resp === 'yes') {
                            localStorage.removeItem('terminalUserProfile');
                            this.addLine('boom. profile deleted. restarting...', 'green');
                            setTimeout(() => location.reload(), 2000);
                        } else {
                            this.addLine('smart choice, keeping ur stuff', 'gray');
                            this.confirmReset = false;
                        }
                        
                        this.input.removeEventListener('keydown', this.handleResetConfirm);
                        this.input.value = '';
                        this.updateCursorPosition();
                        e.preventDefault();
                    }
                });
            } else {
                this.showProfile();
            }
        }
        // unix-style commands cuz why not
        else if(cmd === 'whoami') {
            this.addLine(this.userProfile?.username || 'mystery_user', 'green');
            this.addLine(`groups: ${this.userProfile?.username || 'user'},sudo,gamers,magic_paperclip_fan`, 'gray');
        }
        else if(cmd === 'pwd') {
            this.addLine(`/home/${this.userProfile?.username || 'user'}/ate_bit_experiments`, 'cyan');
        }
        else if(cmd === 'ls' || cmd === 'dir') {
            this.addLine('total 42', 'gray');
            this.addLine(`drwxr-xr-x  2 ${this.userProfile?.username || 'user'} gamers  4096 Jan  1 13:37 games/`, 'cyan');
            this.addLine(`-rw-r--r--  1 ${this.userProfile?.username || 'user'} users    420 Jan  1 04:20 secrets.txt`, 'white');
            this.addLine(`-rw-r--r--  1 ${this.userProfile?.username || 'user'} users   1337 Jan  1 00:01 readme.txt`, 'white');
            this.addLine(`-rwxr-xr-x  1 ${this.userProfile?.username || 'user'} games   8192 Jan  1 12:34 snake*`, 'green');
            this.addLine(`-rw-r--r--  1 ${this.userProfile?.username || 'user'} users    666 Jan  1 03:33 .sus_stuff`, 'gray');
        }
        else if(cmd === 'cat') {
            if (args.length === 0) {
                this.addLine('cat: missing file bruv', 'error');
                this.addLine('try: cat secrets.txt or cat readme.txt', 'gray');
            } else if (args[0] === 'secrets.txt') {
                this.addLine(`${this.userProfile?.name || 'user'}\'s secret stash:`, 'yellow');
                this.addLine('- type "sudo rm -rf /" for chaos mode', 'gray');
                this.addLine('- try "404" when ur lost af', 'gray');
                this.addLine('- "exit" is kinda broken lol', 'gray');
                this.addLine('- konami code unlocks the goods', 'gray');
                this.addLine('- magical paperclip still vibin here', 'gray');
            } else if (args[0] === 'readme.txt') {
                this.addLine('ATE-BIT TERMINAL v0.1.0', 'cyan');
                this.addLine('========================', 'cyan');
                this.addLine('');
                this.addLine(`${this.userProfile?.name || 'user'}\'s personal terminal playground`, 'green');
                this.addLine('featuring super snake 3.0 and other random stuff', 'white');
                this.addLine('');
                this.addLine('easter eggs everywhere if u know where to look...', 'yellow');
                this.addLine('happy hunting!', 'gray');
            } else if (args[0] === '.sus_stuff') {
                this.addLine('    /|', 'yellow');
                this.addLine('   / |_', 'yellow');
                this.addLine('  /  / \\', 'yellow');
                this.addLine(' /  /   \\', 'yellow');
                this.addLine('/  /     \\', 'yellow');
                this.addLine(`${this.userProfile?.name || 'user'} wuz here`, 'cyan');
                this.addLine('probably shouldnt be reading this...', 'red');
            } else {
                this.addLine(`cat: ${args[0]}: file not found mate`, 'error');
            }
        }
        else if(cmd === 'date' || cmd === 'time') {
            const now = new Date();
            this.addLine(now.toString(), 'white');
            this.addLine(`time flies when ${this.userProfile?.name || 'u'} are coding`, 'gray');
        }
        else if(cmd.startsWith('sudo')) {
            const sudoCmd = command.substring(5).trim();
            if (sudoCmd === 'rm -rf /' || sudoCmd === 'rm -rf /*') {
                this.addLine(`WHOA THERE ${(this.userProfile?.name || 'user').toUpperCase()}!`, 'red');
                this.addLine('rm: cannot remove \'/\': system protection enabled', 'yellow');
                this.addLine('nice try though ;)', 'green');
                this.addLine('your terminal keeps you safe!', 'cyan');
            } else if (sudoCmd.includes('hack')) {
                this.addLine(`sudo: hack: command enhanced with ${this.userProfile?.name || 'user'} powers`, 'green');
                this.runCommand(sudoCmd);
            } else {
                this.addLine(`[sudo] password for ${this.userProfile?.username || 'user'}: `, 'yellow');
                this.addLine('sudo: access granted automatically', 'green');
                this.addLine(`executing: ${sudoCmd}`, 'cyan');
                if (sudoCmd) this.runCommand(sudoCmd);
            }
        }
        else if(cmd === '404') {
            this.addLine('404 - Command Not Found', 'red');
            this.addLine(`but ${this.userProfile?.name || 'someone'} found you!`, 'green');
            this.addLine('       /|', 'yellow');
            this.addLine('      / |', 'yellow');  
            this.addLine('     /__|', 'yellow');
            this.addLine('  to the rescue!', 'cyan');
        }
        else if(cmd === 'exit' || cmd === 'quit') {
            this.addLine(`exit: ${this.userProfile?.name || 'user'} never leaves`, 'yellow');
            this.addLine('you are stuck here forever... mwahahaha', 'red');
            this.addLine('just kidding! refresh page to escape', 'green');
        }
        else if(cmd === 'secret' && this.secretsUnlocked) {
            this.addLine(`SECRET ${(this.userProfile?.name || 'USER').toUpperCase()} MODE ACTIVATED`, 'cyan');
            this.addLine('');
            this.addLine('    ╭─────────────╮', 'yellow');
            this.addLine(`    │ ${this.userProfile?.name?.toUpperCase().padEnd(11) || 'SECRET ZONE'}│`, 'yellow');
            this.addLine('    │   POWER!    │', 'yellow');  
            this.addLine('    ╰─────────────╯', 'yellow');
            this.addLine('         /|\\', 'yellow');
            this.addLine('        / | \\', 'yellow');
            this.addLine('       /  |  \\', 'yellow');
            this.addLine('      /___|___\\', 'yellow');
            this.addLine('');
            this.addLine(`all commands now have extra ${this.userProfile?.name || 'user'} magic!`, 'green');
        }
        else if(cmd === 'clippy' || cmd === 'paperclip') {
            const responses = [
                'It looks like you\'re trying to use a terminal!',
                'Would you like help with that command?',
                'I see you\'re exploring. Need assistance?',
                `${this.userProfile?.name || 'User'} tip: try typing "help" for commands!`,
                'Looking for easter eggs? You found one!',
                'I\'m still here helping after all these years',
                'Remember Office 97? Good times!',
                'Would you like me to format that command?'
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addLine(`CLIPPY: "${response}"`, 'yellow');
            this.addLine('       /|', 'yellow');
            this.addLine('      / |_', 'yellow');
            this.addLine('     /   )', 'yellow');
            this.addLine('    /___|', 'yellow');
        }
        else if(cmd === 'magic' && this.secretsUnlocked) {
            this.addLine(`CASTING ${(this.userProfile?.name || 'USER').toUpperCase()} MAGIC...`, 'cyan');
            this.addLine('⚡ * ⚡ * ⚡ * ⚡ * ⚡', 'yellow');
            this.addLine('BOOM! Something magical happened!', 'green');
            this.addLine('(check browser console)', 'gray');
            console.log(`%c ${(this.userProfile?.name || 'USER').toUpperCase()} WAS HERE! `, 'background: #00ff00; color: #000; font-size: 20px; font-weight: bold;');
            console.log(`🔥 ${this.userProfile?.name || 'You'} found the secret magic! 🔥`);
        }
        else if(cmd === 'history') {
            this.addLine(`bash: history: ${this.userProfile?.name || 'user'} remembers everything`, 'yellow');
            this.addLine('1  help', 'gray');
            this.addLine('2  snake', 'gray');
            this.addLine('3  hack paperclip', 'gray');
            this.addLine('4  whoami', 'gray');
            this.addLine('5  sudo make me a sandwich', 'gray');
            this.addLine('6  ' + command, 'cyan');
        }
        else if(cmd === 'ps' || cmd === 'top') {
            this.addLine('PID    USER    %CPU  %MEM   COMMAND', 'cyan');
            this.addLine(`1337   ${this.userProfile?.username || 'user'}  0.1   0.2   terminal_session`, 'white');
            this.addLine(`1338   ${this.userProfile?.username || 'user'}  0.0   0.1   snake_game --level=awesome`, 'white');
            this.addLine(`1339   ${this.userProfile?.username || 'user'} 99.9  50.0   being_awesome`, 'green');
            this.addLine(`1340   ${this.userProfile?.username || 'user'}  0.0   0.0   [easter_egg_hunter]`, 'gray');
        }
        else if(cmd === 'uname' || cmd === 'uname -a') {
            this.addLine(`${this.userProfile?.name || 'User'}OS 3.14159 #ate-bit SMP`, 'cyan');
            this.addLine(`Built by ${this.userProfile?.name || 'user'} for maximum awesomeness`, 'gray');
        }
        else if(cmd === 'fortune') {
            const fortunes = [
                `A ${this.userProfile?.name || 'great user'} a day keeps the errors away`,
                'In terminals we trust',
                'The best help comes from within',
                'Snake games are the path to enlightenment',
                `${this.userProfile?.name || 'Great users'} bring good luck to terminals`,
                'Today is a good day to write some code',
                `Remember: with great power comes great ${this.userProfile?.name || 'responsibility'}`
            ];
            const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
            this.addLine(randomFortune, 'yellow');
            this.addLine(`-- ${this.userProfile?.name || 'user'} fortune cookie`, 'gray');
        }
        else if(cmd === 'echo') {
            if (args.length > 0) {
                const txt = args.join(' ');
                if (txt.includes(this.userProfile?.name?.toLowerCase()) || txt.includes('paperclip') || txt.includes('clippy')) {
                    this.addLine(txt + ` (enhanced by ${this.userProfile?.name || 'user'})`, 'green');
                } else {
                    this.addLine(txt, 'white');
                }
            } else {
                this.addLine('', 'white');
            }
        }
        else {
            this.addLine(`bash: ${command}: command not found`, 'error');
            if (Math.random() < 0.3) {
                this.addLine(`${this.userProfile?.name || 'user'} suggests: try "help" for commands that actually work`, 'yellow');
            } else {
                this.addLine('try "help" to see what actually works');
            }
        }
    }
    
    showProfile() {
        if (!this.userProfile) {
            this.addLine('no profile found - that\'s weird af!', 'error');
            return;
        }
        
        this.addLine('ur profile stuff:', 'cyan');
        this.addLine('═════════════', 'cyan');
        this.addLine(`name: ${this.userProfile.name}`, 'white');
        this.addLine(`username: ${this.userProfile.username}`, 'white');
        this.addLine(`created: ${new Date(this.userProfile.createdAt).toLocaleDateString()}`, 'gray');
        this.addLine(`times logged in: ${this.userProfile.loginCount}`, 'gray');
        this.addLine('');
        this.addLine('type "profile reset" to nuke everything', 'yellow');
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
        
        this.addLine('ate-bit v0.1.0 - retro terminal', 'cyan');
        this.addLine('web terminal with games, themes, and easter eggs', 'gray');
        this.addLine('');
        this.addLine('type "help" to see available commands');
        this.addLine('');
    }
    
    showHelp() {
        this.addLine('commands that actually work:', 'cyan');
        this.addLine('');
        this.addLine('  help          - this help menu');
        this.addLine('  clear         - clear the screen');
        this.addLine('  snake         - super snake 3.0 game');
        this.addLine('  theme         - change colors');
        this.addLine('  themes        - show all themes');
        this.addLine('  matrix        - cool matrix rain effect');
        this.addLine('  about         - info about this thing');
        this.addLine('  hack <target> - hacking simulator (try magical paperclip)');
        this.addLine('  profile       - your profile info');
        this.addLine('');
        this.addLine('unix commands:', 'yellow');
        this.addLine('  ls, pwd, whoami, cat, date, ps, history', 'gray');
        this.addLine('');
        this.addLine('tip: try hack paperclip for easter eggs');
    }
    
    showAbout() {
        this.addLine('ate-bit v0.1.0', 'cyan');
        this.addLine('');
        this.addLine('web terminal with super snake 3.0 + hacking simulator');
        this.addLine('features: obstacles, portals, poison, powerups, high scores');
        this.addLine('hidden stuff: easter eggs, konami codes, secret commands');
        this.addLine('');
        this.addLine('made with vanilla js, no fancy frameworks', 'gray');
        this.addLine('controls: arrow keys to move, esc to quit', 'gray');
        this.addLine('');
    }
    
    startSnake() {
        if (this.isHacking) this.endHackSim();
        if (this.gameActive) return;
        this.gameActive = true;
        document.querySelector('.input-container').style.display = 'none';
        
        var highScore = localStorage.getItem('snakeHighScore') || 0;
        this.addLine('SUPER SNAKE 3.0 - the good stuff', 'green');
        this.addLine(`high score to beat: ${highScore}`, 'yellow');
        this.addLine('● = apple (1pt) | ◉ = power (5pts) | * = bonus (10pts) | <> = poison (-3pts)', 'cyan');
        this.addLine('~ = slow-mo | $ = mega-points | ^ = obstacles | o = portals', 'cyan');
        this.addLine('every 20 pts = more obstacles (gets spicy)!', 'gray');
        this.addLine('');
        
        var board = this.makeBoard(32, 16);
        let snake = [{x: 16, y: 8}];
        let foods = [{x: 20, y: 8, type: 'apple'}]; 
        var obstacles = [];
        let portals = [];
        const dir = {x: 1, y: 0};
        var score = 0;
        let lvl = 1;
        var gameSpeed = 180; 
        let powerTimer = 0;
        var godMode = false; 
        let slowTime = false;
        var slowTimer = 0;
        let megaMode = false;
        var megaTimer = 0;
        var lastFood = ''; 
        let foodsEaten = 1;
        
        // spawn random food somewhere safe
        const dropFood = () => {
            let x, y;
            do {
                x = Math.floor(Math.random() * 32);
                y = Math.floor(Math.random() * 16);
            } while (snake.some(bit => bit.x === x && bit.y === y) || 
                     obstacles.some(obs => obs.x === x && obs.y === y) ||
                     foods.some(f => f.x === x && f.y === y));
            
            var rng = Math.random(); 
            let foodType = 'apple';
            if(rng < 0.45) foodType = 'apple'; 
            else if(rng < 0.65) foodType = 'powerup';
            else if(rng < 0.8) foodType = 'bonus';
            else if(rng < 0.88) foodType = 'poison'; 
            else if(rng < 0.94) foodType = 'slowmo';
            else foodType = 'mega'; 
            
            foods.push({x, y, type: foodType});
        };
        
        // add some obstacles to make it harder
        const addObstacles = (cnt) => {
            for (let i = 0; i < cnt; i++) {
                let x, y;
                do {
                    x = Math.floor(Math.random() * 32);
                    y = Math.floor(Math.random() * 16);
                } while (snake.some(bit => bit.x === x && bit.y === y) || 
                         obstacles.some(obs => obs.x === x && obs.y === y) ||
                         foods.some(f => f.x === x && f.y === y) ||
                         (x >= 14 && x <= 18 && y >= 6 && y <= 10)); 
                
                obstacles.push({x, y});
            }
        };
        
        const spawnPortals = () => {
            if (portals.length >= 2) return;
            
            for (let i = 0; i < 2; i++) {
                let x, y;
                do {
                    x = Math.floor(Math.random() * 32);
                    y = Math.floor(Math.random() * 16);
                } while (snake.some(bit => bit.x === x && bit.y === y) || 
                         obstacles.some(obs => obs.x === x && obs.y === y) ||
                         foods.some(f => f.x === x && f.y === y) ||
                         portals.some(p => p.x === x && p.y === y));
                
                portals.push({x, y});
            }
        };
        
        const getFoodChar = (foodType) => {
            switch(foodType) {
                case 'apple': return '●';
                case 'powerup': return '◉';
                case 'bonus': return '*';
                case 'poison': return '<>';
                case 'slowmo': return '~';
                case 'mega': return '$';
                default: return '●';
            }
        };
        
        const getSnakeChar = (i) => {
            if (i === 0) return godMode ? '◇' : '◆';
            return godMode ? '□' : '■';
        };
        
        const draw = () => {
            for(let y = 0; y < 16; y++) for(var x = 0; x < 32; x++) board[y][x] = ' ';
            
            obstacles.forEach(obs => {
                if(obs.x >= 0 && obs.x < 32 && obs.y >= 0 && obs.y < 16) {
                    board[obs.y][obs.x] = '^';
                }
            });
            
            portals.forEach(portal => {
                if(portal.x >= 0 && portal.x < 32 && portal.y >= 0 && portal.y < 16) {
                    board[portal.y][portal.x] = 'o';
                }
            });
            
            foods.forEach(food => {
                if(food.x >= 0 && food.x < 32 && food.y >= 0 && food.y < 16) {
                    board[food.y][food.x] = getFoodChar(food.type);
                }
            });
            
            snake.forEach((bit, i) => {
                if(bit.x >= 0 && bit.x < 32 && bit.y >= 0 && bit.y < 16) {
                    board[bit.y][bit.x] = getSnakeChar(i);
                }
            });
            
            let status = `score: ${score} | lvl: ${lvl} | speed: ${Math.round((200-gameSpeed)/20)}x`;
            if (godMode) status += ' | GOD MODE';
            if (slowTime) status += ' | SLOW-MO';
            if (megaMode) status += ' | MEGA-PTS';
            if (lastFood) status += ` | ${lastFood}`;
            
            this.showBoard(board, status);
        };
        
        const gameLoop = () => {
            if (this.gameActive !== 'snake') return;
            
            var head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
            
            if(!invincible && (head.x < 0 || head.x >= 32 || head.y < 0 || head.y >= 16)) {
                this.gameOver(`hit the wall! final score: ${points}`);
                return;
            }
            
            if(invincible) {
                if(head.x < 0) head.x = 31;
                if(head.x >= 32) head.x = 0;
                if(head.y < 0) head.y = 15;
                if(head.y >= 16) head.y = 0;
            }
            
            if(!invincible && obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
                this.gameOver(`hit obstacle! final score: ${points}`);
                return;
            }
            
            if(!invincible && snake.some(bit => bit.x === head.x && bit.y === head.y)) {
                this.gameOver(`ate yourself! final score: ${points}`);
                return;
            }
            
            const portalHit = portals.find(p => p.x === head.x && p.y === head.y);
            if (portalHit) {
                const otherPortal = portals.find(p => p !== portalHit);
                if (otherPortal) {
                    head.x = otherPortal.x;
                    head.y = otherPortal.y;
                    lastEaten = 'TELEPORTED!';
                }
            }
            
            snake.unshift(head);
            
            var eatenFood = foods.find(f => f.x === head.x && f.y === head.y);
            if (eatenFood) {
                let foodPoints = 0;
                let shouldGrow = true;
                
                switch(eatenFood.type) {
                    case 'apple':
                        foodPoints = megaPoints ? 3 : 1;
                        lastEaten = megaPoints ? '+3 MEGA!' : '+1';
                        break;
                    case 'powerup':
                        foodPoints = megaPoints ? 15 : 5;
                        powerUpTimer = 60;
                        invincible = true;
                        lastEaten = megaPoints ? '+15 MEGA POWER!' : '+5 POWER!';
                        break;
                    case 'bonus':
                        foodPoints = megaPoints ? 30 : 10;
                        lastEaten = megaPoints ? '+30 MEGA BONUS!' : '+10 BONUS!';
                        break;
                    case 'poison':
                        foodPoints = -3;
                        shouldGrow = false;
                        if (snake.length > 3) {
                            snake.pop();
                            snake.pop();
                        }
                        lastEaten = 'POISON -3!';
                        break;
                    case 'slowmo':
                        foodPoints = megaPoints ? 6 : 2;
                        slowMoTimer = 40;
                        slowMo = true;
                        lastEaten = megaPoints ? '+6 SLOW-MO!' : '+2 SLOW-MO!';
                        break;
                    case 'mega':
                        foodPoints = 15;
                        megaPointsTimer = 30;
                        megaPoints = true;
                        lastEaten = '+15 MEGA-POINTS!';
                        break;
                }
                
                points = Math.max(0, points + foodPoints);
                
                foods.splice(foods.indexOf(eatenFood), 1);
                
                var newSpeed = Math.max(60, 180 - Math.floor(points / 5) * 15);
                if (newSpeed !== speed) {
                    speed = newSpeed;
                    lastEaten += ' SPEED UP!';
                }
                
                let newLevel = Math.floor(points / 20) + 1;
                if(newLevel > level) {
                    level = newLevel;
                    spawnObstacles(Math.min(level - 1, 8)); 
                    if (level % 3 === 0 && portals.length === 0) {
                        spawnPortals();
                        lastEaten = `LEVEL ${level} - PORTALS UNLOCKED!`;
                    } else {
                        lastEaten = `LEVEL ${level} - NEW OBSTACLES!`;
                    }
                }
                
                if(foods.length < Math.min(3, Math.floor(level / 2) + 1)) {
                    spawnFood();
                }
                
                if (points === 10) lastEaten = 'FIRST MILESTONE!';
                if (points === 25) lastEaten = 'ON FIRE!';
                if (points === 50) lastEaten = 'SNAKE MASTER!';
                if (points === 100) lastEaten = 'LEGENDARY!';
                if (points === 150) lastEaten = 'SUPREME SNAKE!';
                if (points === 200) lastEaten = 'SNAKE GOD!';
                
            } else if(!eatenFood) {
                snake.pop();
                if(lastEaten && Math.random() < 0.3) lastEaten = '';
            }
            
            if(powerUpTimer > 0) {
                powerUpTimer--;
                if (powerUpTimer === 0) {
                    invincible = false;
                    lastEaten = 'power ended';
                }
            }
            
            if (slowMoTimer > 0) {
                slowMoTimer--;
                if (slowMoTimer === 0) {
                    slowMo = false;
                    lastEaten = 'slow-mo ended';
                }
            }
            
            if (megaPointsTimer > 0) {
                megaPointsTimer--;
                if (megaPointsTimer === 0) {
                    megaPoints = false;
                    lastEaten = 'mega-points ended';
                }
            }
            
            draw();
            setTimeout(tick, slowMo ? speed * 1.5 : speed);
        };
        
        const handleKeys = (e) => {
            if (this.gameActive !== 'snake') return;
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
        if(Math.random() < 0.3) spawnFood(); 
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
        this.gameActive = null;
        document.querySelector('.input-container').style.display = '';
        this.input.focus();
        this.updateCursorPosition();
        document.removeEventListener('keydown', this._snakeKeyHandler);
        
        var scoreMatch = msg.match(/final score: (\d+)/);
        let finalScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        
        const prevRecord = parseInt(localStorage.getItem('snakeHighScore') || '0');
        let newHighScore = false;
        
        if (finalScore > prevRecord) {
            localStorage.setItem('snakeHighScore', finalScore.toString());
            newHighScore = true;
        }
        
        this.addLine('');
        this.addLine(msg, 'yellow');
        
        if (newHighScore && finalScore > 0) {
            this.addLine('YOOO NEW HIGH SCORE!', 'cyan');
            this.addLine(`beat the old record: ${prevRecord}`, 'gray');
        } else if (finalScore > 0) {
            this.addLine(`high score still: ${prevRecord}`, 'gray');
        }
        
        this.addLine('type "snake" to run it back!');
        this.addLine('');
    }
    
    quitGame() {
        this.gameActive = null;
        document.querySelector('.input-container').style.display = '';
        this.input.focus();
        this.updateCursorPosition();
        document.removeEventListener('keydown', this._snakeKeyHandler);
        this.addLine('');
        this.addLine('aight rage quit');
        this.addLine('');
    }
    
    startHackSim(target = 'anonymous') {
        if (this.gameActive) this.quitGame();
        if (this.isHacking) return;
        this.isHacking = true;
        document.querySelector('.input-container').style.display = 'none';
        
        var isClippy = target.toLowerCase() === 'paperclip' || target.toLowerCase().includes('magical') || target.toLowerCase().includes('clippy');
        
        let randomPort1 = Math.floor(Math.random() * 9000) + 1000; 
        var randomPort2 = Math.floor(Math.random() * 9000) + 1000;
        const randomPort3 = Math.floor(Math.random() * 9000) + 1000;
        let handlerPort = Math.floor(Math.random() * 9000) + 1000;
        var serverPort = Math.floor(Math.random() * 9000) + 1000;
        
        if(isClippy) {
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

    initTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    switchTheme(themeName) {
        if(this.themes[themeName]) {
            this.currentTheme = themeName;
            document.documentElement.setAttribute('data-theme', themeName);
            localStorage.setItem('terminalTheme', themeName);
            
            document.querySelectorAll('.theme-preview').forEach(btn => {
                btn.classList.remove('active');
            });
            var activeBtn = document.querySelector(`.theme-${themeName}`);
            if(activeBtn) activeBtn.classList.add('active');
            
            this.addLine(`theme switched to ${this.themes[themeName]}`, 'cyan');
            
            this.addThemeTransitionEffect();
        }
    }

    addThemeTransitionEffect() {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: var(--glow-color); opacity: 0.1; z-index: 1000;
            pointer-events: none; animation: theme-flash 0.5s ease-out;
        `;
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 500);
        
        if(!document.querySelector('#theme-flash-style')) {
            const style = document.createElement('style');
            style.id = 'theme-flash-style';
            style.textContent = `
                @keyframes theme-flash {
                    0% { opacity: 0.3; }
                    50% { opacity: 0.1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showThemes() {
        this.addLine('available themes:', 'cyan');
        this.addLine('');
        Object.entries(this.themes).forEach(([key, name]) => {
            const current = key === this.currentTheme ? ' (current)' : '';
            this.addLine(`  ${name}${current}`, key === this.currentTheme ? 'yellow' : 'white');
        });
        this.addLine('');
        this.addLine('usage: theme <name>', 'gray');
        this.addLine('example: theme cyberpunk', 'gray');
        this.addLine('');
    }

    handleThemeCommand(args) {
        if (args.length === 0) {
            this.showThemes();
            return;
        }
        
        const themeName = args[0].toLowerCase();
        if (this.themes[themeName]) {
            this.switchTheme(themeName);
        } else {
            this.addLine(`unknown theme: ${themeName}`, 'error');
            this.addLine('type "themes" to see available options', 'gray');
        }
    }

    addThemeSelector() {
        const panel = document.querySelector('.info-panel');
        if (!panel) return;
        
        const themeSection = document.createElement('div');
        themeSection.className = 'panel-section';
        themeSection.innerHTML = `
            <h3>Theme Selector</h3>
            <div class="theme-selector">
                ${Object.keys(this.themes).map(theme => 
                    `<div class="theme-preview theme-${theme} ${theme === this.currentTheme ? 'active' : ''}" 
                          data-theme="${theme}" title="${this.themes[theme]}">
                          <div class="preview-bg"></div>
                          <div class="preview-text">$</div>
                     </div>`
                ).join('')}
            </div>
        `;
        
        themeSection.querySelectorAll('.theme-preview').forEach(btn => {
            btn.addEventListener('click', () => {
                var theme = btn.dataset.theme;
                this.switchTheme(theme);
            });
        });
        
        let footer = panel.querySelector('.panel-footer');
        panel.insertBefore(themeSection, footer);
    }

    startMatrixEffect() {
        this.addLine('initializing matrix digital rain...', 'green');
        this.addLine('');
        
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        let matrixInterval;
        var duration = 5000; 
        
        const matrix = () => {
            let line = '';
            for (let i = 0; i < 80; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                line += Math.random() < 0.05 ? char : ' ';
            }
            this.addLine(line, 'green');
        };
        
        matrixInterval = setInterval(matrix, 150);
        
        setTimeout(() => {
            clearInterval(matrixInterval);
            this.addLine('');
            this.addLine('matrix effect complete', 'cyan');
            this.addLine('wake up, magical paperclip...', 'green');
            this.addLine('');
        }, duration);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TerminalGameHub();
});
