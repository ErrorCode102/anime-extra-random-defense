'use strict';
/* ============================================================
   Anime Extra Random Defence — Co-op Networking  (net.js)
   WebSocket signaling + WebRTC data channels (mesh ≤4 players)
   Host-authoritative: runs simulation, broadcasts state ~15 Hz.
   Clients send actions; server relays everything.
   ============================================================ */
console.log('[net] net.js loading…');

(function () {
  /* ---- config ---- */
  const COOP = window.COOP || {
    maxPlayers: 4,
    playerColors: ['#35e0ff', '#ff3d8e', '#ffc93d', '#3dff9a'],
  };
  const ICE_CFG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };
  const SYNC_MS = 66; // ~15 Hz

  /* ---- state ---- */
  let ws           = null;
  let isHost       = false;
  let mySlot       = 0;
  let started      = false;
  let lobbyPlayers = [];
  let lastSync     = 0;
  const peers      = {}; // slot → { pc, dc }
  const $          = id => document.getElementById(id);

  /* ================================================================
     URL resolution — priority:
       1. ?sig=wss://...  URL param
       2. sigServerInput  field value
       3. same host (served by server.js locally)
       4. null  (remote page, needs manual entry)
  ================================================================ */
  function getServerUrl() {
    const param = new URLSearchParams(location.search).get('sig');
    if (param) return param;

    const inp = $('sigServerInput');
    const val = inp ? inp.value.trim() : '';
    if (val) {
      if (location.protocol === 'https:' && val.startsWith('ws://'))
        return 'wss://' + val.slice(5);
      return val.startsWith('ws') ? val : 'ws://' + val;
    }

    if (location.hostname === 'localhost' ||
        location.hostname.startsWith('127.') ||
        location.hostname.match(/^192\.168\./)) {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      return proto + '://' + location.host;
    }

    return null; // remote page — needs manual address
  }

  /* ================================================================
     WebSocket helpers
  ================================================================ */
  function sigSend(obj) {
    if (ws && ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify(obj));
  }

  function openWs(onOpen) {
    if (ws) { try { ws.close(); } catch (_) {} ws = null; }

    const url = getServerUrl();
    if (!url) {
      setStatus('Enter your server address (e.g. wss://abc.ngrok-free.app)', 'warn');
      const inp = $('sigServerInput');
      if (inp) { inp.focus(); }
      const row = $('sigServerRow');
      if (row) row.style.display = 'flex';
      return;
    }
    if (location.protocol === 'https:' && url.startsWith('ws://')) {
      setStatus('⚠ Use wss:// not ws:// (page is HTTPS)', 'warn');
      return;
    }

    console.log('[net] connecting:', url);
    setStatus('Connecting to ' + url + '…', '');

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[net] WS open');
      onOpen();
    };

    ws.onmessage = e => {
      let msg;
      try { msg = JSON.parse(e.data); } catch (_) { return; }
      handleSig(msg);
    };

    ws.onerror = () => {
      console.error('[net] WS error');
      const u = getServerUrl() || '';
      if (u.startsWith('ws://') && location.protocol === 'https:')
        setStatus('⚠ Cannot use ws:// from https:// — use wss://', 'warn');
      else
        setStatus('Cannot connect to server — is server.js running?', 'warn');
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
    console.log('[net] ←', msg.type);
    if (msg.type === 'created') {
      mySlot = msg.slot;
      $('roomCodeInput').value = msg.code;
      setStatus('Room ' + msg.code + ' — share this code', 'ok');
      lobbyPlayers = [{ slot: 1, name: nameVal(), ready: true, host: true }];
      renderLobby();
      showBtns({ startRoom: true, leave: true });

    } else if (msg.type === 'joined') {
      mySlot = msg.slot;
      lobbyPlayers = msg.players || [];
      setStatus('Connected — waiting for host', 'ok');
      renderLobby();
      showBtns({ ready: true, leave: true });
      (msg.players || []).forEach(function(p) {
        if (p.slot !== mySlot) initPeerConn(p.slot, true);
      });

    } else if (msg.type === 'lobby') {
      lobbyPlayers = msg.players || [];
      renderLobby();

    } else if (msg.type === 'player_left') {
      lobbyPlayers = lobbyPlayers.filter(function(p) { return p.slot !== msg.slot; });
      renderLobby();

    } else if (msg.type === 'host_left') {
      setStatus('Host disconnected', 'warn');
      var G = window.Game;
      if (G && G.net && G.net.onDisconnect) G.net.onDisconnect();

    } else if (msg.type === 'start') {
      started = true;
      var GG = window.Game;
      if (GG && GG.net && GG.net.onStart) GG.net.onStart(msg.diffKey, msg.playerCount);

    } else if (msg.type === 'offer') {
      handleOffer(msg.from, msg.offer);

    } else if (msg.type === 'answer') {
      handleAnswer(msg.from, msg.answer);

    } else if (msg.type === 'ice') {
      handleIce(msg.from, msg.candidate);

    } else if (msg.type === 'action') {
      if (isHost) {
        var H = window.Game;
        if (H && H.net && H.net.onAction) H.net.onAction(msg.action, msg.payload, msg.fromSlot);
      }

    } else if (msg.type === 'state') {
      if (!isHost) {
        var HS = window.Game;
        if (HS && HS.net && HS.net.onState) HS.net.onState(msg.state);
      }

    } else if (msg.type === 'error') {
      var reasons = {
        room_not_found: 'Room not found — check the code',
        already_started: 'That game has already started',
        room_full: 'Room is full (max 4 players)',
      };
      setStatus(reasons[msg.reason] || 'Server error: ' + msg.reason, 'warn');
    }
  }

  /* ================================================================
     WebRTC peer connection
  ================================================================ */
  function initPeerConn(remoteSlot, initiator) {
    if (peers[remoteSlot]) {
      try { peers[remoteSlot].pc.close(); } catch (_) {}
    }
    console.log('[net] initPeer slot', remoteSlot, 'init:', initiator);
    var pc = new RTCPeerConnection(ICE_CFG);
    peers[remoteSlot] = { pc: pc, dc: null };

    pc.onicecandidate = function(ev) {
      if (ev.candidate) sigSend({ type: 'ice', to: remoteSlot, candidate: ev.candidate });
    };
    pc.oniceconnectionstatechange = function() {
      console.log('[net] ICE', remoteSlot, pc.iceConnectionState);
    };

    if (initiator) {
      var dc = pc.createDataChannel('game', { ordered: false, maxRetransmits: 0 });
      peers[remoteSlot].dc = dc;
      dc.onopen    = function() { console.log('[net] DC open →', remoteSlot); setStatus('P2P connected!', 'ok'); };
      dc.onmessage = function(e) { handleDcMsg(remoteSlot, e.data); };
      dc.onerror   = function(e) { console.error('[net] DC error:', e); };
      pc.createOffer().then(function(offer) {
        pc.setLocalDescription(offer);
        sigSend({ type: 'offer', to: remoteSlot, offer: offer });
      });
    } else {
      pc.ondatachannel = function(ev) {
        var dc = ev.channel;
        peers[remoteSlot].dc = dc;
        dc.onopen    = function() { console.log('[net] DC open ←', remoteSlot); };
        dc.onmessage = function(e) { handleDcMsg(remoteSlot, e.data); };
        dc.onerror   = function(e) { console.error('[net] DC error:', e); };
      };
    }
    return pc;
  }

  function handleOffer(fromSlot, offer) {
    var pc = initPeerConn(fromSlot, false);
    pc.setRemoteDescription(new RTCSessionDescription(offer))
      .then(function() { return pc.createAnswer(); })
      .then(function(answer) {
        pc.setLocalDescription(answer);
        sigSend({ type: 'answer', to: fromSlot, answer: answer });
      })
      .catch(function(e) { console.error('[net] handleOffer error:', e); });
  }

  function handleAnswer(fromSlot, answer) {
    var p = peers[fromSlot];
    if (p) p.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  function handleIce(fromSlot, candidate) {
    var p = peers[fromSlot];
    if (p && candidate) p.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(function() {});
  }

  /* ================================================================
     Data channel (fast path) + WS relay fallback
  ================================================================ */
  function dcSend(slot, obj) {
    var p = peers[slot];
    if (p && p.dc && p.dc.readyState === 'open') {
      try { p.dc.send(JSON.stringify(obj)); return true; } catch (_) {}
    }
    return false;
  }

  function handleDcMsg(fromSlot, raw) {
    var msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }
    var G = window.Game;
    if (!G || !G.net) return;
    if (msg.type === 'action' && isHost && G.net.onAction)
      G.net.onAction(msg.action, msg.payload, fromSlot);
    if (msg.type === 'state' && !isHost && G.net.onState)
      G.net.onState(msg.state);
  }

  /* ================================================================
     Public API
  ================================================================ */
  function connectCreate() {
    isHost = true; mySlot = 0; started = false;
    peersCleanup();
    openWs(function() { sigSend({ type: 'create', name: nameVal() }); });
  }

  function connectJoin() {
    var code = (($('roomCodeInput') && $('roomCodeInput').value) || '').toUpperCase().trim();
    if (!code) {
      if ($('roomCodeInput')) $('roomCodeInput').focus();
      setStatus('Enter the room code first', 'warn');
      return;
    }
    isHost = false; mySlot = 0; started = false;
    peersCleanup();
    openWs(function() { sigSend({ type: 'join', code: code, name: nameVal() }); });
  }

  function toggleReady() {
    sigSend({ type: 'ready', ready: true });
  }

  function startRoom(diffKey) {
    if (!isHost) return;
    sigSend({ type: 'start', diffKey: diffKey });
  }

  function syncState(state) {
    if (!isHost || !started) return;
    var now = performance.now();
    if (now - lastSync < SYNC_MS) return;
    lastSync = now;
    var msg = JSON.stringify({ type: 'state', state: state });
    Object.keys(peers).forEach(function(slot) {
      var p = peers[slot];
      if (p.dc && p.dc.readyState === 'open') {
        try { p.dc.send(msg); return; } catch (_) {}
      }
      sigSend({ type: 'state', state: state, to: +slot });
    });
    // broadcast via WS for clients still negotiating P2P
    sigSend({ type: 'state', state: state });
  }

  function sendAction(action, payload) {
    if (isHost) return;
    var obj = { type: 'action', action: action, payload: payload || {} };
    if (!dcSend(1, obj)) sigSend(Object.assign({}, obj, { to: 1 }));
  }

  function leave() {
    peersCleanup();
    if (ws) { try { ws.close(); } catch (_) {} ws = null; }
    isHost = false; started = false; lobbyPlayers = []; mySlot = 0;
    var rp = $('roomPanel'); if (rp) rp.hidden = true;
    setStatus('', '');
    showBtns({});
    var lp = $('lobbyPlayers'); if (lp) lp.innerHTML = '';
    var sm = $('soloModeBtn'); if (sm) sm.classList.add('sel');
    ['createRoomBtn', 'joinRoomBtn'].forEach(function(id) {
      var el = $(id); if (el) el.classList.remove('sel');
    });
  }

  function peersCleanup() {
    Object.values(peers).forEach(function(p) { try { p.pc.close(); } catch (_) {} });
    Object.keys(peers).forEach(function(k) { delete peers[k]; });
  }

  /* ================================================================
     UI helpers
  ================================================================ */
  function nameVal() {
    var inp = $('playerNameInput');
    return (inp ? inp.value : 'Player').slice(0, 18) || 'Player';
  }

  function setStatus(text, cls) {
    var el = $('roomStatus');
    if (!el) return;
    el.textContent = text;
    el.className   = cls || '';
  }

  function showBtns(opts) {
    opts = opts || {};
    var rb = $('readyBtn');     if (rb) rb.hidden = !opts.ready;
    var sb = $('startRoomBtn'); if (sb) sb.hidden = !opts.startRoom;
    var lb = $('leaveRoomBtn'); if (lb) lb.hidden = !opts.leave;
  }

  function renderLobby() {
    var box = $('lobbyPlayers');
    if (!box) return;
    var cs = COOP.playerColors;
    box.innerHTML = lobbyPlayers.map(function(p) {
      return '<div class="lobbyPlayer ' + (p.ready ? 'ready' : '') + '">' +
        '<span class="lpDot" style="background:' + cs[(p.slot - 1) % 4] + '"></span>' +
        '<span class="lpName">' + p.name + (p.host ? ' ★' : '') + '</span>' +
        '<span class="lpStat">' + (p.ready ? '✓ ready' : '…') + '</span>' +
        '</div>';
    }).join('');
    var sr = $('startRoomBtn');
    if (sr && isHost) sr.hidden = lobbyPlayers.length < 1;
  }

  /* ================================================================
     Attach to window.Game
  ================================================================ */
  var net = {
    connectCreate:   connectCreate,
    connectJoin:     connectJoin,
    toggleReady:     toggleReady,
    startRoom:       startRoom,
    syncState:       syncState,
    sendAction:      sendAction,
    leave:           leave,
    getIsHost:       function() { return isHost; },
    isStarted:       function() { return started; },
    getPlayerCount:  function() { return lobbyPlayers.length; },
    onState:         null,
    onAction:        null,
    onStart:         null,
    onDisconnect:    null,
  };

  window.Game = window.Game || {};
  window.Game.net = net;

  var G = window.Game;
  if (G && typeof G.setupNetCallbacks === 'function') G.setupNetCallbacks();

  console.log('[net] ready — server:', getServerUrl() || '(needs manual address)');
})();
