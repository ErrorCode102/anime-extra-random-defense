# Anime Extra Random Defence Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add free ground deployment, run-locked factions, a sourced famous-anime expansion, and four-player host-authoritative online rooms while preserving the existing FERD game.

**Architecture:** Keep the current browser simulation and three.js renderer. Store positions and ownership on deployed units, route all mutations through a player-context action dispatcher, and let only the solo/host browser advance the simulation. A small Node `ws` server handles lobby membership and relays validated actions and sanitized snapshots; remote browsers render snapshots only.

**Tech Stack:** Browser JavaScript, three.js r186, Node.js, `ws`, Node built-in test runner, existing HTML/CSS.

**Spec:** `docs/superpowers/specs/2026-11-09-anime-extra-random-defence-upgrade-design.md`

## Global Constraints

- Preserve the existing 168-unit roster, 177 recipe indices, FERD gacha/faction/gambling values, and current classic-script loading model.
- Logical placement coordinates remain in the 960×640 game coordinate system; rendering uses the existing `wx/wz` conversion.
- Only the host advances RNG, waves, damage, and enemy movement in online games.
- Shared Gold, Spirit, Wisps, Bench, lives, waves, and gacha level; per-player faction, cooldowns, and unit ownership.
- Rooms contain at most four players and are joinable only before the host starts the run.
- Scaling is calculated once at start: HP `1 + 0.65*(n-1)`, ordinary spawn count `1 + 0.25*(n-1)`, population `18 + 6*(n-1)`, bench `10 + 2*(n-1)`.
- Do not invent AniDB URLs or depend on hotlinked portraits; keep source metadata and procedural fallbacks.
- This workspace is not a git repository; do not create commits or rewrite git configuration.

## Review Focus

- Invalid pointer/road/gate/overlap coordinates must not consume a bench unit or population (Task 1 tests).
- A faction change attempted after `mode === 'play'` must be rejected, including a forged network action (Tasks 2 and 5 tests).
- A missing or failed portrait must fall back without breaking the codex or bench (Task 3 tests).
- Duplicate, malformed, oversized, or wrong-player network actions must not mutate authoritative state (Tasks 4–5 tests).
- A remote browser must never advance its own simulation, and a host disconnect must produce a visible room-ended state (Tasks 5–6 tests).

---

### Task 1: Free-position simulation core

**Files:**
- Modify: `anime-extra-random-defense-3d/data.js` (placement bounds/helpers beside `PATH`/`SLOTS`)
- Modify: `anime-extra-random-defense-3d/game.js` (state, placement, combat position reads, selection)
- Test: `tests/placement.test.cjs`

**Interfaces:**
- Add `PLACEMENT = { minX:24, maxX:936, minY:24, maxY:616, roadPadding:22, unitGap:30 }` and `placementReason(x,y,field,ignoreUid=null)` returning `''` for valid or a stable reason code.
- `freshState(diffKey, playerCount=1)` creates `field:[]`, `players`, `playerCount`, `popCap`, and `benchSize`; solo defaults retain current values.
- `tryPlace(x,y,playerId=LOCAL_PLAYER)` returns boolean and deploys `{uid,id,cd,x,y,owner}`; `unitByUid(uid)` returns `{u,loc,idx}` or null.
- `Game.tryPlace(x,y)`, `Game.placementReason(x,y)`, and `Game.unitByUid(uid)` are the rendering-facing APIs.

- [ ] **Step 1: Write failing placement tests.** Load `data.js` and the non-DOM core with a small VM harness; assert valid ground succeeds, road/gate/out-of-bounds/too-close points return the expected reason, population is unchanged on failure, and a placed unit's `x/y` are used by `enemiesInRange`/attack targeting. Assert selling and ascending a free-position unit preserve/remove the correct `uid`.
- [ ] **Step 2: Run the tests and confirm the old fixed-slot implementation fails.** Run `node --test tests/placement.test.cjs`; expected failures are missing `placementReason`, coordinate arguments being ignored, and `SLOTS`-based positions.
- [ ] **Step 3: Implement coordinate-backed field state.** Keep the existing array-based bench/field consumers working by using stable unit objects and `null` slots where necessary, but remove every gameplay dependency on `SLOTS[i]`; use `u.x/u.y` for attacks, FX, and ascension. Add bounds/road/gate/separation checks before mutation.
- [ ] **Step 4: Run focused and syntax checks.** Run `node --test tests/placement.test.cjs` and `node --check anime-extra-random-defense-3d/game.js`; both must pass.

### Task 2: Ground picking and start-locked faction UI

**Files:**
- Modify: `anime-extra-random-defense-3d/scene3d.js` (ground raycast, unit sync, range preview, input)
- Modify: `anime-extra-random-defense-3d/index.html` (start faction selector, room controls, placement copy)
- Modify: `anime-extra-random-defense-3d/style.css` (lobby/faction/placement states)
- Modify: `anime-extra-random-defense-3d/game.js` (menu-only `setFaction`, locked run faction, start flow)
- Test: `tests/faction-lock.test.cjs`

**Interfaces:**
- `setFaction(key)` changes the menu/lobby selection only; `startGame(options={})` freezes `S.factionKey` and local player faction.
- `Game.getPlacementAtPointer` is not required; the renderer converts a ground intersection to logical coordinates and calls `Game.placementReason`/`Game.tryPlace`.
- `Game.net` may be absent in solo; UI must continue to work without a server.

- [ ] **Step 1: Write failing faction-lock tests.** Start with each faction, call `setFaction` during play, and assert the original `S.factionKey`/player faction and cooldown state are unchanged. Assert starting a second run may choose a different faction.
- [ ] **Step 2: Run `node --test tests/faction-lock.test.cjs` and verify the current in-play mutation fails the test.**
- [ ] **Step 3: Implement menu/lobby faction selection and read-only in-game chips.** Preserve localStorage progression and all five active/passive implementations. Add solo/create/join controls and room-status elements without removing existing gambling, codex, or pickup controls.
- [ ] **Step 4: Replace platform picking with ground picking.** Raycast an invisible plane at `y=0`, map the hit to logical coordinates, show the range disc at that coordinate, and reject invalid placement with the existing toast. Synchronize unit groups from `u.x/u.y`, including facing and selection.
- [ ] **Step 5: Verify syntax and the focused tests.** Run `node --check anime-extra-random-defense-3d/scene3d.js`, `node --check anime-extra-random-defense-3d/game.js`, and `node --test tests/faction-lock.test.cjs`.

### Task 3: Sourced anime expansion and signature-skill metadata

**Files:**
- Create: `anime-extra-random-defense-3d/expansion.js` (data overlay, no duplicate recipe-index mutation)
- Create: `anime-extra-random-defense-3d/assets/portraits/` (verified local assets)
- Create: `anime-extra-random-defense-3d/assets/sources.json` (character, AniDB page, local file, attribution)
- Modify: `anime-extra-random-defense-3d/index.html` (load expansion after `data.js`, before `game.js`)
- Modify: `anime-extra-random-defense-3d/data.js` or `expansion.js` (portrait resolver and pool/codex integration)
- Test: `tests/expansion.test.cjs`

**Interfaces:**
- Expansion entries use `{id,name,cls,grade,pop,dmg,rate,range,kind,hair,eye,style,desc,flavor,skillName,skillDesc,portrait,sourcePage}`.
- `portraitSVG(u)` returns a local portrait URL when `u.portrait` is present and the asset is known, otherwise the existing generated SVG.
- New unit IDs are unique, appear in `UNIT_BY_ID` and the intended `GACHA_POOL`, and expose named skills in selected-unit/codex UI.

- [ ] **Step 1: Verify sources before adding assets.** Record only AniDB pages actually retrieved during research and download their permitted image assets into `assets/portraits`; if an image cannot be verified/downloaded, use a procedural fallback and record that fact rather than guessing a URL.
- [ ] **Step 2: Write failing expansion tests.** Assert every expansion ID is unique, its `kind` is supported, its skill metadata is nonempty, every referenced portrait either exists locally or has a fallback, and original recipe count/order is unchanged.
- [ ] **Step 3: Implement the overlay and portrait fallback.** Add the famous-anime entries and map signature behavior to existing kinds before introducing any new kind. Add source links and skill text to the codex/selected card using safe DOM/text handling.
- [ ] **Step 4: Run `node --test tests/expansion.test.cjs`, all existing core tests, and JavaScript syntax checks.** Confirm no network request is required to render a portrait.

### Task 4: Node room relay and protocol validation

**Files:**
- Create: `package.json` (type/module choice, `start` script, pinned `ws` dependency)
- Create: `server.js` (static file serving plus WebSocket rooms)
- Create: `tests/rooms.test.cjs`

**Interfaces:**
- WebSocket JSON messages: client `create|join|ready|start|action|leave`; server `room|lobby|started|snapshot|actionResult|error|ended`.
- Room code is six uppercase letters/digits excluding ambiguous characters; maximum four memberships.
- `create`/`join` carry `{name,faction}`; `start` carries `{diffKey}`; `action` carries `{type,payload,requestId}`.
- The server never calculates combat or accepts a client-supplied authoritative snapshot.

- [ ] **Step 1: Write failing room tests.** Start the server on an ephemeral port and assert create/join, duplicate code handling, four-player capacity, invalid faction/name/message size rejection, ready/start broadcast, action forwarding only to the host, and host-disconnect `ended` broadcast.
- [ ] **Step 2: Run `node --test tests/rooms.test.cjs` and confirm the server module is initially absent/failing.**
- [ ] **Step 3: Implement bounded WebSocket parsing and room lifecycle.** Validate message types and payload sizes, assign server-generated player IDs/tokens, keep lobby state on the server, and route actions with the sender ID rather than trusting a payload ID.
- [ ] **Step 4: Install only the declared dependency and run room tests.** Run `npm install`, `node --test tests/rooms.test.cjs`, and `node --check server.js`; all must pass.

### Task 5: Host-authoritative browser networking and co-op rules

**Files:**
- Create: `anime-extra-random-defense-3d/coop.js` (connection, lobby, action sender, snapshot application)
- Modify: `anime-extra-random-defense-3d/game.js` (player contexts, dispatcher, snapshot/export/import, scaling)
- Modify: `anime-extra-random-defense-3d/scene3d.js` (host-only update)
- Modify: `anime-extra-random-defense-3d/index.html` (load `coop.js` after `game.js`, before renderer)
- Test: `tests/coop-state.test.cjs`

**Interfaces:**
- `Game.dispatchAction(playerId,type,payload)` validates and executes one action; local solo uses the same dispatcher.
- `Game.exportSnapshot()` returns JSON-safe authoritative state; `Game.applySnapshot(snapshot)` replaces simulation state while retaining local selection/UI preferences.
- `Game.net = {enabled,isHost,playerId,roomCode,sendAction,connectCreate,connectJoin,leave}` is supplied by `coop.js`; remote frame loops skip `Game.update`.
- Player context functions resolve faction/cooldowns by `playerId`, never by the browser viewing the snapshot.

- [ ] **Step 1: Write failing co-op state tests.** Assert two/three/four-player scaling values, shared resource/bench mutations, owner-specific Aurel/Steppe/Echo/Mooncell effects, independent Kitsune/cooldown state, rejected wrong-owner actions, and snapshot round-trip without `def`/DOM/circular references.
- [ ] **Step 2: Run the tests and identify the current global-faction/global-cooldown failures.**
- [ ] **Step 3: Implement the dispatcher and per-player context.** Preserve solo values and route existing buttons through the dispatcher. Store owner on summons/deployed units as needed, calculate scaling once at start, and keep faction XP application local to each browser.
- [ ] **Step 4: Implement sanitized snapshots and the WebSocket client.** Host sends snapshots at 10–15 Hz and after mutations; clients send request IDs and apply only newer snapshots. Disable conflicting remote controls and surface server errors/room-ended state.
- [ ] **Step 5: Run all state/room tests and syntax checks.** Confirm a remote client's render loop cannot call authoritative update.

### Task 6: End-to-end verification and regression pass

**Files:**
- Modify only defects found in the files above.
- Create: `tests/e2e-checklist.md` only if a manual checklist is needed; otherwise keep verification in the final report.

- [ ] **Step 1: Run the complete automated suite.** Run `node --test tests/*.test.cjs` and `node --check` for every JavaScript file; fix failures at their source.
- [ ] **Step 2: Start the actual Node server and exercise solo in Chrome.** Verify faction selection/lock, summon, free placement, invalid placement, combat, ascension, waves, bosses, gambling, codex, pause/speed/auto, restart, and portrait fallback.
- [ ] **Step 3: Exercise four browser contexts.** Verify room code create/join, ready/start, all player counts' scaling, shared economy/Bench, distinct factions/cooldowns, remote action results, snapshot continuity, and non-host/host disconnect behavior.
- [ ] **Step 4: Check desktop/mobile screenshots and browser console/network logs.** Verify no unwanted overflow, missing portraits, uncaught errors, or duplicate simulation loops. Return the game to a clean menu and report any limitation explicitly.
