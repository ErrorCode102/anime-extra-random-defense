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
    await cdp.evaluate(`localStorage.removeItem('aerd_lang')`);
    await cdp.reload();
    let booted = false;
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      const st = await cdp.evaluate(`(() => { const c = document.getElementById('game'); return { game: !!window.Game, cw: c && c.width, ch: c && c.height }; })()`);
      if (st && st.game && st.cw > 300 && st.ch > 150) { booted = true; break; }
    }
    ok('renderer boots', booted);

    // initial language defaults to English; toggle button advertises Thai
    ok('default lang is en', await cdp.evaluate(`getLang()`) === 'en');
    ok('html lang attribute en', await cdp.evaluate(`document.documentElement.lang`) === 'en');
    ok('lang button offers ไทย in EN mode', (await txt(cdp, '#langBtn')) === 'ไทย');
    ok('wave button English in menu', /Start Wave/.test(await txt(cdp, '#waveBtn')));
    ok('faction panel header English', /FACTION/.test(await txt(cdp, '#factionPanel h3')));

    // start a run
    await clickSel(cdp, '#startBtn');
    await sleep(200);
    ok('run started', await cdp.evaluate(`Game.S.mode`) === 'play');
    ok('summon button English in play', /SUMMON SERVANT/.test(await txt(cdp, '#summonBtn')));

    // summon + select a servant so the description card is populated
    await clickSel(cdp, '#summonBtn');
    await sleep(150);
    const bidx = await cdp.evaluate(`Game.S.bench.findIndex(Boolean)`);
    await clickSel(cdp, `#bench .bslot:nth-child(${bidx + 1})`);
    const enDesc = await txt(cdp, '#selDesc');
    ok('selected card has English description', enDesc && enDesc.length > 4 && !/[\u0E00-\u0E7F]/.test(enDesc));

    // toggle to Thai via real pointer click on the topbar button (no modal open)
    await clickSel(cdp, '#langBtn');
    await sleep(200);
    ok('lang switched to th', await cdp.evaluate(`getLang()`) === 'th');
    ok('html lang attribute th', await cdp.evaluate(`document.documentElement.lang`) === 'th');
    ok('lang choice persisted', await cdp.evaluate(`localStorage.getItem('aerd_lang')`) === 'th');
    ok('lang button offers EN in TH mode', (await txt(cdp, '#langBtn')) === 'EN');
    ok('wave button Thai', /เริ่มเวฟ/.test(await txt(cdp, '#waveBtn')));
    ok('summon button Thai', /อัญเชิญ/.test(await txt(cdp, '#summonBtn')));
    ok('faction panel header Thai', /แฟคชั่น/.test(await txt(cdp, '#factionPanel h3')));
    ok('selected card description Thai', /[\u0E00-\u0E7F]/.test(await txt(cdp, '#selDesc')));
    await cdp.screenshot('tests/shots/i18n-th-desktop.png');

    // open codex in Thai; verify localized labels and archive skill text
    await clickSel(cdp, '#codexBtn');
    await sleep(150);
    ok('codex open in Thai', /สารานุกรม/.test(await txt(cdp, '#codexOverlay h2')));
    ok('codex recipe base label Thai', await cdp.evaluate(`[...document.querySelectorAll('#codexBody .e-sec')].some(e => e.textContent === 'ฐาน')`));
    await cdp.screenshot('tests/shots/i18n-th-codex.png');
    await clickSel(cdp, '#tabArchive');
    await sleep(150);
    ok('codex archive Thai descriptions', await cdp.evaluate(`[...document.querySelectorAll('#codexBody .ad')].some(e => /[\\u0E00-\\u0E7F]/.test(e.textContent))`));

    // live rebuild: change language while the codex overlay is open (onLangChange path)
    await cdp.evaluate(`setLang('en')`);
    await sleep(180);
    ok('open codex rebuilt to English on setLang', /Ascension Codex/.test(await txt(cdp, '#codexOverlay h2')));
    ok('codex still open after rebuild', await cdp.evaluate(`document.getElementById('codexOverlay').classList.contains('show')`));
    await clickSel(cdp, '#tabRecipes');
    await sleep(120);
    ok('codex recipe base label English after rebuild', await cdp.evaluate(`[...document.querySelectorAll('#codexBody .e-sec')].some(e => e.textContent === 'Base')`));
    await clickSel(cdp, '#codexClose');
    await sleep(120);

    // English fully restored
    ok('lang back to en', await cdp.evaluate(`getLang()`) === 'en');
    ok('wave button English restored', /Start Wave|Wave/.test(await txt(cdp, '#waveBtn')));
    ok('summon button English restored', /SUMMON SERVANT/.test(await txt(cdp, '#summonBtn')));
    ok('selected description English restored', !/[\u0E00-\u0E7F]/.test(await txt(cdp, '#selDesc')));
    await cdp.screenshot('tests/shots/i18n-en-desktop.png');

    // mobile: language button reachable, no horizontal overflow in Thai
    await cdp.viewport(390, 844, true);
    await sleep(400);
    await clickSel(cdp, '#langBtn');
    await sleep(200);
    ok('mobile lang toggled to th', await cdp.evaluate(`getLang()`) === 'th');
    const mob = await cdp.evaluate(`(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))()`);
    ok('mobile: no horizontal overflow', mob.sw <= mob.cw + 1);
    const lr = await rect(cdp, '#langBtn');
    ok('mobile: lang button has layout', lr && lr.w > 0);
    await cdp.screenshot('tests/shots/i18n-th-mobile.png');

    ok('no console/page errors', cdp.errors.length === 0);
    console.log(results.join('\n'));
    console.log('\nI18N_BROWSER_OK');
    if (cdp.errors.length) console.log('ERRORS:\n' + cdp.errors.join('\n'));
  } catch (e) {
    console.log(results.join('\n'));
    console.error('FAIL:', e.message);
    if (cdp.errors.length) console.error('PAGE ERRORS:\n' + cdp.errors.join('\n'));
    try { await cdp.screenshot('tests/shots/i18n-fail.png'); } catch {}
    process.exitCode = 1;
  } finally {
    cdp.close();
  }
})();