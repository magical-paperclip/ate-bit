const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;


app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://cdnjs.cloudflare.com"]
        }
    }
}));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100 
});
app.use(limiter);


app.use(compression());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: true,
    lastModified: true
}));


app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});


const gameState = {
    activeGames: new Map(),
    addGame: (gameId, data) => {
        gameState.activeGames.set(gameId, {
            ...data,
            createdAt: Date.now()
        });
    },
    removeGame: (gameId) => {
        gameState.activeGames.delete(gameId);
    },
    getGame: (gameId) => {
        return gameState.activeGames.get(gameId);
    }
};

app.post('/api/games', (req, res) => {
    const gameId = Date.now().toString();
    gameState.addGame(gameId, req.body);
    res.status(201).json({ gameId });
});

app.get('/api/games/:gameId', (req, res) => {
    const game = gameState.getGame(req.params.gameId);
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});


const server = app.listen(PORT, () => {
    console.log(`Game server running at http://localhost:${PORT}`);
});


process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});


module.exports = { app, server, gameState }; 