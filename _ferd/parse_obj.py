import struct, json, sys

def u32(b, o): return struct.unpack_from('<I', b, o)[0]
def i32(b, o): return struct.unpack_from('<i', b, o)[0]
def f32(b, o):
    v = struct.unpack_from('<f', b, o)[0]
    if v != v or v in (float('inf'), float('-inf')): return 0.0
    return v
def code(b, o): return ''.join(chr(c) if 32 <= c < 127 else '.' for c in b[o:o+4])
def iscode(b, o): return o+4 <= len(b) and all(32 <= c < 127 for c in b[o:o+4])

def read_val(b, o, vt):
    if vt == 3:
        e = b.find(b'\x00', o)
        if e < 0: return None, o
        s = b[o:e].decode('utf-8', 'ignore')
        s = s.encode('utf-8', 'ignore').decode('utf-8', 'ignore')
        o = e + 1
        return s, o
    elif vt in (0,):
        return i32(b, o), o+4
    elif vt in (1, 2):
        return round(f32(b, o), 5), o+4
    return None, o

def parse(b, kind):
    ver = u32(b, 0)
    if kind == 'w3u':
        cnt = u32(b, 8); o = 12
    else:
        cnt = u32(b, 4); o = 8
    objs = []
    while o + 12 <= len(b) and iscode(b, o):
        old = code(b, o); new = code(b, o+4); nm = u32(b, o+8)
        if nm > 5000: break
        o += 12
        mods = []; ok = True
        for i in range(nm):
            if not iscode(b, o): ok = False; break
            mid = code(b, o); vt = u32(b, o+4); o += 8
            if kind == 'w3a':
                lvl = u32(b, o); col = u32(b, o+4); o += 8
            else:
                lvl = 0; col = 0
            val, o = read_val(b, o, vt)
            if val is None: ok = False; break
            # per-mod token dword
            tok = u32(b, o) if o+4 <= len(b) else 0
            o += 4
            mods.append({'id': mid, 'type': vt, 'level': lvl, 'col': col, 'val': val})
        if not ok: break
        objs.append({'old': old, 'new': new, 'mods': mods})
        # auto-detect object end token: try 0 or 4 bytes so next header is valid
        def valid_header(p):
            if p+12 > len(b) or not iscode(b, p): return False
            n = u32(b, p+8)
            return n <= 5000
        if valid_header(o):
            pass
        elif valid_header(o+4):
            o += 4
        else:
            # scan forward for next valid header
            found = False
            for skip in range(0, 16, 4):
                if valid_header(o+skip):
                    o += skip; found = True; break
            if not found:
                break
    return ver, cnt, objs, o

if __name__ == '__main__':
    fn = sys.argv[1]; kind = 'w3u' if 'w3u' in fn else 'w3a'
    b = open('out/' + fn, 'rb').read()
    ver, cnt, objs, end = parse(b, kind)
    print('file', fn, 'ver', ver, 'count', cnt, 'parsed', len(objs), 'end', end, '/', len(b))
    json.dump(objs, open('out/' + fn + '.json', 'w', encoding='utf-8'), ensure_ascii=True)
    for ob in objs[:2]:
        print('OBJ', ob['old'], '->', ob['new'], 'mods', len(ob['mods']))
        for m in ob['mods'][:10]:
            print('   ', m['id'], 't', m['type'], 'lv', m['level'], 'col', m['col'], '=', repr(m['val'])[:70])