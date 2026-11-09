# Anime Extra Random Defence

โปรเจกต์นี้เป็นเกม Tower Defense แนว Grail War ที่ดัดแปลงระบบ gacha/merge จากแมป Warcraft III ชื่อ **FERD** (Fate Extra Random Defence) มาทำเป็นเว็บเกม 2 รุ่น (2D Canvas และ 3D Three.js) พร้อมชุดเครื่องมือ Python สำหรับ reverse-engineer ข้อมูลจากแมปต้นฉบับ

## โครงสร้างโปรเจกต์

```
048e0eb0/
├── [A]_FERD_3.81_8275_Fix.w3x     แมป Warcraft III ต้นฉบับ (33.58 MB, MPQ archive)
├── _ferd/                          เครื่องมือ Python สำหรับสกัดและวิเคราะห์ข้อมูลแมป
│   ├── map.mpq                     สำเนาแมปไฟล์สำหรับใช้กับ Python scripts
│   ├── out/                        ไฟล์ที่สกัดได้และข้อมูลที่สร้างขึ้น
│   └── *.py                        สคริปต์ Python 21 ไฟล์
├── anime-extra-random-defense/     เกมเวอร์ชัน 2D (Canvas)
│   ├── index.html                  หน้าเว็บหลัก
│   ├── style.css                   สไตล์
│   ├── data.js                     ข้อมูลยูนิต, สูตร, ค่าความยาก
│   └── game.js                     เอนจินเกม (combat, wave, render, UI)
└── anime-extra-random-defense-3d/  เกมเวอร์ชัน 3D (Three.js) — FERD-aligned
    ├── index.html                  หน้าเว็บหลัก
    ├── style.css                   สไตล์
    ├── data.js                     ข้อมูล 177 สูตร, 8 เกรด, 12 ระดับความยาก
    ├── game.js                     เอนจินเกม + ระบบ faction/gambling/wisp
    └── scene3d.js                  3D render layer (Three.js r186)
```

## ไปป์ไลน์การทำงาน

ข้อมูลไหลจากแมป Warcraft III ไปสู่เกมเว็บในลักษณะนี้:

```
FERD map (.w3x)
   │
   ▼  extract.py — สกัดไฟล์จาก MPQ (มี decryption)
   │
   ▼  parse_obj.py — แปลง binary object files (w3u/w3a) เป็น JSON
   │
   ▼  merges.py — ดึงสูตร merge จาก abilities → merges.json (177 สูตร)
   │
   ▼  gen_data.py — แมปสูตร FERD ลงบนตัวละครอนิเมะต้นฉบับ → gamedata.json
   │
   ▼  emit_data.py — แปลง gamedata.json เป็น data.js ของเกม 3D
   │
   ▼  เกมเว็บ (anime-extra-random-defense-3d/)
```

---

## 1. `_ferd/` — เครื่องมือวิเคราะห์แมป FERD

ชุดสคริปต์ Python สำหรับสกัดข้อมูลจากแมป Warcraft III ที่เข้ารหัส (MPQ archive) และแปลงเป็นข้อมูลเกมที่ใช้ได้

### สคริปต์หลัก (ตามลำดับไปป์ไลน์)

| ไฟล์ | หน้าที่ |
|------|---------|
| `extract.py` | สกัดไฟล์จาก MPQ archive ที่เข้ารหัส — เพิ่ม decryption support ที่ห้อง `mpyq` ไม่มี (PKWARE implode, sector-based encryption, FIX_KEY) และ dump ไฟล์สำคัญ เช่น `war3map.j`, `war3map.w3u`, `war3map.w3a` |
| `parse_obj.py` | แปลง binary object files (`w3u` = ยูนิต, `w3a` = อาบิลิตี) เป็น JSON — อ่าน mod list ที่มี type detection (int/float/string) และรองรับโครงสร้างของ w3a ที่มี level+column |
| `dumpobj.py` | hex dump โครงสร้าง object file เพื่อ debug |
| `analyze.py` | วิเคราะห์ servant units (ID แบบ `-XY#` = base + เกรด) และ ability string fields |
| `recipes.py` | ค้นหา abilities ที่อ้างถึง servant unit IDs (ค้นหาสูตร) |
| `recipes2.py` | จัดกลุ่ม abilities ตามชื่อเพื่อหาหมวดหมู่ |
| `merges.py` | ดึงสูตร `[Merge]` จาก abilities (`acat` = วัตถุดิบ, `atat` = ผลลัพธ์) → `out/merges.json` (177 สูตร) |
| `roster.py` | จัดกลุ่ม servants ตาม base code และเกรด แสดง roster ทั้งหมด |
| `johab.py` | ตรวจสอ abilities ชื่อ `#` (สูตรพิเศษ) |
| `gen_data.py` | แมปสูตร FERD ลงบนตัวละครอนิเมะต้นฉบับ ~45 ตัว — กำหนด class, สีผม/ตา, ประเภทโจมตี, ค่า stat ฐาน และคูณตามเกรด (E→STAR) → `out/gamedata.json` |
| `emit_data.py` | แปลง `gamedata.json` เป็น `data.js` ของเกม 3D — เพิ่มคำอธิบาย, flavor text, ระดับความยาก, faction, gambling config, path/slots, และ portrait functions |
| `probe.py` | สำรวจไฟล์ WC3 ที่รู้จัก (SLK, txt) ใน archive |

### สคริปต์ crack/debug

| ไฟล์ | หน้าที่ |
|------|---------|
| `recover.py` | กู้ MPQ encryption key จาก known plaintext (offset table ที่ทราบค่า) |
| `brute.py` | brute-force key candidates สำหรับ offset table |
| `brute_sector.py` | brute-force sector decryption key และทดสอบ decompress |
| `dbg.py` | debug การ decrypt sector แรกของ listfile |
| `dbg2.py` | debug key adjustment สำหรับ `war3map.w3u` |

### ไฟล์ใน `out/`

| ไฟล์ | คำอธิบาย |
|------|---------|
| `war3map.j` | JASS script ของแมป |
| `war3map.w3u` / `.json` | ข้อมูล custom units (binary + JSON) |
| `war3map.w3a` / `.json` | ข้อมูล custom abilities (binary + JSON) |
| `war3map.w3i` | ข้อมูลแมป (ชื่อ, ผู้สร้าง, ขนาด) |
| `war3map.w3b/w3d/w3h/w3q` | buffs, destructables, doodads, upgrades |
| `war3map.wts` | string table |
| `war3map.wtg/wct` | trigger data |
| `war3mapMisc/Skin/Extra.txt` | gameplay constants |
| `merges.json` | 177 สูตร merge (req → result) |
| `gamedata.json` | ข้อมูลเกมที่สร้างขึ้น (units, recipes, gacha pool) |

### วิธีรัน

```bash
cd _ferd
pip install mpyq
py extract.py          # สกัดไฟล์จาก map.mpq → out/
py parse_obj.py war3map.w3u   # แปลง units → JSON
py parse_obj.py war3map.w3a   # แปลง abilities → JSON
py merges.py           # ดึงสูตร merge → out/merges.json
py gen_data.py         # สร้าง gamedata.json
py emit_data.py        # สร้าง data.js สำหรับเกม 3D
```

> บน Windows ถ้า `python` ไม่ได้ (เด้ง Microsoft Store) ให้ใช้ `py` แทน

---

## 2. `anime-extra-random-defense/` — เกมเวอร์ชัน 2D

เกม Tower Defense บน Canvas 2D แนว Grail War ที่ผสมระบบ gacha

### คุณสมบัติ

- **Canvas 2D rendering** — วาดด้วย `requestAnimationFrame` loop พร้อม DPR scaling
- **4 เกรด + EX** — C / B / A / S (gacha) และ EX (ascend เท่านั้น)
- **21 ยูนิต** — 4 C, 4 B, 5 A, 4 S, 8 EX พร้อม portrait SVG ที่สร้างแบบ procedural
- **9 สูตร ascension** — รวม base + materials → EX servant
- **3 ระดับความยาก** — Normal / Hard / Hell
- **25 waves** — boss ทุก 5 waves, pop cap 10
- **Gacha summoning** — 50 gold/ครั้ง, pity 12 ครั้งการันตี S
- **ประเภทโจมตี 11 แบบ** — single, aoe, chain, slow, crit, burn, poison, stun, beam, pierce, multi
- **Web Audio API** — เอฟเฟกต์เสียง procedural (summon, ascend, shoot, hit, ฯลฯ)
- **Codex** — ดูสูตร ascension ทั้งหมดและ unit archive (สไตล์ Discord embed)

### วิธีเล่น

1. **Summon** — สุ่ม servants ด้วย gold (C/B/A/S ตามน้ำหนัก 44/30/18/8%)
2. **Deploy** — เลือก servant บน bench → คลิก platform เพื่อวาง (pop cap จำกัด)
3. **Ascend** — รวม base + materials → EX servant (ดูสูตรใน Codex)
4. **Wave** — เริ่ม wave ศัตรูเดินวงแหวน 1½ รอบ อยู่ให้รอดครบ 25 waves

### คีย์ลัด

- `Space` = เริ่ม wave
- `G` = summon
- `P` = pause
- `Esc` = deselect

### วิธีรัน

เปิด `index.html` ในเบราว์เซอร์โดยตรง (ไม่ต้อง server เพราะใช้ plain `<script>` ไม่มี module) หรือใช้ local server:

```bash
cd anime-extra-random-defense
py -m http.server 8000
# เปิด http://localhost:8000
```

> บน Windows ถ้า `python` ไม่ได้ (เด้ง Microsoft Store) ให้ใช้ `py` แทน

---

## 3. `anime-extra-random-defense-3d/` — เกมเวอร์ชัน 3D (FERD-aligned)

เวอร์ชันขยายที่ใช้ข้อมูลจากแมป FERD ต้นฉบับโดยตรง พร้อม 3D rendering ด้วย Three.js

### คุณสมบัติใหม่

- **Three.js r186 3D rendering** — WebGL + UnrealBloomPass, PCF shadows, PBR materials, image-based lighting, orbit camera (drag/zoom)
- **8 เกรด** — E / D / C / B / A / S / EX / ★(STAR) พร้อม ladder สูตรครบ
- **177 สูตร ascension** — แปลจาก FERD map 1:1 ลงบนตัวละครอนิเมะต้นฉบับ
- **~160 ยูนิต** — ข้ามทุกเกรด พร้อม 3D figures (robe, head, hair, weapon ตาม class, halo สำหรับ S/EX/STAR)
- **Gacha upgrade** — ใช้ spirit (✧) อัปเกรด gacha Lv 1-6 (E→D→C→B→A→S)
- **Wisp system (❋)** — ได้ 2 wisps/wave แปลงเป็น gold/spirit/summon ได้
- **5 Faction** — Aurel Court / Kitsune Covenant / Steppe Horde / Echo Syndicate / Mooncell Bloc พร้อม passive + active ability และ XP ถาวร (localStorage)
- **Gambling** — เสี่ยง gold หรือ servant (payouts/chances ตรงกับ FERD)
- **Servant Pickup** — เลือก servant เฉพาะเจาะจงด้วย wisps
- **Fusion** — รวม 3 servants เกรดเท่ากัน → 1 สุ่มเกรดถัดไป
- **12 ระดับความยาก** — Practice → SE.RA.PH → Sakura Labyrinth → Photonic Abyss → Imaginary Number Space I-IV → Hell Proof I-IV
- **สูงสุด 100 waves** — pop cap 18, bench 10 ช่อง
- **WebGL fallback** — แสดงข้อความถ้าเบราว์เซอร์ไม่รองรับ WebGL

### โครงสร้างไฟล์

- **`data.js`** — ข้อมูลเกมทั้งหมด: GRADES (8 เกรด), UNITS (~160), RECIPES (177), GACHA_POOL, DIFFICULTIES (12), FACTIONS (5), GOLD_GAMBLES, SERVANT_GAMBLES, PATH, SLOTS, portrait functions
- **`game.js`** — เอนจินเกม: state management, faction system (persistent XP via localStorage), gacha upgrade, wisp economy, gambling, combat (11 attack types), wave spawning, ascension, fusion, pickup, UI sync
- **`scene3d.js`** — 3D render layer: arena (floor, ring road, gates, platforms), unit figures (procedural per class), enemies (icosa core + glow + boss cage), projectiles, beams, rings, particles, damage floats, ambient motes, orbit controls, camera shake, resize handling

### วิธีรัน

เปิด `index.html` ในเบราว์เซอร์ (รองรับ `file://` เพราะใช้ dynamic import กับ import map) หรือใช้ local server:

```bash
cd anime-extra-random-defense-3d
py -m http.server 8000
# เปิด http://localhost:8000
```

> บน Windows ถ้า `python` ไม่ได้ (เด้ง Microsoft Store) ให้ใช้ `py` แทน

> ต้องการเบราว์เซอร์ที่รองรับ WebGL และ ES modules

---

## เปรียบเทียบสองเวอร์ชัน

| ฟีเจอร์ | 2D | 3D |
|---------|----|----|
| Rendering | Canvas 2D | Three.js WebGL |
| เกรด | C/B/A/S/EX (5) | E/D/C/B/A/S/EX/★ (8) |
| ยูนิต | 21 | ~160 |
| สูตร ascension | 9 | 177 |
| ระดับความยาก | 3 | 12 |
| Waves | 25 | สูงสุด 100 |
| Pop cap | 10 | 18 |
| Gacha upgrade | — | ✅ (spirit) |
| Wisp system | — | ✅ |
| Faction | — | ✅ (5, persistent XP) |
| Gambling | — | ✅ (gold + servant) |
| Servant pickup | — | ✅ |
| Fusion | — | ✅ |
| แหล่งข้อมูล | ดัดแปลงเอง | FERD map 1:1 |

---

## การอ้างอิง

- **FERD** = Fate Extra Random Defence — แมป Warcraft III ต้นฉบับ (v3.81, build 8275, Fix)
- **MPQ** = Mo'PaQ — รูปแบบ archive ของ Blizzard (เข้ารหัส sector-based)
- **JASS** = ภาษา scripting ของ Warcraft III
- ตัวละครอนิเมะทั้งหมดเป็นต้นฉบับของโปรเจกต์นี้ ไม่ใช่ตัวละครจาก Fate โดยตรง แต่ได้รับแรงบันดาลใจจากธีม Grail War
