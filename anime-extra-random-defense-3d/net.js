'use strict';
/* ============================================================
   Anime Extra Random Defence — Co-op Networking  (net.js)

   Architecture:
   • WebSocket signaling server (server.js / ws) handles room
     management and relays WebRTC offer/answer/ICE.
   • After handshake each peer opens an RTCDataChannel directly
     to every other peer (mesh for ≤4 players).
   • Host is authoritative: runs the full simulation, broadcasts
     state at ~15 Hz.  Clients forward actions.

   Fallback: if WebRTC is unavailable all messages go through
   the WebSocket relay directly (adds ~5 ms but always works).
   ============================================================ */
console.log('[net] net.js loading…');

(function () {
  /* ---- config ---- */
  const COOP = window.COOP || {
    maxPlayers: 4,
    playerColors: ['#35e0ff', '#ff3d8e', '#ffc93d', '#3dff9a'],
  };
  const ICE = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };
  const SYNC_MS  = 66;   // ~15 Hz

  /* ---- auto-detect server URL ---- */
  /* If the page was served by server.js the WebSocket lives on the same host */
  function signalingUrl() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}`;
  }

  /* ---- state ---- */
  let ws       = null;   // WebSocket to signaling server
  let isHost   = false;
  let mySlot   = 0;
  let roomCode = '';
  let started  = false;
  let lobbyPlayers = [];
  let lastSync = 0;

  /* peer connections: slot -> { pc: RTCPeerConnection, dc: RTCDataChannel } */
  const peers = {};

  const $ = id => document.getElementById(id);

  /* ================================================================
     WebSocket helpers
  ================================================================ */
  function sigSend(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  function openWs(onOpen) {
    if (ws) { try { ws.close(); } catch (e) {} }
    const url = signalingUrl();
    console.log('[net] connecting to signaling server:', url);
    setStatus('Connecting to server…', '');

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[net] signaling WS open');
      onOpen();
    };

    ws.onmessage = e => {
      let msg;
      try { msg = JSON.parse(e.data); } catch (_) { return; }
      handleSig(msg);
    };

    ws.onerror = err => {
      console.error('[net] WS error', err);
      setStatus('Cannot reach server — is server.js running?', 'warn');
    };

    ws.onclose = () => {
      console.warn('[net] WS closed');
      if (started) {
        const G = window.Game;
        if (G && G.net && G.net.onDisconnect) G.net.onDisconnect();
      }
    };
  }

  /* ================================================================
     Signaling message router
  ================================================================ */
  function handleSig(msg) {
    console.log('[net] sig ←', msg.type, msg);
    switch (msg.type) {

      case 'created':
        mySlot   = msg.slot;
        roomCode = msg.code;
        $('roomCodeInput').value = msg.code;
        setStatus(`Room  ${msg.code}  — share this code`, 'ok');
        lobbyPlayers = [{ slot: 1, name: nameVal(), ready: true, host: true }];
        renderLobby();
        showBtns({ startRoom: true, leave: true });
        break;

      case 'joined':
        mySlot   = msg.slot;
        roomCode = msg.code;
        lobbyPlayers = msg.players || [];
        setStatus('Connected — waiting for host', 'ok');
        renderLobby();
        showBtns({ ready: true, leave: true });
        /* initiate WebRTC to everyone already in room */
        (msg.players || []).forEach(p => {
          if (p.slot !== mySlot) initPeerConn(p.slot, true /* initiator */);
        });
        break;

      case 'lobby':
        lobbyPlayers = msg.players || [];
        renderLobby();
        break;

      case 'player_left':
        lobbyPlayers = (lobbyPlayers || []).filter(p => p.slot !== msg.slot);
        renderLobby();
        break;

      case 'host_left':
        setStatus('Host disconnected', 'warn');
        const G = window.Game;
        if (G && G.net && G.net.onDisconnect) G.net.onDisconnect();
        break;

      case 'start':
        started = true;
        const GG = window.Game;
        if (GG && GG.net && GG.net.onStart) GG.net.onStart(msg.diffKey, msg.playerCount);
        break;

      case 'offer':
        handleOffer(msg.from, msg.offer);
        break;

      case 'answer':
        handleAnswer(msg.from, msg.answer);
        break;

      case 'ice':
        handleIce(msg.from, msg.candidate);
        break;

      /* Fallback relay: host ← client action */
      case 'action':
        if (isHost) {
          const H = window.Game;
          if (H && H.net && H.net.onAction) H.net.onAction(msg.action, msg.payload, msg.fromSlot);
        }
        break;

      /* Fallback relay: clients ← state */
      case 'state':
        if (!isHost) {
          const H = window.Game;
          if (H && H.net && H.net.onState) H.net.onState(msg.state);
        }
        break;

      case 'error':
        const reasons = {
          room_not_found: 'Room not found — check the code',
          already_started: 'That game has already started',
          room_full: 'Room is full (max 4 players)',
        };
        setStatus(reasons[msg.reason] || 'Server error: ' + msg.reason, 'warn');
        break;

      case 'pong': break;
    }
  }

  /* ================================================================
     WebRTC peer connection (one per remote player)
  ================================================================ */
  function initPeerConn(remoteSlot, initiator) {
    if (peers[remoteSlot]) {
      try { peers[remoteSlot].pc.close(); } catch (e) {}
    }
    console.log('[net] initPeerConn slot', remoteSlot, 'initiator:', initiator);
    const pc = new RTCPeerConnection(ICE);
    peers[remoteSlot] = { pc, dc: null };

    /* ICE candidates */
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sigSend({ type: 'ice', to: remoteSlot, candidate });
    };
    pc.oniceconnectionstatechange = () => {
      console.log('[net] ICE', remoteSlot, pc.iceConnectionState);
    };

    /* data channel */
    if (initiator) {
      const dc = pc.createDataChannel('game', { ordered: false, maxRetransmits: 0 });
      peers[remoteSlot].dc = dc;
      dc.onopen = () => {
        console.log('[net] DataChannel open to slot', remoteSlot);
        setStatus('P2P connected!', 'ok');
      };
      dc.onmessage = e => handleDcMsg(remoteSlot, e.data);
      dc.onerror   = err => console.error('[net] DC error:', err);

      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        sigSend({ type: 'offer', to: remoteSlot, offer });
      });
    } else {
      pc.ondatachannel = ({ channel: dc }) => {
        peers[remoteSlot].dc = dc;
        dc.onopen    = () => console.log('[net] DataChannel open from slot', remoteSlot);
        dc.onmessage = e => handleDcMsg(remoteSlot, e.data);
        dc.onerror   = err => console.error('[net] DC error:', err);
      };
    }

    return pc;
  }

  function handleOffer(fromSlot, offer) {
    const pc = initPeerConn(fromSlot, false);
    pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() =>
      pc.createAnswer()
    ).then(answer => {
      pc.setLocalDescription(answer);
      sigSend({ type: 'answer', to: fromSlot, answer });
    }).catch(e => console.error('[net] handleOffer error:', e));
  }

  function handleAnswer(fromSlot, answer) {
    const p = peers[fromSlot];
    if (p) p.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  function handleIce(fromSlot, candidate) {
    const p = peers[fromSlot];
    if (p && candidate) p.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
  }

  /* ================================================================
     Data channel messaging (fast path) + WS relay fallback
  ================================================================ */
  function dcSend(slot, obj) {
    const p = peers[slot];
    if (p && p.dc && p.dc.readyState === 'open') {
      try { p.dc.send(JSON.stringify(obj)); return true; } catch (e) {}
    }
    return false; // fall through to WS
  }

  function handleDcMsg(fromSlot, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }
    const G = window.Game;
    if (!G || !G.net) return;
    if (msg.type === 'action' && isHost && G.net.onAction)
      G.net.onAction(msg.action, msg.payload, fromSlot);
    if (msg.type === 'state' && !isHost && G.net.onState)
      G.net.onState(msg.state);
  }

  /* ================================================================
     Public interface
  ================================================================ */
  function connectCreate() {
    isHost = true; mySlot = 0; started = false;
    peers_cleanup();
    openWs(() => sigSend({ type: 'create', name: nameVal() }));
  }

  function connectJoin() {
    const code = ($('roomCodeInput')?.value || '').toUpperCase().trim();
    if (!code) { $('roomCodeInput')?.focus(); setStatus('Enter the room code first', 'warn'); return; }
    isHost = false; mySlot = 0; started = false;
    peers_cleanup();
    openWs(() => sigSend({ type: 'join', code, name: nameVal() }));
  }

  function toggleReady() {
    sigSend({ type: 'ready', ready: true });
  }

  function startRoom(diffKey) {
    if (!isHost) return;
    sigSend({ type: 'start', diffKey });
  }

  /* Send game state to all clients (~15 Hz, host only) */
  function syncState(state) {
    if (!isHost || !started) return;
    const now = performance.now();
    if (now - lastSync < SYNC_MS) return;
    lastSync = now;
    const msg = JSON.stringify({ type: 'state', state });
    Object.entries(peers).forEach(([slot, p]) => {
      if (p.dc && p.dc.readyState === 'open') {
        try { p.dc.send(msg); return; } catch (e) {}
      }
      /* fallback: relay via WS */
      sigSend({ type: 'state', state, to: +slot });
    });
    /* also broadcast via WS signaling for clients without P2P yet */
    sigSend({ type: 'state', state });
  }

  /* Send action to host (client only) */
  function sendAction(action, payload = {}) {
    if (isHost) return;
    const obj = { type: 'action', action, payload };
    /* try direct P2P to host (slot 1) first */
    if (!dcSend(1, obj)) {
      /* fallback: relay via WS */
      sigSend({ ...obj, to: 1 });
    }
  }

  function leave() {
    peers_cleanup();
    if (ws) { try { ws.close(); } catch (e) {} ws = null; }
    isHost = false; started = false; lobbyPlayers = []; mySlot = 0; roomCode = '';
    const rp = $('roomPanel'); if (rp) rp.hidden = true;
    setStatus('', '');
    showBtns({});
    const lp = $('lobbyPlayers'); if (lp) lp.innerHTML = '';
    const sm = $('soloModeBtn'); if (sm) sm.classList.add('sel');
    ['createRoomBtn', 'joinRoomBtn'].forEach(id => $(''+id)?.classList.remove('sel'));
  }

  function peers_cleanup() {
    Object.values(peers).forEach(p => { try { p.pc.close(); } catch (e) {} });
    Object.keys(peers).forEach(k => delete peers[k]);
  }

  /* ================================================================
     UI helpers
  ================================================================ */
  function nameVal() {
    return ($('playerNameInput')?.value || 'Player').slice(0, 18);
  }

  function setStatus(text, cls) {
    const el = $('roomStatus');
    if (!el) return;
    el.textContent = text;
    el.className   = cls || '';
  }

  function showBtns({ ready, startRoom: sr, leave: lv } = {}) {
    const rb = $('readyBtn');     if (rb) rb.hidden     = !ready;
    const sb = $('startRoomBtn'); if (sb) sb.hidden     = !sr;
    const lb = $('leaveRoomBtn'); if (lb) lb.hidden     = !lv;
  }

  function renderLobby() {
    const box = $('lobbyPlayers');
    if (!box) return;
    const cs = COOP.playerColors;
    box.innerHTML = (lobbyPlayers || []).map(p =>
      `<div class="lobbyPlayer ${p.ready ? 'ready' : ''}">
        <span class="lpDot" style="background:${cs[(p.slot - 1) % 4]}"></span>
        <span class="lpName">${p.name}${p.host ? ' ★' : ''}</span>
        <span class="lpStat">${p.ready ? '✓ ready' : '…'}</span>
      </div>`
    ).join('');
    /* enable start button only on host screen */
    const sr = $('startRoomBtn');
    if (sr && isHost) sr.hidden = lobbyPlayers.length < 1;
  }

  /* ================================================================
     Attach to window.Game
  ================================================================ */
  const net = {
    connectCreate,
    connectJoin,
    toggleReady,
    startRoom,
    syncState,
    sendAction,
    leave,
    getIsHost:     () => isHost,
    isStarted:     () => started,
    getPlayerCount: () => lobbyPlayers.length,
    /* callbacks set by game.js via setupNetCallbacks() */
    onState:       null,
    onAction:      null,
    onStart:       null,
    onDisconnect:  null,
  };

  window.Game = window.Game || {};
  window.Game.net = net;

  /* wire up game callbacks immediately if game.js already loaded */
  const G = window.Game;
  if (G && typeof G.setupNetCallbacks === 'function') G.setupNetCallbacks();

  console.log('[net] net.js ready — using WebSocket signaling at', signalingUrl());
})();
