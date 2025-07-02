export class Term {
    constructor() {
        let d = document
        this.o = d.getElementById('terminal-output')
        this.i = d.getElementById('terminal-input')
        this.prompt = d.getElementById('terminal-prompt')
        this._blink = d.querySelector('.cursor')
        
        this.look = localStorage.getItem('terminalTheme') || 'matrix'
        this.noob = false
        this.me = this.getUser()
        this.hacking = false
        
        this.cheatCode = []
        this.upupdowndown = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
        this.unlocked = false
        
        this.snek = null
        this.gameon = false
        this.grid = null
        
        this.skins = {
            matrix: 'green matrix vibes',
            cyberpunk: 'neon pink style', 
            minimalist: 'clean white mode',
            neon: 'cyan glow',
            noir: 'retro gray style'
        }

        this.setupStuff()
        
        if (!this.me) {
            this.firstTime()
        } else {
            this.hi()
        }
    }
    
    getUser() {
        let stuff = localStorage.getItem('terminalUserProfile')
        return stuff ? JSON.parse(stuff) : null
    }
    
    save(data) {
        localStorage.setItem('terminalUserProfile', JSON.stringify(data))
        this.me = data
    }
    
    fixPrompt() {
        if (this.me?.username && this.prompt) {
            this.prompt.textContent = `${this.me.username}@ate-bit:~$ `
        }
    }

    firstTime() {
        this.noob = true
        this.step = 'name'
        this.tmp = {}
        
        this.addHTML(`
            <div class="ascii-art green">
 █████╗ ████████╗███████╗      ██████╗ ██╗████████╗
██╔══██╗╚══██╔══╝██╔════╝      ██╔══██╗██║╚══██╔══╝
███████║   ██║   █████╗  █████╗██████╔╝██║   ██║   
██╔══██║   ██║   ██╔══╝  ╚════╝██╔══██╗██║   ██║   
██║  ██║   ██║   ███████╗      ██████╔╝██║   ██║   
╚═╝  ╚═╝   ╚═╝   ╚══════╝      ╚═════╝ ╚═╝   ╚═╝   
            </div>
        `)
        
        this.addLine('Welcome to the Terminal', 'cyan')
        this.addLine('')
        this.addLine('Initial setup required...', 'gray')
        this.addLine('')
        this.addLine('Please enter your name:', 'yellow')
        
        this.initTheme()
        this.updateCursorPosition()
    }
    
    handleSetupInput(input) {
        if (this.step === 'name') {
            this.tmp.name = input
            this.addLine(`Welcome, ${input}`, 'green')
            this.addLine('')
            this.addLine('Please choose a username (no spaces):', 'yellow')
            this.step = 'username'
        } else if (this.step === 'username') {
            if (input.includes(' ') || input.length < 2) {
                this.addLine('Username must be at least 2 characters and contain no spaces', 'red')
                this.addLine('Please try again:', 'yellow')
                return
            }
            this.tmp.username = input
            this.addLine(`Username set to: @${input}`, 'cyan')
            this.addLine('')
            this.addLine('Would you like to set a password? (optional, press Enter to skip):', 'yellow')
            this.step = 'password'
        } else if (this.step === 'password') {
            if (input.trim()) {
                this.tmp.password = input
                this.addLine('Password set successfully', 'green')
            } else {
                this.addLine('Continuing without password', 'green')
            }
            
            this.tmp.createdAt = new Date().toISOString()
            this.tmp.loginCount = 1
            this.save(this.tmp)
            
            this.noob = false
            this.fixPrompt()
            
            this.addLine('')
            this.addLine('Setup complete', 'cyan')
            this.addLine('')
            this.hi()
        }
        // ensure input stays focused after each step
        setTimeout(() => this.i.focus(), 0)
    }
    
    setupStuff() {
        this._blink = document.querySelector('.cursor')
        
        document.querySelectorAll('.theme-preview').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme
                this.switchTheme(theme)
            })
        })
        
        this.i.addEventListener('keydown', (e) => {
            this.trackKonamiCode(e)
            
            if (e.key === 'Enter') {
                const cmd = this.i.value.trim()
                if (cmd) {
                    if (this.noob) {
                        this.handleSetupInput(cmd)
                    } else {
                        this.addLine(`$ ${cmd}`, 'user-input')
                        this.runCommand(cmd)
                    }
                }
                this.i.value = ''
                this.updateCursorPosition()
            }
        })
        
        this.i.addEventListener('input', () => this.updateCursorPosition())
        this.i.addEventListener('keyup', () => this.updateCursorPosition())
        this.i.addEventListener('paste', () => setTimeout(() => this.updateCursorPosition(), 10))
        
        this.initTheme()
        this.updateCursorPosition()
        
       
        setTimeout(() => this.i.focus(), 0)
    }
    
    trackKonamiCode(e) {
        if (!this.unlocked) {
            this.cheatCode.push(e.code)
            if (this.cheatCode.length > this.upupdowndown.length) {
                this.cheatCode.shift()
            }
            if (this.cheatCode.join(',') === this.upupdowndown.join(',')) {
                this.unlocked = true
                this.addLine('')
                this.addLine('KONAMI CODE ACTIVATED!', 'cyan')
                this.addLine(`${this.me?.name || 'user'} just unlocked secret commands...`, 'yellow')
                this.addLine('try: secret, clippy, paperclip, magic', 'green')
                this.addLine('')
            }
        }
    }
    
    updateCursorPosition() {
        if (!this._blink || !this.i) return;
        
        var txt = this.i.value || '';
        
        let span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.fontSize = '14px';
        span.style.fontFamily = '"JetBrains Mono", monospace';
        span.style.whiteSpace = 'pre';
        span.style.letterSpacing = 'normal';
        span.textContent = txt;
        
        const container = this.i.parentElement;
        container.appendChild(span);
        const w = span.offsetWidth;
        container.removeChild(span);
        
        this._blink.style.left = w + 'px';
    }
    
    runCommand(command) {
        this.addLine(`$ ${command}`, 'user-input');
        
        const cmd = command.toLowerCase().trim()
        const args = cmd.split(' ').slice(1)
        
        if(cmd === 'help') {
            this.addLine('Available Commands:', 'cyan')
            this.addLine('')
            this.addLine('System Commands:', 'yellow')
            this.addLine('  help     - Display this help message', 'white')
            this.addLine('  clear    - Clear terminal screen', 'white')
            this.addLine('  whoami   - Display current user', 'white')
            this.addLine('  ls/dir   - List directory contents', 'white')
            this.addLine('  cat      - Read file contents', 'white')
            this.addLine('  profile  - View user profile', 'white')
            this.addLine('')
            this.addLine('Applications:', 'yellow')
            this.addLine('  snake    - Start Snake game', 'white')
            this.addLine('  hack     - Run hack simulation', 'white')
            this.addLine('  theme    - Change terminal theme', 'white')
            this.addLine('')
            this.addLine('Additional commands may be available', 'gray')
        } 
        else if(cmd === 'clear' || cmd === 'cls') {
            this.o.innerHTML = '';
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
        else if(cmd === 'profile reset') {
            localStorage.removeItem('terminalUserProfile');
            this.addLine('Profile deleted. Restarting...', 'green');
            setTimeout(() => location.reload(), 1000);
        }
        else if(cmd === 'profile') {
            this.showProfile();
        }
        else if(cmd === 'whoami') {
            this.addLine(this.me?.username || 'mystery_user', 'green')
            this.addLine(`groups: ${this.me?.username || 'user'},1337,h4x0r,cool_kids`, 'gray')
        }
        else if(cmd === 'pwd') {
            this.addLine(`/home/${this.me?.username || 'user'}/ate_bit_experiments`, 'cyan');
        }
        else if(cmd === 'ls' || cmd === 'dir') {
            this.addLine('total 1337', 'gray')
            this.addLine(`drwxr-xr-x  2 ${this.me?.username || 'user'} cool_kids  4096 Jan  1 13:37 games/`, 'cyan')
            this.addLine(`-rw-r--r--  1 ${this.me?.username || 'user'} users    420 Jan  1 04:20 secrets.txt`, 'white')
            this.addLine(`-rw-r--r--  1 ${this.me?.username || 'user'} users   1337 Jan  1 00:01 readme.txt`, 'white')
            this.addLine(`-rwxr-xr-x  1 ${this.me?.username || 'user'} games   8192 Jan  1 12:34 snake*`, 'green')
            this.addLine(`-rw-------  1 ${this.me?.username || 'user'} users    666 Jan  1 03:33 .sus_stuff`, 'gray')
            if (Math.random() < 0.1) {
                this.addLine(`-rw-------  1 ${this.me?.username || 'user'} users    404 Jan  1 00:00 .easter_egg`, 'gray')
            }
        }
        else if(cmd === 'cat') {
            if (args.length === 0) {
                this.addLine('cat: missing file bruv', 'error');
                this.addLine('try: cat secrets.txt or cat readme.txt', 'gray');
            } else if (args[0] === 'secrets.txt') {
                this.addLine(`${this.me?.name || 'user'}\'s secret stash:`, 'yellow');
                this.addLine('- type "sudo rm -rf /" for chaos mode', 'gray');
                this.addLine('- try "404" when ur lost af', 'gray');
                this.addLine('- "exit" is kinda broken lol', 'gray');
                this.addLine('- konami code unlocks the goods', 'gray');
                this.addLine('- magical paperclip still vibin here', 'gray');
            } else if (args[0] === 'readme.txt') {
                this.addLine('ATE-BIT TERMINAL v0.1.0', 'cyan');
                this.addLine('========================', 'cyan');
                this.addLine('');
                this.addLine(`${this.me?.name || 'user'}\'s personal terminal playground`, 'green');
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
                this.addLine(`${this.me?.name || 'user'} wuz here`, 'cyan');
                this.addLine('probably shouldnt be reading this...', 'red');
            } else {
                this.addLine(`cat: ${args[0]}: file not found mate`, 'error');
            }
        }
        else if(cmd === 'date' || cmd === 'time') {
            const now = new Date();
            this.addLine(now.toString(), 'white');
            this.addLine(`time flies when ${this.me?.name || 'u'} are coding`, 'gray');
        }
        else if(cmd.startsWith('sudo')) {
            const sudoCmd = command.substring(5).trim();
            if (sudoCmd === 'rm -rf /' || sudoCmd === 'rm -rf /*') {
                this.addLine(`WHOA THERE ${(this.me?.name || 'user').toUpperCase()}!`, 'red');
                this.addLine('rm: cannot remove \'/\': system protection enabled', 'yellow');
                this.addLine('nice try though ;)', 'green');
                this.addLine('your terminal keeps you safe!', 'cyan');
            } else if (sudoCmd.includes('hack')) {
                this.addLine(`sudo: hack: command enhanced with ${this.me?.name || 'user'} powers`, 'green');
                this.runCommand(sudoCmd);
            } else {
                this.addLine(`[sudo] password for ${this.me?.username || 'user'}: `, 'yellow');
                this.addLine('sudo: access granted automatically', 'green');
                this.addLine(`executing: ${sudoCmd}`, 'cyan');
                if (sudoCmd) this.runCommand(sudoCmd);
            }
        }
        else if(cmd === '404') {
            this.addLine('404 - Command Not Found', 'red');
            this.addLine(`but ${this.me?.name || 'someone'} found you!`, 'green');
            this.addLine('       /|', 'yellow');
            this.addLine('      / |', 'yellow');  
            this.addLine('     /__|', 'yellow');
            this.addLine('  to the rescue!', 'cyan');
        }
        else if(cmd === 'exit' || cmd === 'quit') {
            this.addLine(`exit: ${this.me?.name || 'user'} never leaves`, 'yellow');
            this.addLine('you are stuck here forever... mwahahaha', 'red');
            this.addLine('just kidding! refresh page to escape', 'green');
        }
        else if(cmd === 'secret' && this.secretsUnlocked) {
            this.addLine(`SECRET ${(this.me?.name || 'USER').toUpperCase()} MODE ACTIVATED`, 'cyan');
            this.addLine('');
            this.addLine('    ╭─────────────╮', 'yellow');
            this.addLine(`    │ ${this.me?.name?.toUpperCase().padEnd(11) || 'SECRET ZONE'}│`, 'yellow');
            this.addLine('    │   POWER!    │', 'yellow');  
            this.addLine('    ╰─────────────╯', 'yellow');
            this.addLine('         /|\\', 'yellow');
            this.addLine('        / | \\', 'yellow');
            this.addLine('       /  |  \\', 'yellow');
            this.addLine('      /___|___\\', 'yellow');
            this.addLine('');
            this.addLine(`all commands now have extra ${this.me?.name || 'user'} magic!`, 'green');
        }
        else if(cmd === 'clippy' || cmd === 'paperclip') {
            const responses = [
                'It looks like you\'re trying to use a terminal!',
                'Would you like help with that command?',
                'I see you\'re exploring. Need assistance?',
                `${this.me?.name || 'User'} tip: try typing "help" for commands!`,
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
            this.addLine(`CASTING ${(this.me?.name || 'USER').toUpperCase()} MAGIC...`, 'cyan');
            this.addLine('⚡ * ⚡ * ⚡ * ⚡ * ⚡', 'yellow');
            this.addLine('BOOM! Something magical happened!', 'green');
            this.addLine('(check browser console)', 'gray');
            console.log(`%c ${(this.me?.name || 'USER').toUpperCase()} WAS HERE! `, 'background: #00ff00; color: #000; font-size: 20px; font-weight: bold;');
            console.log(`🔥 ${this.me?.name || 'You'} found the secret magic! 🔥`);
        }
        else if(cmd === 'history') {
            this.addLine(`bash: history: ${this.me?.name || 'user'} remembers everything`, 'yellow');
            this.addLine('1  help', 'gray');
            this.addLine('2  snake', 'gray');
            this.addLine('3  hack paperclip', 'gray');
            this.addLine('4  whoami', 'gray');
            this.addLine('5  sudo make me a sandwich', 'gray');
            this.addLine('6  ' + command, 'cyan');
        }
        else if(cmd === 'ps' || cmd === 'top') {
            this.addLine('PID    USER    %CPU  %MEM   COMMAND', 'cyan');
            this.addLine(`1337   ${this.me?.username || 'user'}  0.1   0.2   terminal_session`, 'white');
            this.addLine(`1338   ${this.me?.username || 'user'}  0.0   0.1   snake_game --level=awesome`, 'white');
            this.addLine(`1339   ${this.me?.username || 'user'} 99.9  50.0   being_awesome`, 'green');
            this.addLine(`1340   ${this.me?.username || 'user'}  0.0   0.0   [easter_egg_hunter]`, 'gray');
        }
        else if(cmd === 'uname' || cmd === 'uname -a') {
            this.addLine(`${this.me?.name || 'User'}OS 3.14159 #ate-bit SMP`, 'cyan');
            this.addLine(`Built by ${this.me?.name || 'user'} for maximum awesomeness`, 'gray');
        }
        else if(cmd === 'fortune') {
            const fortunes = [
                `${this.me?.name || 'u'} gonna have a good time coding today`,
                'your terminal brings all the bytes to the yard',
                'snake high score incoming...',
                'you were born to hack',
                `${this.me?.name || 'u'} + keyboard = magic`,
                'today feels like a 1337 day',
                'your deployment will fail'
            ]
            const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)]
            this.addLine(randomFortune, 'yellow')
            this.addLine(`-- fortune.db v4.20`, 'gray')
        }
        else if(cmd === 'echo') {
            if (args.length > 0) {
                const txt = args.join(' ');
                if (txt.includes(this.me?.name?.toLowerCase()) || txt.includes('paperclip') || txt.includes('clippy')) {
                    this.addLine(txt + ` (enhanced by ${this.me?.name || 'user'})`, 'green');
                } else {
                    this.addLine(txt, 'white');
                }
            } else {
                this.addLine('', 'white');
            }
        }
        else {
            this.addLine(`bash: ${command}: command not found`, 'error')
            if (Math.random() < 0.3) {
                const tips = [
                    'protip: type "help" for the good stuff',
                    'psst... try "fortune" for some wisdom',
                    'hint: "snake" is always a good choice',
                    'lost? "help" is ur friend',
                    'type "hack" to feel like ur in a movie'
                ]
                this.addLine(tips[Math.floor(Math.random() * tips.length)], 'yellow')
            }
        }
    }
    
    showProfile() {
        if (!this.me) {
            this.addLine('no profile found - that\'s weird af!', 'error');
            return;
        }
        
        this.addLine('ur profile stuff:', 'cyan');
        this.addLine('═════════════', 'cyan');
        this.addLine(`name: ${this.me.name}`, 'white');
        this.addLine(`username: ${this.me.username}`, 'white');
        this.addLine(`created: ${new Date(this.me.createdAt).toLocaleDateString()}`, 'gray');
        this.addLine(`times logged in: ${this.me.loginCount}`, 'gray');
        this.addLine('');
        this.addLine('type "profile reset" to nuke everything', 'yellow');
    }
    
    addLine(text, className = '') {
        const div = document.createElement('div');
        div.className = `terminal-line ${className}`;
        div.textContent = text;
        this.o.appendChild(div);
        this.o.scrollTop = this.o.scrollHeight;
    }
    
    addHTML(html) {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML = html;
        this.o.appendChild(div);
        this.o.scrollTop = this.o.scrollHeight;
    }
    
    hi() {
        this.addHTML(`
            <div class="ascii-art green">
 █████╗ ████████╗███████╗      ██████╗ ██╗████████╗
██╔══██╗╚══██╔══╝██╔════╝      ██╔══██╗██║╚══██╔══╝
███████║   ██║   █████╗  █████╗██████╔╝██║   ██║   
██╔══██║   ██║   ██╔══╝  ╚════╝██╔══██╗██║   ██║   
██║  ██║   ██║   ███████╗      ██████╔╝██║   ██║   
╚═╝  ╚═╝   ╚═╝   ╚══════╝      ╚═════╝ ╚═╝   ╚═╝   
            </div>
        `)
        
        const greetings = [
            `Welcome back, ${this.me?.name || 'guest'}`,
            `Hello ${this.me?.name || 'guest'}, ready to begin?`,
            `Terminal session started for ${this.me?.name || 'guest'}`,
            `${this.me?.name || 'guest'} - Terminal initialized`
        ]
        
        this.addLine(greetings[Math.floor(Math.random() * greetings.length)], 'cyan')
        this.addLine('')
        this.addLine('Type "help" for available commands', 'gray')
        this.addLine('Terminal ready for input', 'gray')
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
        if (this.hacking) this.endHackSim()
        if (this.gameon) return
        this.gameon = 'snake'
        document.querySelector('.input-container').style.display = 'none'
        
        let w = 20, h = 15
        let snake = [{x: 5, y: 7}]
        let food = {x: 15, y: 7}
        let dir = {x: 1, y: 0}
        let score = 0
        let speed = 150
        let paused = false
        let powerup = null
        let powerupTimer = null
        
        const randomPos = () => ({
            x: Math.floor(Math.random() * w),
            y: Math.floor(Math.random() * h)
        })
        
        const spawnPowerup = () => {
            if (Math.random() < 0.1 && !powerup) {
                powerup = randomPos()
                powerupTimer = setTimeout(() => {
                    powerup = null
                    this.showBoard(makeBoard(), `score: ${score} - powerup vanished!`)
                }, 5000)
            }
        }
        
        const makeBoard = () => {
            let board = Array(h).fill().map(() => Array(w).fill(' '))
            snake.forEach((pos, i) => {
                if (pos.x >= 0 && pos.x < w && pos.y >= 0 && pos.y < h) {
                    board[pos.y][pos.x] = i === 0 ? '🟢' : '🟩'
                }
            })
            if (food.x >= 0 && food.x < w && food.y >= 0 && food.y < h) {
                board[food.y][food.x] = '🍎'
            }
            if (powerup && powerup.x >= 0 && powerup.x < w && powerup.y >= 0 && powerup.y < h) {
                board[powerup.y][powerup.x] = '⭐'
            }
            return board
        }
        
        const gameLoop = () => {
            if (this.gameon !== 'snake') return
            if (paused) {
                setTimeout(gameLoop, speed)
                return
            }
            
            let head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y}
            
            // wrap around
            if (head.x >= w) head.x = 0
            if (head.x < 0) head.x = w - 1
            if (head.y >= h) head.y = 0
            if (head.y < 0) head.y = h - 1
            
            // check collision with self
            if (snake.some(pos => pos.x === head.x && pos.y === head.y)) {
                this.gameOver(`game over! score: ${score} - u hit urself 🤦`)
                return
            }
            
            snake.unshift(head)
            
            if (head.x === food.x && head.y === food.y) {
                score += 10
                food = randomPos()
                speed = Math.max(50, speed - 5)
                spawnPowerup()
                this.showBoard(makeBoard(), `score: ${score} - nom nom 😋`)
            } else if (powerup && head.x === powerup.x && head.y === powerup.y) {
                score += 50
                powerup = null
                clearTimeout(powerupTimer)
                snake.push({...snake[snake.length-1]})
                snake.push({...snake[snake.length-1]})
                this.showBoard(makeBoard(), `score: ${score} - powerup get! 🌟`)
            } else {
                snake.pop()
                this.showBoard(makeBoard(), `score: ${score}${paused ? ' - PAUSED' : ''}`)
            }
            
            setTimeout(gameLoop, speed)
        }
        
        const handleKeys = (e) => {
            if (this.gameon !== 'snake') return
            if (e.key === 'Escape') { 
                this.quitGame()
                return
            }
            if (e.key === 'p') {
                paused = !paused
                this.showBoard(makeBoard(), `score: ${score}${paused ? ' - PAUSED' : ''}`)
                return
            }
            if (paused) return
            
            const oldDir = {...dir}
            switch(e.key) {
                case 'ArrowUp':    if (oldDir.y !== 1)  dir = {x: 0, y: -1}; break
                case 'ArrowDown':  if (oldDir.y !== -1) dir = {x: 0, y: 1};  break
                case 'ArrowLeft':  if (oldDir.x !== 1)  dir = {x: -1, y: 0}; break
                case 'ArrowRight': if (oldDir.x !== -1) dir = {x: 1, y: 0};  break
            }
        }
        
        this._snakeKeyHandler = handleKeys
        document.addEventListener('keydown', handleKeys)
        
        this.addLine('🐍 SUPER SNAKE 3000 🐍', 'green')
        this.addLine('use arrow keys to move', 'gray')
        this.addLine('P to pause, ESC to quit', 'gray')
        this.addLine('protip: watch for powerups ⭐', 'yellow')
        this.addLine('')
        
        this.showBoard(makeBoard(), 'score: 0')
        gameLoop()
    }
    
    makeBoard(w, h) {
        const board = [];
        for (let y = 0; y < h; y++) {
            board[y] = new Array(w).fill(' ');
        }
        return board;
    }
    
    showBoard(board, status = '') {
        const old = this.o.querySelector('.game-display');
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
        
        this.o.appendChild(gameDiv);
        this.o.scrollTop = this.o.scrollHeight;
    }
    
    gameOver(msg) {
        this.gameon = null;
        document.querySelector('.input-container').style.display = '';
        this.i.focus();
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
        this.gameon = null;
        document.querySelector('.input-container').style.display = '';
        this.i.focus();
        this.updateCursorPosition();
        document.removeEventListener('keydown', this._snakeKeyHandler);
        this.addLine('');
        this.addLine('aight rage quit');
        this.addLine('');
    }
    
    startHackSim(target = 'anonymous') {
        if (this.gameon) this.quitGame()
        if (this.hacking) return
        this.hacking = true
        document.querySelector('.input-container').style.display = 'none'
        
        const hackText = [
            'accessing mainframe...',
            'bypassing firewall...',
            'cracking encryption...',
            'downloading data...',
            'covering tracks...',
            'planting backdoor...',
            'erasing logs...',
            'mission accomplished!'
        ]
        
        const randomDelay = () => Math.random() * 500 + 500
        const randomGlitch = () => {
            const glitches = ['ERR', '0xDEADBEEF', '404', 'SEGFAULT', 'KERNEL_PANIC']
            return glitches[Math.floor(Math.random() * glitches.length)]
        }
        
        let step = 0
        const progress = ['|', '/', '-', '\\']
        let progressIdx = 0
        
        const updateHack = () => {
            if (!this.hacking) return
            
            if (step < hackText.length) {
                if (Math.random() < 0.2) {
                    this.addLine(`${randomGlitch()} - retrying...`, 'red')
                    setTimeout(updateHack, randomDelay())
                    return
                }
                
                this.addLine(`${progress[progressIdx]} ${hackText[step]}`, 'green')
                progressIdx = (progressIdx + 1) % progress.length
                step++
                
                if (step === hackText.length) {
                    this.addLine('')
                    this.addLine('target pwned! 🎯', 'cyan')
                    this.addLine(`${target}'s secrets are yours! 🔓`, 'yellow')
                    this.endHackSim()
                } else {
                    setTimeout(updateHack, randomDelay())
                }
            }
        }
        
        this.addLine('🔒 HACK THE PLANET 🔒', 'cyan')
        this.addLine(`target: ${target}`, 'yellow')
        this.addLine('')
        setTimeout(updateHack, randomDelay())
    }
    
    endHackSim() {
        this.hacking = false
        document.querySelector('.input-container').style.display = ''
        this.i.focus()
        this.updateCursorPosition()
    }

    initTheme() {
        document.documentElement.setAttribute('data-theme', this.look);
    }

    switchTheme(themeName) {
        if(this.skins[themeName]) {
            this.look = themeName
            document.documentElement.setAttribute('data-theme', themeName)
            localStorage.setItem('terminalTheme', themeName)
            
            document.querySelectorAll('.theme-preview').forEach(btn => {
                btn.classList.remove('active')
                if(btn.dataset.theme === themeName) btn.classList.add('active')
            })
            
            this.addLine(`Theme changed to: ${this.skins[themeName]}`, 'cyan')
            
            this.addThemeTransitionEffect()
        }
    }

    addThemeTransitionEffect() {
        const overlay = document.createElement('div')
        overlay.className = 'theme-transition'
        document.body.appendChild(overlay)
        
        setTimeout(() => {
            overlay.style.opacity = '0'
            setTimeout(() => overlay.remove(), 500)
        }, 100)
    }

    showThemes() {
        this.addLine('Available Themes:', 'cyan')
        this.addLine('')
        Object.entries(this.skins).forEach(([key, name]) => {
            const current = key === this.look ? ' [Active]' : ''
            this.addLine(`  ${name}${current}`, key === this.look ? 'yellow' : 'white')
        })
        this.addLine('')
        this.addLine('Use "theme <name>" to change themes', 'gray')
    }

    handleThemeCommand(args) {
        if (!args.length) {
            this.showThemes()
            return
        }
        
        const themeName = args[0].toLowerCase()
        if (this.skins[themeName]) {
            this.switchTheme(themeName)
        } else {
            this.addLine('Invalid theme selection', 'error')
            this.addLine('Available themes:', 'gray')
            this.showThemes()
        }
    }

    showThemeSelector() {
        this.addHTML(`
            <div class="theme-selector-container">
                <h3>✨ style picker ✨</h3>
                <div class="theme-selector">
                    ${Object.keys(this.skins).map(theme => 
                        `<div class="theme-preview theme-${theme} ${theme === this.look ? 'active' : ''}" 
                              data-theme="${theme}" title="${this.skins[theme]}">
                              <div class="preview-bg"></div>
                              <div class="preview-text">$</div>
                        </div>`
                    ).join('')}
                </div>
                <p class="theme-hint">click to preview, type "theme <name>" to keep it!</p>
            </div>
        `)
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
            this.addLine(`wake up, ${this.me?.name || 'user'} ...`, 'green');
            this.addLine('');
        }, duration);
    }
}

// initialize the terminal when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.terminal = new Term();
});
