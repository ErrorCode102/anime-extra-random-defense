const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { loadGame } = require('./load-game.cjs');

const root = path.resolve(__dirname, '..', 'anime-extra-random-defense-3d');
const ref = {};
vm.createContext(ref);
vm.runInContext(
  fs.readFileSync(path.join(root, 'ferd-skills.js'), 'utf8') +
  fs.readFileSync(path.join(root, 'ferd-skills-th.js'), 'utf8') +
  ';globalThis.FS=FERD_SKILLS;globalThis.NT=FERD_NAME_TH;globalThis.DT=FERD_DESC_TH;', ref);
const FS = ref.FS, NT = ref.NT, DT = ref.DT;
const all = Object.values(FS).flat();
const isFormula = d => d && d.includes('=') && /^\[[A-Z★]+\]/.test(d.trim());

test('every FERD skill name has a Thai translation', () => {
  const missing = [...new Set(all.map(s => s.name))].filter(n => !NT[n] || !/[\u0E01-\u0E5B]/.test(NT[n]));
  assert.deepStrictEqual(missing, [], 'names missing Thai: ' + missing.slice(0, 5).join(' | '));
});

test('every prose skill description has a Thai translation', () => {
  const missing = [...new Set(all.map(s => s.desc).filter(d => d && !isFormula(d)))].filter(d => !DT[d] || !/[\u0E01-\u0E5B]/.test(DT[d]));
  assert.deepStrictEqual(missing.length, 0, 'descs missing Thai: ' + missing.slice(0, 2).map(d => d.slice(0, 60)).join(' | '));
});

test('Thai translations preserve structure markers and numbers', () => {
  for (const [en, th] of Object.entries(DT)) {
    const enNums = (en.match(/\d+(\.\d+)?%?/g) || []).sort();
    const thNums = (th.match(/\d+(\.\d+)?%?/g) || []).sort();
    assert.deepStrictEqual(thNums, enNums, 'numbers changed in: ' + en.slice(0, 50));
    assert.strictEqual((th.match(/\n/g) || []).length, (en.match(/\n/g) || []).length, 'line breaks changed in: ' + en.slice(0, 50));
  }
});

test('selected card renders Thai skill text in Thai mode and English in English mode', () => {
  const ctx = loadGame();
  ctx.setLang('th');
  ctx.startGame();
  ctx.giveServant('A', 'test');
  const idx = ctx.Game.S.bench.findIndex(Boolean);
  ctx.select({ loc: 'bench', idx });
  const u = ctx.Game.S.bench[idx];
  const skills = ref.FS[u.id] || [];
  const html = ctx.elements.get('selSkills').innerHTML;
  if (skills.length) {
    const first = skills[0];
    assert.ok(html.includes(NT[first.name] || first.name), 'Thai name rendered');
    if (first.desc && !isFormula(first.desc)) assert.ok(html.includes((DT[first.desc] || first.desc).split('\n')[0]), 'Thai desc rendered');
  }
  ctx.setLang('en');
  ctx.select({ loc: 'bench', idx });
  const enHtml = ctx.elements.get('selSkills').innerHTML;
  if (skills.length) assert.ok(enHtml.includes(skills[0].name), 'English name restored');
});

test('merge formula descriptions render unchanged in Thai mode', () => {
  const ctx = loadGame();
  ctx.setLang('th');
  const formula = all.find(s => isFormula(s.desc));
  assert.ok(formula, 'a merge formula exists');
  assert.strictEqual(ctx.skillDesc(formula), formula.desc);
});

test('codex search matches Thai skill text', () => {
  const ctx = loadGame();
  ctx.setLang('th');
  const withThai = Object.entries(ref.FS).find(([id, list]) => list.some(s => s.desc && !isFormula(s.desc) && DT[s.desc]));
  assert.ok(withThai, 'a translated unit exists');
  const [id, list] = withThai;
  const s = list.find(x => x.desc && !isFormula(x.desc) && DT[x.desc]);
  const word = DT[s.desc].replace(/[\n\d%.\[\]]/g, ' ').split(/\s+/).find(w => w.length >= 4 && /[\u0E01-\u0E5B]/.test(w));
  assert.ok(word, 'a Thai search word exists');
  const unit = vm.runInContext('UNIT_BY_ID[' + JSON.stringify(id) + ']', ctx);
  const text = ctx.unitSearchText(unit);
  assert.ok(text.includes(word.toLowerCase()), 'haystack contains Thai word');
});