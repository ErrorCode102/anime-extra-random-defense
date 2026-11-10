#!/usr/bin/env python
"""
FERD 3.81 (Fate/Extra Random Defence) data extraction.

Reads ONLY the already-extracted files under ./out and writes three new JSON
outputs: skills.json, penalties.json, factions.json. No game file is modified.

Run:  py extract_skills.py
"""
import json
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"

# --------------------------------------------------------------------------- #
# TRIGSTR resolver
# --------------------------------------------------------------------------- #
# In this map the object-editor JSONs contain inline (already localised) strings
# and war3map.wts is 0 bytes, so the resolver below is a complete, general
# implementation that simply finds nothing to substitute. It parses:
#   * war3map.wts          (STRING #### { ... } blocks)
#   * war3mapSkin.txt      (INI sections; some maps store TRIGSTR keys here)
#   * war3map.wct          (binary custom-text triggers; scanned for definitions)
TRIGSTR_RE = re.compile(r"TRIGSTR_(\d+)")


def parse_wct(blob: bytes):
    """Parse the WCT custom-text file.

    Empirical layout of this map's WCT (written by W3x2lni):
      int32 version (=1), one 0x00 byte, int32 len + global custom script,
      int32 trigger count, then per trigger an int32 byte-length + text.
      Empty triggers are stored as a bare int32 0 (zero padding), so we skip
      zero dwords between entries. Consumes the file exactly to EOF.
    """
    if len(blob) < 9:
        return "", []
    ver = struct.unpack_from("<i", blob, 0)[0]
    o = 4
    if ver == 1 and blob[o] == 0:
        o += 1  # extra flag byte present in this file
    n = struct.unpack_from("<i", blob, o)[0]
    o += 4
    if n < 0 or n > len(blob) - o:
        return "", []
    global_script = blob[o:o + n].rstrip(b"\x00").decode("utf-8", "replace")
    o += n
    count = struct.unpack_from("<i", blob, o)[0]
    o += 4
    entries = []
    if not (0 <= count <= 100000):
        return global_script, []
    while o + 4 <= len(blob) and len(entries) < count:
        ln = struct.unpack_from("<i", blob, o)[0]
        o += 4
        if ln == 0:
            entries.append("")  # empty trigger slot
            continue
        if ln < 0 or ln > len(blob) - o:
            break
        entries.append(blob[o:o + ln].rstrip(b"\x00").decode("utf-8", "replace"))
        o += ln
    return global_script, entries


class TrigStrResolver:
    def __init__(self):
        self.table = {}          # "TRIGSTR_123" -> text
        self.source_count = {}   # source name -> number of definitions
        self.unresolved = set()
        self._load_wts()
        self._load_skin()
        self._load_wct()

    def _add(self, key, text, source):
        self.table[key] = text
        self.source_count[source] = self.source_count.get(source, 0) + 1

    def _load_wts(self):
        p = OUT / "war3map.wts"
        if not p.exists():
            return
        txt = p.read_bytes().decode("utf-8", "replace")
        for m in re.finditer(r"STRING\s+(\d+)\s*\{(.*?)\}", txt, re.S):
            self._add("TRIGSTR_" + m.group(1), m.group(2).strip(), "war3map.wts")

    def _load_skin(self):
        p = OUT / "war3mapSkin.txt"
        if not p.exists():
            return
        txt = p.read_bytes().decode("utf-8", "replace")
        for m in re.finditer(r"^(TRIGSTR_\d+)\s*=\s*(.*)$", txt, re.M):
            self._add(m.group(1), m.group(2).strip(), "war3mapSkin.txt")

    def _load_wct(self):
        p = OUT / "war3map.wct"
        if not p.exists():
            return
        self.global_script, self.wct_entries = parse_wct(p.read_bytes())
        # Scan every text block for explicit TRIGSTR definitions (WTS-style).
        for block in [self.global_script] + self.wct_entries:
            for m in re.finditer(r"STRING\s+(\d+)\s*\{(.*?)\}", block, re.S):
                self._add("TRIGSTR_" + m.group(1), m.group(2).strip(), "war3map.wct")

    def resolve(self, s):
        if not isinstance(s, str):
            return s

        def sub(m):
            key = m.group(0)
            if key in self.table:
                return self.table[key]
            self.unresolved.add(key)
            return key

        return TRIGSTR_RE.sub(sub, s)


# --------------------------------------------------------------------------- #
# Warcraft-3 text helpers
# --------------------------------------------------------------------------- #
COLOR_RE = re.compile(r"\|c[0-9a-fA-F]{8}")
HOTKEY_RE = re.compile(r"\s*\([A-Za-z0-9]{1,2}\)\s*$")
PLACEHOLDER_NAMES = {"", "#", "[skill]", "[merge]", "[system]", "[teleport]",
                     "[wisp skin]", "[ex]", "_"}


def clean(s):
    """Resolve TRIGSTR, strip WC3 colour codes, normalise newlines."""
    if not isinstance(s, str):
        return ""
    # resolve before stripping so tokens inside colour markup still match
    s = RESOLVER.resolve(s)
    s = COLOR_RE.sub("", s)
    s = s.replace("|r", "").replace("|n", "\n")
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def name_from_tooltip(tooltip):
    t = clean(tooltip)
    t = HOTKEY_RE.sub("", t)
    return t.strip()


def load_json(name):
    with open(OUT / name, encoding="utf-8") as f:
        return json.load(f)


def write_json(name, data):
    path = OUT / name
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    return path


RESOLVER = TrigStrResolver()

# --------------------------------------------------------------------------- #
# 1. skills.json
# --------------------------------------------------------------------------- #

def pick_mod(mods, mid):
    """Pick the representative mod entry: prefer level 1, then level 0,
    then lowest level; prefer data column 0, then lowest column."""
    cand = [m for m in mods if m["id"] == mid]
    if not cand:
        return None
    cand.sort(key=lambda m: (0 if m["level"] == 1 else 1 if m["level"] == 0 else 2,
                             m["level"], m["col"]))
    return cand[0]


def string_mod(mods, mid):
    m = pick_mod(mods, mid)
    return m["val"] if m and isinstance(m["val"], str) else ""


def build_ability(obj):
    mods = obj["mods"]
    code = obj["new"]
    anam = clean(string_mod(mods, "anam"))
    atp1 = string_mod(mods, "atp1")
    aub1 = string_mod(mods, "aub1")
    aret = string_mod(mods, "aret")
    arut = string_mod(mods, "arut")
    ansf = clean(string_mod(mods, "ansf"))

    tooltip = clean(atp1)
    desc = clean(aub1) or clean(aret) or clean(arut)

    if anam.lower() in PLACEHOLDER_NAMES:
        name = name_from_tooltip(atp1) or ansf or code
    else:
        name = anam

    effects = {}
    for mid in dict.fromkeys(m["id"] for m in mods):
        m = pick_mod(mods, mid)
        if m and m["type"] in (0, 1, 2) and isinstance(m["val"], (int, float)):
            effects[mid] = m["val"]

    entry = {
        "name": name,
        "desc": desc,
        "tooltip": tooltip,
        "effects": effects,
        "old": obj["old"],          # base Warcraft-3 ability code
        "ansf": ansf,                # editor suffix (often Korean dev label)
    }
    if not desc and not tooltip:
        entry["note"] = ("internal/hidden ability: no user-facing tooltip or "
                         "description text exists in war3map.w3a; name is the "
                         "raw in-map editor label")
    return entry


def build_skills():
    w3a = load_json("war3map.w3a.json")
    w3u = load_json("war3map.w3u.json")
    gamedata = load_json("gamedata.json")

    abilities = {}
    for obj in w3a:
        abilities[obj["new"]] = build_ability(obj)

    units_by_code = {o["new"]: o for o in w3u}

    # Standard/base-game abilities referenced by units but absent from w3a.
    standard_names = {"Avul": "Invulnerable"}

    by_unit = {}
    by_base = {}
    referenced = set()
    for u in gamedata["units"]:
        uid = u["id"]
        ferd = "-" + uid
        obj = units_by_code.get(ferd)
        if obj is None:
            by_unit[uid] = {"ferdCode": ferd, "ferdName": "", "abilities": [],
                            "note": "unit code not found in war3map.w3u"}
            continue
        ferd_name = clean(string_mod(obj["mods"], "unam"))
        uabi = string_mod(obj["mods"], "uabi")
        codes = []
        for c in uabi.split(","):
            c = c.strip()
            if c and c != "_" and c not in codes:
                codes.append(c)
        referenced.update(codes)
        by_unit[uid] = {"ferdCode": ferd, "ferdName": ferd_name, "abilities": codes}
        base = u["base"]
        bucket = by_base.setdefault(base, [])
        for c in codes:
            if c not in bucket:
                bucket.append(c)

    # Guarantee every referenced code has an entry.
    for c in sorted(referenced - set(abilities)):
        abilities[c] = {
            "name": standard_names.get(c, c),
            "desc": "",
            "tooltip": "",
            "effects": {},
            "old": c,
            "ansf": "",
            "note": "standard/base-game ability; not present in war3map.w3a",
        }

    return {"abilities": abilities, "byUnit": by_unit, "byBase": by_base}


# --------------------------------------------------------------------------- #
# 2. penalties.json
# --------------------------------------------------------------------------- #
# Effect facts below were read out of war3map.j / war3map.w3a / war3map.w3u;
# each carries its source location. The icon-unit order and the XP reward rule
# are re-parsed live from war3map.j so the output stays tied to the map data.

PENALTY_EFFECTS = {
    "PANALTY_ENEMY_BOOST":
        "Every spawned enemy gains ability A03W (slow aura, Slo1=0.5) => +50% movement speed. "
        "[war3map.j:19672-19674; war3map.w3a A03W]",
    "PANALTY_SERVANT_CORRUPT":
        "Every added Servant gains ability A08V (Slo1=-0.5) => 50% slow; tagged "
        "'『Servant Contaminated』'. [war3map.j:1292-1294, 24738-24748; war3map.w3a A08V]",
    "PANALTY_GACHA_ONLY_E":
        "Wisp draws force rank=1: only E-grade Servants appear; draw building tooltip becomes "
        "'Random [E] Servant Draw / Penalty: E-grade Only'. [war3map.j:40050-40052, 19921-19935]",
    "PANALTY_POWERFUL_LEADER":
        "First enemy of every wave gains marker A0EW, HP x20 (2000%), MP x20, bounty x10. "
        "[war3map.j:20548-20553]",
    "PANALTY_NURF_GACHA":
        "Gambling buildings are downgraded: Nero H00F->H002 (loses high-rate servant gambling and "
        "Emperor's Privilege); other factions H002->H00E 'Corrupted Building' (only E/D/C servant "
        "gambling + 10G/100G gold gambling remain); BB H00Y->H00Z. "
        "[war3map.j:34875,35076,35374,35556,35678; war3map.w3u useu of H00F/H002/H00E/H00Y/H00Z]",
    "PANALTY_JOHAB_BECOME_RANDOM":
        "30% chance (GetRandomReal(0,100) <= 30) to abort a merge and replace its result with a "
        "random Servant of the same grade; tagged '『RNG Interference』'. [war3map.j:24619-24652]",
    "PANALTY_SERVANT_SELL_DISABLED":
        "Selling Servants is blocked: error sound + 'Penalty - Servants cannot be sold!'. "
        "[war3map.j:41276-41281]",
    "PANALTY_ENEMY_HEAL":
        "All enemies gain A04J and regenerate 0.5% max HP and 1% max MP per second. "
        "[war3map.j:20567-20569; war3map.w3a A04J]",
    "PANALTY_ENEMY_BONUS":
        "Enemies spawn 2x (80 per wave instead of 40); each enemy has HP/MP halved and bounty halved; "
        "life-danger warning threshold doubled. [war3map.j:20471-20477, 20555-20560, 19807-19808]",
    "PANALTY_SERVANT_STUN":
        "A Servant that kills an enemy is stunned for 1.0 s (Storm Bolt missile FX). "
        "[war3map.j:24708-24719]",
    "PANALTY_LESS_WISP":
        "Round wisp bounty reduced from 3 to 2 ('We're one short' activated!). [war3map.j:20267-20278]",
    "PANALTY_SUMMON_STASIS":
        "Every 20 s (first after 10 s) summons 2 stasis traps per player at random positions "
        "(+/-960 around start location), FXRD_FXStasisField(x,y,3,10), stopping player units. "
        "[war3map.j:24762-24795]",
    "PANALTY_SUMMON_STORM":
        "Summons 2 cyber typhoons (size 192) per player field that bounce/knock back player units; "
        "created 3 s after game init. [war3map.j:24817-24856]",
    "PANALTY_AFTER_IMPACT":
        "When a giant (boss) enemy dies it explodes: all player Servants stunned 10 s and knocked "
        "back (1000 range, 250 distance, 0.625 speed). [war3map.j:24663-24690]",
    "PANALTY_LIFE_HALF":
        "Starting lives are halved (myLife = LEVEL_LIFE / 2). [war3map.j:39757-39760]",
}


def build_penalties():
    j = (OUT / "war3map.j").read_bytes().decode("utf-8", "replace")
    w3u = load_json("war3map.w3u.json")
    units_by_code = {o["new"]: o for o in w3u}

    # constants: index -> PANALTY_* name
    constants = {}
    for m in re.finditer(r"constant integer (PANALTY_[A-Z_0-9]+)=\s*(\d+)", j):
        name, idx = m.group(1), int(m.group(2))
        if name in ("PANALTY_MAX", "PANALTY_UNKNOWN", "PANALTY_COUNT"):
            continue
        constants[idx] = name
    max_penalty = 15
    mm = re.search(r"constant integer PANALTY_MAX=\s*(\d+)", j)
    if mm:
        max_penalty = int(mm.group(1))

    # icon units in grid order, parsed from the result-panel construction
    icon_units = {}
    for m in re.finditer(
            r"ICONBOUND\[ui \* PANALTY_MAX \+ (\d+)\]=CreateUnit\(Player\(PLAYER_NEUTRAL_PASSIVE\),\s*'(n0[0-9A-Za-z]{2})'",
            j):
        icon_units[int(m.group(1))] = m.group(2)
    if not icon_units:
        # fallback: settings-panel order n00Q..n014
        order = ["n00Q", "n00R", "n00S", "n00T", "n00U", "n00V", "n00W", "n00X",
                 "n00Y", "n00Z", "n010", "n011", "n012", "n013", "n014"]
        icon_units = {i + 1: c for i, c in enumerate(order)}

    # reward rule: 5+ penalties => XP +100%
    reward = {"minPenalties": 5, "xpBonusPercent": 100,
              "source": "FXTrig0SGameSetting___diagnoseChallenge (war3map.j:39637-39643)"}
    rm = re.search(r"if PANALTY_COUNT > (\d+) then\s*\n\s*set USER_XP_BONUS\[0\]=USER_XP_BONUS\[0\] \+ (\d+)", j)
    if rm:
        reward["minPenalties"] = int(rm.group(1)) + 1
        reward["xpBonusPercent"] = int(rm.group(2))

    penalties = []
    for idx in range(1, max_penalty + 1):
        const = constants.get(idx, "PANALTY_%d" % idx)
        ucode = icon_units.get(idx, "")
        uobj = units_by_code.get(ucode)
        raw = clean(string_mod(uobj["mods"], "unam")) if uobj else ""
        parts = raw.split("\n", 1)
        name = parts[0].strip() if parts else ""
        desc = parts[1].strip() if len(parts) > 1 else ""
        penalties.append({
            "index": idx,
            "constant": const,
            "name": name,
            "desc": desc,
            "effect": PENALTY_EFFECTS.get(const, ""),
            "iconUnit": ucode,
            "reward": reward,
        })
    return penalties


# --------------------------------------------------------------------------- #
# 3. factions.json
# --------------------------------------------------------------------------- #
# The five factions are NERO(1)/TAMAMO(2)/ALTERA(3)/ANOTHER(4)/BB(5), matching the
# reference tags A..E. The reference UI's exact English description sentences are
# NOT stored verbatim anywhere in the map (checked war3map.j, war3map.wct,
# war3mapSkin.txt, w3u/w3a); what the map does contain is the English ability
# tooltips and the trigger code implementing every described benefit. `lines`
# below captures that in-map text/numbers faithfully; `notes` records the
# mapping to the reference description and the sources.

def faction_declarations():
    """Extract NAME/ICON/index from the FACTION_DECLARATION textmacro sources."""
    decls = {}
    blocks = [RESOLVER.global_script] + RESOLVER.wct_entries
    for block in blocks:
        m = re.search(r'FACTION_DECLARATION_START\("(\w+)",\s*"(\d+)"\)', block)
        if not m:
            continue
        key, idx = m.group(1), int(m.group(2))
        if key in decls:
            continue
        def const(cname):
            cm = re.search(r'private constant string %s = "([^"]*)"' % cname, block)
            return cm.group(1) if cm else ""
        decls[key] = {
            "index": idx,
            "name": clean(const("NAME")),
            "icon": const("ICON").replace("\\\\", "\\"),
            "masterName": clean(const("MASTER_NAME")),
            "masterIcon": const("MASTER_ICON").replace("\\\\", "\\"),
        }
    return decls


def ability_text(abilities, code, field="desc"):
    a = abilities.get(code, {})
    return a.get(field, "")


def build_factions(skills):
    ab = skills["abilities"]
    decls = faction_declarations()
    j = (OUT / "war3map.j").read_bytes().decode("utf-8", "replace")

    # unlock facts, re-parsed from the map
    max_level = 15
    lm = re.search(r"constant integer FX_FACTION_MAX_LEVEL=\s*(\d+)", j)
    if lm:
        max_level = int(lm.group(1))
    basic_unlock = "Basic faction - always selectable (non-Master random pool is factions 1-3)."
    master_unlock = ("Locked until Master status (FXIsPlayerMaster: master level > 0). Master is "
                     "promoted when any faction reaches level %d (FX_FACTION_MAX_LEVEL). UI gates "
                     "factions >= FX_FACTION_ANOTHER behind FXIsPlayerMaster. "
                     "[war3map.j:21882-21887, 21914-21917; war3map.wct FXRDPlayerFaction]" % max_level)

    def tp(code):
        return ability_text(ab, code, "tooltip")

    def ds(code):
        return ability_text(ab, code, "desc")

    factions = []

    # ---------------- A / NERO ---------------- #
    nero_lines = [
        "Faction Talent - Movement Speed Increase: every added Servant gains A02V "
        "(aura Slo1=0.25) => +25% movement speed. Tag: '『Faction Talent - Movement Speed Increase』'. "
        "[war3map.j:1451-1457; war3map.w3a A02V]",
        "Kill bonus: 50% chance (GetRandomInt(0,1)==0) on each kill to gain 1-15 gold. "
        "[war3map.wct TrigFactionNeroKillBonus / war3map.j:34939+]",
        "Servant gambling success rate very high: Nero's gambling building H00F sells n009-n00D with "
        "success rates E/D=71%, C=66%, B=61%, A=56%, S=51% (normal building H002 sells g00E-g00S at "
        "51%/46%/41%/36%/31%). [war3map.j:41141-41242; war3map.w3u H00F/H002 useu]",
        "Emperor's Privilege (n01C, sold only by H00F): gamble yields GetRandomInt(0,25000) gold. "
        "[war3map.wct TrigFactionNeroSuperGamble]",
        "Start gold: +1000 gold trickled as +10 every 0.03125 s when the convenience building is placed. "
        "[war3map.wct TrigFactionNeroStartGold]",
        "Skill building H004 spells: " + tp("A02B") + " | " + tp("A02C") + " | " + tp("A02D") + " | " + tp("A05Q"),
    ]
    factions.append({
        "tag": "A", "faction": "NERO", "index": 1,
        "name": "Nero Claudius",
        "ferdName": decls.get("NERO", {}).get("name", ""),
        "icon": decls.get("NERO", {}).get("icon", ""),
        "lines": nero_lines,
        "unlock": basic_unlock,
        "notes": ("Reference A: 'Servant gambling success rate very high; all servants movement speed "
                  "increased; kill enemies for additional resources' - all three confirmed in code "
                  "(71-51% gamble rates, +25% move speed aura, 1-15 gold kill bonus). In-map faction "
                  "label is Korean '네로'; English name 'Nero Claudius' appears in the save-code preload "
                  "(war3map.j:18924). The reference UI description sentence itself is not stored verbatim "
                  "in the map; lines above are the in-map tooltips/constants implementing it."),
    })

    # ---------------- B / TAMAMO ---------------- #
    tamamo_lines = [
        "Enhanced MP skills (instant cast, hit Player Zone & Boss Zone): " + tp("A01E") + " - " + ds("A01E"),
        tp("A01G") + " - " + ds("A01G"),
        tp("A049") + " - " + ds("A049"),
        "MP regeneration: +100 MP to the player every game round. [war3map.wct TrigFactionTamamoMPRegen]",
        "Summon a servant of your choice: " + tp("A09D") + " - " + ds("A09D") + " (cooldown 40 s)",
        "Reduced teleport time: Tamamo servants get A0BQ '『Beam Transition』' with cast time acas=0.04 s "
        "instead of A0BP '『Teleport』' acas=3.0 s. [war3map.j:36860-36866; war3map.w3a A0BQ/A0BP]",
    ]
    factions.append({
        "tag": "B", "faction": "TAMAMO", "index": 2,
        "name": "Tamamo-no-Mae",
        "ferdName": decls.get("TAMAMO", {}).get("name", ""),
        "icon": decls.get("TAMAMO", {}).get("icon", ""),
        "lines": tamamo_lines,
        "unlock": basic_unlock,
        "notes": ("Reference B: 'enhanced MP skills; summon a servant of your choice; reduced teleport "
                  "time' - confirmed: instant-cast upgraded faction spells A01E/A01G/A049 on building H00J, "
                  "Summon Selected (A09D, Saint Quartz prices E=1/D=2/C=5/B=10), teleport cast 3.0 s -> "
                  "0.04 s. In-map faction label '타마모'; English name from save-code preload "
                  "(war3map.j:18927). Reference description sentence not stored verbatim in-map."),
    })

    # ---------------- C / ALTERA ---------------- #
    altera_lines = [
        "Kill enemies for additional draw opportunities: 1% chance (GetRandomInt(1,100)==1) per kill to "
        "gain +1 wisp (Saint Quartz); tag '영령 획득!' (Heroic Spirit acquired). "
        "[war3map.wct TrigFactionAlteraKillBonus / war3map.j:35413+]",
        "All damage upgrades start advanced: on game init every upgrade R00E/R00D/R00C/R00B/R00A/R00S/"
        "R0EX/R0XS is set to researched level 15 (of 60). Upgrades are '<Grade>-grade Upgrade' - "
        "'Increases damage and attack speed of <grade> Servants.' Debug text: '알테라 보너스 : 각 업그레이드 "
        "15회 완료' (Altera bonus: each upgrade completed 15 times). The reference's 'Lvl 1.5' corresponds "
        "to this level 15/60 head start. [war3map.wct FXTrig0SGameSetting.diagnosePlayer; war3map.w3q]",
        "Blessing increases servant power: " + tp("A069") + " - " + ds("A069") +
        " Implemented as +50 damage bonus & A07H aura (Slo1=0.5); on Attila servants (-ALA/-ALB/-ALS/-ALX) "
        "the effect doubles: +100 damage & A0EV (Slo1=1.0). [war3map.wct TrigFactionAlteraSeal; war3map.w3a A07H/A0EV]",
    ]
    factions.append({
        "tag": "C", "faction": "ALTERA", "index": 3,
        "name": "Attila",
        "ferdName": decls.get("ALTERA", {}).get("name", ""),
        "icon": decls.get("ALTERA", {}).get("icon", ""),
        "lines": altera_lines,
        "unlock": basic_unlock,
        "notes": ("Reference C: 'kill enemies for additional draw opportunities; all damage upgrades start "
                  "at Lvl 1.5; blessing increases servant power' - confirmed: 1% wisp-on-kill, all 8 grade "
                  "upgrades pre-researched to level 15/60, Crest of the Wandering Star (+50% speed/damage, "
                  "doubled on Attila). In-map faction label '알테라'; English name 'Attila' from save-code "
                  "preload (war3map.j:18930). Reference description sentence not stored verbatim in-map."),
    })

    # ---------------- D / ANOTHER ---------------- #
    another_lines = [
        "Start with increased spirits: 15 wisps (Saint Quartz) at game start instead of the normal 4. "
        "[war3map.j:39900-39908]",
        "Upgradeable Condensing Ray: special tower n008 'Condensing Ray' is created at the start location; " +
        tp("A06F") + " - " + ds("A06F") +
        " Upgrade building is H00D (unique to Another). [war3map.wct TrigFactionAnotherBatchBuilding/FixTarget]",
        "Very low chance to double merging output: 5% (GetRandomReal(0,100) <= 5) on each merge to create a "
        "second copy of the result; message '세력 특성 『어나더 - 조합 결과 두 배』 발동' / in-map English tag "
        "'Faction Talent 『Another - Combination results are doubled』 activated'. [war3map.j:35611-35620; "
        "war3map.wct TrigFactionAnotherDoubleServant]",
    ]
    factions.append({
        "tag": "D", "faction": "ANOTHER", "index": 4,
        "name": "Another",
        "ferdName": decls.get("ANOTHER", {}).get("name", ""),
        "icon": decls.get("ANOTHER", {}).get("icon", ""),
        "lines": another_lines,
        "unlock": master_unlock,
        "notes": ("Reference D (unlock: master one basic faction A/B/C): 'start with increased spirits; "
                  "upgradeable Condensing Ray; very low chance to double merging output' - confirmed: "
                  "15 starting wisps vs 4, Condensing Ray tower (3 s retarget charge, damage ramps to 400% "
                  "on a sustained target), 5% double-merge. Code gate is Master status, earned by mastering "
                  "any one faction (level 15). In-map label '어나더'; English 'Another' from save-code "
                  "preload (war3map.j:18933). Reference description sentence not stored verbatim in-map."),
    })

    # ---------------- E / BB ---------------- #
    bb_lines = [
        "Gain growth-type Servant BB: hero unit H014 '[★] MoonCancer' (MoonCancer) is granted when the "
        "convenience building is placed; it gains +1 BBxp per line enemy kill, and the BB gacha (n01E) "
        "randomly raises one of STR/AGI/INT by +10. [war3map.wct TrigFactionBBServant; war3map.w3u H014]",
        "Upgrade by combining 3 same-grade units: " + tp("A0GL") + " - " + ds("A0GL") +
        " Code: FUSION_COUNT=3, result grade = material grade + 1, result gains +50 damage bonus and "
        "abilities A0GM/A0GN; fusion zone building n015 'Fusion Zone'. [war3map.wct TrigFactionBBHoradricCube]",
        "Collect 5 specified units to unlock ultimate unit: " + tp("A0GX") + " - " + ds("A0GX") +
        " Code: MAX_REQUIRED=5 random A-class Servants are displayed; owning all five unlocks a random "
        "EX-grade (rank 7) Servant. [war3map.wct TrigFactionBBUnlock]",
    ]
    factions.append({
        "tag": "E", "faction": "BB", "index": 5,
        "name": "BB",
        "ferdName": decls.get("BB", {}).get("name", ""),
        "icon": decls.get("BB", {}).get("icon", ""),
        "lines": bb_lines,
        "unlock": master_unlock,
        "notes": ("Reference E (unlock: master one basic faction): 'gain growth-type Servant BB; upgrade by "
                  "combining 3 same-grade units; collect 5 specified units to unlock ultimate unit' - "
                  "confirmed: MoonCancer hero BB (XP/ stat growth), 3-unit same-grade fusion to next grade, "
                  "5 specified A-class collection unlocking an EX servant. Code gate is Master status "
                  "(any faction mastered to level 15). In-map label 'BB' (war3map.j:18936-18938). "
                  "Reference description sentence not stored verbatim in-map."),
    })

    return factions


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #

def main():
    skills = build_skills()
    penalties = build_penalties()
    factions = build_factions(skills)

    p1 = write_json("skills.json", skills)
    p2 = write_json("penalties.json", penalties)
    p3 = write_json("factions.json", factions)

    # ------------------------- verification report ------------------------- #
    gd = load_json("gamedata.json")
    roster = gd["units"]
    resolved_units = 0
    for u in roster:
        entry = skills["byUnit"].get(u["id"], {})
        codes = entry.get("abilities", [])
        if any(skills["abilities"].get(c, {}).get("name") and
               (skills["abilities"].get(c, {}).get("desc") or
                skills["abilities"].get(c, {}).get("tooltip"))
               for c in codes):
            resolved_units += 1

    total_ab = len(skills["abilities"])
    named = sum(1 for a in skills["abilities"].values()
                if a["name"] and a["name"] != "#")
    with_desc = sum(1 for a in skills["abilities"].values() if a["desc"])
    trigstr_left = sum(1 for a in skills["abilities"].values()
                       for v in (a["name"], a["desc"], a["tooltip"])
                       if "TRIGSTR_" in v)

    print("TRIGSTR resolver: %d definitions loaded from %s; unresolved tokens: %d"
          % (len(RESOLVER.table), RESOLVER.source_count or "{}", len(RESOLVER.unresolved)))
    print("wct parsed: global %d chars, %d trigger texts"
          % (len(RESOLVER.global_script), len(RESOLVER.wct_entries)))
    print("skills.json   : %d abilities (%d named, %d with desc, %d leftover TRIGSTR), "
          "%d/%d units with >=1 resolved ability, %d bases"
          % (total_ab, named, with_desc, trigstr_left, resolved_units, len(roster),
             len(skills["byBase"])))
    print("penalties.json: %d penalties (reward: %d+ -> XP +%d%%)"
          % (len(penalties), penalties[0]["reward"]["minPenalties"],
             penalties[0]["reward"]["xpBonusPercent"]))
    print("factions.json : %d factions [%s]"
          % (len(factions), ", ".join(f["tag"] + "=" + f["faction"] for f in factions)))

    print("\n--- 3 sample units ---")
    for uid in ("GAS", "BBT", "NCS"):
        e = skills["byUnit"].get(uid)
        if not e:
            continue
        print("%s (%s) %s" % (uid, e["ferdCode"], e["ferdName"].replace("\n", " / ")))
        shown = 0
        for c in e["abilities"]:
            a = skills["abilities"].get(c, {})
            if a.get("desc") or a.get("tooltip"):
                d = (a.get("desc") or a.get("tooltip")).replace("\n", " ")
                print("   %s %s: %s" % (c, a["name"], d[:140]))
                shown += 1
                if shown >= 2:
                    break

    print("\nWrote:")
    for p in (p1, p2, p3):
        print("  " + str(p))


if __name__ == "__main__":
    main()