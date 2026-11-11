const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawn } = require('node:child_process');
const WebSocket = require(path.resolve(__dirname, '..', 'anime-extra-random-defense-3d', 'node_modules', 'ws'));

const PORT = 8799;
const URL = `ws://localhost:${PORT}`;
const GAME_DIR = path.resolve(__dirname, '..', 'anime-extra-random-defense-3d');

function startServer() {
  const proc = spawn(process.execPath, ['server.js', String(PORT)], { cwd: GAME_DIR });
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('server boot timeout')), 8000);
    proc.stdout.on('data', d => {
      if (String(d).includes('Server running')) { clearTimeout(to); resolve(proc); }
    });
    proc.on('exit', c => reject(new Error('server exited early: ' + c)));
  });
}

function connect() {
  const ws = new WebSocket(URL);
  ws.queue = [];
  ws.waiters = [];
  ws.on('message', raw => {
    const msg = JSON.parse(raw);
    const i = ws.waiters.findIndex(w => w.type === msg.type);
    if (i >= 0) { const [w] = ws.waiters.splice(i, 1); clearTimeout(w.to); w.resolve(msg); }
    else ws.queue.push(msg);
  });
  return new Promise((resolve, reject) => {
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function expect(ws, type, ms = 4000) {
  const i = ws.queue.findIndex(m => m.type === type);
  if (i >= 0) return Promise.resolve(ws.queue.splice(i, 1)[0]);
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('timeout waiting for ' + type)), ms);
    ws.waiters.push({ type, resolve, to });
  });
}

const send = (ws, obj) => ws.send(JSON.stringify(obj));

test('co-op signaling: create, join, ready, start, action/state relay, leave', async () => {
  const proc = await startServer();
  let host, client;
  try {
    host = await connect();
    send(host, { type: 'create', name: 'Host' });
    const created = await expect(host, 'created');
    assert.strictEqual(created.slot, 1);
    assert.match(created.code, /^[A-Z0-9]{5}$/);

    client = await connect();
    send(client, { type: 'join', code: created.code, name: 'P2' });
    const joined = await expect(client, 'joined');
    assert.strictEqual(joined.slot, 2);
    assert.strictEqual(joined.players.length, 2);
    const lobbyAtHost = await expect(host, 'lobby');
    assert.strictEqual(lobbyAtHost.players.length, 2);

    send(client, { type: 'ready', ready: true });
    const readyLobby = await expect(host, 'lobby');
    assert.strictEqual(readyLobby.players.find(p => p.slot === 2).ready, true);

    send(host, { type: 'start', diffKey: 'practice' });
    const startHost = await expect(host, 'start');
    const startClient = await expect(client, 'start');
    assert.strictEqual(startHost.playerCount, 2);
    assert.strictEqual(startClient.diffKey, 'practice');

    send(client, { type: 'action', action: 'summon', payload: {} });
    const action = await expect(host, 'action');
    assert.strictEqual(action.action, 'summon');
    assert.strictEqual(action.fromSlot, 2);

    send(host, { type: 'state', state: { gold: 123 } });
    const state = await expect(client, 'state');
    assert.strictEqual(state.state.gold, 123);

    client.close();
    const left = await expect(host, 'player_left');
    assert.strictEqual(left.slot, 2);

    host.close();
    await new Promise(r => setTimeout(r, 200));
    const probe = await connect();
    send(probe, { type: 'join', code: created.code, name: 'Late' });
    const err = await expect(probe, 'error');
    assert.strictEqual(err.reason, 'room_not_found');
    probe.close();
  } finally {
    if (host) host.close();
    if (client) client.close();
    proc.kill();
  }
});

test('co-op signaling rejects bad joins and non-host starts', async () => {
  const proc = await startServer();
  let host, client;
  try {
    host = await connect();
    send(host, { type: 'create', name: 'Host' });
    const created = await expect(host, 'created');

    client = await connect();
    send(client, { type: 'join', code: 'NOPE1', name: 'X' });
    assert.strictEqual((await expect(client, 'error')).reason, 'room_not_found');

    send(client, { type: 'join', code: created.code, name: 'P2' });
    await expect(client, 'joined');
    send(client, { type: 'start', diffKey: 'practice' });
    send(host, { type: 'ping' });
    await expect(host, 'pong');
    assert.strictEqual(host.queue.filter(m => m.type === 'start').length, 0, 'client cannot start the room');

    send(host, { type: 'start', diffKey: 'practice' });
    await expect(client, 'start');
    const late = await connect();
    send(late, { type: 'join', code: created.code, name: 'Late' });
    assert.strictEqual((await expect(late, 'error')).reason, 'already_started');
    late.close();
  } finally {
    if (host) host.close();
    if (client) client.close();
    proc.kill();
  }
});