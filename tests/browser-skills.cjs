const { connect } = require('./cdp.cjs');
const assert = require('node:assert');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function rect(cdp, sel) {
  return cdp.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; })()`);
}
async function clickSel(cdp, sel) {
  await cdp.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (el) el.scrollIntoView({ block: 'center', inline: 'center' }); })()`);
  await sleep(80);
  const r = await rect(cdp, sel);
  assert.ok(r && r.w > 0, `element ${sel} has no layout`);
  await cdp.click(Math.round(r.x), Math.round(r.y));
  await sleep(140);
}
const txt = (cdp, sel) => cdp.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.textContent.trim() : null; })()`);

(async () => {
  const cdp = await connect();
  const results = [];
  const ok = (name, cond) => { assert.ok(cond, name); results.push('PASS ' + name); };
  try {
    await cdp.viewport(1440, 900, false);
    await cdp.reload();
    let booted = false;
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      const st = await cdp.evaluate(`(() => { const c = document.getElementById('game'); return { game: !!window.Game, skills: typeof FERD_SKILLS !== 'undefined', cw: c && c.width, ch: c && c.height }; })()`);
      if (st && st.game && st.skills && st.cw > 300 && st.ch > 150) { booted = true; break; }
    }
    ok('renderer + FERD_SKILLS boot', booted);
    ok('all 168 roster units carry FERD skills', await cdp.evaluate(`UNITS.every(u => Array.isArray(u.ferdSkills) && u.ferdSkills.length > 0)`));

    // start a run, summon, select a servant -> selected card shows its skills
    await clickSel(cdp, '#startBtn');
    await sleep(200);
    ok('run started', await cdp.evaluate(`Game.S.mode`) === 'play');
    await clickSel(cdp, '#summonBtn');
    await sleep(150);
    const bidx = await cdp.evaluate(`Game.S.bench.findIndex(Boolean)`);
    await clickSel(cdp, `#bench .bslot:nth-child(${bidx + 1})`);
    const selSkills = await cdp.evaluate(`(() => { const el = document.getElementById('selSkills'); return { html: el.innerHTML, n: el.querySelectorAll('.skn').length, names: [...el.querySelectorAll('.skn')].map(e => e.textContent) }; })()`);
    ok('selected card renders skill names', selSkills.n >= 1);
    ok('selected card has SKILL heading', /SKILL|สกิล/.test(await txt(cdp, '#selSkills')));
    const selUid = await cdp.evaluate(`Game.S.bench[${bidx}].id`);
    const expectNames = await cdp.evaluate(`(FERD_SKILLS[${JSON.stringify(selUid)}] || []).map(s => s.name)`);
    ok('selected skills match the servant FERD data', expectNames.every(n => selSkills.names.includes(n)));
    await cdp.screenshot('tests/shots/skills-selected.png');

    // select a second, different servant -> skill list refreshes
    await clickSel(cdp, '#summonBtn');
    await sleep(150);
    const bidx2 = await cdp.evaluate(`Game.S.bench.findIndex(Boolean)`);
    if (bidx2 !== bidx) {
      await clickSel(cdp, `#bench .bslot:nth-child(${bidx2 + 1})`);
      const names2 = await cdp.evaluate(`[...document.querySelectorAll('#selSkills .skn')].map(e => e.textContent)`);
      const uid2 = await cdp.evaluate(`Game.S.bench[${bidx2}].id`);
      const expect2 = await cdp.evaluate(`(FERD_SKILLS[${JSON.stringify(uid2)}] || []).map(s => s.name)`);
      ok('second servant skills refresh to its own data', expect2.every(n => names2.includes(n)));
    }

    // codex archive lists skills for every unit
    await clickSel(cdp, '#codexBtn');
    await sleep(150);
    await clickSel(cdp, '#tabArchive');
    await sleep(200);
    const arch = await cdp.evaluate(`(() => { const cards = [...document.querySelectorAll('#codexBody .archCard')]; return { cards: cards.length, withSkills: cards.filter(c => c.querySelector('.askills .skn')).length, sample: (document.querySelector('#codexBody .askills .skn') || {}).textContent }; })()`);
    ok('codex archive has 168 cards', arch.cards === 168);
    ok('every archive card lists FERD skills', arch.withSkills === 168);
    ok('archive skill sample present', !!arch.sample && arch.sample.length > 0);
    await cdp.screenshot('tests/shots/skills-codex.png');
    await clickSel(cdp, '#codexClose');
    await sleep(120);

    ok('no console/page errors', cdp.errors.length === 0);
    console.log(results.join('\n'));
    console.log('\nSKILLS_BROWSER_OK');
    if (cdp.errors.length) console.log('ERRORS:\n' + cdp.errors.join('\n'));
  } catch (e) {
    console.log(results.join('\n'));
    console.error('FAIL:', e.message);
    if (cdp.errors.length) console.error('PAGE ERRORS:\n' + cdp.errors.join('\n'));
    try { await cdp.screenshot('tests/shots/skills-fail.png'); } catch {}
    process.exitCode = 1;
  } finally {
    cdp.close();
  }
})();