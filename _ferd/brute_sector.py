import mpyq, struct, zlib, bz2
from extract import decompress, recover_offset_key

arc = mpyq.MPQArchive('map.mpq', listfile=False)
fn = '(listfile)'
he = arc.get_hash_table_entry(fn); be = arc.block_table[he.block_table_index]
arc.file.seek(be.offset + arc.header['offset']); fd = arc.file.read(be.archived_size)
base = arc._hash(fn, 'TABLE')
off_size = 8
enc0 = struct.unpack('<I', fd[:4])[0]
keys = list(recover_offset_key(arc, enc0, off_size))
koff = keys[0]
pos = struct.unpack('<2I', arc._decrypt(fd[:8], koff))
print('base', hex(base), 'koff', hex(koff), 'pos', pos)
sec = fd[pos[0]:pos[1]]
print('sector len', len(sec))
cands = set()
for d in range(-4, 5):
    cands.add((koff + d) & 0xFFFFFFFF)
    cands.add((base + d) & 0xFFFFFFFF)
for k in sorted(cands):
    d = arc._decrypt(sec, k)
    ct = d[0]
    if ct not in (0, 2, 8, 16):
        continue
    try:
        out = decompress(d)
    except Exception as e:
        print('key', hex(k), 'ct', ct, 'decompress err', repr(e)[:50]); continue
    printable = sum(1 for c in out[:200] if 32 <= c < 127 or c in (10, 13)) / max(1, len(out[:200]))
    print('key', hex(k), 'ct', ct, 'outlen', len(out), 'printable', round(printable, 2), 'sample', out[:80])