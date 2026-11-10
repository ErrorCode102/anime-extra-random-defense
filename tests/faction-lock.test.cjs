const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./load-game.cjs');

const FACTION_KEYS = ['aurel', 'kitsune', 'steppe', 'echo', 'mooncell'];
const masterBasic = ctx => ctx.Game.addFactionXp(1e9); // D/E require a mastered basic faction

test('each faction is frozen for the whole run and rejects in-play changes', () => {
  for (const key of FACTION_KEYS) {
    const ctx = loadGame();
    masterBasic(ctx);
    assert.equal(ctx.Game.setFaction(key), true);
    ctx.Game.startGame();
    assert.equal(ctx.Game.S.factionKey, key);
    assert.equal(ctx.Game.S.players[0].faction, key);
    ctx.Game.S.facCd.super = 17;
    ctx.Game.S.facCd.focus = 9;
    ctx.Game.S.facCd.seal = 5;
    const other = FACTION_KEYS.find(k => k !== key);
    assert.equal(ctx.Game.setFaction(other), false);
    assert.equal(ctx.Game.S.factionKey, key);
    assert.equal(ctx.Game.S.players[0].faction, key);
    assert.equal(ctx.Game.S.facCd.super, 17);
    assert.equal(ctx.Game.S.facCd.focus, 9);
    assert.equal(ctx.Game.S.facCd.seal, 5);
    const chips = ctx.elements.get('facChips').children;
    assert.equal(chips.length, FACTION_KEYS.length);
    assert.ok(chips.every(chip => chip.disabled));
  }
});

test('start options can lock a faction without changing the saved menu preference first', () => {
  const ctx = loadGame();
  masterBasic(ctx);
  ctx.Game.startGame({ factionKey: 'mooncell' });
  assert.equal(ctx.Game.S.factionKey, 'mooncell');
  assert.equal(ctx.Game.S.players[0].faction, 'mooncell');
  assert.equal(ctx.Game.setFaction('aurel'), false);
});

test('returning to the menu unlocks selection for the next run', () => {
  const ctx = loadGame();
  masterBasic(ctx);
  ctx.Game.setFaction('aurel');
  ctx.Game.startGame();
  assert.equal(ctx.Game.setFaction('echo'), false);
  ctx.Game.S.mode = 'menu';
  assert.equal(ctx.Game.setFaction('echo'), true);
  ctx.Game.startGame();
  assert.equal(ctx.Game.S.factionKey, 'echo');
  assert.equal(ctx.Game.S.players[0].faction, 'echo');
  const chips = ctx.elements.get('facChips').children;
  assert.ok(chips.every(chip => chip.disabled));
});

test('invalid faction keys never mutate the run or menu selection', () => {
  const ctx = loadGame();
  ctx.Game.setFaction('steppe');
  ctx.Game.startGame();
  assert.equal(ctx.Game.setFaction('not-a-faction'), false);
  assert.equal(ctx.Game.S.factionKey, 'steppe');
  ctx.Game.S.mode = 'menu';
  assert.equal(ctx.Game.setFaction('not-a-faction'), false);
  ctx.Game.startGame();
  assert.equal(ctx.Game.S.factionKey, 'steppe');
});