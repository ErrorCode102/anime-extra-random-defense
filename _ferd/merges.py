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
    return re.sub(r'\|c[0-9a-fA-F]{8}', '', str(s)).replace('|r', '').replace('|n', ' / ').strip()

def nm(uid):
    return clean(uname.get(uid, uid))

# Extract all [Merge] recipes: acat = required (comma list), atat = result
merges = []
for o in a:
    sm = {m['id']: m['val'] for m in o['mods'] if m['type'] == 3 and isinstance(m['val'], str)}
    if clean(sm.get('anam', '')) == '[Merge]':
        acat = sm.get('acat', '')
        atat = sm.get('atat', '')
        req = [x for x in acat.split(',') if x.strip()]
        if req and atat:
            merges.append({'req': req, 'result': atat.strip(),
                           'reqNames': [nm(x) for x in req], 'resultName': nm(atat.strip())})

print('=== MERGE RECIPES:', len(merges), '===')
for m in merges:
    print(' + '.join(m['reqNames']), '=>', m['resultName'], '   ['+','.join(m['req'])+' -> '+m['result']+']')

json.dump(merges, open('out/merges.json', 'w', encoding='utf-8'), ensure_ascii=True, indent=1)