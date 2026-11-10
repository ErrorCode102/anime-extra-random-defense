const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const { loadGame, unit } = require('./load-game.cjs');

const run = (ctx, code) => vm.runInContext(code, ctx);
const PEN_KEYS = ['enemyBoost','servantCorrupt','gachaOnlyE','powerfulLeader','nurfGacha',
  'johabRandom','sellDisabled','enemyHeal','raid','servantStun','lessWisp',
  'summonStasis','summonStorm','afterImpact','lifeHalf'];

function withPenalties(keys, diff='practice'){
  const ctx = loadGame();
  keys.forEach(k => ctx.togglePenalty(k));
  ctx.startGame({ diffKey: diff });
  return ctx;
}

test('PENALTIES defines all 15 FERD penalties with bilingual text', () => {
  const ctx = loadGame();
  const pens = run(ctx, 'PENALTIES');
  assert.strictEqual(pens.length, 15);
  assert.strictEqual(pens.map(p => p.key).sort().join(','), [...PEN_KEYS].sort().join(','));
  for (const p of pens){
    assert.ok(p.name && p.nameTh && p.desc && p.descTh && p.icon, p.key + ' fields');
    assert.ok(/[\u0E01-\u0E5B]/.test(p.nameTh) && /[\u0E01-\u0E5B]/.test(p.descTh), p.key + ' Thai');
  }
});

test('penalties toggle in menu, copy into run, and lock during play', () => {
  const ctx = loadGame();
  assert.strictEqual(ctx.togglePenalty('raid'), true);
  assert.strictEqual(ctx.togglePenalty('raid'), false);
  ctx.togglePenalty('raid'); ctx.togglePenalty('lifeHalf');
  ctx.startGame();
  assert.deepStrictEqual([...ctx.Game.S.penalties].sort(), ['lifeHalf','raid']);
  assert.strictEqual(ctx.togglePenalty('enemyHeal'), false);
  assert.ok(!ctx.Game.S.penalties.includes('enemyHeal'));
});

test('lifeHalf halves starting lives', () => {
  const ctx = loadGame();
  ctx.togglePenalty('lifeHalf');
  ctx.startGame({ diffKey: 'practice' });
  assert.strictEqual(ctx.Game.S.lives, 40);
});

test('5+ penalties double faction XP; 4 do not', () => {
  const ctx = withPenalties(PEN_KEYS.slice(0, 5));
  const before = run(ctx, 'factionSave.fac[curFaction().key].xp');
  ctx.addFactionXp(100);
  const after = run(ctx, 'factionSave.fac[curFaction().key].xp');
  assert.strictEqual(after - before, 200);
  const ctx4 = withPenalties(PEN_KEYS.slice(0, 4));
  const b4 = run(ctx4, 'factionSave.fac[curFaction().key].xp');
  ctx4.addFactionXp(100);
  assert.strictEqual(run(ctx4, 'factionSave.fac[curFaction().key].xp') - b4, 100);
});

test('enemyBoost makes enemies 50% faster', () => {
  const orig = Math.random; Math.random = () => 0.5;
  try {
    const plain = withPenalties([]); plain.Game.startWave(); plain.spawnEnemy('normal');
    const boosted = withPenalties(['enemyBoost']); boosted.Game.startWave(); boosted.spawnEnemy('normal');
    const a = plain.Game.S.enemies[0].sp, b = boosted.Game.S.enemies[0].sp;
    assert.ok(Math.abs(b / a - 1.5) < 1e-9, `${b} / ${a}`);
  } finally { Math.random = orig; }
});

test('raid doubles wave size and halves enemy HP and bounty', () => {
  const orig = Math.random; Math.random = () => 0.5;
  try {
    const plain = withPenalties([]);
    const raid = withPenalties(['raid']);
    assert.strictEqual(raid.buildWave(11).length, plain.buildWave(11).length * 2);
    plain.Game.startWave(); plain.spawnEnemy('normal');
    raid.Game.startWave(); raid.spawnEnemy('normal');
    const a = plain.Game.S.enemies[0], b = raid.Game.S.enemies[0];
    assert.ok(Math.abs(b.maxHp - a.maxHp * 0.5) <= 1, `hp ${b.maxHp} vs ${a.maxHp}`);
    assert.ok(Math.abs(b.gold - a.gold * 0.5) <= 1, `gold ${b.gold} vs ${a.gold}`);
  } finally { Math.random = orig; }
});

test('powerfulLeader empowers only the first spawn of each wave', () => {
  const orig = Math.random; Math.random = () => 0.5;
  try {
    const ctx = withPenalties(['powerfulLeader']);
    ctx.Game.startWave();
    ctx.spawnEnemy('normal'); ctx.spawnEnemy('normal');
    const [first, second] = ctx.Game.S.enemies;
    assert.ok(first.leader, 'first is leader');
    assert.ok(!second.leader, 'second is not');
    assert.ok(Math.abs(first.maxHp - second.maxHp * 20) <= 20, `hp ${first.maxHp} vs ${second.maxHp}`);
    assert.ok(Math.abs(first.gold - second.gold * 10) <= 10, `gold ${first.gold} vs ${second.gold}`);
  } finally { Math.random = orig; }
});

test('enemyHeal grants all enemies 0.5% max-HP regen', () => {
  const ctx = withPenalties(['enemyHeal']);
  ctx.Game.startWave(); ctx.spawnEnemy('normal');
  assert.ok(Math.abs(ctx.Game.S.enemies[0].regen - 0.005) < 1e-9);
});

test('gachaOnlyE forces wisp draws to E grade even late game', () => {
  const orig = Math.random; Math.random = () => 0.9;
  try {
    const ctx = withPenalties(['gachaOnlyE']);
    ctx.Game.S.wave = 20; ctx.Game.S.wisps = 3;
    ctx.wispToGacha();
    const u = ctx.Game.S.bench.find(Boolean);
    assert.strictEqual(run(ctx, 'UNIT_BY_ID[' + JSON.stringify(u.id) + '].grade'), 'E');
  } finally { Math.random = orig; }
});

test('lessWisp reduces wave wisp reward by one', () => {
  const ctx = withPenalties(['lessWisp']);
  ctx.Game.S.wave = 1; ctx.Game.S.wisps = 0;
  ctx.endWave();
  assert.strictEqual(ctx.Game.S.wisps, 1);
});

test('sellDisabled blocks selling servants', () => {
  const ctx = withPenalties(['sellDisabled']);
  ctx.Game.S.bench[0] = unit('ATE', 9001);
  ctx.select({ loc: 'bench', idx: 0 });
  const wisps = ctx.Game.S.wisps;
  ctx.sellSelected();
  assert.ok(ctx.Game.S.bench[0], 'servant kept');
  assert.strictEqual(ctx.Game.S.wisps, wisps);
});

test('johabRandom can replace ascension result with a random same-grade unit', () => {
  const orig = Math.random; Math.random = () => 0.1;
  try {
    const ctx = withPenalties(['johabRandom']);
    ctx.Game.S.bench[0] = unit('GAS', 9101);
    ctx.Game.S.bench[1] = unit('BRA', 9102);
    ctx.Game.S.bench[2] = unit('GMB', 9103);
    ctx.select({ loc: 'bench', idx: 0 });
    ctx.ascend(0);
    const id = ctx.Game.S.bench[0].id;
    const grade = run(ctx, 'UNIT_BY_ID[' + JSON.stringify(id) + '].grade');
    const expected = run(ctx, 'UNIT_BY_ID["GAX"].grade');
    assert.strictEqual(grade, expected, 'same grade as recipe result');
    assert.notStrictEqual(id, 'GAX', 'result randomized');
  } finally { Math.random = orig; }
});

test('servantStun stuns the killer for 1s and projectiles carry the source uid', () => {
  const ctx = withPenalties(['servantStun']);
  const u = unit('ATE', 9201); u.x = 300; u.y = 300;
  ctx.Game.S.field[0] = u;
  ctx.Game.startWave(); ctx.spawnEnemy('normal');
  const e = ctx.Game.S.enemies[0];
  e.d = 10;
  ctx.damageEnemy(e, 1e9, { src: 9201 });
  assert.ok(e.dead);
  assert.strictEqual(u.stunT, 1);
  const ctx2 = withPenalties(['servantStun']);
  const u2 = unit('ATE', 9202); u2.x = 200; u2.y = 320;
  ctx2.Game.S.field[0] = u2;
  ctx2.Game.startWave(); ctx2.spawnEnemy('normal');
  ctx2.Game.S.enemies[0].d = 100;
  const def = run(ctx2, 'UNIT_BY_ID["ATE"]');
  ctx2.unitAttack(u2, def, u2.x, u2.y);
  assert.strictEqual(ctx2.Game.S.projectiles[0].src, 9202);
});

test('afterImpact stuns every deployed servant when a boss dies', () => {
  const ctx = withPenalties(['afterImpact']);
  ctx.Game.S.field[0] = unit('ATE', 9301);
  ctx.Game.S.field[1] = unit('BRA', 9302);
  ctx.Game.startWave(); ctx.spawnEnemy('boss');
  ctx.damageEnemy(ctx.Game.S.enemies[0], 1e9, {});
  assert.strictEqual(ctx.Game.S.field[0].stunT, 10);
  assert.strictEqual(ctx.Game.S.field[1].stunT, 10);
});

test('stunned servants do not attack', () => {
  const ctx = withPenalties([]);
  const u = unit('ATE', 9401); u.x = 200; u.y = 320; u.stunT = 2;
  ctx.Game.S.field[0] = u;
  ctx.Game.startWave(); ctx.spawnEnemy('normal');
  ctx.Game.S.enemies[0].d = 100;
  ctx.update(0.5);
  assert.strictEqual(ctx.Game.S.projectiles.length, 0);
  assert.ok(u.stunT < 2 && u.stunT > 0);
});

test('nurfGacha restricts gambling to low-tier options', () => {
  const ctx = withPenalties(['nurfGacha']);
  ctx.Game.S.gold = 100000; ctx.Game.S.spirit = 100;
  const gold = ctx.Game.S.gold;
  ctx.doGoldGamble('g500');
  assert.strictEqual(ctx.Game.S.gold, gold, 'g500 blocked');
  ctx.doServantGamble('S');
  assert.strictEqual(ctx.Game.S.gold, gold, 'S gamble blocked');
  ctx.doGoldGamble('g10');
  assert.ok(ctx.Game.S.gold !== gold || ctx.Game.S.gambleStocks.g10.n < 10, 'g10 allowed');
});

test('servantCorrupt halves servant attack rate', () => {
  const ctx = withPenalties(['servantCorrupt']);
  const u = unit('ATE', 9501); u.x = 200; u.y = 320;
  ctx.Game.S.field[0] = u;
  ctx.Game.startWave(); ctx.spawnEnemy('normal');
  ctx.Game.S.enemies[0].d = 100;
  const def = run(ctx, 'UNIT_BY_ID["ATE"]');
  ctx.update(0.01);
  assert.ok(Math.abs(u.cd - 2 / def.rate) < 0.02, `cd ${u.cd} vs ${2 / def.rate}`);
});

test('penalty UI builds 15 cards and wires buttons', () => {
  const ctx = loadGame();
  ctx.buildPenalties();
  assert.strictEqual(ctx.elements.get('penaltyGrid').children.length, 15);
  assert.strictEqual(typeof ctx.elements.get('penaltyBtn').onclick, 'function');
  assert.strictEqual(typeof ctx.elements.get('startPenaltyBtn').onclick, 'function');
  assert.strictEqual(typeof ctx.elements.get('penaltyClose').onclick, 'function');
  ctx.togglePenalty('raid');
  ctx.buildPenalties();
  const card = ctx.elements.get('penaltyGrid').children.find(c => c.dataset.key === 'raid');
  assert.ok(card && card.className.includes('sel'), 'selected card marked');
});

test('periodic penalties fire stasis and storm stuns over time', () => {
  const ctx = withPenalties(['summonStasis','summonStorm']);
  ctx.Game.S.field[0] = unit('ATE', 9601);
  ctx.Game.S.field[1] = unit('BRA', 9602);
  ctx.Game.S.field[2] = unit('GMB', 9603);
  for (let i=0;i<11;i++) ctx.update(1);
  const stunnedAfterStasis = ctx.Game.S.field.filter(u => u && u.stunT > 0).length;
  assert.ok(stunnedAfterStasis >= 2, 'stasis stuns at least 2 units');
  for (let i=0;i<7;i++) ctx.update(1);
  const stunnedAfterStorm = ctx.Game.S.field.filter(u => u && u.stunT > 0).length;
  assert.ok(stunnedAfterStorm >= 2, 'storm stuns units');
});