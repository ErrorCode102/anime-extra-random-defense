'use strict';
/* ============ CO-OP NETWORKING — PeerJS WebRTC P2P ============
   Host-authoritative model:
   • Host runs the full game simulation (Game.update).
   • Clients send action messages; host validates & applies them.
   • Host broadcasts serialised state at ~15 Hz; clients render only.
   Up to 4 players (1 host + 3 clients). */
(function(){
  const COOP = window.COOP || {maxPlayers:4, playerColors:['#35e0ff','#ff3d8e','#ffc93d','#3dff9a']};
  const $ = id => document.getElementById(id);
  const SYNC_MS = 66;          // ~15 Hz state broadcast
  const PREFIX = 'aerd3d-';    // peer-id prefix to avoid collisions with the 2D build

  let peer=null, conns=[], isHost=false, started=false;
  let playerSlot=0, lobbyPlayers=[];
  let lastSync=0;

  // ---- helpers ----
  function shortCode(){ return Math.random().toString(36).slice(2,7); }
  function colors(){ return COOP.playerColors; }

  // ---- host: create room ----
  function connectCreate(){
    isHost=true; playerSlot=0;
    const name = ($('playerNameInput')?.value || 'Host').slice(0,18);
    const rid = PREFIX + shortCode();
    try { peer = new Peer(rid); } catch(e){ fail('Could not start networking'); return; }

    peer.on('open', id=>{
      const code = id.slice(PREFIX.length).toUpperCase();
      $('roomCodeInput').value = code;
      $('roomStatus').textContent = `Room ${code} — share this code`;
      $('roomStatus').className = 'ok';
      lobbyPlayers = [{name, slot:0, ready:true, host:true}];
      renderLobby();
      $('startRoomBtn').hidden = false;
      $('leaveRoomBtn').hidden = false;
      $('readyBtn').hidden = true;
    });

    peer.on('connection', conn=>{
      if (conns.length >= COOP.maxPlayers-1){
        conn.on('open', ()=> conn.send({type:'reject', reason:'Room full'}));
        return;
      }
      conn.on('open', ()=>{
        const slot = conns.length + 1;
        conn._slot = slot;
        conns.push(conn);
        conn.send({type:'welcome', slot});
      });
      conn.on('data', d=> handleClientMsg(conn, d));
      conn.on('close', ()=> removeConn(conn));
      conn.on('error', ()=> removeConn(conn));
    });

    peer.on('error', err=> fail('Peer error: ' + err.type));
  }

  // ---- client: join room ----
  function connectJoin(){
    isHost=false;
    const name = ($('playerNameInput')?.value || 'Player').slice(0,18);
    const code = ($('roomCodeInput')?.value || '').toUpperCase().trim();
    if (!code){ $('roomCodeInput').focus(); return; }
    try { peer = new Peer(); } catch(e){ fail('Could not start networking'); return; }

    peer.on('open', ()=>{
      const conn = peer.connect(PREFIX + code.toLowerCase(), {reliable:true});
      conn.on('open', ()=>{
        conns = [conn];
        conn.send({type:'join', name});
        $('roomStatus').textContent = 'Connected — waiting for host';
        $('roomStatus').className = 'ok';
        $('readyBtn').hidden = false;
        $('leaveRoomBtn').hidden = false;
        $('startRoomBtn').hidden = true;
      });
      conn.on('data', d=> handleServerMsg(d));
      conn.on('close', ()=>{
        $('roomStatus').textContent = 'Disconnected from host';
        $('roomStatus').className = 'warn';
        const G = window.Game;
        if (G && G.net && G.net.onDisconnect) G.net.onDisconnect();
      });
      conn.on('error', ()=>{
        $('roomStatus').textContent = 'Connection error';
        $('roomStatus').className = 'warn';
      });
    });

    peer.on('error', err=>{
      if (err.type === 'peer-unavailable')
        fail('Room not found — check the code');
      else
        fail('Peer error: ' + err.type);
    });
  }

  // ---- host: message from client ----
  function handleClientMsg(conn, d){
    const G = window.Game;
    if (d.type==='join'){
      lobbyPlayers.push({name:d.name, slot:conn._slot, ready:false, host:false});
      broadcastLobby(); renderLobby();
    } else if (d.type==='ready'){
      const p = lobbyPlayers.find(p=>p.slot===conn._slot);
      if (p) p.ready = d.ready;
      broadcastLobby(); renderLobby();
    } else if (d.type==='action'){
      if (G && G.net && G.net.onAction) G.net.onAction(d.action, d.payload, conn._slot);
    }
  }

  // ---- client: message from host ----
  function handleServerMsg(d){
    const G = window.Game;
    if (d.type==='reject'){
      $('roomStatus').textContent = 'Rejected: ' + d.reason;
      $('roomStatus').className = 'warn';
      conns.forEach(c=>c.close()); conns=[];
      return;
    }
    if (d.type==='welcome'){ playerSlot = d.slot; }
    if (d.type==='lobby'){ lobbyPlayers = d.players; renderLobby(); }
    if (d.type==='start'){
      started = true;
      if (G && G.net && G.net.onStart) G.net.onStart(d.diffKey, d.playerCount);
    }
    if (d.type==='state'){
      if (G && G.net && G.net.onState) G.net.onState(d.state);
    }
  }

  // ---- lobby helpers ----
  function broadcastLobby(){
    conns.forEach(c=>{ if(c.open) c.send({type:'lobby', players:lobbyPlayers, yourSlot:c._slot}); });
  }
  function renderLobby(){
    const box = $('lobbyPlayers'); if (!box) return;
    const cs = colors();
    box.innerHTML = lobbyPlayers.map(p=>
      `<div class="lobbyPlayer ${p.ready?'ready':''}">
        <span class="lpDot" style="background:${cs[p.slot%4]}"></span>
        <span class="lpName">${p.name}${p.host?' ★':''}</span>
        <span class="lpStat">${p.ready?'✓ ready':'…'}</span>
      </div>`).join('');
    if (isHost) $('startRoomBtn').hidden = lobbyPlayers.length < 1;
  }
  function fail(msg){
    const s = $('roomStatus');
    if (s){ s.textContent = msg; s.className = 'warn'; }
  }

  // ---- client: toggle ready ----
  function toggleReady(){
    if (isHost) return;
    const me = lobbyPlayers.find(p=>p.slot===playerSlot);
    const ready = me ? !me.ready : true;
    conns.forEach(c=>{ if(c.open) c.send({type:'ready', ready}); });
  }

  // ---- host: start the run for everyone ----
  function startRoom(diffKey){
    if (!isHost) return;
    const pc = lobbyPlayers.length;
    started = true;
    conns.forEach(c=>{ if(c.open) c.send({type:'start', diffKey, playerCount:pc}); });
  }

  // ---- host: broadcast serialised game state ----
  function syncState(state){
    if (!isHost || !started) return;
    const now = performance.now();
    if (now - lastSync < SYNC_MS) return;
    lastSync = now;
    /* strip enemy & def references from projectiles so JSON is clean */
    const s = state;
    if (s.projectiles){
      s.projectiles = s.projectiles.map(p=>{
        const c = Object.assign({}, p);
        if (c.t){ c.tUid = c.t.uid; delete c.t; }
        if (c.def){ c.defId = c.def.id; delete c.def; }
        return c;
      });
    }
    const msg = {type:'state', state:s};
    conns.forEach(c=>{ if(c.open) c.send(msg); });
  }

  // ---- client: send action to host ----
  function sendAction(action, payload={}){
    if (isHost || !conns.length) return;
    conns.forEach(c=>{ if(c.open) c.send({type:'action', action, payload}); });
  }

  // ---- leave / teardown ----
  function leave(){
    conns.forEach(c=>c.close()); conns = [];
    if (peer){ try{ peer.destroy(); }catch(e){} peer = null; }
    isHost = false; started = false; lobbyPlayers = []; playerSlot = 0;
    const rp = $('roomPanel'); if (rp) rp.hidden = true;
    const rs = $('roomStatus'); if (rs){ rs.textContent=''; rs.className=''; }
    ['readyBtn','startRoomBtn','leaveRoomBtn'].forEach(id=>{ const e=$(id); if(e) e.hidden=true; });
    const lp = $('lobbyPlayers'); if (lp) lp.innerHTML = '';
    const sm = $('soloModeBtn'); if (sm) sm.classList.add('sel');
    ['createRoomBtn','joinRoomBtn'].forEach(id=>{ const e=$(id); if(e) e.classList.remove('sel'); });
  }

  // ---- public API ----
  window.Game = window.Game || {};
  window.Game.net = {
    connectCreate,
    connectJoin,
    toggleReady,
    startRoom,
    syncState,
    sendAction,
    leave,
    getIsHost: ()=>isHost,
    isStarted: ()=>started,
    getPlayerCount: ()=>lobbyPlayers.length,
    onState: null,    // (state) => void   — client receives full state
    onAction: null,   // (action, payload, slot) => void — host receives client action
    onStart: null,     // (diffKey, playerCount) => void — client: host started
    onDisconnect: null,// () => void — client: host left
  };
  /* tell game.js to wire up its callbacks now that net is available */
  const G = window.Game;
  if (G && typeof G.setupNetCallbacks === 'function') G.setupNetCallbacks();
})();
