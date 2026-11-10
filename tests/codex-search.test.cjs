const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { loadGame } = require('./load-game.cjs');

const root = path.resolve(__dirname, '..', 'anime-extra-random-defense-3d');
// Independent reference data (not the game under test) to compute expected matches.
const ref = {};
vm.createContext(ref);
vm.runInContext(
  fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'ferd-skills.js'), 'utf8') +
  ';globalThis.U=UNITS;globalThis.R=RECIPES;globalThis.F=FERD_SKILLS;globalThis.G=GRADES;',
  ref
);
const U = ref.U, R = ref.R, F = ref.F;

const searchText = u => [u.name, u.cls, u.grade, u.kind, u.desc, (F[u.id] || []).map(s => s.name + ' ' + s.desc).join(' ')].join(' ').toLowerCase();
const cardNames = ctx => {
  const grid = ctx.elements.get('codexBody').children[0];
  if (!grid || !grid.children) return [];
  return grid.children.map(c => (c.innerHTML.match(/<b>(.*?)<\/b>/) || [])[1]);
};
const embedCount = ctx => ctx.elements.get('codexBody').children.filter(c => c.className === 'embed').length;

test('archive search matches FERD skill text, not just names', () => {
  const ctx = loadGame();
  ctx.buildCodex('archive');
  ctx.setCodexFilter({ q: 'Boar of Divine Punishment' });
  const expected = U.filter(u => searchText(u).includes('boar of divine punishment')).map(u => u.name);
  assert.ok(expected.length > 0 && expected.length < U.length, 'query is selective');
  assert.deepStrictEqual([...cardNames(ctx)].sort(), [...expected].sort());
  assert.match(ctx.elements.get('codexCount').textContent, new RegExp(expected.length + ' results'));
});

test('archive grade filter narrows to that grade only', () => {
  const ctx = loadGame();
  ctx.buildCodex('archive');
  ctx.setCodexFilter({ grade: 'S' });
  const names = cardNames(ctx);
  const expected = U.filter(u => u.grade === 'S');
  assert.strictEqual(names.length, expected.length);
  const grid = ctx.elements.get('codexBody').children[0];
  grid.children.forEach(c => assert.match(c.innerHTML, /\[S\]/));
});

test('archive class and kind filters combine with search', () => {
  const ctx = loadGame();
  ctx.buildCodex('archive');
  ctx.setCodexFilter({ cls: 'Berserker', kind: 'crit', q: 'boar' });
  const expected = U.filter(u => u.cls === 'Berserker' && u.kind === 'crit' && searchText(u).includes('boar')).map(u => u.name);
  assert.ok(expected.length > 0, 'combination has matches');
  assert.deepStrictEqual([...cardNames(ctx)].sort(), [...expected].sort());
});

test('recipes tab respects the same filters on the result unit', () => {
  const ctx = loadGame();
  ctx.buildCodex('recipes');
  ctx.setCodexFilter({ grade: 'S' });
  const expected = R.filter(r => ref.U.find(u => u.id === r.result).grade === 'S').length;
  assert.strictEqual(embedCount(ctx), expected);
  assert.ok(expected > 0 && expected < R.length, 'grade filter is selective on recipes');
});

test('recipes search also matches base and material names', () => {
  const ctx = loadGame();
  ctx.buildCodex('recipes');
  const baseName = ref.U.find(u => u.id === R[0].base).name;
  ctx.setCodexFilter({ q: baseName });
  assert.ok(embedCount(ctx) >= 1, 'searching a base name finds its recipe');
});

test('no matches shows the empty state and zero count', () => {
  const ctx = loadGame();
  ctx.buildCodex('archive');
  ctx.setCodexFilter({ q: 'zzz-no-such-servant' });
  assert.strictEqual(cardNames(ctx).length, 0);
  const body = ctx.elements.get('codexBody');
  assert.ok(body.children.some(c => c.className === 'codexEmpty'), 'empty state rendered');
  assert.match(ctx.elements.get('codexCount').textContent, /0 results/);
});

test('clear restores the full archive and resets controls', () => {
  const ctx = loadGame();
  ctx.buildCodex('archive');
  ctx.setCodexFilter({ q: 'boar', grade: 'S', cls: 'Berserker', kind: 'crit' });
  assert.ok(cardNames(ctx).length < U.length);
  ctx.setCodexFilter({ q: '', cls: '', grade: '', kind: '' });
  assert.strictEqual(cardNames(ctx).length, U.length);
  assert.strictEqual(ctx.elements.get('codexSearch').value, '');
  assert.strictEqual(ctx.elements.get('codexGrade').value, '');
});

test('filter selects offer All plus every class/grade/kind and count localizes', () => {
  const ctx = loadGame();
  ctx.buildCodexFilters();
  const classOpts = ctx.elements.get('codexClass').children.map(o => o.value);
  assert.strictEqual(classOpts[0], '');
  [...new Set(U.map(u => u.cls))].forEach(c => assert.ok(classOpts.includes(c), 'class option ' + c));
  const kindOpts = ctx.elements.get('codexKind').children.map(o => o.value);
  [...new Set(U.map(u => u.kind))].forEach(k => assert.ok(kindOpts.includes(k), 'kind option ' + k));
  ctx.setLang('th');
  ctx.buildCodex('archive');
  assert.match(ctx.elements.get('codexCount').textContent, /รายการ/);
  ctx.buildCodexFilters();
  assert.strictEqual(ctx.elements.get('codexKind').children[0].textContent, 'ทั้งหมด');
});