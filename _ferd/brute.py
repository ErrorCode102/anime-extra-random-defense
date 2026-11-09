import mpyq, struct

arc = mpyq.MPQArchive('map.mpq', listfile=False)

def try_key(fd, off_size, num_off, key, archived):
    raw = arc._decrypt(fd[:off_size], key & 0xFFFFFFFF)
    pos = struct.unpack('<%dI' % num_off, raw)
    ok = pos[0] == off_size and all(pos[i] < pos[i+1] for i in range(num_off-1)) and pos[-1] <= archived + 64
    return ok, pos

for fn in ['war3map.w3u', '(listfile)']:
    he = arc.get_hash_table_entry(fn)
    be = arc.block_table[he.block_table_index]
    arc.file.seek(be.offset + arc.header['offset'])
    fd = arc.file.read(be.archived_size)
    base = arc._hash(fn.split('\\')[-1], 'TABLE')
    ss = 512 << arc.header['sector_size_shift']
    sectors = be.size // ss + 1
    if be.flags & 0x4000000: sectors += 1
    num_off = sectors + 1
    off_size = num_off * 4
    print('===', fn, 'base', hex(base), 'off', be.offset, 'size', be.size, 'arch', be.archived_size, 'off_size', off_size)
    found = False
    cands = {}
    for delta in [0, 512, -512, be.offset, be.offset+512, be.offset-512]:
        for xorsz in [be.size, be.archived_size, 0]:
            k = ((base + delta) & 0xFFFFFFFF) ^ xorsz
            cands[(delta, xorsz)] = k
    # also scan offset basis around be.offset for the (key+off)^size form
    for offbasis in range(be.offset-1024, be.offset+1025, 512):
        k = ((base + offbasis) & 0xFFFFFFFF) ^ be.size
        cands[('scan', offbasis)] = k
    for label, k in cands.items():
        ok, pos = try_key(fd, off_size, num_off, k, be.archived_size)
        if ok:
            print('  FOUND', label, 'key', hex(k), 'pos', pos[:6]); found = True
    if not found:
        print('  no candidate matched; sample adjusted pos:', try_key(fd, off_size, num_off, ((base+be.offset)&0xFFFFFFFF)^be.size, be.archived_size)[1][:3])