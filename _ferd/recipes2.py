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

# Categorize abilities by name
byname = defaultdict(list)
for o in a:
    sm = {m['id']: m['val'] for m in o['mods'] if m['type'] == 3 and isinstance(m['val'], str)}
    anam = clean(sm.get('anam', ''))
    byname[anam].append(o)

print('=== Ability name categories ===')
for name, objs in sorted(byname.items(), key=lambda x: -len(x[1])):
    print(f'{len(objs):4d}  {name[:60]}')