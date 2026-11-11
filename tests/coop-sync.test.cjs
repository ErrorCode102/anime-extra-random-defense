const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const { loadGame, unit } = require('./load-game.cjs');

const run = (ctx, code) => vm.runInContext(code, ctx);

function combatCtx() {
  const ctx = loadGame();
  ctx.startGame({ diffKey: 'practice' });
  const u = unit('ATE', 9901); u.x = 200; u.y = 320;
  ctx.Game.S.field[0] = u;
  ctx.Game.startWave();
  ctx.spawnEnemy('normal');
  ctx.Game.S.enemies[0].d = 100;
  ctx.update(0.01);
  return ctx;
}

test('projectiles carry tUid/defId and serialize without live object refs', () => {
  const ctx = combatCtx();
  assert.ok(ctx.Game.S.projectiles.length >= 1, 'a projectile was fired');
  const live = ctx.Game.S.projectiles[0];
  assert.strictEqual(live.tUid, ctx.Game.S.enemies[0].uid);
  assert.strictEqual(live.defId, 'ATE');
  const wire = JSON.parse(JSON.stringify(ctx.serializeState()));
  const p = wire.projectiles[0];
  assert.ok(!('t' in p), 'no live enemy ref on the wire');
  assert.ok(!('def' in p), 'no unit def on the wire');
  assert.strictEqual(p.tUid, live.tUid);
  assert.strictEqual(p.defId, 'ATE');
});

test('full combat state survives a JSON round-trip', () => {
  const ctx = combatCtx();
  ctx.update(0.5);
  const json = JSON.stringify(ctx.serializeState());
  const wire = JSON.parse(json);
  assert.ok(waveActive(wire), 'wave still active');
  assert.ok(Array.isArray(wire.enemies) && Array.isArray(wire.floats));
});

function waveActive(w) { return w.waveActive === true; }

test('applyState relinks projectile targets and unit defs on the client', () => {
  const host = combatCtx();
  const wire = JSON.parse(JSON.stringify(host.serializeState()));
  const client = loadGame();
  client.startGame({ diffKey: 'practice' });
  client.applyState(wire);
  const pr = client.Game.S.projectiles[0];
  const enemy = client.Game.S.enemies.find(e => e.uid === pr.tUid);
  assert.ok(enemy, 'target enemy exists on client');
  assert.strictEqual(pr.t, enemy, 'projectile relinked to live enemy');
  assert.strictEqual(pr.def, run(client, 'UNIT_BY_ID["ATE"]'), 'def relinked to unit table');
  assert.strictEqual(client.Game.S.gold, host.Game.S.gold);
  assert.strictEqual(client.Game.S.wave, host.Game.S.wave);
});

test('serializeState keeps co-op scaling fields', () => {
  const ctx = loadGame();
  ctx.startGame({ diffKey: 'practice', playerCount: 3 });
  const wire = JSON.parse(JSON.stringify(ctx.serializeState()));
  assert.strictEqual(wire.playerCount, 3);
  assert.strictEqual(wire.players.length, 3);
  assert.strictEqual(wire.benchSize, 14);
  assert.strictEqual(wire.popCap, 30);
});