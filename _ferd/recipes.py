import json, re
from collections import defaultdict

a = json.load(open('out/war3map.w3a.json', encoding='utf-8'))
u = json.load(open('out/war3map.w3u.json', encoding='utf-8'))

# map unit id -> name
uname = {}
for o in u:
    d = {m['id']: m['val'] for m in o['mods']}
    nid = o['new'] if o['new'] and o['new'] != '....' else o['old']
    if 'unam' in d: uname[nid] = d['unam']

def clean(s):
    return re.sub(r'\|c[0-9a-fA-F]{8}', '', str(s)).replace('|r', '').replace('|n', ' / ')

# Find abilities referencing servant unit IDs in any string field
recipes = []
for o in a:
    strmods = {m['id']: m['val'] for m in o['mods'] if m['type'] == 3 and isinstance(m['val'], str)}
    # look for fields containing servant-like IDs (-XY#)
    hits = {k: v for k, v in strmods.items() if re.search(r'-[A-Z0-9]{2}[EDCBASXT0]', v)}
    if hits:
        anam = clean(strmods.get('anam', ''))
        recipes.append((o['old'], o['new'], anam, hits, strmods))

print('abilities referencing servant IDs:', len(recipes))
for old, new, anam, hits, sm in recipes[:15]:
    print('---', old, '->', new, '|', anam[:50])
    for k, v in hits.items():
        print('    ', k, '=', v[:120])