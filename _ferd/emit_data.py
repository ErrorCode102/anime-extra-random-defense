# -*- coding: utf-8 -*-
import json
d = json.load(open('out/gamedata.json', encoding='utf-8'))
units, recipes, pool = d['units'], d['recipes'], d['pool']

# kind -> short desc template
KDESC = {
 'single':'Reliable single-target strikes.',
 'crit':'High critical strike chance for heavy burst damage.',
 'aoe':'Heavy swings splash damage to nearby foes.',
 'burn':'Explosions ignite enemies, burning them over time.',
 'poison':'Venom rots enemies over time.',
 'slow':'Chills enemies, slowing their advance.',
 'stun':'Impact may stun enemies in place.',
 'pierce':'Thrusts pierce through multiple enemies.',
 'chain':'Arcs between several enemies.',
 'beam':'A focused beam melts single targets.',
 'multi':'Strikes multiple targets each attack.',
}
FLAVOR = {
 'GA':'“The sun itself kneels to my blade.”','PD':'“A king does not ask permission to win.”',
 'NC':'“Umu! Praise me louder!”','AP':'“The dark forge burns colder, and brighter.”',
 'GO':'“My sword dances; the world follows.”','AL':'“I am the war that ends all wars.”',
 'BR':'“Bloom for me, or be cut down.”','AT':'“The wild hunts through me.”',
 'EM':'“I am the bone of my sword.”','GM':'“All treasures in the world are mine.”',
 'ZM':'“TARGET LOCKED. EMOTION: NULL.”','VL':'“Impaler of the night, lord of walls.”',
 'KH':'“The hound never releases its prey.”','KA':'“I bear the dawn. Behold it, and burn.”',
 'BA':'“Blood is the finest vintage.”','MD':'“Look into my eyes, and stay forever.”',
 'ES':'“Conqueror of horizons, king of riders.”','FD':'“The stars themselves are my wake.”',
 'TA':'“Nine tails, one devoted heart.”','AN':'“Every story ends; I write the ending.”',
 'RH':'“Once upon a time, you were already mine.”','ST':'“A witch’s smile hides nine knives.”',
 'PT':'“Casual day, catastrophic power.”','TO':'“The jewels obey my will.”',
 'SA':'“The hollow blooms with imaginary flowers.”','YS':'“You died three steps ago.”',
 'RY':'“I will cut even the void.”','KI':'“Rejoice. Your suffering has meaning.”',
 'LU':'“Among men, the mightiest. Among beasts, the fiercest.”','AQ':'“The white princess walks at night.”',
 'AE':'“Rage is my crown.”','AA':'“The hunt turned feral.”',
 'PA':'“Love me, or I will crush you.”','BB':'“The moon cell watches, and giggles.”',
 'JE':'“The oracle speaks; heaven answers.”','JA':'“Vengeance is a prayer answered.”',
 'VO':'“A fragment of the imaginary, given form.”',
 'MS':'“None shall pass. Not even you.”','LK':'“At the edge of the sky, the tower of dawn answers.”',
 'EN':'“The chains remember. The chains weep.”','ML':'“One… two… three… please, dissolve!”',
 'MX':'“The highest-spec ego. Nobody dares disagree.”','SE':'“My gardens were a wonder; my wine, the eighth.”',
 'SK':'“The shadow lands teach only the worthy.”','AS':'“It’s a trap! …No, really, this is just me.”',
 'HX':'“I am nobody’s counter. The evidence suggests otherwise.”','FR':'“A gentle monster, bearing lightning.”',
 'TS':'“Summer foxfire burns brightest.”',
}
for u in units:
    base = u['base']
    kd = KDESC.get(u['kind'],'A mysterious power.')
    extra = ''
    if u['kind']=='crit': extra=f" ({int(u.get('critC',.25)*100)}% for {u.get('critX',2):g}×)"
    if u['kind']=='pierce': extra=f" (pierces {u.get('pierce',2)})"
    if u['kind']=='chain': extra=f" (chains {u.get('chain',3)})"
    if u['kind']=='multi': extra=f" ({u.get('multi',2)} targets)"
    if u.get('slow'): extra=f" (−{int(u['slow']*100)}% speed)"
    if u.get('stunC'): extra=f" ({int(u['stunC']*100)}% stun)"
    if u.get('greed'): extra=' (+1 gold per hit)'
    if u.get('aura'): extra=f" (allies +{int(u['aura']*100)}% dmg)"
    u['desc'] = kd + extra
    u['flavor'] = FLAVOR.get(base,'“The grail remembers its name.”')

def js(o):
    return json.dumps(o, ensure_ascii=True)

GRADES = {
 'E':  {'color':'#9fb4c8','dark':'#1c2430','sell':8,  'label':'E',  'gcost':30},
 'D':  {'color':'#4aa8ff','dark':'#152b47','sell':14, 'label':'D',  'gcost':45},
 'C':  {'color':'#3dff9a','dark':'#103324','sell':24, 'label':'C',  'gcost':65},
 'B':  {'color':'#ff9440','dark':'#3d2410','sell':40, 'label':'B',  'gcost':95},
 'A':  {'color':'#ffd23d','dark':'#3d3210','sell':70, 'label':'A',  'gcost':140},
 'S':  {'color':'#e14dff','dark':'#351040','sell':120,'label':'S',  'gcost':200},
 'EX': {'color':'#ff3d5e','dark':'#40101c','sell':200,'label':'EX', 'gcost':0},
 'STAR':{'color':'#ffffff','dark':'#2a2440','sell':360,'label':'★', 'gcost':0},
}
DIFF = [
 ('practice','Practice','The training simulation. Gentle waves, generous lives.',60,60,80,1.0,1.0,'#3dff9a'),
 ('seraph','SE.RA.PH','The standard grail war. The true starting line.',80,50,80,1.05,1.25,'#4aa8ff'),
 ('labyrinth','Sakura Labyrinth','A twisting maze of tougher foes.',90,40,70,1.2,1.5,'#ffd23d'),
 ('abyss','Photonic Abyss','Brutal light. The cell shows no mercy.',100,40,60,1.35,2.0,'#ff9440'),
 ('elite1','Imaginary Number Space I','Elite proof I — the imaginary deepens.',100,40,50,1.35,2.25,'#e14dff'),
 ('elite2','Imaginary Number Space II','Elite proof II — reality thins.',100,40,50,1.35,2.5,'#e14dff'),
 ('elite3','Imaginary Number Space III','Elite proof III — the void presses in.',100,40,50,1.35,2.75,'#c86aff'),
 ('elite4','Imaginary Number Space IV','Elite proof IV — faster, harder, merciless.',100,40,50,1.5,3.0,'#c86aff'),
 ('hell1','Hell Proof I','The first hell. Few return.',100,40,40,1.5,3.25,'#ff3d5e'),
 ('hell2','Hell Proof II','The second hell. The moon cell bleeds.',100,40,40,1.5,3.5,'#ff3d5e'),
 ('hell3','Hell Proof III','The third hell. Despair has a name.',100,40,40,1.5,3.75,'#ff3d5e'),
 ('hell4','Hell Proof IV','The final hell. Only legends survive.',100,40,40,1.65,4.0,'#ff2d4e'),
]

L = []
L.append("'use strict';")
L.append("/* ===== ANIME EXTRA RANDOM DEFENCE — data (FERD-aligned) ===== */")
L.append("/* Roster, grade ladder and 177 ascension recipes translated 1:1 from the")
L.append("   FERD map structure onto an original anime cast. */")
L.append("")
L.append("const GRADES = "+js(GRADES)+";")
L.append("const GRADE_ORDER = ['E','D','C','B','A','S','EX','STAR'];")
L.append("")
L.append("/* kind: single|aoe|chain|slow|crit|burn|poison|stun|beam|pierce|multi */")
L.append("const UNITS = [")
for u in units:
    keys = ['id','base','name','cls','grade','pop','dmg','rate','range','kind','hair','eye','style','desc','flavor']
    parts = []
    for k in keys:
        if k in u: parts.append(f"{k}:{js(u[k])}")
    for k in ['aoe','dot','dotT','slow','slowT','stunC','stunT','critC','critX','pierce','chain','multi','greed','aura','exTitle']:
        if k in u: parts.append(f"{k}:{js(u[k])}")
    L.append("  {"+", ".join(parts)+"},")
L.append("];")
L.append("const UNIT_BY_ID = Object.fromEntries(UNITS.map(u=>[u.id,u]));")
L.append("")
L.append("/* base + materials -> result (base transforms in place, materials consumed) */")
L.append("const RECIPES = [")
for r in recipes:
    L.append("  {base:"+js(r['base'])+", mats:"+js(r['mats'])+", result:"+js(r['result'])+"},")
L.append("];")
L.append("")
L.append("/* cumulative gacha roster per grade (FERD pool sizes) */")
L.append("const GACHA_POOL = "+js(pool)+";")
L.append("")
L.append("const DIFFICULTIES = {")
for k,name,blurb,waves,timeout,lives,spd,hp,color in DIFF:
    L.append(f"  {k}:{{name:{js(name)}, blurb:{js(blurb)}, waves:{waves}, timeout:{timeout}, lives:{lives}, speed:{spd}, hp:{hp}, gold:1.0, color:{js(color)}}},")
L.append("};")
L.append("")
L.append("const CFG = {")
L.append("  W:960, H:640,")
L.append("  startGold:300, startSpirit:0, startWisps:4,")
L.append("  popCap:18, benchSize:10, pityEvery:15,")
L.append("  gachaMaxLv:6, gachaUpCost:lv=>8+lv*6,")
L.append("  wispsPerWave:2,")
L.append("  ring:{ l:200, t:130, r:760, b:510, w:34 },")
L.append("};")
L.append("/* gacha level 1..6 -> grade */")
L.append("const GACHA_GRADE = ['E','D','C','B','A','S'];")
L.append("")
L.append("/* waypoints: enter left gate, 1.5 clockwise laps, exit right gate */")
L.append("const PATH = [")
L.append("  [-30,320],[200,320],[200,130],[760,130],[760,510],[200,510],[200,320],")
L.append("  [200,130],[760,130],[760,320],[990,320],")
L.append("];")
L.append("const PATH_SEG = []; let PATH_LEN = 0;")
L.append("for (let i=0;i<PATH.length-1;i++){")
L.append("  const [x1,y1]=PATH[i],[x2,y2]=PATH[i+1];")
L.append("  const len=Math.hypot(x2-x1,y2-y1);")
L.append("  PATH_SEG.push({x1,y1,x2,y2,len,start:PATH_LEN}); PATH_LEN+=len;")
L.append("}")
L.append("function pathPos(d){")
L.append("  d=Math.max(0,Math.min(PATH_LEN,d));")
L.append("  for (const s of PATH_SEG){ if (d<=s.start+s.len){ const t=(d-s.start)/s.len;")
L.append("    return {x:s.x1+(s.x2-s.x1)*t, y:s.y1+(s.y2-s.y1)*t}; } }")
L.append("  const s=PATH_SEG[PATH_SEG.length-1]; return {x:s.x2,y:s.y2};")
L.append("}")
L.append("")
L.append("const SLOTS = [")
L.append("  {x:258,y:188},{x:702,y:188},{x:702,y:452},{x:258,y:452},")
L.append("  {x:480,y:320},")
L.append("  {x:120,y:60},{x:840,y:60},{x:840,y:580},{x:120,y:580},")
L.append("  {x:95,y:225},{x:95,y:415},{x:865,y:225},{x:865,y:415},")
L.append("];")
L.append("")
# portrait functions (verbatim from current data.js)
port = open('../anime-extra-random-defense-3d/data.js',encoding='utf-8').read()
port = port[port.index('/* ============ procedural anime portraits'):]
L.append(port)

open('../anime-extra-random-defense-3d/data.js','w',encoding='utf-8').write("\n".join(L))
print('wrote data.js:', len("\n".join(L)), 'bytes;', len(units),'units;',len(recipes),'recipes')