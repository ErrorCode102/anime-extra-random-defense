const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { loadGame } = require('./load-game.cjs');

const root = path.resolve(__dirname, '..', 'anime-extra-random-defense-3d');
const ref = {};
vm.createContext(ref);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + ';globalThis.F=FACTIONS;globalThis.U=UNITS;globalThis.MAX=FACTION_MAX_LEVEL;', ref);
const FACTIONS = ref.F, U = ref.U, MAX = ref.MAX;

const chip = (ctx, k) => ctx.elements.get('facChips').children.find(c => c.dataset.k === k);
const masterBasic = ctx => ctx.addFactionXp(1e9); // levels the current (basic) faction to max

test('every faction declares exactly three localized traits', () => {
  FACTIONS.forEach(f => {
    assert.ok(Array.isArray(f.traits) && f.traits.length === 3, f.key + ' has 3 traits');
    f.traits.forEach(tr => { assert.ok(tr.en && tr.en.length > 3, f.key + ' en'); assert.ok(tr.th && tr.th.length > 3, f.key + ' th'); });
  });
  assert.ok(FACTIONS.find(f => f.tag === 'D').reqMaster, 'D requires mastery');
  assert.ok(FACTIONS.find(f => f.tag === 'E').reqMaster, 'E requires mastery');
  assert.ok(!FACTIONS.find(f => f.tag === 'A').reqMaster, 'A is basic');
});

test('D and E are locked until a basic faction is mastered', () => {
  const ctx = loadGame();
  assert.strictEqual(ctx.setFaction('echo'), false, 'D rejected pre-mastery');
  assert.strictEqual(ctx.setFaction('mooncell'), false, 'E rejected pre-mastery');
  assert.match(chip(ctx, 'echo').className, /locked/);
  assert.match(chip(ctx, 'mooncell').className, /locked/);
  masterBasic(ctx);
  assert.strictEqual(ctx.setFaction('echo'), true, 'D unlocked after mastery');
  assert.doesNotMatch(chip(ctx, 'echo').className, /locked/);
});

test('startGame coerces a locked faction to an unlocked one', () => {
  const ctx = loadGame();
  ctx.startGame({ factionKey: 'mooncell' });
  assert.notStrictEqual(ctx.Game.S.factionKey, 'mooncell');
  assert.ok(['aurel', 'kitsune', 'steppe'].includes(ctx.Game.S.factionKey));
});

test('faction panel lists the three traits', () => {
  const ctx = loadGame();
  ctx.syncFaction();
  const html = ctx.elements.get('facPassive').innerHTML;
  assert.strictEqual((html.match(/facTrait/g) || []).length, 3);
});

test('A boosts servant gambling success chance', () => {
  const ctx = loadGame();
  const g = { chance: 51, special: 46 };
  ctx.setFaction('aurel');
  const boosted = ctx.servantChance(g);
  ctx.setFaction('kitsune');
  const normal = ctx.servantChance(g);
  assert.strictEqual(normal, 51);
  assert.ok(boosted > normal, 'A chance higher');
  assert.ok(boosted <= 95, 'capped');
});

test('C starts with advanced damage upgrades (+15%)', () => {
  const ctx = loadGame();
  ctx.setFaction('steppe');
  ctx.startGame();
  assert.ok(Math.abs(ctx.dmgMult() - 1.15) < 1e-9, 'C head-start multiplier');
});

test('B deploys servants instantly while others have a teleport warmup', () => {
  const a = loadGame();
  a.setFaction('aurel'); a.startGame(); a.giveServant('E', 'test');
  const au = a.Game.S.bench.find(Boolean);
  assert.ok(au.cd > 0, 'non-B warmup');
  const b = loadGame();
  b.setFaction('kitsune'); b.startGame(); b.giveServant('E', 'test');
  const bu = b.Game.S.bench.find(Boolean);
  assert.strictEqual(bu.cd, 0, 'B instant');
});

test('D starts with increased spirits (15 wisps)', () => {
  const ctx = loadGame();
  masterBasic(ctx);
  ctx.startGame({ factionKey: 'echo' });
  assert.strictEqual(ctx.Game.S.factionKey, 'echo');
  assert.strictEqual(ctx.Game.S.wisps, 15);
});

test('E grants a growth servant that gains power per kill', () => {
  const ctx = loadGame();
  masterBasic(ctx);
  ctx.startGame({ factionKey: 'mooncell' });
  const bb = ctx.Game.S.bench.find(u => u && u.grow !== undefined);
  assert.ok(bb, 'growth servant granted');
  const before = bb.grow;
  const S = ctx.Game.S;
  S.enemies.push({ uid: 999, type: 'grunt', d: 0, hp: 1, maxHp: 1, sp: 1, r: 8, color: '#fff', gold: 1, leak: 1, boss: false, armor: 0, regen: 0, slowT: 0, slowF: 0, stunT: 0, dots: [], dead: false });
  ctx.damageEnemy(S.enemies[0], 99999);
  assert.ok(bb.grow > before, 'BB grew on kill');
});

test('E collecting five distinct A-grade servants unlocks an EX', () => {
  const ctx = loadGame();
  masterBasic(ctx);
  ctx.startGame({ factionKey: 'mooncell' });
  const S = ctx.Game.S;
  const aIds = [...new Set(U.filter(u => u.grade === 'A').map(u => u.id))].slice(0, 5);
  S.bench.length = 0;
  aIds.forEach((id, i) => S.bench.push({ uid: 100 + i, id, cd: 0 }));
  while (S.bench.length < 10) S.bench.push(null);
  ctx.checkCollection();
  assert.ok(S.bench.some(u => u && U.find(x => x.id === u.id).grade === 'EX'), 'EX granted');
});