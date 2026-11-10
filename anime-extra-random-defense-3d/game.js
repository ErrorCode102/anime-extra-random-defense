'use strict';
/* ============ ANIME EXTRA RANDOM DEFENCE — game core (3D-ready) ============ */
/* Logic + DOM UI only. The three.js layer (scene3d.js) drives update() and renders S. */

const $ = id => document.getElementById(id);
const rand = (a,b)=>a+Math.random()*(b-a);
const pick = arr => arr[Math.floor(Math.random()*arr.length)];

/* ---------------- audio ---------------- */
const AudioFX = {
  ctx:null, master:null, muted:false, lastShoot:0,
  ensure(){
    if (!this.ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  },
  tone(f, dur, type='sine', vol=0.5, slide=0, delay=0){
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide), t0+dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0+dur+0.05);
  },
  noise(dur, vol=0.3, delay=0){
    if (this.muted || !this.ensure()) return;
    const t0=this.ctx.currentTime+delay, n=this.ctx.sampleRate*dur;
    const buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const s=this.ctx.createBufferSource(), g=this.ctx.createGain(), f=this.ctx.createBiquadFilter();
    f.type='lowpass'; f.frequency.value=900;
    s.buffer=buf; g.gain.value=vol;
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t0);
  },
  click(){ this.tone(660,0.06,'triangle',0.25); },
  shoot(){ const now=performance.now(); if(now-this.lastShoot<70)return; this.lastShoot=now; this.tone(rand(820,980),0.05,'square',0.06,-300); },
  hit(){ this.tone(rand(200,260),0.05,'sawtooth',0.05,-80); },
  summon(g){
    const seq = g==='S' ? [523,659,784,1047,1319] : g==='A' ? [523,659,784,1047] : [523,659,784];
    seq.forEach((f,i)=>this.tone(f,0.16,'triangle',0.3,0,i*0.07));
    if (g==='S') this.tone(2093,0.4,'sine',0.2,0,0.35);
  },
  ascend(){ [392,523,659,784,1047,1568].forEach((f,i)=>this.tone(f,0.22,'sawtooth',0.16,0,i*0.08)); this.noise(0.4,0.15,0.4); },
  place(){ this.tone(330,0.09,'triangle',0.3,120); },
  sell(){ this.tone(880,0.08,'triangle',0.25,-300); this.tone(660,0.1,'triangle',0.2,-200,0.08); },
  leak(){ this.tone(180,0.35,'sawtooth',0.4,-120); this.noise(0.25,0.2); },
  wave(){ this.noise(0.3,0.3); this.tone(196,0.3,'sawtooth',0.25,60); },
  boss(){ this.tone(98,0.6,'sawtooth',0.4,30); this.noise(0.5,0.3); },
  kill(){ const now=performance.now(); if(now-this.lastShoot<40)return; this.tone(rand(500,700),0.06,'triangle',0.08,200); },
  win(){ [523,659,784,1047,784,1047,1319,1568].forEach((f,i)=>this.tone(f,0.25,'triangle',0.3,0,i*0.13)); },
  lose(){ [440,392,330,262,196].forEach((f,i)=>this.tone(f,0.35,'sawtooth',0.22,-30,i*0.18)); },
  err(){ this.tone(160,0.12,'square',0.2,-40); },
};

/* ---------------- state ---------------- */
let S = null;
let uidSeq = 1;
const LOCAL_PLAYER = 'p1';
function freshState(diffKey, playerCount=1){
  const diff = DIFFICULTIES[diffKey];
  const benchSize = CFG.benchSize + 2*(playerCount-1);
  return {
    mode:'menu', diffKey, diff,
    gold:CFG.startGold, spirit:CFG.startSpirit, wisps:CFG.startWisps, gachaLv:1,
    lives:diff.lives, wave:0,
    playerCount, players:Array.from({length:playerCount},(_,i)=>({id:`p${i+1}`})),
    popCap:CFG.popCap + 6*(playerCount-1), benchSize,
    bench:Array(benchSize).fill(null),
    field:[],
    sel:null,
    enemies:[], projectiles:[], beams:[], rings:[], particles:[], floats:[],
    spawnQueue:[], spawnT:0, waveActive:false, auto:false, autoT:0,
    speed:1, paused:false,
    pity:0, kills:0, summons:0, ascensions:0, goldEarned:0, startTime:0,
    shake:0, leakFlash:0, time:0,
    facCd:{seal:0,focus:0,super:0}, focusT:0, focusUid:null, facUiT:0,
    gambleStocks:Object.fromEntries(GOLD_GAMBLES.map(g=>[g.key,{n:g.charges,t:0}])),
  };
}
S = freshState('practice');

const popUsed = () => S.field.reduce((n,u)=>n+(u?UNIT_BY_ID[u.id].pop:0),0);
const gradeVal = g => ({E:1,D:2,C:3,B:4,A:5,S:6,EX:7,STAR:8}[g]||1);
const summonGrade = () => GACHA_GRADE[Math.min(S.gachaLv,CFG.gachaMaxLv)-1];
const summonCost = () => GRADES[summonGrade()].gcost;
const allUnits = () => [
  ...S.bench.map((u,i)=>u&&{u,loc:'bench',idx:i}),
  ...S.field.map((u,i)=>u&&{loc:'field',idx:i,u}),
].filter(Boolean);

/* ---------------- factions ---------------- */
const FSAVE_KEY = 'aerd_factions_v1';
const GRADE_FROM_VAL = ['E','D','C','B','A','S','EX','STAR'];
let factionSave = loadFactionSave();
function loadFactionSave(){
  const base = { cur:'aurel', fac:{} };
  FACTIONS.forEach(f=>base.fac[f.key]={lv:1,xp:0});
  try{
    const raw = localStorage.getItem(FSAVE_KEY);
    if (raw){
      const p = JSON.parse(raw);
      if (p && p.fac){
        if (FACTION_BY_KEY[p.cur]) base.cur = p.cur;
        FACTIONS.forEach(f=>{
          const s = p.fac[f.key];
          if (s && typeof s.lv==='number') base.fac[f.key]={ lv:Math.min(FACTION_MAX_LEVEL,Math.max(1,s.lv|0)), xp:Math.max(0,s.xp|0) };
        });
      }
    }
  }catch(e){}
  return base;
}
function persistFactionSave(){ try{ localStorage.setItem(FSAVE_KEY, JSON.stringify(factionSave)); }catch(e){} }
const curFaction = () => FACTION_BY_KEY[(S.mode !== 'menu' && S.factionKey) || factionSave.cur];
const facLevel = () => factionSave.fac[curFaction().key].lv;
const facMul = () => 1 + (facLevel()-1)*0.05;
const facMastered = () => facLevel() >= FACTION_MAX_LEVEL;
const basicMastered = () => FACTIONS.some(f=>!f.reqMaster && factionSave.fac[f.key].lv>=FACTION_MAX_LEVEL);
const factionUnlocked = f => !f.reqMaster || basicMastered();
function addFactionXp(amount){
  const st = factionSave.fac[curFaction().key];
  if (st.lv >= FACTION_MAX_LEVEL) return;
  st.xp += Math.round(amount);
  let leveled = false;
  while (st.lv < FACTION_MAX_LEVEL && st.xp >= FACTION_XP_REQ[st.lv-1]){ st.xp -= FACTION_XP_REQ[st.lv-1]; st.lv++; leveled=true; }
  if (st.lv >= FACTION_MAX_LEVEL) st.xp = 0;
  persistFactionSave();
  if (leveled){
    AudioFX.ascend();
    toast(t('fac.rankUp',{name:curFaction().name,lv:st.lv})+(facMastered()?t('fac.masteredSuffix'):''));
    log(t('fac.rankUpLog',{name:curFaction().name,lv:st.lv}), 'epic');
  }
  syncFaction();
}
function setFaction(key){
  if (!FACTION_BY_KEY[key]) return false;
  if (!factionUnlocked(FACTION_BY_KEY[key])){ toast(t('fac.unlockNeed'), true); return false; }
  if (S.mode !== 'menu' && S.mode !== 'lobby'){
    toast(t('fac.lockedToast'), true);
    return false;
  }
  if (factionSave.cur === key) return true;
  factionSave.cur = key; persistFactionSave();
  AudioFX.click();
  log(t('fac.sworn',{name:curFaction().name,tag:curFaction().tag}), 'good');
  toast(`⚑ ${curFaction().name}`);
  syncFaction(); syncStats();
  return true;
}
function onKillReward(e, p){
  const f = curFaction();
  addFactionXp(f.key==='mooncell' ? 150 : 100);
  if (f.key==='mooncell'){
    const bb = [...S.bench,...S.field].find(u=>u&&u.grow!==undefined);
    if (bb) bb.grow += 1;
  }
  if (f.key==='aurel' && Math.random()<0.5){
    const amt = Math.round(rand(1,15)*facMul());
    S.gold += amt; S.goldEarned += amt;
    float(p.x, p.y-e.r-6, `+${amt}`, '#ffd23d', 11);
  }
  if (f.key==='steppe' && Math.random()<0.01*facMul()){
    S.wisps += 1;
    float(p.x, p.y-e.r-6, '+❋', '#d0d0d0', 12);
    log(t('log.spiritPlunder'), 'good');
  }
}
function factionActive(){
  if (S.mode!=='play') return;
  const f = curFaction();
  if (f.activeType==='supergold'){
    if (S.facCd.super>0) return;
    if (S.gold < f.cost) return toast(t('toast.noGold'), true);
    S.gold -= f.cost; S.facCd.super=f.cd;
    const amt=Math.floor(rand(0,25001));
    S.gold += amt; S.goldEarned += amt;
    amt<f.cost?AudioFX.err():AudioFX.summon(amt>=20000?'S':'A');
    log(t('fac.imperialLog',{amt,cost:f.cost}), amt<f.cost?'bad':amt>=10000?'epic':'gold');
    toast(amt<f.cost?t('fac.lost',{n:f.cost-amt}):amt===f.cost?t('fac.brokeEven'):t('fac.won',{n:amt-f.cost}));
    if (amt>=20000) banner(t('banner.jackpot'));
    bump($('stGold').parentElement); syncStats();
  } else if (f.activeType==='pickup'){
    openPickup();
  } else if (f.activeType==='crest'){
    if (S.facCd.seal>0) return;
    const sel = S.sel && (S.sel.loc==='bench'?S.bench[S.sel.idx]:S.field[S.sel.idx]);
    if (!sel) return toast(t('fac.crestNeed'), true);
    S.facCd.seal = f.cd; sel.crest = true;
    const nm = UNIT_BY_ID[sel.id].name;
    AudioFX.ascend();
    toast(t('fac.crestToast',{name:nm}));
    log(t('fac.crestLog',{name:nm}), 'good');
    syncStats(); renderSelected();
  } else if (f.key==='echo'){
    if (S.facCd.focus>0) return;
    S.facCd.focus = f.cd; S.focusT = 6;
    const front = S.enemies.filter(e=>!e.dead).sort((a,b)=>b.d-a.d)[0];
    S.focusUid = front ? front.uid : null;
    AudioFX.wave();
    toast(t('fac.focusToast'));
    log(t('fac.focusLog'), 'good');
    syncStats();
  } else if (f.activeType==='fusion'){
    doFusion();
  }
}
function doFusion(){
  if (!S.bench.includes(null)) return toast(t('toast.benchFull'), true);
  const pool = allUnits();
  for (let gv=5; gv>=1; gv--){
    const grade = GRADE_FROM_VAL[gv-1];
    const members = pool.filter(x=>gradeVal(UNIT_BY_ID[x.u.id].grade)===gv);
    if (members.length >= FUSION_COUNT){
      members.sort((a,b)=>(a.loc==='bench'?0:1)-(b.loc==='bench'?0:1));
      members.slice(0,FUSION_COUNT).forEach(m=>{
        const arr = m.loc==='bench'?S.bench:S.field;
        arr[m.idx]=null;
      });
      const next = GRADE_FROM_VAL[gv];
      giveServant(next, t('src.fusion'));
      AudioFX.ascend(); banner(t('banner.fusion'));
      log(t('fac.fusionLog',{n:FUSION_COUNT,grade,next}), 'epic');
      select(null); syncStats();
      return;
    }
  }
  toast(t('fac.fusionNeed',{n:FUSION_COUNT}), true);
}
/* pickup modal (Kitsune Covenant) */
let pickupGrade = 'E';
function openPickup(){
  pickupGrade = 'E';
  buildPickup();
  $('pickupOverlay').classList.add('show');
}
function buildPickup(){
  const tabs = $('pickupTabs'); tabs.innerHTML='';
  ['E','D','C','B'].forEach(g=>{
    const b=document.createElement('button');
    b.className = 'pkTab'+(g===pickupGrade?' sel':'');
    b.style.color = GRADES[g].color;
    b.innerHTML = `[${g}] <span class="cost">❋${PICKUP_REQ[g]}</span>`;
    b.onclick=()=>{ pickupGrade=g; AudioFX.click(); buildPickup(); };
    tabs.appendChild(b);
  });
  const grid = $('pickupGrid'); grid.innerHTML='';
  const need = PICKUP_REQ[pickupGrade];
  UNITS.filter(u=>u.grade===pickupGrade && GACHA_POOL[pickupGrade].includes(u.id)).forEach(u=>{
    const c=document.createElement('button');
    c.className='pkCard'; c.style.borderColor=GRADES[u.grade].color;
    c.disabled = S.wisps<need || !S.bench.includes(null);
    c.innerHTML=`<img src="${portraitSVG(u)}" style="border-color:${GRADES[u.grade].color}" alt="">
      <b>${u.name}</b><span>${u.cls} · ⛨${u.pop}</span>`;
    c.onclick=()=>{
      if (S.wisps<need) return toast(t('toast.noWisp'), true);
      if (!S.bench.includes(null)) return toast(t('toast.benchFull'), true);
      S.wisps-=need; S.summons++;
      const idx=S.bench.indexOf(null);
      S.bench[idx]={uid:uidSeq++, id:u.id, cd:0};
      AudioFX.summon(u.grade);
      log(t('pickup.log',{grade:u.grade,name:u.name,need}), 'good');
      renderBench(idx); syncStats(); syncFaction();
      $('pickupOverlay').classList.remove('show');
    };
    grid.appendChild(c);
  });
  $('pickupHint').textContent = t('pickup.hintDyn',{need,grade:pickupGrade,have:S.wisps});
}

/* ---------------- gambling ---------------- */
let gambleTab = 'gold';
let servantSpecial = false;
function buildGambling(){
  const goldGrid=$('goldGambleGrid'); goldGrid.innerHTML='';
  GOLD_GAMBLES.forEach(g=>{
    const b=document.createElement('button');
    b.className='gambleBtn'; b.id='gamble_'+g.key;
    b.innerHTML=`<b>${tl(g,'label')}</b><span>${g.type==='gold'?`◈${g.cost} → ◈0–${g.payout}`:`◈${g.cost} → 25%: ✧1–3`}</span><em id="stock_${g.key}"></em>`;
    b.onclick=()=>doGoldGamble(g.key);
    goldGrid.appendChild(b);
  });
  buildServantGambles();
}
function buildServantGambles(){
  const grid=$('servantGambleGrid'); grid.innerHTML='';
  SERVANT_GAMBLES.forEach(g=>{
    const chance=servantSpecial?g.special:g.chance;
    const b=document.createElement('button');
    b.className='gambleBtn'; b.id='servant_'+g.key;
    b.style.borderColor=GRADES[g.grades[g.grades.length-1]].color;
    b.innerHTML=`<b>${t('gamble.servantLabel',{label:g.label})}</b><span>◈${g.cost}${g.spirit?` + ✧${g.spirit}`:''}</span><em>${t('gamble.success',{n:chance})}</em>`;
    b.onclick=()=>doServantGamble(g.key);
    grid.appendChild(b);
  });
  $('servantModeNormal').classList.toggle('sel',!servantSpecial);
  $('servantModeSpecial').classList.toggle('sel',servantSpecial);
}
function syncGambling(){
  if (!$('goldGambleGrid')) return;
  $('tabGoldGamble').classList.toggle('sel',gambleTab==='gold');
  $('tabServantGamble').classList.toggle('sel',gambleTab==='servant');
  $('goldGamble').style.display=gambleTab==='gold'?'block':'none';
  $('servantGamble').style.display=gambleTab==='servant'?'block':'none';
  GOLD_GAMBLES.forEach(g=>{
    const st=S.gambleStocks[g.key], b=$('gamble_'+g.key);
    b.disabled=S.mode!=='play'||S.gold<g.cost||st.n<1;
    $('stock_'+g.key).textContent=t('gamble.charges',{n:st.n,max:g.charges})+(st.n<g.charges?t('gamble.next',{s:Math.ceil(g.cd-st.t)}):'');
  });
  SERVANT_GAMBLES.forEach(g=>{
    const b=$('servant_'+g.key);
    b.disabled=S.mode!=='play'||S.gold<g.cost||S.spirit<g.spirit||!S.bench.includes(null);
  });
}
function doGoldGamble(key){
  const g=GOLD_GAMBLES.find(x=>x.key===key);
  if (S.mode!=='play'||!g) return;
  const st=S.gambleStocks[key];
  if (st.n<1) return toast(t('gamble.noCharges'), true);
  if (S.gold<g.cost) return toast(t('toast.noGold'), true);
  st.n--; S.gold-=g.cost;
  if (g.type==='gold'){
    const amt=Math.floor(rand(0,g.payout+1));
    S.gold+=amt; S.goldEarned+=amt;
    const outcome=amt<g.cost?'lost':amt===g.cost?'same':'won';
    log(t('gamble.goldLog',{label:tl(g,'label'),amt,outcome:t(outcome==='lost'?'gamble.outLost':outcome==='same'?'gamble.outSame':'gamble.outWon')}), outcome==='lost'?'bad':'gold');
    toast(outcome==='lost'?t('gamble.goldLost',{amt}):outcome==='same'?t('gamble.goldSame'):t('gamble.goldWon',{amt}));
    outcome==='lost'?AudioFX.err():AudioFX.sell();
  } else {
    const amt=Math.random()<0.25?Math.floor(rand(1,4)):0;
    S.spirit+=amt;
    log(t('gamble.spiritLog',{amt}), amt?'good':'bad');
    toast(amt?t('gamble.spiritWon',{amt}):t('gamble.spiritNone'));
    amt?AudioFX.summon('A'):AudioFX.err();
    bump($('stSpirit').parentElement);
  }
  bump($('stGold').parentElement); syncStats(); syncGambling();
}
function servantChance(g){
  const base = servantSpecial?g.special:g.chance;
  return Math.min(95, base + (curFaction().key==='aurel'?20:0));
}
function doServantGamble(key){
  const g=SERVANT_GAMBLES.find(x=>x.key===key);
  if (S.mode!=='play'||!g) return;
  if (!S.bench.includes(null)) return toast(t('toast.benchFull'), true);
  if (S.gold<g.cost) return toast(t('toast.noGold'), true);
  if (S.spirit<g.spirit) return toast(t('toast.noSpirit'), true);
  S.gold-=g.cost; S.spirit-=g.spirit;
  const chance=servantSpecial?g.special:g.chance;
  if (Math.random()*100<chance){
    S.summons++;
    giveServant(pick(g.grades), t(servantSpecial?'src.specialGamble':'src.servantGamble'));
    banner(t('banner.servantWon'));
  } else {
    AudioFX.err();
    log(t('gamble.servantFailLog',{label:g.label,chance}), 'bad');
    toast(t('gamble.servantFail'), true);
  }
  bump($('stGold').parentElement); syncStats(); syncGambling();
}

/* ---------------- logging / toast ---------------- */
function log(msg, cls=''){
  const el = document.createElement('div');
  el.textContent = msg; if (cls) el.className = cls;
  const box = $('log');
  box.prepend(el);
  while (box.children.length > 30) box.lastChild.remove();
}
let toastT = null;
function toast(msg, err=false){
  const t = $('toast');
  t.textContent = msg; t.className = 'show' + (err?' err':'');
  clearTimeout(toastT);
  toastT = setTimeout(()=>t.className='', 1900);
  if (err) AudioFX.err();
}
function banner(txt){
  const b = $('waveBanner');
  b.textContent = txt; b.classList.remove('show');
  void b.offsetWidth; b.classList.add('show');
}

/* ---------------- stats / bench / selection UI ---------------- */
function bump(el){ el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function buildFactionChips(){
  const box=$('facChips'); box.innerHTML='';
  const startRow=$('startFactionRow'); startRow.innerHTML='';
  FACTIONS.forEach(f=>{
    const b=document.createElement('button');
    b.className='facChip'; b.dataset.k=f.key; b.style.color=f.color; b.title=f.name;
    b.innerHTML=`<i>${f.icon}</i><b>${f.tag}</b>`;
    b.onclick=()=>setFaction(f.key);
    box.appendChild(b);
    const choice=document.createElement('button');
    choice.className='facChoice'; choice.dataset.k=f.key; choice.style.color=f.color;
    choice.innerHTML=`<i>${f.icon}</i><b>${f.tag}</b><span>${f.name}</span>`;
    choice.onclick=()=>setFaction(f.key);
    startRow.appendChild(choice);
  });
}
function syncFaction(){
  const f=curFaction(), lv=facLevel(), st=factionSave.fac[f.key];
  const locked = S.mode !== 'menu' && S.mode !== 'lobby';
  for (const c of [...$('facChips').children, ...$('startFactionRow').children]){
    const on=c.dataset.k===f.key;
    c.classList.toggle('sel',on);
    c.style.borderColor=on?f.color:'';
    c.style.background=on?f.color+'22':'';
    c.disabled=locked;
    c.setAttribute('aria-pressed', on?'true':'false');
  }
  $('factionPanel').classList.toggle('locked', locked);
  $('facLockNote').textContent = locked ? t('fac.lockLocked') : t('fac.lockMenu');
  $('startFactionDesc').textContent = `${tl(f,'passive')} ${t('fac.activeWord')} ${f.activeName} — ${tl(f,'activeDesc')}`;
  $('facName').textContent=f.name; $('facName').style.color=f.color;
  $('facTag').textContent=f.tag; $('facTag').style.background=f.color;
  $('facLv').textContent = facMastered()?t('fac.mastered'):t('fac.lv',{lv});
  const req = lv>=FACTION_MAX_LEVEL?0:FACTION_XP_REQ[lv-1];
  $('facXpBar').style.width = (lv>=FACTION_MAX_LEVEL?100:Math.min(100,st.xp/req*100))+'%';
  $('facXpBar').style.background=f.color;
  $('facXpTxt').textContent = lv>=FACTION_MAX_LEVEL?t('fac.xpMaster'):t('fac.xp',{xp:st.xp,req});
  $('facPassive').textContent=tl(f,'passive');
  const btn=$('facActiveBtn');
  btn.style.borderColor=f.color; btn.style.color=f.color;
  let sub='', dis=S.mode!=='play';
  if (f.activeType==='supergold'){ sub=S.facCd.super>0?`${Math.ceil(S.facCd.super)}s`:`◈${f.cost}`; dis=dis||S.facCd.super>0||S.gold<f.cost; }
  else if (f.activeType==='pickup'){ sub=t('fac.pickupSub'); dis=dis||S.wisps<1||!S.bench.includes(null); }
  else if (f.activeType==='fusion'){ sub=t('fac.fusionSub',{n:FUSION_COUNT}); }
  else if (f.key==='steppe'){ sub=S.facCd.seal>0?`${Math.ceil(S.facCd.seal)}s`:t('fac.cdSub',{n:f.cd}); dis=dis||S.facCd.seal>0; }
  else if (f.key==='echo'){ sub=S.facCd.focus>0?`${Math.ceil(S.facCd.focus)}s`:t('fac.cdSub',{n:f.cd}); dis=dis||S.facCd.focus>0; }
  btn.disabled=dis;
  btn.innerHTML=`${f.icon} ${f.activeName} <span class="cost">${sub}</span>`;
  $('facActiveDesc').textContent=tl(f,'activeDesc');
}
function syncStats(){
  $('stGold').textContent = Math.floor(S.gold);
  $('stSpirit').textContent = Math.floor(S.spirit);
  $('stWisps').textContent = S.wisps;
  $('stLives').textContent = S.lives;
  $('stWave').textContent = `${S.wave} / ${S.diff.waves}`;
  $('stPop').textContent = `${popUsed()} / ${S.popCap}`;
  const sg = summonGrade();
  $('gachaLv').textContent = S.gachaLv;
  $('gachaGrade').textContent = GRADES[sg].label;
  $('gachaGrade').style.color = GRADES[sg].color;
  $('summonBtn').innerHTML = t('summon.btn',{cost:summonCost()});
  $('pity').innerHTML = t('summon.pity',{n:CFG.pityEvery - S.pity});
  $('summonBtn').disabled = S.mode!=='play' || S.gold < summonCost() || !S.bench.includes(null);
  const up = $('gachaUpBtn');
  if (S.gachaLv>=CFG.gachaMaxLv){ up.disabled=true; up.innerHTML=t('summon.maxGrade'); }
  else { const c=CFG.gachaUpCost(S.gachaLv); up.disabled=S.mode!=='play'||S.spirit<c; up.innerHTML=t('summon.up',{cost:c}); }
  $('wispGold').disabled = S.mode!=='play' || S.wisps<1;
  $('wispSpirit').disabled = S.mode!=='play' || S.wisps<1;
  $('wispGacha').disabled = S.mode!=='play' || S.wisps<1 || !S.bench.includes(null);
  const wb = $('waveBtn');
  wb.disabled = S.mode!=='play' || S.waveActive;
  wb.classList.toggle('pulse', S.mode==='play' && !S.waveActive);
  wb.innerHTML = S.waveActive ? t('ctl.waveActive',{n:S.wave}) : (S.wave===0?t('ctl.wave'):t('ctl.waveNext',{n:S.wave+1}));
  $('benchN').textContent = `${S.bench.filter(Boolean).length}/${S.benchSize}`;
  syncFaction(); syncGambling();
}
function renderBench(newIdx=-1){
  const box = $('bench'); box.innerHTML='';
  S.bench.forEach((u,i)=>{
    const d = document.createElement('div');
    d.className = 'bslot ' + (u?'filled':'empty');
    if (u){
      const g = GRADES[UNIT_BY_ID[u.id].grade];
      d.style.borderColor = g.color;
      const img = document.createElement('img');
      img.src = portraitSVG(UNIT_BY_ID[u.id]); img.alt = UNIT_BY_ID[u.id].name;
      d.appendChild(img);
      const pop = document.createElement('div'); pop.className='pop'; pop.textContent=UNIT_BY_ID[u.id].pop;
      d.appendChild(pop);
      if (S.sel && S.sel.loc==='bench' && S.sel.idx===i) d.classList.add('sel');
      if (i===newIdx) d.classList.add('new');
      d.onclick = ()=>{ AudioFX.click(); select(S.sel&&S.sel.loc==='bench'&&S.sel.idx===i ? null : {loc:'bench',idx:i}); };
    }
    box.appendChild(d);
  });
}
function select(sel){
  S.sel = sel;
  renderBench(); renderSelected();
}
function recipesFor(id){ return RECIPES.map((r,i)=>({...r,ri:i})).filter(r=>r.base===id); }
function matStatus(recipe, baseRef){
  const pool = allUnits().filter(x=>!(x.loc===baseRef.loc && x.idx===baseRef.idx));
  const used = new Set();
  return recipe.mats.map(mid=>{
    const found = pool.find(x=>x.u.id===mid && !used.has(x.u.uid));
    if (found) used.add(found.u.uid);
    return { id:mid, have:!!found, ref:found };
  });
}
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function skillsHTML(u, wrapClass){
  const list = u.ferdSkills || [];
  if (!list.length) return '';
  return `<div class="${wrapClass}"><div class="skHead">${t('sel.skill')}</div>` +
    list.map(s=>`<div class="sk"><b class="skn">${esc(s.name)}</b>${s.desc?`<span class="skd">${esc(s.desc).replace(/\n/g,'<br>')}</span>`:''}</div>`).join('') +
    `</div>`;
}
function renderSelected(){
  const none = $('selNone'), card = $('selCard');
  const ref = S.sel && (S.sel.loc==='bench'?S.bench[S.sel.idx]:S.field[S.sel.idx]);
  if (!ref){ none.style.display='block'; card.style.display='none'; return; }
  none.style.display='none'; card.style.display='flex';
  const u = UNIT_BY_ID[ref.id], g = GRADES[u.grade];
  $('selImg').src = portraitSVG(u); $('selImg').style.borderColor = g.color;
  $('selName').textContent = u.name;
  $('selMeta').innerHTML =
    `<span class="gradeChip" style="background:${g.color}">${u.grade}</span><span>${u.cls}</span><span>⛨${u.pop}</span>` +
    (S.sel.loc==='field'?`<span style="color:var(--success)">${t('sel.onField')}</span>`:`<span style="color:var(--info)">${t('sel.onBench')}</span>`);
  $('ssDmg').textContent = u.dmg; $('ssRate').textContent = u.rate; $('ssRange').textContent = u.range;
  $('selDesc').textContent = unitDesc(u);
  $('selSkills').innerHTML = skillsHTML(u,'selSkills');
  $('sellBtn').textContent = t('sel.release',{n:Math.max(1,Math.round(gradeVal(u.grade)/2))});
  $('ascendBtn').style.display='none';
  const rbox = $('recipeBox');
  const recs = recipesFor(ref.id);
  if (!recs.length){ rbox.style.display='none'; return; }
  rbox.style.display='block';
  rbox.innerHTML = `<div class="rt">${t('sel.ascendPaths')}</div>`;
  recs.forEach(r=>{
    const res = UNIT_BY_ID[r.result];
    const status = matStatus(r, S.sel);
    const ok = status.every(m=>m.have);
    const popOk = S.sel.loc!=='field' || popUsed()-u.pop+res.pop <= S.popCap;
    const row = document.createElement('div');
    row.style.cssText='margin-bottom:8px';
    row.innerHTML = `<div style="font-size:12px;font-weight:700;color:${GRADES[res.grade].color};margin-bottom:5px">→ ${res.name} <span style="color:var(--ink-faint);font-weight:400">(⛨${res.pop})</span></div>`;
    const chips = document.createElement('div'); chips.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px';
    status.forEach(m=>{
      const mu = UNIT_BY_ID[m.id];
      const c = document.createElement('div');
      c.className = 'matChip ' + (m.have?'have':'miss');
      c.innerHTML = `<img src="${portraitSVG(mu)}" style="border-color:${GRADES[mu.grade].color}">[${mu.grade}] ${mu.name}`;
      chips.appendChild(c);
    });
    row.appendChild(chips);
    const btn = document.createElement('button');
    btn.textContent = ok ? (popOk?t('sel.ascend'):t('sel.popFull')) : t('sel.matsMissing');
    btn.disabled = !ok || !popOk;
    btn.style.cssText='width:100%;padding:8px;border-radius:8px;font-weight:700;font-size:12px;background:linear-gradient(120deg,#a62e5b,var(--gEX));border:1px solid rgba(255,61,94,.5)';
    btn.onclick = ()=>ascend(r.ri);
    row.appendChild(btn);
    rbox.appendChild(row);
  });
}

/* ---------------- summon (gacha building) ---------------- */
function giveServant(grade, source){
  const idx = S.bench.indexOf(null);
  if (idx===-1){ toast(t('toast.benchFull'), true); return false; }
  const pool = GACHA_POOL[grade];
  const id = pick(pool);
  const u = UNIT_BY_ID[id];
  S.bench[idx] = { uid:uidSeq++, id, cd:0 };
  AudioFX.summon(grade);
  const epic = grade==='S'||grade==='EX'||grade==='STAR';
  log(`${source} [${GRADES[grade].label}] ${u.name}`, epic?'epic':grade==='A'?'gold':'');
  if (epic) toast(t('summon.epicToast',{grade:GRADES[grade].label,name:u.name}));
  renderBench(idx); syncStats();
  if (S.sel) renderSelected();
  return true;
}
function summon(){
  if (S.mode!=='play') return;
  const cost = summonCost();
  if (S.gold < cost) return toast(t('toast.noGold'), true);
  if (!S.bench.includes(null)) return toast(t('toast.benchFull'), true);
  S.gold -= cost; S.summons++;
  let lv = S.gachaLv;
  S.pity++;
  if (S.pity >= CFG.pityEvery){ lv = Math.min(CFG.gachaMaxLv, lv+1); S.pity = 0; }
  const grade = GACHA_GRADE[lv-1];
  if (grade==='S') S.pity = 0;
  bump($('stGold').parentElement);
  giveServant(grade, t('src.summon'));
}
function upgradeGacha(){
  if (S.mode!=='play' || S.gachaLv>=CFG.gachaMaxLv) return;
  const c = CFG.gachaUpCost(S.gachaLv);
  if (S.spirit < c) return toast(t('toast.noSpirit'), true);
  S.spirit -= c; S.gachaLv++;
  AudioFX.ascend();
  const g = summonGrade();
  log(t('upgrade.log',{lv:S.gachaLv,grade:GRADES[g].label}), 'gold');
  toast(t('upgrade.toast',{lv:S.gachaLv,grade:GRADES[g].label}));
  bump($('stSpirit').parentElement);
  syncStats();
}
/* ---------------- wisp economy ---------------- */
function wispToGold(){
  if (S.mode!=='play' || S.wisps<1) return;
  S.wisps--;
  const amt = Math.floor(rand(50+S.wave*2, 100+S.wave*10));
  S.gold += amt; S.goldEarned += amt;
  AudioFX.sell(); log(t('wisp.goldLog',{amt}), 'gold');
  toast(t('wisp.goldToast',{amt})); bump($('stGold').parentElement); syncStats();
}
function wispToSpirit(){
  if (S.mode!=='play' || S.wisps<1) return;
  S.wisps--;
  const amt = Math.floor(rand(1,5.99));
  S.spirit += amt;
  AudioFX.place(); log(t('wisp.spiritLog',{amt}), 'good');
  toast(t('wisp.spiritToast',{amt})); bump($('stSpirit').parentElement); syncStats();
}
function wispToGacha(){
  if (S.mode!=='play' || S.wisps<1) return;
  if (!S.bench.includes(null)) return toast(t('toast.benchFull'), true);
  S.wisps--; S.summons++;
  const grade = S.wave<15 ? 'E' : (Math.random()<0.5?'E':'D');
  giveServant(grade, t('src.wispGacha'));
  syncStats();
}

/* ---------------- placement / sell / ascend ---------------- */
function tryPlace(x, y, playerId=LOCAL_PLAYER){
  if (!S.sel || S.sel.loc!=='bench') return false;
  const u = S.bench[S.sel.idx];
  if (!u) return false;
  const reason = placementReason(x, y, S.field);
  if (reason){
    toast(t('toast.place.'+reason), true);
    return false;
  }
  const def = UNIT_BY_ID[u.id];
  if (popUsed()+def.pop > S.popCap) { toast(t('toast.popFull',{used:popUsed(),cap:S.popCap}), true); return false; }
  let idx = S.field.findIndex(v=>!v);
  if (idx<0) idx = S.field.length;
  u.x=x; u.y=y; u.owner=playerId;
  S.field[idx] = u; S.bench[S.sel.idx] = null;
  AudioFX.place();
  ringFx(x, y, GRADES[def.grade].color, 40);
  log(t('toast.deployed',{name:def.name}), 'good');
  select({loc:'field', idx});
  syncStats();
  return true;
}
function unitByUid(uid){
  for (const [loc,arr] of [['bench',S.bench],['field',S.field]]){
    const idx = arr.findIndex(u=>u && u.uid===uid);
    if (idx>=0) return {u:arr[idx], loc, idx};
  }
  return null;
}
function sellSelected(){
  if (!S.sel) return;
  const arr = S.sel.loc==='bench'?S.bench:S.field;
  const u = arr[S.sel.idx]; if (!u) return;
  const def = UNIT_BY_ID[u.id];
  const w = Math.max(1, Math.round(gradeVal(def.grade)/2));
  S.wisps += w;
  arr[S.sel.idx] = null;
  AudioFX.sell();
  log(t('toast.released',{name:def.name,w}), 'good');
  toast(t('toast.wispPlus',{w}));
  select(null); syncStats();
}
function ascend(ri){
  const r = RECIPES[ri];
  if (!S.sel) return;
  const baseArr = S.sel.loc==='bench'?S.bench:S.field;
  const base = baseArr[S.sel.idx];
  if (!base || base.id!==r.base) return;
  const status = matStatus(r, S.sel);
  if (!status.every(m=>m.have)) return toast(t('toast.matsMissing'), true);
  const res = UNIT_BY_ID[r.result];
  const baseDef = UNIT_BY_ID[base.id];
  if (S.sel.loc==='field' && popUsed()-baseDef.pop+res.pop > S.popCap)
    return toast(t('toast.noPop'), true);
  status.forEach(m=>{
    const arr = m.ref.loc==='bench'?S.bench:S.field;
    arr[m.ref.idx] = null;
  });
  base.id = r.result; base.cd = 0;
  S.ascensions++;
  addFactionXp(200);
  if (curFaction().key==='echo' && Math.random()<0.05*facMul() && S.bench.includes(null)){
    const idx=S.bench.indexOf(null);
    S.bench[idx]={uid:uidSeq++, id:r.result, cd:0};
    log(t('fac.echoLog',{name:res.name}), 'epic');
    toast(t('fac.echoToast',{name:res.name}));
  }
  AudioFX.ascend();
  const pos = S.sel.loc==='field' ? base : null;
  const rc = GRADES[res.grade].color;
  if (pos){ ringFx(pos.x,pos.y,rc,90); ringFx(pos.x,pos.y,'#ffd23d',60); burst(pos.x,pos.y,rc,26); S.shake=Math.max(S.shake,6); }
  banner(res.grade==='STAR'?t('banner.star'):res.grade==='EX'?t('banner.ex'):t('banner.ascend'));
  log(t('log.ascended',{name:res.name}), 'epic');
  toast(t('toast.awakens',{name:res.name}));
  renderBench(); renderSelected(); syncStats();
}

/* ---------------- waves & enemies ---------------- */
function buildWave(w){
  const q = [];
  const count = Math.min(30, 8 + Math.floor(w*0.55));
  const isBoss = w%5===0;
  for (let i=0;i<count;i++){
    let type='normal';
    const r=Math.random();
    if (w>=20 && r<0.16) type='regen';
    else if (w>=10 && r<0.36) type='armor';
    else if (w>=4 && r<0.60) type='swift';
    q.push(type);
  }
  if (isBoss) q.push(w%10===0?'bigboss':'boss');
  return q;
}
const ETYPES = {
  normal:{ hp:1,   sp:74,  r:9,  color:'#ff7a4d', gold:1,   leak:1 },
  swift: { hp:0.6, sp:120, r:7,  color:'#3de0c8', gold:1,   leak:1 },
  armor: { hp:1.6, sp:58,  r:10, color:'#9ab0c8', gold:1.4, leak:1, armor:0.3 },
  regen: { hp:1.2, sp:66,  r:9,  color:'#5dc86a', gold:1.3, leak:1, regen:0.02 },
  boss:  { hp:8,  sp:46,  r:17, color:'#e14dff', gold:12,  leak:5, boss:true },
  bigboss:{hp:16, sp:40,  r:21, color:'#ff3d5e', gold:25,  leak:8, boss:true },
};
function startWave(){
  if (S.mode!=='play' || S.waveActive) return;
  S.wave++;
  S.waveActive = true;
  S.spawnQueue = buildWave(S.wave);
  S.spawnT = 0.4;
  const boss = S.wave%5===0;
  banner(boss ? t('banner.waveBoss',{n:S.wave}) : t('banner.wave',{n:S.wave}));
  boss ? AudioFX.boss() : AudioFX.wave();
  log(boss?t('log.boss',{n:S.wave}):t('log.wave',{n:S.wave}), boss?'bad':'');
  syncStats();
}
function spawnEnemy(type){
  const t = ETYPES[type], w = S.wave;
  const finalBoss = t.boss && w===S.diff.waves;
  const hp = Math.round((10 + 4*w + 0.5*w*w) * t.hp * S.diff.hp * (finalBoss?1.5:1));
  S.enemies.push({
    uid:uidSeq++, type, d:0, hp, maxHp:hp, sp:t.sp*S.diff.speed*rand(0.92,1.08), r:t.r, color:t.color,
    gold:Math.round((3+w*0.7)*t.gold*S.diff.gold), leak:t.leak, boss:!!t.boss,
    armor:t.armor||0, regen:t.regen||0, slowT:0, slowF:0, stunT:0, dots:[], dead:false,
  });
}
function endWave(){
  S.waveActive = false;
  const interest = Math.min(60, Math.floor(S.gold*0.08));
  const bonus = Math.round((30 + S.wave*5) * S.diff.gold) + interest;
  S.gold += bonus; S.goldEarned += bonus;
  S.wisps += CFG.wispsPerWave;
  const spiritReward = curFaction().key==='kitsune' ? 2 : 1;
  S.spirit += spiritReward;
  addFactionXp(500);
  log(t('log.waveCleared',{n:S.wave,bonus,interest:interest?t('log.interest',{n:interest}):'',wisps:CFG.wispsPerWave,spirit:spiritReward}), 'gold');
  bump($('stGold').parentElement);
  if (S.wave >= S.diff.waves) return gameOver(true);
  if (S.auto) S.autoT = 2.0;
  syncStats();
}
function gameOver(win){
  S.mode = win?'won':'lost';
  addFactionXp(win?20000:S.wave*500);
  win ? AudioFX.win() : AudioFX.lose();
  const mins = Math.floor((S.time)/60), secs = Math.floor(S.time%60);
  $('endTitle').textContent = win ? t('end.titleWin') : t('end.titleLose');
  $('endTitle').className = win?'win':'lose';
  $('endSub').textContent = win
    ? t('end.subWin',{waves:S.diff.waves,diff:tl(S.diff,'name')})
    : t('end.subLose',{wave:S.wave,diff:tl(S.diff,'name')});
  $('endSub').textContent += t('end.facSuffix',{name:curFaction().name,rank:facMastered()?t('fac.mastered'):t('fac.lv',{lv:facLevel()})});
  $('endStats').innerHTML = [
    [S.wave, t('end.waves')], [S.kills, t('end.kills')], [S.summons, t('end.summons')],
    [S.ascensions, t('end.ascensions')], [Math.floor(S.goldEarned), t('end.gold')], [`${mins}:${String(secs).padStart(2,'0')}`, t('end.time')],
  ].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('');
  $('endOverlay').classList.add('show');
}

/* ---------------- combat ---------------- */
function dmgMult(){ return (1 + 0.12 * S.field.filter(u=>u&&UNIT_BY_ID[u.id].base==='MS').length) * (S.focusT>0?1.25:1); }
function damageEnemy(e, dmg, opts={}){
  if (e.dead) return;
  const real = dmg * (1 - e.armor);
  e.hp -= real;
  if (opts.dot) e.dots.push({ dps:opts.dot, t:opts.dotT||2 });
  if (opts.slow){ e.slowT = Math.max(e.slowT, opts.slowT||1.2); e.slowF = Math.max(e.slowF, opts.slow); }
  if (opts.stun) e.stunT = Math.max(e.stunT, opts.stun);
  if (opts.greed){ S.gold += opts.greed; S.goldEarned += opts.greed; }
  const p = pathPos(e.d);
  if (opts.crit || real >= 60) float(p.x, p.y-e.r-6, Math.round(real), opts.crit?'#ffc93d':'#f2ead8', opts.crit?15:11);
  if (e.hp <= 0){
    e.dead = true;
    S.kills++; S.gold += e.gold; S.goldEarned += e.gold;
    onKillReward(e, p);
    burst(p.x, p.y, e.color, e.boss?30:8);
    if (e.boss){ S.shake = Math.max(S.shake, 9); ringFx(p.x,p.y,e.color,80); log(t('log.bossDestroyed',{gold:e.gold}), 'good'); }
    AudioFX.kill();
    bump($('stGold').parentElement);
    syncStats();
  } else AudioFX.hit();
}
function enemiesInRange(x,y,r){
  const out=[];
  for (const e of S.enemies){
    if (e.dead) continue;
    const p=pathPos(e.d);
    if ((p.x-x)**2+(p.y-y)**2 <= r*r) out.push({e,p});
  }
  return out;
}
function unitAttack(u, def, x, y){
  const inR = enemiesInRange(x,y,def.range);
  if (!inR.length) return false;
  inR.sort((a,b)=>b.e.d-a.e.d);
  const first = (S.focusT>0 && inR.find(o=>o.e.uid===S.focusUid)) || inR[0];
  const mult = dmgMult();
  const g = GRADES[def.grade];
  AudioFX.shoot();
  const fire = (target, dmg, extra={}) => {
    S.projectiles.push({ uid:uidSeq++, x, y, t:target.e, tx:target.p.x, ty:target.p.y, sp:460, dmg, color:g.color, def, ...extra });
  };
  switch (def.kind){
    case 'single': fire(first, def.dmg*mult, {greed:def.greed}); break;
    case 'crit': {
      const crit = Math.random() < (def.critC||0.25);
      fire(first, def.dmg*mult*(crit?(def.critX||2):1), {crit, greed:def.greed});
      break;
    }
    case 'slow': fire(first, def.dmg*mult, {slow:def.slow, slowT:def.slowT, aoe:def.aoe}); break;
    case 'stun': fire(first, def.dmg*mult, {aoe:def.aoe, stunC:def.stunC, stunT:def.stunT}); break;
    case 'aoe': fire(first, def.dmg*mult, {aoe:def.aoe||40}); break;
    case 'burn': case 'poison': fire(first, def.dmg*mult, {aoe:def.aoe||40, dot:def.dot, dotT:def.dotT}); break;
    case 'pierce': {
      const targets = [first, ...inR.slice(1).filter(o=>(o.p.x-first.p.x)**2+(o.p.y-first.p.y)**2<95*95).slice(0,(def.pierce||2)-1)];
      targets.forEach(t=>fire(t, def.dmg*mult, {aoe:def.aoe, fast:true}));
      break;
    }
    case 'multi': {
      const n = def.multi||2;
      for (let i=0;i<n;i++) fire(inR[i%inR.length], def.dmg*mult, {dot:def.dot, dotT:def.dotT});
      break;
    }
    case 'chain': {
      let cur = first; const hit=new Set(); const pts=[{x,y}];
      let dmg = def.dmg*mult;
      for (let i=0;i<(def.chain||3);i++){
        if (!cur) break;
        hit.add(cur.e);
        pts.push({x:cur.p.x,y:cur.p.y});
        damageEnemy(cur.e, dmg, {});
        dmg *= 0.75;
        const next = S.enemies.filter(e=>!e.dead&&!hit.has(e)).map(e=>({e,p:pathPos(e.d)}))
          .filter(o=>(o.p.x-cur.p.x)**2+(o.p.y-cur.p.y)**2<130*130)
          .sort((a,b)=>((a.p.x-cur.p.x)**2+(a.p.y-cur.p.y)**2)-((b.p.x-cur.p.x)**2+(b.p.y-cur.p.y)**2))[0];
        cur = next;
      }
      S.beams.push({uid:uidSeq++, pts, t:0, life:0.18, color:g.color, w:2.5, lightning:true});
      break;
    }
    case 'beam': {
      damageEnemy(first.e, def.dmg*mult, {});
      if (def.aoe){
        S.enemies.forEach(e=>{
          if (e.dead || e===first.e) return;
          const p=pathPos(e.d);
          if ((p.x-first.p.x)**2+(p.y-first.p.y)**2 < def.aoe*def.aoe) damageEnemy(e, def.dmg*mult*0.7, {});
        });
        ringFx(first.p.x, first.p.y, g.color, def.aoe);
      }
      S.beams.push({uid:uidSeq++, pts:[{x,y},{x:first.p.x,y:first.p.y}], t:0, life:0.16, color:g.color, w:def.aoe?5:3});
      burst(first.p.x, first.p.y, g.color, 5);
      break;
    }
  }
  return true;
}
function projectileImpact(pr){
  const hitOne = (e)=>{
    damageEnemy(e, pr.dmg, {
      crit:pr.crit, dot:pr.dot, dotT:pr.dotT, slow:pr.slow, slowT:pr.slowT,
      stun:(pr.stunC && Math.random()<pr.stunC)?pr.stunT:0, greed:pr.greed,
    });
  };
  if (pr.aoe){
    S.enemies.forEach(e=>{
      if (e.dead) return;
      const p=pathPos(e.d);
      if ((p.x-pr.tx)**2+(p.y-pr.ty)**2 <= pr.aoe*pr.aoe) hitOne(e);
    });
    ringFx(pr.tx, pr.ty, pr.color, pr.aoe);
  } else if (pr.t && !pr.t.dead) hitOne(pr.t);
  burst(pr.tx, pr.ty, pr.color, 3);
}

/* ---------------- effects (data only; rendered in 3D) ---------------- */
function burst(x,y,color,n){
  for (let i=0;i<n;i++){
    const a=rand(0,Math.PI*2), sp=rand(30,150);
    S.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,life:rand(0.3,0.7),color,r:rand(1.5,3.5)});
  }
  if (S.particles.length>400) S.particles.splice(0, S.particles.length-400);
}
function ringFx(x,y,color,r){ S.rings.push({x,y,color,r,t:0,life:0.4}); }
function float(x,y,txt,color,size){
  S.floats.push({x:x+rand(-6,6),y,txt:String(txt),color,size,t:0,life:0.8});
  if (S.floats.length>60) S.floats.shift();
}

/* ---------------- update (driven by the 3D loop) ---------------- */
function update(dt){
  S.time += dt;
  if (S.facCd.seal>0) S.facCd.seal=Math.max(0,S.facCd.seal-dt);
  if (S.facCd.focus>0) S.facCd.focus=Math.max(0,S.facCd.focus-dt);
  if (S.facCd.super>0) S.facCd.super=Math.max(0,S.facCd.super-dt);
  for (const g of GOLD_GAMBLES){
    const st=S.gambleStocks[g.key];
    if (st.n<g.charges){
      st.t+=dt;
      if (st.t>=g.cd){ st.t-=g.cd; st.n++; }
    } else st.t=0;
  }
  if (S.focusT>0) S.focusT=Math.max(0,S.focusT-dt);
  S.facUiT=(S.facUiT||0)+dt;
  if (S.facUiT>0.25){ S.facUiT=0; syncFaction(); syncGambling(); }
  if (S.waveActive && S.spawnQueue.length){
    S.spawnT -= dt;
    if (S.spawnT <= 0){
      const type = S.spawnQueue.shift();
      spawnEnemy(type);
      S.spawnT = type==='boss' ? 1.6 : Math.max(0.35, 0.95 - S.wave*0.02);
    }
  }
  if (S.auto && !S.waveActive && S.mode==='play' && S.wave>0 && S.wave<S.diff.waves){
    S.autoT -= dt;
    if (S.autoT<=0) startWave();
  }
  for (const e of S.enemies){
    if (e.dead) continue;
    if (e.slowT>0) e.slowT-=dt;
    if (e.stunT>0) e.stunT-=dt;
    for (const d of e.dots){ d.t-=dt; if (d.t>0){ e.hp -= d.dps*dt*(1-e.armor); } }
    e.dots = e.dots.filter(d=>d.t>0);
    if (e.regen) e.hp = Math.min(e.maxHp, e.hp + e.maxHp*e.regen*dt);
    if (e.hp<=0){
      e.dead=true; S.kills++; S.gold+=e.gold; S.goldEarned+=e.gold;
      const p=pathPos(e.d); onKillReward(e,p); burst(p.x,p.y,'#5dc86a',6); AudioFX.kill(); syncStats();
      continue;
    }
    const slow = e.slowT>0 ? 1-e.slowF : 1;
    e.d += e.sp * slow * (e.stunT>0?0:1) * dt;
    if (e.d >= PATH_LEN){
      e.dead = true;
      S.lives -= e.leak;
      S.leakFlash = 0.5; S.shake = Math.max(S.shake, e.boss?10:5);
      AudioFX.leak();
      log(t('log.leaked',{type:e.boss?t('enemy.boss'):t('enemy.normal'),n:e.leak}), 'bad');
      bump($('stLives').parentElement);
      syncStats();
      if (S.lives<=0){ S.lives=0; syncStats(); return gameOver(false); }
    }
  }
  S.enemies = S.enemies.filter(e=>!e.dead);
  if (S.waveActive && !S.spawnQueue.length && !S.enemies.length) endWave();
  S.field.forEach((u,i)=>{
    if (!u) return;
    u.cd -= dt;
    if (u.cd<=0){
      const def = UNIT_BY_ID[u.id];
      if (unitAttack(u, def, u.x, u.y)) u.cd = 1/def.rate;
      else u.cd = 0.08;
    }
  });
  for (const pr of S.projectiles){
    if (pr.t && !pr.t.dead){ const p=pathPos(pr.t.d); pr.tx=p.x; pr.ty=p.y; }
    const dx=pr.tx-pr.x, dy=pr.ty-pr.y, dist=Math.hypot(dx,dy);
    const step=(pr.fast?640:pr.sp)*dt;
    if (dist<=step+4){ pr.done=true; projectileImpact(pr); }
    else { pr.x+=dx/dist*step; pr.y+=dy/dist*step; }
  }
  S.projectiles = S.projectiles.filter(p=>!p.done);
  for (const b of S.beams) b.t+=dt;
  S.beams = S.beams.filter(b=>b.t<b.life);
  for (const r of S.rings) r.t+=dt;
  S.rings = S.rings.filter(r=>r.t<r.life);
  for (const p of S.particles){ p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.96; p.vy*=0.96; }
  S.particles = S.particles.filter(p=>p.t<p.life);
  for (const f of S.floats){ f.t+=dt; f.y-=28*dt; }
  S.floats = S.floats.filter(f=>f.t<f.life);
  S.shake = Math.max(0, S.shake - dt*22);
  S.leakFlash = Math.max(0, S.leakFlash - dt);
}

/* ---------------- codex ---------------- */
function gradeLine(id){ const u=UNIT_BY_ID[id]; return `[${u.grade}] ${u.name}`; }
let codexTab='recipes';
let codexFilter={q:'',cls:'',grade:'',kind:''};
const CODEX_CLASSES=[...new Set(UNITS.map(u=>u.cls))];
const CODEX_GRADES=Object.keys(GRADES);
const CODEX_KINDS=[...new Set(UNITS.map(u=>u.kind))];
function unitSearchText(u){
  return [u.name,u.cls,u.grade,u.kind,u.desc,unitDesc(u),u.exTitle||'',(u.ferdSkills||[]).map(s=>s.name+' '+s.desc).join(' ')].join(' ').toLowerCase();
}
function unitMatches(u){
  const f=codexFilter;
  if(f.cls&&u.cls!==f.cls)return false;
  if(f.grade&&u.grade!==f.grade)return false;
  if(f.kind&&u.kind!==f.kind)return false;
  if(f.q&&!unitSearchText(u).includes(f.q.toLowerCase()))return false;
  return true;
}
function recipeMatches(r){
  const res=UNIT_BY_ID[r.result], f=codexFilter;
  if(f.cls&&res.cls!==f.cls)return false;
  if(f.grade&&res.grade!==f.grade)return false;
  if(f.kind&&res.kind!==f.kind)return false;
  if(f.q){
    const hay=(unitSearchText(res)+' '+UNIT_BY_ID[r.base].name+' '+r.mats.map(m=>UNIT_BY_ID[m].name).join(' ')).toLowerCase();
    if(!hay.includes(f.q.toLowerCase()))return false;
  }
  return true;
}
function buildCodexFilters(){
  const fill=(id,values,labelFn,cur)=>{
    const el=$(id); el.innerHTML='';
    const all=document.createElement('option'); all.value=''; all.textContent=t('codex.all'); el.appendChild(all);
    values.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=labelFn(v);el.appendChild(o);});
    el.value=cur;
  };
  fill('codexClass',CODEX_CLASSES,v=>v,codexFilter.cls);
  fill('codexGrade',CODEX_GRADES,v=>v,codexFilter.grade);
  fill('codexKind',CODEX_KINDS,v=>t('klabel.'+v),codexFilter.kind);
}
function setCodexFilter(patch){
  Object.assign(codexFilter,patch);
  if('q' in patch)$('codexSearch').value=codexFilter.q;
  if('cls' in patch)$('codexClass').value=codexFilter.cls;
  if('grade' in patch)$('codexGrade').value=codexFilter.grade;
  if('kind' in patch)$('codexKind').value=codexFilter.kind;
  buildCodex(codexTab);
}
function buildCodex(tab){
  codexTab=tab;
  const body=$('codexBody'); body.innerHTML='';
  $('tabRecipes').classList.toggle('sel',tab==='recipes');
  $('tabArchive').classList.toggle('sel',tab==='archive');
  let count=0;
  if (tab==='recipes'){
    const list=RECIPES.filter(recipeMatches); count=list.length;
    list.forEach((r,i)=>{
      const res=UNIT_BY_ID[r.result], base=UNIT_BY_ID[r.base], g=GRADES[res.grade];
      const dates=['19/01/2022','22/01/2022','23/01/2022','23/01/2022','23/01/2022','29/01/2022','25/12/2021','26/12/2021','03/01/2022'];
      const el=document.createElement('div');
      el.className='embed';
      el.innerHTML=`
      <div class="avatar">✦</div>
      <div class="e-main">
        <div class="e-head"><span class="nm">Atlas</span><span class="bot">✓ APP</span><span class="dt">${dates[i%dates.length]}</span></div>
        <div class="e-card" style="--accent:${i%3===0?'#5865f2':i%3===1?'#eb459e':g.color}">
          <img class="e-thumb" src="${portraitSVG(res)}" style="border-color:${g.color}" alt="">
          <div class="e-class">${res.exTitle||t('codex.false',{cls:res.cls})}</div>
          <div class="e-name">${res.name}</div>
          <div class="e-sec">${t('codex.base')}</div>
          <div class="e-line"><code>${gradeLine(r.base)}</code></div>
          <div class="e-sec">${t('codex.materials')}</div>
          ${r.mats.map(m=>`<div class="e-line"><code>${gradeLine(m)}</code></div>`).join('')}
          <div class="e-sec">${t('codex.misc')}</div>
          <div class="e-misc">${res.flavor}</div>
          <div class="e-icons">
            <div class="e-pop">${res.pop}</div>
            <img src="${portraitSVG(base)}" style="border-color:${GRADES[base.grade].color}" title="${base.name}">
            ${r.mats.map(m=>{const mu=UNIT_BY_ID[m];return `<img src="${portraitSVG(mu)}" style="border-color:${GRADES[mu.grade].color}" title="${mu.name}">`;}).join('')}
          </div>
          <div class="e-foot">${t('codex.archiveFoot')}</div>
        </div>
      </div>`;
      body.appendChild(el);
    });
  } else {
    const list=UNITS.filter(unitMatches); count=list.length;
    const grid=document.createElement('div'); grid.id='archiveGrid';
    list.forEach(u=>{
      const g=GRADES[u.grade];
      const c=document.createElement('div');
      c.className='archCard'; c.style.borderLeftColor=g.color;
      c.innerHTML=`<img src="${portraitSVG(u)}" style="border-color:${g.color}" alt="">
        <div><b>${u.name}</b><div class="am">[${u.grade}] ${u.cls} · ⛨${u.pop} · ${u.dmg} dmg · ${u.rate}/s</div>
        <div class="ad">${unitDesc(u)}</div>${skillsHTML(u,'askills')}</div>`;
      grid.appendChild(c);
    });
    if(count)body.appendChild(grid);
  }
  if(!count){const e=document.createElement('div');e.className='codexEmpty';e.textContent=t('codex.noResults');body.appendChild(e);}
  $('codexCount').textContent=t('codex.results',{n:count});
}

/* ---------------- controls & overlays ---------------- */
let selectedDiff='practice';
function buildDiffCards(){
  const row=$('diffRow'); row.innerHTML='';
  Object.entries(DIFFICULTIES).forEach(([k,d])=>{
    const b=document.createElement('button');
    b.className='diffCard'+(k===selectedDiff?' sel':'');
    b.style.color=d.color;
    b.innerHTML=`<b>${tl(d,'name')}</b><span>${t('diff.waves',{n:d.waves})} · ${t('diff.lives',{n:d.lives})} · ${t('diff.hp',{n:d.hp})}<br><em>${tl(d,'blurb')}</em></span>`;
    b.onclick=()=>{ selectedDiff=k; AudioFX.click(); buildDiffCards(); };
    row.appendChild(b);
  });
}
function startGame(options={}){
  const factionKey = FACTION_BY_KEY[options.factionKey] ? options.factionKey : factionSave.cur;
  const diffKey = DIFFICULTIES[options.diffKey] ? options.diffKey : selectedDiff;
  const playerCount = Math.max(1, Math.min(4, options.playerCount|0 || 1));
  S = freshState(diffKey, playerCount);
  S.factionKey = factionKey;
  S.players.forEach(p => { p.faction = factionKey; });
  factionSave.cur = factionKey; persistFactionSave();
  S.mode='play'; S.startTime=performance.now();
  $('startOverlay').classList.remove('show');
  $('endOverlay').classList.remove('show');
  $('log').innerHTML='';
  log(t('log.entered',{diff:tl(S.diff,'name'),waves:S.diff.waves}),'good');
  log(t('log.factionLocked',{name:curFaction().name,tag:curFaction().tag}),'good');
  log(t('log.summonHint',{grade:GRADES[summonGrade()].label}),'');
  banner(t('banner.defend'));
  AudioFX.wave();
  select(null); syncStats();
  $('autoBtn').classList.remove('on');
  $('speedBtn').textContent='1×';
  $('pauseBtn').textContent='⏸';
}
$('startBtn').onclick=()=>{ AudioFX.ensure(); startGame(); };
$('endRestartBtn').onclick=()=>{ AudioFX.click(); $('endOverlay').classList.remove('show'); $('startOverlay').classList.add('show'); S.mode='menu'; syncFaction(); };
$('restartBtn').onclick=()=>{ AudioFX.click(); S.mode='menu'; $('endOverlay').classList.remove('show'); $('startOverlay').classList.add('show'); syncFaction(); };
function roomFallback(){
  $('roomStatus').textContent=t('room.needServer');
  $('roomStatus').className='warn';
  toast(t('room.noServer'), true);
}
function callNet(method){
  const net = window.Game && window.Game.net;
  if (net && typeof net[method]==='function') return net[method]();
  roomFallback();
}
function selectRoomMode(id){
  for (const b of $('roomControls').children) b.classList.toggle('sel', b.id===id);
}
$('soloModeBtn').onclick=()=>{ AudioFX.click(); selectRoomMode('soloModeBtn'); $('roomPanel').hidden=true; $('roomStatus').textContent=t('start.statusSolo'); $('roomStatus').className=''; };
$('createRoomBtn').onclick=()=>{ AudioFX.click(); selectRoomMode('createRoomBtn'); $('roomPanel').hidden=false; callNet('connectCreate'); };
$('joinRoomBtn').onclick=()=>{ AudioFX.click(); selectRoomMode('joinRoomBtn'); $('roomPanel').hidden=false; $('roomCodeInput').focus(); callNet('connectJoin'); };
$('summonBtn').onclick=()=>{ AudioFX.ensure(); summon(); };
$('gachaUpBtn').onclick=()=>{ AudioFX.ensure(); upgradeGacha(); };
$('wispGold').onclick=()=>{ AudioFX.ensure(); wispToGold(); };
$('wispSpirit').onclick=()=>{ AudioFX.ensure(); wispToSpirit(); };
$('wispGacha').onclick=()=>{ AudioFX.ensure(); wispToGacha(); };
$('facActiveBtn').onclick=()=>{ AudioFX.ensure(); factionActive(); };
$('tabGoldGamble').onclick=()=>{ gambleTab='gold'; AudioFX.click(); syncGambling(); };
$('tabServantGamble').onclick=()=>{ gambleTab='servant'; AudioFX.click(); syncGambling(); };
$('servantModeNormal').onclick=()=>{ servantSpecial=false; AudioFX.click(); buildServantGambles(); syncGambling(); };
$('servantModeSpecial').onclick=()=>{ servantSpecial=true; AudioFX.click(); buildServantGambles(); syncGambling(); };
$('pickupClose').onclick=()=>{ AudioFX.click(); $('pickupOverlay').classList.remove('show'); };
$('pickupOverlay').addEventListener('click',ev=>{ if(ev.target===$('pickupOverlay')) $('pickupOverlay').classList.remove('show'); });
$('waveBtn').onclick=()=>{ AudioFX.ensure(); startWave(); };
$('sellBtn').onclick=sellSelected;
$('autoBtn').onclick=function(){ S.auto=!S.auto; this.classList.toggle('on',S.auto); if(S.auto&&!S.waveActive)S.autoT=1.5; AudioFX.click(); toast(S.auto?t('toast.autoOn'):t('toast.autoOff')); };
$('speedBtn').onclick=function(){ S.speed=S.speed>=3?1:S.speed+1; this.textContent=S.speed+'×'; AudioFX.click(); };
$('pauseBtn').onclick=function(){ if(S.mode!=='play')return; S.paused=!S.paused; this.textContent=S.paused?'▶':'⏸'; AudioFX.click(); };
$('soundBtn').onclick=function(){ AudioFX.ensure(); AudioFX.muted=!AudioFX.muted; this.classList.toggle('on',!AudioFX.muted); this.classList.toggle('off',AudioFX.muted); this.textContent=AudioFX.muted?'♪̸':'♪'; if(!AudioFX.muted)AudioFX.click(); };
$('langBtn').onclick=()=>{ AudioFX.click(); setLang(getLang()==='th'?'en':'th'); };
$('codexBtn').onclick=()=>{ AudioFX.click(); buildCodex('recipes'); $('codexOverlay').classList.add('show'); };
$('codexClose').onclick=()=>{ AudioFX.click(); $('codexOverlay').classList.remove('show'); };
$('tabRecipes').onclick=()=>buildCodex('recipes');
$('tabArchive').onclick=()=>buildCodex('archive');
$('codexSearch').oninput=e=>setCodexFilter({q:e.target.value.trim()});
$('codexClass').onchange=e=>setCodexFilter({cls:e.target.value});
$('codexGrade').onchange=e=>setCodexFilter({grade:e.target.value});
$('codexKind').onchange=e=>setCodexFilter({kind:e.target.value});
$('codexClear').onclick=()=>{ AudioFX.click(); setCodexFilter({q:'',cls:'',grade:'',kind:''}); };
$('codexOverlay').addEventListener('click',ev=>{ if(ev.target===$('codexOverlay')) $('codexOverlay').classList.remove('show'); });

document.addEventListener('keydown',ev=>{
  if (ev.code==='Space'){
    ev.preventDefault();
    if ($('startOverlay').classList.contains('show')) { AudioFX.ensure(); startGame(); }
    else if (S.mode==='play' && !S.paused) startWave();
  }
  else if (ev.key==='g'||ev.key==='G'){ if(S.mode==='play'&&!S.paused) summon(); }
  else if (ev.key==='p'||ev.key==='P'){ $('pauseBtn').click(); }
  else if (ev.key==='Escape'){
    if ($('pickupOverlay').classList.contains('show')) $('pickupOverlay').classList.remove('show');
    else if ($('codexOverlay').classList.contains('show')) $('codexOverlay').classList.remove('show');
    else select(null);
  }
});
document.addEventListener('pointerdown',()=>AudioFX.ensure(),{once:true});

/* ---------------- language helpers ---------------- */
function unitDesc(u){
  if (getLang()!=='th') return u.desc;
  let s=t('kind.'+u.kind);
  if(u.critC)s+=t('mod.crit',{c:Math.round(u.critC*100),x:u.critX});
  if(u.greed)s+=t('mod.greed',{n:u.greed});
  if(u.chain)s+=t('mod.chain',{n:u.chain});
  if(u.multi)s+=t('mod.multi',{n:u.multi});
  if(u.stunC)s+=t('mod.stun',{c:Math.round(u.stunC*100)});
  if(u.pierce)s+=t('mod.pierce',{n:u.pierce});
  if(u.slow)s+=t('mod.slow',{p:Math.round(u.slow*100)});
  if(u.aura)s+=t('mod.aura',{p:Math.round(u.aura*100)});
  return s;
}
function updateLangBtn(){ const b=$('langBtn'); if(b) b.textContent=getLang()==='th'?'EN':'ไทย'; }
function onLangChange(){ updateLangBtn(); buildFactionChips(); buildGambling(); buildDiffCards(); renderBench(); syncStats(); renderSelected(); buildCodexFilters(); if($('codexOverlay').classList.contains('show'))buildCodex(codexTab); if($('pickupOverlay').classList.contains('show'))buildPickup(); }

/* ---------------- expose API for the 3D layer ---------------- */
window.Game = {
  get S(){ return S; },
  update, summon, upgradeGacha, wispToGold, wispToSpirit, wispToGacha,
  startWave, select, tryPlace, sellSelected, ascend, startGame,
  placementReason:(x,y)=>placementReason(x,y,S.field), unitByUid,
  setFaction, factionActive, doFusion, addFactionXp, openPickup,
  doGoldGamble, doServantGamble,
  popUsed, AudioFX, onLangChange,
};
UNITS.forEach(u=>{ u.ferdSkills = FERD_SKILLS[u.id] || []; });
buildDiffCards();
buildFactionChips();
buildGambling();
renderBench();
syncStats();
applyI18n();
buildCodexFilters();
updateLangBtn();
updateLangBtn();