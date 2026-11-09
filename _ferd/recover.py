import mpyq, struct

arc = mpyq.MPQArchive('map.mpq', listfile=False)
crypt = arc.encryption_table

def recover_key_first_dword(enc0, plain0):
    # plain0 = enc0 ^ (key + seed2_0), seed2_0 = 0xEEEEEEEE + crypt[0x400 + (key&0xFF)]
    target = (enc0 ^ plain0) & 0xFFFFFFFF  # = key + seed2_0
    rhs = (target - 0xEEEEEEEE) & 0xFFFFFFFF  # = key + crypt[0x400+(key&0xFF)]
    sols = []
    for b in range(256):
        k = (rhs - crypt[0x400 + b]) & 0xFFFFFFFF
        if (k & 0xFF) == b:
            sols.append(k)
    return sols

for fn in ['war3map.w3u', 'war3map.w3a', '(listfile)']:
    he = arc.get_hash_table_entry(fn); be = arc.block_table[he.block_table_index]
    arc.file.seek(be.offset + arc.header['offset']); fd = arc.file.read(be.archived_size)
    base = arc._hash(fn.split('\\')[-1], 'TABLE')
    ss = 512 << arc.header['sector_size_shift']
    sectors = be.size // ss + 1
    if be.flags & 0x4000000: sectors += 1
    off_size = (sectors + 1) * 4
    enc0 = struct.unpack('<I', fd[:4])[0]
    sols = recover_key_first_dword(enc0, off_size)
    print('===', fn, 'base', hex(base), 'off', be.offset, 'size', be.size, 'off_size', off_size)
    print('  recovered offset-table keys:', [hex(k) for k in sols])
    for k in sols:
        raw = arc._decrypt(fd[:off_size], k)
        pos = struct.unpack('<%dI' % (sectors+1), raw)
        mono = all(pos[i] < pos[i+1] for i in range(len(pos)-1))
        print('    key', hex(k), 'pos', pos, 'monotonic', mono, 'last<=arch', pos[-1] <= be.archived_size)
        # relation to base
        print('      k-base', hex((k-base)&0xFFFFFFFF), 'k^base', hex(k^base), '(k^size)-off', hex(((k^be.size)-be.offset)&0xFFFFFFFF))