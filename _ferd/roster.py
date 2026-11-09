import json, re
from collections import defaultdict

merges = json.load(open('out/merges.json', encoding='utf-8'))
u = json.load(open('out/war3map.w3u.json', encoding='utf-8'))
uname = {}
for o in u:
    d = {m['id']: m['val'] for m in o['mods']}
    nid = o['new'] if o['new'] and o['new'] != '....' else o['old']
    if 'unam' in d: uname[nid] = d['unam']
def clean(s):
    return re.sub(r'\|c[0-9a-fA-F]{8}', '', str(s)).replace('|r','').replace('|n',' / ').strip()

ids = set()
for m in merges:
    ids.update(m['req']); ids.add(m['result'])

# group by base (first 3 chars after '-'), grade = last char
bybase = defaultdict(dict)
for uid in sorted(ids):
    mm = re.match(r'-([A-Z0-9]{2})([EDCBASXT])$', uid)
    if mm:
        base, grade = mm.group(1), mm.group(2)
        bybase[base][grade] = clean(uname.get(uid, uid))
    else:
        print('UNPARSED:', uid, clean(uname.get(uid,'')))

print('=== BASES:', len(bybase), '===')
for base in sorted(bybase):
    grades = bybase[base]
    # pick a representative name (strip grade prefix)
    sample = next(iter(grades.values()))
    print(f'{base}: grades={"".join(sorted(grades))}  | {sample}')
print('total unique unit ids:', len(ids))