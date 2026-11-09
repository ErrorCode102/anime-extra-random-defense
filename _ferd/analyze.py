import json, sys
from collections import defaultdict

u = json.load(open('out/war3map.w3u.json', encoding='utf-8'))
a = json.load(open('out/war3map.w3a.json', encoding='utf-8'))

def mods(o): return {m['id']: m['val'] for m in o['mods']}

# Servant units: IDs like '-ATE' (base '-AT0' + grade letter)
servants = []
for o in u:
    nid = o['new'] if o['new'] != '....' and o['new'] else o['old']
    oid = o['old']
    cand = nid if nid.startswith('-') else oid
    if cand.startswith('-') and len(cand) == 4:
        d = mods(o)
        servants.append((cand, d.get('unam', ''), d))

print('=== SERVANT UNITS:', len(servants), '===')
# group by base (first 3 chars)
bybase = defaultdict(list)
for sid, name, d in servants:
    bybase[sid[:3]].append((sid, name, d))
print('distinct servant bases:', len(bybase))
for sid, name, d in servants[:12]:
    print(sid, '| name=', repr(name)[:40], '| HP=', d.get('uhpx'), '| atk=', d.get('ua1m'), '| rng=', d.get('ua1r'), '| spd=', d.get('umvs'), '| def=', d.get('udty'), '| cool=', d.get('ua1c'))

# Recipe abilities: look for abilities with string fields listing 4-char unit IDs
print()
print('=== ABILITY STRING FIELDS (sample) ===')
fieldcount = defaultdict(int)
for o in a:
    for m in o['mods']:
        if m['type'] == 3 and isinstance(m['val'], str):
            fieldcount[m['id']] += 1
print('string fields by frequency:', sorted(fieldcount.items(), key=lambda x: -x[1])[:25])