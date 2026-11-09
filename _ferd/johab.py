import json, re
from collections import defaultdict

a = json.load(open('out/war3map.w3a.json', encoding='utf-8'))
u = json.load(open('out/war3map.w3u.json', encoding='utf-8'))

uname = {}
for o in u:
    d = {m['id']: m['val'] for m in o['mods']}
    nid = o['new'] if o['new'] and o['new'] != '....' else o['old']
    if 'unam' in d: uname[nid] = d['unam']

def clean(s):
    return re.sub(r'\|c[0-9a-fA-F]{8}', '', str(s)).replace('|r', '').replace('|n', ' / ')

# Examine "#" abilities (likely Johab recipes) - dump all string + int fields
cnt = 0
for o in a:
    sm = {m['id']: m['val'] for m in o['mods'] if m['type'] == 3 and isinstance(m['val'], str)}
    anam = clean(sm.get('anam', ''))
    if anam == '#':
        cnt += 1
        if cnt <= 6:
            print('=== ability', o['old'], '->', o['new'], '===')
            for m in o['mods']:
                v = m['val']
                if isinstance(v, str): v = clean(v)
                print(f"  {m['id']} (t{m['type']} lv{m.get('lvl',0)} c{m.get('col',0)}) = {v}")
print('total # abilities:', cnt)