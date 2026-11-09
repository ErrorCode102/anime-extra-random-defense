import mpyq, struct, zlib, bz2
from io import BytesIO
from extract import read_file_dec, decompress

arc = mpyq.MPQArchive('map.mpq', listfile=False)
print('sector_size_shift', arc.header['sector_size_shift'], '=> sector', 512 << arc.header['sector_size_shift'])
he = arc.get_hash_table_entry('(listfile)')
be = arc.block_table[he.block_table_index]
off = be.offset + arc.header['offset']
arc.file.seek(off)
fd = arc.file.read(be.archived_size)
key = arc._hash('(listfile)', 'TABLE')
print('key', hex(key), 'flags', hex(be.flags), 'size', be.size, 'arch', be.archived_size)
ss = 512 << arc.header['sector_size_shift']
sectors = be.size // ss + 1
crc = bool(be.flags & 0x4000000)
if crc: sectors += 1
num_off = sectors + 1
off_size = num_off * 4
raw = arc._decrypt(fd[:off_size], key)
pos = struct.unpack('<%dI' % num_off, raw)
print('positions', pos[:6], '...')
# first sector
sec = fd[pos[0]:pos[1]]
print('first sector raw len', len(sec), 'first bytes', sec[:8].hex())
dsec = arc._decrypt(sec, key)  # sector 0 => key+0
print('decrypted first bytes', dsec[:8].hex(), 'compression', dsec[0])
try:
    out = decompress(dsec)
    print('decompressed len', len(out), 'sample', out[:120])
except Exception as e:
    print('decompress err', repr(e))