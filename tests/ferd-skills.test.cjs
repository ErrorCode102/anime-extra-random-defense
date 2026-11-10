const { test } = require('node:test');
const assert = require('node:assert');
const { loadGame, unit } = require('./load-game.cjs');

function archiveCards(ctx) {
  ctx.buildCodex('archive');
  const body = ctx.elements.get('codexBody');
  const grid = body.children[0];
  return grid ? grid.children : [];
}

test('codex archive lists FERD signature skills for every roster unit', () => {
  const ctx = loadGame();
  const cards = archiveCards(ctx);
  assert.equal(cards.length, 168);
  for (const c of cards) {
    const names = (c.innerHTML.match(/class="skn"/g) || []).length;
    assert.ok(names >= 1, 'every unit card shows at least one FERD skill name');
  }
  const all = cards.map(c => c.innerHTML).join('\n');
  assert.ok(all.includes('Boar of Divine Punishment'), 'AAA carries its FERD ability');
});

test('selected card shows the selected servant\'s FERD skills', () => {
  const ctx = loadGame();
  ctx.Game.startGame();
  ctx.Game.S.bench[0] = unit('AAA', 1);
  ctx.Game.select({ loc: 'bench', idx: 0 });
  const html = ctx.elements.get('selSkills').innerHTML;
  assert.ok(html.includes('Boar of Divine Punishment'), 'selected AAA shows its FERD ability');
  assert.ok(/class="skn"/.test(html));
});

test('selecting a different servant refreshes the skill list', () => {
  const ctx = loadGame();
  ctx.Game.startGame();
  ctx.Game.S.bench[0] = unit('AAA', 1);
  ctx.Game.S.bench[1] = unit('BBB', 2);
  ctx.Game.select({ loc: 'bench', idx: 0 });
  const first = ctx.elements.get('selSkills').innerHTML;
  ctx.Game.select({ loc: 'bench', idx: 1 });
  const second = ctx.elements.get('selSkills').innerHTML;
  assert.ok(/class="skn"/.test(second));
  assert.notEqual(first, second, 'skill list follows the selection');
});