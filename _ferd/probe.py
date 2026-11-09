import mpyq, os
import extract  # loads patched read_file via monkeypatch on import? No—patch runs at module level
from extract import read_file_dec

arc = mpyq.MPQArchive('map.mpq', listfile=False)
cands = [
    'units\\unitdata.slk','units\\unitbalance.slk','units\\unitweapons.slk',
    'units\\unitabilities.slk','units\\unitui.slk','units\\commonabilitydata.slk',
    'units\\unitweapons.slk','abilitydata.slk','abilitybuffdata.slk',
    'itemdata.slk','itemfunc.slk','upgradedata.slk','upgradefunc.slk',
    'destructabledata.slk','destructablefunc.slk','doodaddata.slk','doodadfunc.slk',
    'miscdata.slk','war3map.txt','war3map.lua','war3map.w3u','war3map.w3a',
    'war3map.w3t','war3map.w3q','units\\commandstrings.txt','units\\abilitystrings.txt',
    'war3mapskin.txt','skin.txt','war3mapmisc.txt','war3mapextra.txt',
    'units\\miscdata.slk','units\\upgradedata.slk','units\\itemdata.slk',
    'war3mapcampaign.w3u','campaignabilitydata.slk','campaignunitdata.slk',
]
os.makedirs('out', exist_ok=True)
for c in cands:
    try:
        d = read_file_dec(arc, c)
    except Exception as e:
        print('ERR', c, repr(e)[:70]); continue
    if d is not None and len(d) > 0:
        fn = 'out/' + c.replace('\\', '_')
        open(fn, 'wb').write(d)
        print('OK ', c, len(d))
    else:
        print('-- ', c, '(none/empty)')