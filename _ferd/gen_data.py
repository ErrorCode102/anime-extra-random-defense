# -*- coding: utf-8 -*-
import json, re
merges = json.load(open('out/merges.json', encoding='utf-8'))

# grade suffix -> grade key. T specials are EX, except BBT/VOT which are the ultimate star.
def grade_of(uid):
    s = uid[-1]
    if s in 'EDCBAS': return s
    if s == 'X': return 'EX'
    if s == 'T': return 'STAR' if uid in ('-BBT','-VOT') else 'EX'
    return 'EX'
def uid2id(uid):  # '-GAS' -> 'GAS'
    return uid.lstrip('-')

# ---- original anime cast: base code -> meta ----
# name, cls, hair, eye, style, kind, dmg(base E), rate, range, pop, extra
M = {
 'GA':('Kai Solblade','Saber','#ffd23d','#ff9440',0,'crit',9,1.15,120,1,{'critC':.25,'critX':2.5}),
 'PD':('Aria Starforge','Saber','#3a6ea8','#35e0ff',3,'single',10,1.2,125,1,{}),
 'NC':('Nera Crimson','Saber','#ff5a7a','#ffd23d',1,'aoe',9,1.0,115,1,{'aoe':34}),
 'AP':('Vera Darkforge','Saber','#6a7a9a','#e14dff',2,'crit',11,1.05,120,1,{'critC':.3,'critX':2.6}),
 'GO':('Suzu Kamui','Saber','#b06ae0','#ff3d8e',4,'single',10,1.3,130,1,{}),
 'AL':('Altair Warbrand','Saber','#e8e8f0','#35e0ff',5,'beam',12,0.8,150,2,{'aoe':30}),
 'BR':('Nera Blossom','Saber','#ff9ecb','#ff3d8e',1,'burn',9,1.0,120,1,{'aoe':36,'dot':4,'dotT':2}),
 'AT':('Tala Wildbow','Archer','#4dc86a','#3dff9a',1,'single',7,1.9,160,1,{}),
 'EM':('Shiro Kanzaki','Archer','#c8c8d8','#ff9440',0,'multi',8,1.5,150,1,{'multi':2}),
 'GM':('Gilden Ark','Archer','#ffd23d','#ff3d5e',4,'pierce',11,1.3,165,2,{'pierce':2}),
 'ZM':('V-0 Nullmodel','Archer','#e8e8f0','#ff3d5e',5,'single',9,1.7,150,1,{}),
 'VL':('Vlar Impaler','Lancer','#d43a3a','#ff6a3d',2,'pierce',10,1.0,135,1,{'pierce':2}),
 'KH':('Kulan Gaebole','Lancer','#35a0ff','#35e0ff',0,'pierce',9,1.15,140,1,{'pierce':3}),
 'KA':('Karn Solheir','Lancer','#ffd23d','#ff9440',0,'burn',11,0.95,150,2,{'aoe':40,'dot':6,'dotT':2}),
 'BA':('Elize Batori','Lancer','#ff7a2a','#ffc93d',3,'chain',9,1.0,140,1,{'chain':2}),
 'MD':('Mesa Gorgon','Rider','#7a4dc8','#e14dff',4,'slow',8,1.4,135,1,{'slow':.3,'slowT':1.2}),
 'ES':('Iskander Kingson','Rider','#d43a3a','#ffd23d',2,'aoe',12,0.8,120,2,{'aoe':44}),
 'FD':('Captain Draka','Rider','#ff9440','#35e0ff',1,'single',9,1.6,145,1,{'greed':1}),
 'TA':('Tamaki Ninefox','Caster','#ff9ecb','#ffd23d',3,'burn',8,1.0,140,1,{'aoe':40,'dot':5,'dotT':2}),
 'AN':('Anders Taleweaver','Caster','#8a5a33','#ffc93d',0,'aoe',7,1.1,130,1,{'aoe':42}),
 'RH':('Rime Picturebook','Caster','#bfe8ff','#4aa8ff',3,'slow',7,1.05,135,1,{'aoe':40,'slow':.35,'slowT':1.3}),
 'ST':('Kitsune Vitch','Caster','#e14dff','#ff3d8e',4,'chain',9,1.0,145,1,{'chain':3}),
 'PT':('Kitsune Casual','Caster','#ff9ecb','#3dff9a',1,'aoe',8,1.15,135,1,{'aoe':40}),
 'TO':('Rina Jewelcaster','Caster','#d8d8e8','#bfe8ff',5,'slow',8,1.0,145,1,{'aoe':44,'slow':.4,'slowT':1.4}),
 'SA':('Saku Hollow','Caster','#b06ae0','#e14dff',3,'aoe',8,1.05,135,1,{'aoe':42}),
 'YS':('Shen Lishu','Assassin','#6a3ad4','#e14dff',2,'crit',11,1.1,105,1,{'critC':.3,'critX':3}),
 'RY':('Shiki Voidblade','Assassin','#3a3a5a','#35e0ff',4,'crit',12,1.0,110,1,{'critC':.35,'critX':3}),
 'KI':('Kirei Executor','Assassin','#2b2d44','#ff3d5e',5,'poison',9,1.1,115,1,{'aoe':34,'dot':5,'dotT':2.5}),
 'LU':('Bu Fengxian','Berserker','#8a5a33','#ffc93d',2,'aoe',14,0.65,90,2,{'aoe':40}),
 'AQ':('Luna Whitevamp','Berserker','#f2ead8','#ff3d5e',1,'crit',13,0.85,100,2,{'critC':.3,'critX':2.8}),
 'AE':('Elize Bloodrage','Berserker','#ff5a7a','#ff3d5e',3,'burn',12,0.8,100,2,{'aoe':40,'dot':6,'dotT':2}),
 'AA':('Tala Wildrage','Berserker','#4dc86a','#ff3d5e',2,'crit',13,0.9,100,2,{'critC':.32,'critX':2.8}),
 'PA':('Pashia Lip','Alter Ego','#ff3d8e','#ffd23d',4,'beam',12,0.8,150,2,{'aoe':34}),
 'BB':('Beebee Mooncell','Alter Ego','#e14dff','#35e0ff',5,'multi',11,1.2,150,2,{'multi':2}),
 'JE':('Jehanne Oracle','Ruler','#f2ead8','#ffd23d',3,'chain',11,1.0,175,2,{'chain':3}),
 'JA':('Venge Jehanne','Ruler','#6a7a9a','#e14dff',4,'beam',12,0.9,165,2,{'aoe':36}),
 # catalyst line
 'VO':('Spiritron Construct','Foreigner','#35e0ff','#35e0ff',5,'beam',6,0.9,140,1,{'aoe':30}),
 # EX / star specials (unique)
 'MS':('Mira Shieldheart','Shielder','#d8a8c8','#ff9ecb',3,'stun',10,0.85,125,2,{'aoe':44,'stunC':.25,'stunT':.6,'aura':.12}),
 'LK':('Astraea Star-Spear','Lancer','#ffd23d','#35e0ff',3,'pierce',14,1.0,185,3,{'pierce':4,'aoe':30}),
 'EN':('Enkiel Heaven Chains','Lancer','#7ae0b0','#3dff9a',0,'stun',12,1.0,170,2,{'stunC':.3,'stunT':.8}),
 'ML':('Meltra Ego Blossom','Alter Ego','#b06ae0','#ff3d8e',1,'multi',12,1.3,155,2,{'multi':2}),
 'MX':('Meltra Prime','Alter Ego','#e0a0ff','#ff3d5e',4,'multi',15,1.4,170,3,{'multi':3,'dot':6,'dotT':2}),
 'SE':('Shami Hanging Empress','Assassin','#7a4dc8','#e14dff',5,'poison',12,1.0,170,3,{'aoe':50,'dot':8,'dotT':3}),
 'SK':('Scaha the Wise','Lancer','#d43a3a','#e14dff',4,'pierce',14,1.05,175,3,{'pierce':3,'aoe':30}),
 'AS':('Zephyr Cloud Trickster','Rider','#ff9ecb','#3dff9a',1,'crit',8,2.4,140,1,{'critC':.25,'critX':2.5,'greed':1}),
 'HX':('Mysterious Heroine Z','Assassin','#35e0ff','#ffd23d',4,'crit',13,1.5,160,3,{'critC':.4,'critX':4}),
 'FR':('Frankie Stein','Berserker','#7ae0b0','#ffc93d',2,'aoe',15,0.75,110,3,{'aoe':50,'stunC':.2,'stunT':.5}),
 'TS':('Tamaki Summer','Caster','#ff9ecb','#35e0ff',1,'burn',12,1.0,150,2,{'aoe':48,'dot':8,'dotT':2.5}),
}
# EX ascension titles (X suffix) and star special titles
EXTITLE = {
 'GAX':'Knight of the Sun','FDX':'Pioneer of the Stars','SAX':'Bloom Titan Kingprotea',
 'MDX':'Gorgon Maid','JEX':'The Crimson Saint','TOX':'Jeweled Sword Zelretch',
 'FRX':'Frankenstein\'s Monster','NCX':'Mystic Code of the Emperor','PDX':'Mystic Code of the Star',
 'TAX':'Mystic Code of the Sun','GMX':'Genesis Mystic Code','ALX':'Titan Attilaight Cell',
 'BBX':'Third Pleasure Deva','MLX':'Mysterious Alter Ego Λ','TSX':'Summer Tamamo',
 'MST':'False Shielder','LKT':'Goddess of Rhongomyniad','ENT':'Chain of Heaven',
 'MXT':'False Final Ascension','SET':'Empress of Hanging Gardens','SKT':'Scáthach of the Shadow',
 'AST':'False Rider','HXT':'Mysterious Heroine X','BBT':'Moon Cell Automaton','VOT':'Velber 02',
}
GRADE_MULT = {'E':1.0,'D':1.7,'C':2.8,'B':4.6,'A':7.6,'S':12.5,'EX':40.0,'STAR':80.0}
GRADE_POP  = {'E':1,'D':1,'C':1,'B':1,'A':2,'S':2,'EX':3,'STAR':4}
GRADE_RATE = {'E':1.0,'D':1.03,'C':1.06,'B':1.1,'A':1.15,'S':1.2,'EX':1.3,'STAR':1.4}
GRADE_RANGE= {'E':0,'D':4,'C':8,'B':12,'A':18,'S':24,'EX':34,'STAR':44}

# collect all unit ids present
ids = set()
for m in merges:
    ids.update(m['req']); ids.add(m['result'])

units = []
for uid in sorted(ids):
    base = uid[1:3]; grade = grade_of(uid); idn = uid2id(uid)
    if base not in M:
        raise SystemExit('missing base meta: '+base+' '+uid)
    name,cls,hair,eye,style,kind,dmg,rate,rng,pop,extra = M[base]
    gm = GRADE_MULT[grade]
    u = {
        'id':idn,'base':base,'name':name,'cls':cls,'grade':grade,
        'pop':GRADE_POP[grade] if grade in ('EX','STAR') else pop,
        'dmg':round(dmg*gm,1),'rate':round(rate*GRADE_RATE[grade],2),
        'range':rng+GRADE_RANGE[grade],'kind':kind,'hair':hair,'eye':eye,'style':style,
    }
    # scale extra numeric fields with grade for damage-over-time / aoe
    for k,v in extra.items():
        if k in ('dot',): u[k]=round(v*gm*0.6,1)
        elif k in ('aoe',): u[k]=round(v*(1+GRADE_RANGE[grade]*0.012))
        else: u[k]=v
    if grade in ('EX','STAR'):
        u['pop'] = GRADE_POP[grade]
    if idn in EXTITLE:
        u['exTitle'] = EXTITLE[idn]
        u['name'] = name  # keep base name; title shown separately
    units.append(u)

# recipes: base = first ingredient (transforms in place), mats = rest
recipes = []
for m in merges:
    req = [uid2id(x) for x in m['req']]
    recipes.append({'base':req[0],'mats':req[1:],'result':uid2id(m['result'])})

# gacha pools: which bases available at each grade (from real pool counts)
# E=5,D=9,C=22,B=32,A=36,S=37 cumulative roster; map to bases that have that grade
pool = {g:[] for g in ['E','D','C','B','A','S']}
for u in units:
    if u['grade'] in pool and u['base']!='VO':
        pool[u['grade']].append(u['id'])

out = {'units':units,'recipes':recipes,'pool':pool,
       'counts':{g:len(pool[g]) for g in pool}}
json.dump(out, open('out/gamedata.json','w',encoding='utf-8'), ensure_ascii=True)
print('units:',len(units),'recipes:',len(recipes))
print('gacha pool sizes:',out['counts'])
print('grades present:',sorted(set(u['grade'] for u in units)))