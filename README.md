# ate-bit

a retro-style terminal experience in your browser with games and a proper command system

## features

- 🎮 multiple built-in games including snake
- 💾 profile system with save/load
- 🎨 customizable themes (try `theme` command)
- 📝 command history with arrow keys
- 🔍 file system simulation
- 🌟 easter eggs (hint: try the konami code)

## quick start

```bash
# install dependencies
npm install

# start dev server
npm run dev

# build for production
npm run build

# deploy to vercel
npm run deploy
```

## available commands

- `help` - show all available commands
- `clear` or `cls` - clear the screen
- `whoami` - show current user
- `ls` or `dir` - list directory contents
- `cat` - read file contents
- `profile` - view or manage your profile
- `snake` - launch snake game
- `hack <target>` - run hack simulation
- `theme` - change terminal theme

## game controls

### snake
- arrow keys to move
- esc to pause/quit
- space to restart after game over

## profile management

your profile and settings are saved locally. to reset:
```bash
profile reset
```

## development

built with:
- vanilla javascript
- vite for bundling
- vercel for deployment

## deployment

the project is set up for one-click deployment to vercel. your app will be live at:
`https://ate-bit-[username].vercel.app`

## contributing

feel free to:
- add more games
- improve terminal features
- fix bugs
- add new themes

just fork, make your changes, and submit a pr!

## license

mit - do whatever you want with it 🤘

