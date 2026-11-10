#!/usr/bin/env node
/* ============================================================
   Anime Extra Random Defence — Co-op Signaling + Game Server

   Usage:
     node server.js           → http://localhost:8765
     node server.js 3000      → http://localhost:3000

   For internet play, run ngrok in another terminal:
     ngrok http 8765
   Then use  wss://xxxx.ngrok-free.app  as server address.
   ============================================================ */
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const { WebSocketServer, WebSocket } = require('ws');

const PORT   = parseInt(process.argv[2] || '8765', 10);
const ROOT   = __dirname;

/* ---------- static file server ---------- */
const MIME = {
  '.html':'text/html', '.js':'application/javascript',
  '.css':'text/css',   '.png':'image/png',
  '.ico':'image/x-icon','.json':'application/json',
  '.woff2':'font/woff2', '.woff':'font/woff',
};
const httpServer = http.createServer((req, res) => {
  /* CORS — allow Vercel frontend to load static files if needed */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath.replace(/\.\./g, ''));
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found');
    } else {
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    }
  });
});

/* ---------- signaling server ---------- */
const wss = new WebSocketServer({ server: httpServer });

/*  Room structure:
    rooms[code] = {
      host: ws,
      players: { slot: ws },   // slot 1 = host, 2-4 = clients
      names:   { slot: name },
      ready:   { slot: bool },
      started: bool,
      maxPlayers: 4,
    }
*/
const rooms = {};

function broadcast(room, msg, exclude) {
  const str = JSON.stringify(msg);
  Object.values(room.players).forEach(ws => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) ws.send(str);
  });
}
function sendTo(ws, msg) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}
function roomInfo(room) {
  return Object.entries(room.names).map(([slot, name]) => ({
    slot: +slot, name, ready: room.ready[slot] || false,
    host: +slot === 1,
  }));
}
function cleanRoom(code) {
  if (!rooms[code]) return;
  const room = rooms[code];
  Object.values(room.players).forEach(ws => {
    try { ws.close(); } catch(e) {}
  });
  delete rooms[code];
  console.log(`[sig] room ${code} closed`);
}

function genCode() {
  let code;
  do { code = Math.random().toString(36).slice(2, 7).toUpperCase(); }
  while (rooms[code]);
  return code;
}

wss.on('connection', ws => {
  ws._room  = null;
  ws._slot  = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch(e) { return; }
    const { type } = msg;

    /* ---- CREATE ---- */
    if (type === 'create') {
      const code = genCode();
      rooms[code] = {
        host: ws, players: { 1: ws }, names: { 1: msg.name || 'Host' },
        ready: { 1: true }, started: false, maxPlayers: 4,
      };
      ws._room = code; ws._slot = 1;
      sendTo(ws, { type: 'created', code, slot: 1 });
      console.log(`[sig] room ${code} created by ${msg.name}`);
      return;
    }

    /* ---- JOIN ---- */
    if (type === 'join') {
      const code = (msg.code || '').toUpperCase();
      const room = rooms[code];
      if (!room) { sendTo(ws, { type: 'error', reason: 'room_not_found' }); return; }
      if (room.started) { sendTo(ws, { type: 'error', reason: 'already_started' }); return; }
      const count = Object.keys(room.players).length;
      if (count >= room.maxPlayers) { sendTo(ws, { type: 'error', reason: 'room_full' }); return; }
      const slot = count + 1;
      room.players[slot] = ws; room.names[slot] = msg.name || `Player ${slot}`; room.ready[slot] = false;
      ws._room = code; ws._slot = slot;
      sendTo(ws, { type: 'joined', code, slot, players: roomInfo(room) });
      broadcast(room, { type: 'lobby', players: roomInfo(room) }, ws);
      console.log(`[sig] ${msg.name} joined ${code} as slot ${slot}`);
      return;
    }

    /* ---- READY ---- */
    if (type === 'ready') {
      const room = rooms[ws._room];
      if (!room || !ws._slot) return;
      room.ready[ws._slot] = msg.ready;
      broadcast(room, { type: 'lobby', players: roomInfo(room) });
      sendTo(ws, { type: 'lobby', players: roomInfo(room) });
      return;
    }

    /* ---- START ---- */
    if (type === 'start') {
      const room = rooms[ws._room];
      if (!room || ws._slot !== 1) return; // only host
      room.started = true;
      const pc = Object.keys(room.players).length;
      broadcast(room, { type: 'start', diffKey: msg.diffKey, playerCount: pc });
      sendTo(ws,       { type: 'start', diffKey: msg.diffKey, playerCount: pc });
      console.log(`[sig] room ${ws._room} started, ${pc} players, diff=${msg.diffKey}`);
      return;
    }

    /* ---- WebRTC OFFER / ANSWER / ICE (relay for direct P2P) ---- */
    if (type === 'offer' || type === 'answer' || type === 'ice') {
      const room = rooms[ws._room];
      if (!room) return;
      const target = room.players[msg.to];
      if (target) sendTo(target, { ...msg, from: ws._slot });
      return;
    }

    /* ---- GAME ACTION (relay: client → host) ---- */
    if (type === 'action') {
      const room = rooms[ws._room];
      if (!room) return;
      sendTo(room.host, { ...msg, fromSlot: ws._slot });
      return;
    }

    /* ---- GAME STATE (broadcast: host → all clients) ---- */
    if (type === 'state') {
      const room = rooms[ws._room];
      if (!room || ws._slot !== 1) return;
      broadcast(room, msg, ws); // send to all except host
      return;
    }

    /* ---- PING ---- */
    if (type === 'ping') { sendTo(ws, { type: 'pong' }); return; }
  });

  ws.on('close', () => {
    const code = ws._room;
    const room = rooms[code];
    if (!room) return;
    // notify others
    broadcast(room, { type: 'player_left', slot: ws._slot, players: roomInfo(room) });
    if (ws._slot === 1) {
      // host left → close room
      broadcast(room, { type: 'host_left' });
      cleanRoom(code);
    } else {
      // client left → remove from room
      delete room.players[ws._slot];
      delete room.names[ws._slot];
      delete room.ready[ws._slot];
    }
  });

  ws.on('error', err => console.error('[sig] ws error:', err.message));
});

httpServer.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║  Anime Extra Random Defence — Co-op      ║');
  console.log(`  ║  Server running on port ${PORT}             ║`);
  console.log(`  ║  Open: http://localhost:${PORT}             ║`);
  console.log('  ║                                          ║');
  console.log('  ║  For LAN: share your local IP address    ║');
  console.log('  ║  For WAN: use ngrok or similar tunnel    ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
