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
const setSearch = (cdp, v) => cdp.evaluate(`(() => { const el = document.getElementById('codexSearch'); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const setSelect = (cdp, id, v) => cdp.evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const archState = cdp => cdp.evaluate(`(() => { const cards = [...document.querySelectorAll('#codexBody .archCard')]; return { n: cards.length, names: cards.map(c => c.querySelector('b').textContent), grades: cards.map(c => (c.querySelector('.am').textContent.match(/\\[(\\w+)\\]/) || [])[1]), count: document.getElementById('codexCount').textContent, empty: !!document.querySelector('#codexBody .codexEmpty') }; })()`);

(async () => {
  const cdp = await connect();
  const results = [];
  const ok = (name, cond) => { assert.ok(cond, name); results.push('PASS ' + name); };
  try {
    await cdp.viewport(1440, 900, false);
    await cdp.evaluate(`localStorage.removeItem('aerd_lang')`);
    await cdp.reload();
    let booted = false;
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      const st = await cdp.evaluate(`(() => { const c = document.getElementById('game'); return { game: !!window.Game, cw: c && c.width }; })()`);
      if (st && st.game && st.cw > 300) { booted = true; break; }
    }
    ok('renderer boots', booted);

    await clickSel(cdp, '#startBtn');
    await sleep(200);
    await clickSel(cdp, '#codexBtn');
    await sleep(150);
    ok('codex open', await cdp.evaluate(`document.getElementById('codexOverlay').classList.contains('show')`));
    const fr = await rect(cdp, '#codexSearch');
    ok('filter bar search has layout', fr && fr.w > 0);
    ok('class select populated', await cdp.evaluate(`document.getElementById('codexClass').options.length`) > 5);
    ok('kind select populated', await cdp.evaluate(`document.getElementById('codexKind').options.length`) > 5);

    await clickSel(cdp, '#tabArchive');
    await sleep(150);
    let st = await archState(cdp);
    ok('archive unfiltered shows all 168', st.n === 168 && /168 results/.test(st.count));

    // search by FERD skill text
    await setSearch(cdp, 'Boar of Divine Punishment');
    await sleep(150);
    st = await archState(cdp);
    const expectBoar = await cdp.evaluate(`UNITS.filter(u => (u.ferdSkills || []).some(s => (s.name + ' ' + s.desc).toLowerCase().includes('boar of divine punishment'))).map(u => u.name)`);
    ok('skill-text search narrows archive', st.n > 0 && st.n < 168);
    ok('skill-text search returns exactly the matching units', JSON.stringify([...st.names].sort()) === JSON.stringify([...expectBoar].sort()));
    await cdp.screenshot('tests/shots/codex-search.png');

    // grade filter on top of search
    await setSelect(cdp, 'codexGrade', 'S');
    await sleep(150);
    st = await archState(cdp);
    ok('grade filter applies within search', st.n > 0 && st.grades.every(g => g === 'S'));

    // class filter combines
    await setSelect(cdp, 'codexClass', 'Berserker');
    await sleep(150);
    const stCls = await archState(cdp);
    ok('class filter combines', stCls.n <= st.n);

    // clear via real pointer click
    await clickSel(cdp, '#codexClear');
    await sleep(150);
    st = await archState(cdp);
    ok('clear restores full archive', st.n === 168);
    ok('clear empties the search box', await cdp.evaluate(`document.getElementById('codexSearch').value`) === '');
    ok('clear resets grade select', await cdp.evaluate(`document.getElementById('codexGrade').value`) === '');

    // no-results empty state
    await setSearch(cdp, 'zzz-no-such-servant');
    await sleep(150);
    st = await archState(cdp);
    ok('no matches shows empty state', st.n === 0 && st.empty && /0 results/.test(st.count));
    await cdp.screenshot('tests/shots/codex-empty.png');
    await clickSel(cdp, '#codexClear');
    await sleep(120);

    // recipes tab respects filters
    await clickSel(cdp, '#tabRecipes');
    await sleep(150);
    await setSelect(cdp, 'codexGrade', 'S');
    await sleep(150);
    const recN = await cdp.evaluate(`document.querySelectorAll('#codexBody .embed').length`);
    const recExpect = await cdp.evaluate(`RECIPES.filter(r => UNITS.find(u => u.id === r.result).grade === 'S').length`);
    ok('recipes grade filter matches expected', recN === recExpect && recN > 0 && recN < 177);
    await clickSel(cdp, '#codexClear');
    await sleep(120);

    // language switch while codex open rebuilds filter labels + count
    await cdp.evaluate(`setLang('th')`);
    await sleep(180);
    ok('filter class label Thai', (await txt(cdp, '#codexFilters .cf span')) === 'คลาส');
    ok('count label Thai', /รายการ/.test(await txt(cdp, '#codexCount')));
    ok('kind All option Thai', await cdp.evaluate(`document.getElementById('codexKind').options[0].textContent`) === 'ทั้งหมด');
    ok('search placeholder Thai', await cdp.evaluate(`document.getElementById('codexSearch').placeholder`).then(p => /ค้นหา/.test(p)));
    await cdp.screenshot('tests/shots/codex-th.png');
    await cdp.evaluate(`setLang('en')`);
    await sleep(150);
    await clickSel(cdp, '#codexClose');
    await sleep(120);

    // mobile: filter bar wraps without horizontal overflow
    await cdp.viewport(390, 844, true);
    await sleep(300);
    await clickSel(cdp, '#codexBtn');
    await sleep(200);
    const mob = await cdp.evaluate(`(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))()`);
    ok('mobile codex: no horizontal overflow', mob.sw <= mob.cw + 1);
    const ms = await rect(cdp, '#codexSearch');
    ok('mobile: search reachable', ms && ms.w > 0);
    const clip = await cdp.evaluate(`(() => { const box = document.querySelector('#codexOverlay .box').getBoundingClientRect(); const sel = document.getElementById('codexKind').getBoundingClientRect(); const f = document.getElementById('codexFilters').getBoundingClientRect(); return { selRight: sel.right, boxRight: box.right, filterRight: f.right, selW: sel.width }; })()`);
    ok('mobile: kind select not clipped by box', clip.selRight <= clip.boxRight - 4 && clip.selRight <= clip.filterRight + 1);
    await cdp.screenshot('tests/shots/codex-mobile.png');

    ok('no console/page errors', cdp.errors.length === 0);
    console.log(results.join('\n'));
    console.log('\nCODEX_BROWSER_OK');
    if (cdp.errors.length) console.log('ERRORS:\n' + cdp.errors.join('\n'));
  } catch (e) {
    console.log(results.join('\n'));
    console.error('FAIL:', e.message);
    if (cdp.errors.length) console.error('PAGE ERRORS:\n' + cdp.errors.join('\n'));
    try { await cdp.screenshot('tests/shots/codex-fail.png'); } catch {}
    process.exitCode = 1;
  } finally {
    cdp.close();
  }
})();