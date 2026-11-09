# Anime Extra Random Defence — Free Placement and Online Co-op

## Intent

Extend the existing three.js FERD-inspired game without replacing its summoning, ascension, wave, boss, economy, gambling, or faction rules. The run should support free ground placement, a faction chosen before the run and locked during it, a larger famous-anime roster with signature-skill metadata and verified portrait sources, and online rooms for up to four players.

## Goals

- Preserve the existing 168-unit roster, 177 recipes, FERD-aligned gacha, faction effects, and gambling values.
- Let a selected bench servant deploy at valid logical `(x,y)` ground coordinates instead of one of 13 fixed platforms.
- Require a faction choice in the start/lobby screen; reject faction changes after the run begins.
- Add famous anime characters and appropriate named skills using the existing combat kinds wherever possible.
- Use verified AniDB character pages as source references and locally served portrait assets with a procedural fallback; never invent source URLs.
- Support solo, create-room, and join-room flows with short room codes and a maximum of four players.
- Make the host browser authoritative for RNG, waves, combat, movement, and action validation.
- Scale enemy pressure and population capacity from the player count at run start.

## Non-goals / anti-goals

- Do not rewrite the game as a new engine or port the entire simulation to Node.
- Do not run independent RNG/simulation loops on remote browsers.
- Do not restore Fate character names or replace the existing roster wholesale.
- Do not make the static Python server a requirement for online play; online play uses the Node/WebSocket server.
- No accounts, matchmaking, chat, persistent online profiles, or host-migration protocol in this iteration. A host disconnect ends the room cleanly rather than risking a corrupt run.
- Do not claim that remote images are locally available until their source and download have been checked.

## Constraints

- Keep the current classic-script order (`data.js`, `game.js`, then rendering/network scripts) and three.js r186 import map.
- The generated-data source `_ferd/emit_data.py` must not silently erase hand-maintained faction/gambling additions. Roster additions belong in a separate overlay or a deliberately updated generator.
- The existing global `S` is private lexical state and is exposed through `window.Game`; snapshot application and action dispatch need explicit APIs.
- Network messages must be bounded, validated at the room boundary, and treated as untrusted input. Room codes are identifiers, not authentication.
- Portrait hotlinking is not a reliable runtime dependency. Keep attribution/source metadata beside downloaded assets and retain procedural portraits if an asset is unavailable.

## Approaches considered

### 1. Host-authoritative browser simulation with Node/WebSocket relay (selected)

The host runs the existing `Game.update` and all random outcomes. The Node server creates/join rooms, assigns player IDs, relays actions to the host, and relays sanitized host snapshots to the other players. Remote clients submit intentions and render the latest snapshot.

**Trade-off:** the smallest change and best preservation of FERD behavior, but the host is trusted and a host disconnect ends the run.

### 2. Fully server-authoritative Node simulation

Move the simulation and RNG to Node and make browsers presentation/input clients.

**Trade-off:** stronger authority and easier migration, but requires porting combat, gacha, factions, recipes, effects, and timing; too much new system for this upgrade.

### 3. Deterministic lockstep

Every browser simulates the same actions and seed.

**Trade-off:** low bandwidth, but the current global mutable state, random calls, timers, and effect data make desynchronization likely; it is not a safe fit.

## Design

### Free placement

- Keep logical coordinates in the existing 960×640 coordinate system and convert to three.js with the existing `wx/wz` helpers.
- Replace fixed-slot position reads with `u.x/u.y` on deployed units. A deployed unit keeps its `uid`, `owner`, `id`, cooldown, and coordinates.
- `tryPlace(x,y,playerId)` checks bench ownership/availability, population, arena bounds, distance from the enemy road and gates, and minimum separation from other deployed units. Invalid clicks show a reason and do not consume the servant.
- The ground plane is the placement raycast target. Existing platforms become decorative landmarks or are removed from the pick path; they no longer determine combat positions.
- Selection and ascension effects use the unit coordinates. Range preview follows the hovered ground point while a bench unit is selected and the deployed unit otherwise.
- A field unit remains selectable by its stable `uid`; removal/ascension must not accidentally select another unit after array compaction.

### Start-locked factions

- Add a five-faction selector to the start screen and room lobby. The selected faction is sent when creating/joining a room.
- On solo start, copy the selection into the run. On co-op start, the host freezes every lobby player's faction in the run snapshot.
- `setFaction` is a menu/lobby operation only. In-game faction chips are read-only and display the local player's locked faction.
- Faction XP remains persistent locally. In co-op, each client applies its own earned XP from authoritative events/snapshot totals; the host does not write another browser's localStorage.

### Roster and skills

- Add a separate anime expansion overlay to the existing data, with stable IDs and no changes to existing recipe indices.
- Each added unit has a name, source-page reference, portrait key, class/grade/population/combat stats, `skillName`, and `skillDesc`.
- Map signature behavior to existing kinds first: multi-target, chain, beam, pierce, burn/poison, slow, stun, crit, and area attacks. Add a new combat kind only when an existing kind cannot express the intended behavior.
- Include the expansion units in the appropriate gacha pool and codex; add only explicit, data-driven ascension links where needed.
- `portraitSVG` first resolves a verified local portrait, then falls back to the existing procedural portrait. Source pages and attribution are available in the codex/asset metadata.

### Online room lifecycle

- `server.js` serves the game and WebSocket endpoint using Node and `ws`; `package.json` contains the minimal start script and dependency.
- Create-room returns a short uppercase code and player ID. Join-room validates code, name, faction, capacity (four), and lobby state.
- Lobby players can ready up; the host selects difficulty and starts only when all connected players are ready. Joining after the simulation starts is rejected.
- The host sends a snapshot at approximately 10–15 Hz and immediately after important actions. Snapshots contain authoritative game state and bounded transient render data, not DOM state or local selection.
- Remote clients do not call `Game.update` for gameplay. They render snapshots and send actions such as summon, place, sell, ascend, wave, faction active, wisp conversion, and gambling.
- The host validates the player ID, current mode, resources, ownership, bench capacity, population, placement, and action-specific cooldowns before mutating state. Invalid actions return a small error message.
- Shared Gold, Spirit, Wisps, Bench, lives, waves, and gacha level are authoritative host state. Every deployed unit records its owner.
- Faction passives use the acting/owning player: Aurel tribute and Steppe plunder use the killer's owner; Echo duplication uses the ascending player; Kitsune wave spirit is calculated from the locked player factions; Mooncell XP goes to the owning player. Active cooldowns and Fix Target state are per player.
- Solo uses the same action/context path with one local player so behavior does not diverge between modes.
- Speed, pause, auto-wave, and difficulty are host-controlled. Remote controls show their authoritative state.
- A disconnect removes the player from the lobby. During a run, a non-host disconnect leaves their deployed units inert/ownerless but does not pause the host; a host disconnect closes the room and informs remaining clients.

### Player-count scaling

Calculate once when the host starts the run and store the values in the snapshot:

- `hpMultiplier = 1 + 0.65 * (playerCount - 1)`
- `spawnMultiplier = 1 + 0.25 * (playerCount - 1)`, rounding the additional ordinary enemies while retaining boss cadence
- `popCap = 18 + 6 * (playerCount - 1)`
- `benchSize = 10 + 2 * (playerCount - 1)`
- Keep the selected difficulty's HP, speed, gold, lives, wave count, and boss rules as the base. Do not scale a second time on snapshots or rejoin attempts.

### Verification

- Run JavaScript syntax checks and server startup checks.
- Test solo placement at valid ground, road/gate rejection, overlap rejection, range/combat, ascension at a free coordinate, and faction immutability after start.
- Test every existing faction and gambling control for regressions.
- Start the Node server and use four browser contexts to verify create/join, ready/start, shared resources, independent factions/cooldowns, action validation, snapshots, scaling, and disconnect behavior.
- Check desktop and mobile layout, portrait fallback, Codex source links, and console/network errors.
