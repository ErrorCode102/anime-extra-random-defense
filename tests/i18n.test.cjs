const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./load-game.cjs');

test('dictionary resolves English by default and Thai after setLang', () => {
  const ctx = loadGame();
  assert.equal(typeof ctx.t, 'function', 't() must be exposed by i18n.js');
  assert.equal(ctx.t('ctl.wave'), '▶ Start Wave');
  ctx.setLang('th');
  assert.equal(ctx.t('ctl.wave'), '▶ เริ่มเวฟ');
  ctx.setLang('en');
  assert.equal(ctx.t('ctl.wave'), '▶ Start Wave');
});

test('t interpolates variables and falls back to the key when missing', () => {
  const ctx = loadGame();
  assert.equal(ctx.t('fac.lv', { lv: 5 }), 'Lv5');
  assert.equal(ctx.t('toast.popFull', { used: 3, cap: 18 }), 'Population full! (3/18)');
  ctx.setLang('th');
  assert.equal(ctx.t('fac.lv', { lv: 5 }), 'เลเวล 5');
  assert.equal(ctx.t('toast.popFull', { used: 3, cap: 18 }), 'ประชากรเต็ม! (3/18)');
  assert.equal(ctx.t('no.such.key.exists'), 'no.such.key.exists');
});

test('language choice persists to localStorage and rejects unknown codes', () => {
  const ctx = loadGame();
  ctx.setLang('th');
  assert.equal(ctx.localStorage.getItem('aerd_lang'), 'th');
  ctx.setLang('xx');
  assert.equal(ctx.localStorage.getItem('aerd_lang'), 'th', 'unknown language must be ignored');
  assert.equal(ctx.t('ctl.wave'), '▶ เริ่มเวฟ');
});

test('switching language re-renders the dynamic HUD in the active language', () => {
  const ctx = loadGame();
  ctx.Game.startGame();
  assert.match(ctx.elements.get('waveBtn').innerHTML, /Start Wave/);
  ctx.setLang('th');
  assert.match(ctx.elements.get('waveBtn').innerHTML, /เริ่มเวฟ/);
  assert.match(ctx.elements.get('summonBtn').innerHTML, /อัญเชิญ/);
  ctx.setLang('en');
  assert.match(ctx.elements.get('waveBtn').innerHTML, /Start Wave/);
});

test('every English key has a Thai counterpart (no missing translations)', () => {
  const ctx = loadGame();
  const en = Object.keys(ctx.I18N.en);
  const th = ctx.I18N.th;
  const missing = en.filter(k => !(k in th));
  assert.deepEqual(missing, [], 'Thai dictionary missing keys: ' + missing.join(', '));
});