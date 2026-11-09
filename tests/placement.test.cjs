const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, unit } = require('./load-game.cjs');

function started() {
  const ctx = loadGame();
  ctx.Game.startGame();
  ctx.Game.S.bench[0] = unit('ATE', 101);
  return ctx;
}

test('valid free ground deployment stores logical coordinates and consumes bench', () => {
  const ctx = started();
  assert.equal(typeof ctx.Game.placementReason, 'function');
  assert.equal(ctx.Game.placementReason(480, 60), '');
  assert.equal(ctx.Game.tryPlace(480, 60), true);
  const placed = ctx.Game.S.field.find(Boolean);
  assert.equal(placed.x, 480);
  assert.equal(placed.y, 60);
  assert.equal(ctx.Game.S.bench[0], null);
});

test('invalid ground and overlap do not consume a servant', () => {
  const ctx = started();
  for (const [x, y, reason] of [[400, 130, 'road'], [100, 320, 'gate'], [0, 0, 'bounds']]) {
    assert.equal(ctx.Game.placementReason(x, y), reason);
    assert.equal(ctx.Game.tryPlace(x, y), false);
    assert.equal(ctx.Game.S.bench[0].uid, 101);
  }
  assert.equal(ctx.Game.tryPlace(480, 60), true);
  ctx.Game.S.bench[0] = unit('GAE', 102);
  assert.equal(ctx.Game.placementReason(485, 60), 'too-close');
  assert.equal(ctx.Game.tryPlace(485, 60), false);
  assert.equal(ctx.Game.S.bench[0].uid, 102);
});

test('population rejection leaves the selected bench unit intact', () => {
  const ctx = started();
  ctx.Game.S.field = Array.from({ length: 18 }, (_, i) => ({ ...unit('ATE', 200 + i), x: 30 + i * 40, y: 60 }));
  assert.equal(ctx.Game.tryPlace(480, 60), false);
  assert.equal(ctx.Game.S.bench[0].uid, 101);
  assert.equal(ctx.Game.S.field.filter(Boolean).length, 18);
});

test('attacks originate from the deployed coordinate rather than a fixed slot', () => {
  const ctx = started();
  assert.equal(ctx.Game.tryPlace(480, 60), true);
  ctx.Game.S.enemies.push({
    uid: 900, type: 'normal', d: 700, hp: 10000, maxHp: 10000, sp: 0, r: 9,
    color: '#fff', gold: 0, leak: 1, boss: false, armor: 0, regen: 0,
    slowT: 0, slowF: 0, stunT: 0, dots: [], dead: false,
  });
  ctx.Game.update(0.01);
  assert.ok(ctx.Game.S.projectiles.length > 0);
  assert.equal(ctx.Game.S.projectiles[0].x, 480);
  assert.equal(ctx.Game.S.projectiles[0].y, 60);
});

test('ascending a deployed servant preserves its uid and free position', () => {
  const ctx = started();
  assert.equal(ctx.Game.tryPlace(480, 60), true);
  const placed = ctx.Game.S.field.find(Boolean);
  ctx.Game.ascend(176);
  assert.equal(placed.uid, 101);
  assert.equal(placed.id, 'ATD');
  assert.equal(placed.x, 480);
  assert.equal(placed.y, 60);
  assert.deepEqual(ctx.Game.unitByUid(101), { u: placed, loc: 'field', idx: 0 });
});

test('releasing a free-position servant removes only the selected uid', () => {
  const ctx = started();
  assert.equal(ctx.Game.tryPlace(480, 60), true);
  ctx.Game.S.bench[0] = unit('GAE', 102);
  ctx.Game.select({ loc: 'bench', idx: 0 });
  assert.equal(ctx.Game.tryPlace(600, 60), true);
  const before = ctx.Game.S.wisps;
  ctx.Game.sellSelected();
  assert.equal(ctx.Game.unitByUid(102), null);
  assert.ok(ctx.Game.unitByUid(101));
  assert.equal(ctx.Game.S.wisps, before + 1);
});
