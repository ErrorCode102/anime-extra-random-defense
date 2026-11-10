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
  await sleep(120);
}

(async () => {
  const cdp = await connect();
  const results = [];
  const ok = (name, cond) => { assert.ok(cond, name); results.push('PASS ' + name); };
  try {
    await cdp.viewport(1440, 900, false);
    await cdp.reload();
    // wait for boot: Game defined and renderer resized canvas beyond default 300x150
    let booted = false;
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      const st = await cdp.evaluate(`(() => { const c = document.getElementById('game'); return { game: !!window.Game, mode: window.Game && Game.S && Game.S.mode, cw: c && c.width, ch: c && c.height }; })()`);
      if (st && st.game && st.cw > 300 && st.ch > 150) { booted = true; break; }
    }
    ok('renderer boots and canvas sized to stage', booted);
    const boot = await cdp.evaluate(`(() => ({ mode: Game.S.mode, choices: document.querySelectorAll('#startFactionRow .facChoice').length, cw: document.getElementById('game').width, ch: document.getElementById('game').height, stageW: document.getElementById('stage').clientWidth }))()`);
    ok('opens in menu with 5 faction choices', boot.mode === 'menu' && boot.choices === 5);
    ok('canvas fills stage width', Math.abs(boot.cw - boot.stageW) <= 2);

    // choose Kitsune via real pointer click on the start-screen choice
    await clickSel(cdp, '#startFactionRow .facChoice[data-k="kitsune"]');
    const chosen = await cdp.evaluate(`(() => { const c = document.querySelector('#startFactionRow .facChoice[data-k="kitsune"]'); return { sel: c.classList.contains('sel'), disabled: c.disabled }; })()`);
    ok('start-screen faction choice selectable in menu', chosen.sel && !chosen.disabled);

    // start the run via real pointer click
    await clickSel(cdp, '#startBtn');
    await sleep(200);
    const started = await cdp.evaluate(`(() => ({ mode: Game.S.mode, fk: Game.S.factionKey, pf: Game.S.players[0].faction, chipsDisabled: [...document.querySelectorAll('#facChips .facChip')].every(c => c.disabled), startHidden: !document.getElementById('startOverlay').classList.contains('show') }))()`);
    ok('run starts in play mode', started.mode === 'play' && started.startHidden);
    ok('faction frozen to kitsune for run', started.fk === 'kitsune' && started.pf === 'kitsune');
    ok('in-game faction chips disabled (locked)', started.chipsDisabled);

    // summon via real pointer click
    await clickSel(cdp, '#summonBtn');
    await sleep(150);
    const summoned = await cdp.evaluate(`(() => ({ bench: Game.S.bench.filter(Boolean).length, gold: Game.S.gold }))()`);
    ok('summon places a servant on the bench', summoned.bench >= 1);

    // select first filled bench slot via real pointer click
    const bidx = await cdp.evaluate(`Game.S.bench.findIndex(Boolean)`);
    await clickSel(cdp, `#bench .bslot:nth-child(${bidx + 1})`);
    const selState = await cdp.evaluate(`(() => ({ sel: Game.S.sel }))()`);
    ok('bench slot selects the servant', selState.sel && selState.sel.loc === 'bench');

    // place via real pointer click on valid ground: probe a grid in the foreground
    const stage = await rect(cdp, '#stage');
    const before = await cdp.evaluate(`Game.S.field.filter(Boolean).length`);
    let placed = false, placedInfo = null;
    outer:
    for (const fy of [0.82, 0.72, 0.62, 0.5, 0.4]) {
      for (const fx of [0.5, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85]) {
        const x = Math.round(stage.x - stage.w / 2 + stage.w * fx);
        const y = Math.round(stage.y - stage.h / 2 + stage.h * fy);
        await cdp.click(x, y);
        await sleep(90);
        const n = await cdp.evaluate(`Game.S.field.filter(Boolean).length`);
        if (n > before) { placed = true; placedInfo = await cdp.evaluate(`(() => { const u = Game.S.field.find(Boolean); return { x: u.x, y: u.y, owner: u.owner, uid: u.uid }; })()`); break outer; }
      }
    }
    ok('ground raycast placement deploys a field unit', placed);
    ok('deployed unit has logical coords + owner', placedInfo && Number.isFinite(placedInfo.x) && Number.isFinite(placedInfo.y) && placedInfo.owner === 'p1');

    // invalid placement: click the enemy road center, must not consume bench/pop
    const benchBefore = await cdp.evaluate(`Game.S.bench.filter(Boolean).length`);
    const fieldBefore = await cdp.evaluate(`Game.S.field.filter(Boolean).length`);
    // select another bench unit if available, else re-summon
    let haveBench = await cdp.evaluate(`Game.S.bench.findIndex(Boolean)`);
    if (haveBench < 0) { await clickSel(cdp, '#summonBtn'); await sleep(120); haveBench = await cdp.evaluate(`Game.S.bench.findIndex(Boolean)`); }
    if (haveBench >= 0) {
      await clickSel(cdp, `#bench .bslot:nth-child(${haveBench + 1})`);
      // road runs through logical y~60..? probe top strip which is road/gate; click near top edge
      const x = Math.round(stage.x), y = Math.round(stage.y - stage.h / 2 + stage.h * 0.08);
      await cdp.click(x, y); await sleep(90);
      const fieldAfter = await cdp.evaluate(`Game.S.field.filter(Boolean).length`);
      const toastErr = await cdp.evaluate(`document.getElementById('toast').classList.contains('err') || document.getElementById('toast').textContent.length > 0`);
      ok('invalid ground click does not deploy', fieldAfter === fieldBefore);
      ok('invalid placement surfaces feedback', !!toastErr);
    }

    // in-play faction change rejected
    const rejected = await cdp.evaluate(`Game.setFaction('aurel')`);
    const stillKitsune = await cdp.evaluate(`Game.S.factionKey`);
    ok('in-play setFaction rejected and faction unchanged', rejected === false && stillKitsune === 'kitsune');

    await cdp.screenshot('tests/shots/task2-desktop.png');

    // mobile layout: no horizontal overflow, controls reachable
    await cdp.viewport(390, 844, true);
    await sleep(400);
    const mob = await cdp.evaluate(`(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, stageW: document.getElementById('stage').clientWidth, cwCanvas: document.getElementById('game').width }))()`);
    ok('mobile: no horizontal overflow', mob.sw <= mob.cw + 1);
    ok('mobile: canvas resized to stage', Math.abs(mob.cwCanvas - mob.stageW) <= 2);
    await cdp.screenshot('tests/shots/task2-mobile.png');

    ok('no console/page errors', cdp.errors.length === 0);
    console.log(results.join('\n'));
    console.log('\nTASK2_BROWSER_OK');
    if (cdp.errors.length) console.log('ERRORS:\n' + cdp.errors.join('\n'));
  } catch (e) {
    console.log(results.join('\n'));
    console.error('FAIL:', e.message);
    if (cdp.errors.length) console.error('PAGE ERRORS:\n' + cdp.errors.join('\n'));
    try { await cdp.screenshot('tests/shots/task2-fail.png'); } catch {}
    process.exitCode = 1;
  } finally {
    cdp.close();
  }
})();