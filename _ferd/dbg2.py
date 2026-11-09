import mpyq, struct
from extract import decompress

arc = mpyq.MPQArchive('map.mpq', listfile=False)
fn = 'war3map.w3u'
he = arc.get_hash_table_entry(fn)
be = arc.block_table[he.block_table_index]
arc.file.seek(be.offset + arc.header['offset'])
fd = arc.file.read(be.archived_size)
base = arc._hash(fn, 'TABLE')
key = ((base + be.offset) & 0xFFFFFFFF) ^ be.size
print('base', hex(base), 'offset', be.offset, 'size', be.size, 'adjkey', hex(key))
ss = 512 << arc.header['sector_size_shift']
sectors = be.size // ss + 1
crc = bool(be.flags & 0x4000000)
if crc: sectors += 1
num_off = sectors + 1
off_size = num_off * 4
print('sectors', sectors, 'off_size', off_size)
for trial_key, label in [(key, 'adjusted'), (base, 'base')]:
    raw = arc._decrypt(fd[:off_size], trial_key)
    pos = struct.unpack('<%dI' % num_off, raw)
    print(label, 'positions', pos)