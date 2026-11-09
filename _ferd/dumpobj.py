import struct

def u32(b, o): return struct.unpack_from('<I', b, o)[0]
def i32(b, o): return struct.unpack_from('<i', b, o)[0]
def f32(b, o): return struct.unpack_from('<f', b, o)[0]
def code(b, o):
    s = b[o:o+4]
    return ''.join(chr(c) if 32 <= c < 127 else '.' for c in s)

for fn in ['war3map.w3u', 'war3map.w3a']:
    b = open('out/' + fn, 'rb').read()
    print('=====', fn, 'len', len(b))
    ver = u32(b, 0); cnt = u32(b, 4)
    print('version', ver, 'count', cnt)
    o = 8
    old = code(b, o); new = code(b, o+4); nm = u32(b, o+8)
    print('obj0 old', old, 'new', new, 'numMods', nm)
    o += 12
    # dump first 6 mods raw (16 bytes each candidate)
    for i in range(min(6, nm)):
        mid = code(b, o); vt = u32(b, o+4)
        print('  mod', i, 'id', mid, 'type', vt, 'raw+8..+20', b[o+8:o+20].hex(), 'ascode', code(b, o+8), 'asint', u32(b, o+8), 'asfloat', round(f32(b, o+8), 3))
        o += 16  # assume id+type+level+value? probe