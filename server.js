// tiny websocket relay server
// run with:  npm run server
// only handles room join + message broadcast

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 8080;

// simple express app to optionally serve static files (e.g., after vite build)
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// serve files from ./dist if present
app.use(express.static(path.join(__dirname, 'dist')));

// fallback to index.html for SPA routing
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) res.status(404).end();
  });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

// roomId -> Set<ws>
const rooms = new Map();

function noop() {}
function heartbeat() { this.isAlive = true; }

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  let currentRoom = null;

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.type === 'join') {
      const { room } = msg;
      if (!room) return;
      // leave previous
      if (currentRoom && rooms.get(currentRoom)) {
        rooms.get(currentRoom).delete(ws);
      }
      currentRoom = room;
      if (!rooms.has(room)) rooms.set(room, new Set());
      rooms.get(room).add(ws);
      const order = rooms.get(room).size - 1;
      ws.name = msg.name || 'player'+order;
      ws.send(JSON.stringify({type:'joined', order}));
      const list=[...rooms.get(room)].map((c,i)=>({name:c.name||('player'+i),order:i}));
      for(const c of rooms.get(room)) c.send(JSON.stringify({type:'players',players:list}));
      return;
    }

    // broadcast to room mates
    if (currentRoom && rooms.has(currentRoom)) {
      for (const client of rooms.get(currentRoom)) {
        if (client !== ws && client.readyState === 1) {
          client.send(data);
        }
      }
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.get(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
      if (rooms.get(currentRoom).size === 0) rooms.delete(currentRoom);
    }
  });
});

// heartbeat interval
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`http+ws server listening on ${PORT}`);
}); 