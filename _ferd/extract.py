#!/usr/bin/env python
# Extract WAR3 map internals from an MPQ with decryption support (mpyq lacks it).
import os, sys, struct, zlib, bz2
from io import BytesIO
import mpyq

F_IMPLODE=0x100; F_COMPRESS=0x200; F_ENCRYPTED=0x10000; F_FIX_KEY=0x20000
F_SINGLE_UNIT=0x1000000; F_DELETE=0x2000000; F_SECTOR_CRC=0x4000000; F_EXISTS=0x80000000

# --- PKWARE DCL implode decompressor (compression type 8) ---
def implode_decompress(data):
    try:
        import explode
        return explode.explode(data)
    except Exception:
        pass
    raise RuntimeError("PKWARE implode needs an external decompressor")

def decompress(data):
    if len(data)==0: return data
    ct=data[0]
    if ct==0: return data
    if ct==2: return zlib.decompress(data[1:],15)
    if ct==16: return bz2.decompress(data[1:])
    if ct==8: return implode_decompress(data[1:])
    raise RuntimeError("Unsupported compression type: %d" % ct)

def decrypt_full(self, data, key):
    seed1=key&0xFFFFFFFF; seed2=0xEEEEEEEE; crypt=self.encryption_table
    out=bytearray(); n=len(data); i=0
    while i+4<=n:
        seed2=(seed2+crypt[0x400+(seed1&0xFF)])&0xFFFFFFFF
        value=struct.unpack('<I',data[i:i+4])[0]
        value=(value^(seed1+seed2))&0xFFFFFFFF
        seed1=(((~seed1<<0x15)+0x11111111)|(seed1>>0x0B))&0xFFFFFFFF
        seed2=(value+seed2+(seed2<<5)+3)&0xFFFFFFFF
        out+=struct.pack('<I',value); i+=4
    if i<n:
        out+=data[i:n]
    return bytes(out)

def read_file_dec(self, filename, force_decompress=False):
    he=self.get_hash_table_entry(filename)
    if he is None: return None
    be=self.block_table[he.block_table_index]
    if not (be.flags & F_EXISTS): return None
    if be.archived_size==0: return None
    offset=be.offset+self.header['offset']
    self.file.seek(offset)
    file_data=self.file.read(be.archived_size)

    key=None
    if be.flags & F_ENCRYPTED:
        base=filename.replace('/','\\').split('\\')[-1]
        key=self._hash(base,'TABLE')
        if be.flags & F_FIX_KEY:
            key=((key+be.offset)&0xFFFFFFFF)^be.size

    if not (be.flags & F_SINGLE_UNIT):
        sector_size=512<<self.header['sector_size_shift']
        sectors=be.size//sector_size+1
        crc=bool(be.flags & F_SECTOR_CRC)
        if crc: sectors+=1
        num_off=sectors+1
        off_size=num_off*4
        raw_off=file_data[:off_size]
        if key is not None:
            raw_off=decrypt_full(self,raw_off,(key-1)&0xFFFFFFFF)
        positions=struct.unpack('<%dI'%num_off,raw_off)
        result=BytesIO()
        left=be.size
        data_sectors=sectors-(1 if crc else 0)
        for i in range(data_sectors):
            if i+1>=len(positions): break
            sector=file_data[positions[i]:positions[i+1]]
            if key is not None:
                sector=decrypt_full(self,sector,(key+i)&0xFFFFFFFF)
            if (be.flags & F_COMPRESS) and (force_decompress or left>len(sector)):
                sector=decompress(sector)
            left-=len(sector)
            result.write(sector)
        return result.getvalue()
    else:
        if key is not None:
            file_data=decrypt_full(self,file_data,(key-1)&0xFFFFFFFF)
        if (be.flags & F_COMPRESS) and (force_decompress or be.size>be.archived_size):
            file_data=decompress(file_data)
        return file_data

mpyq.MPQArchive.read_file=read_file_dec

def main():
    path=sys.argv[1] if len(sys.argv)>1 else 'map.mpq'
    arc=mpyq.MPQArchive(path,listfile=False)
    # read listfile via decryption
    lf=read_file_dec(arc,'(listfile)')
    files=[]
    if lf:
        files=[x for x in lf.replace(b'\r\n',b'\n').split(b'\n') if x]
    print("LISTFILE entries:",len(files))
    os.makedirs('out',exist_ok=True)
    with open('out/_listfile.txt','wb') as f: f.write(lf or b'')
    # Always try the key gameplay files even if listfile is partial
    targets=['war3map.j','war3map.w3i','war3map.w3u','war3map.w3t','war3map.w3a',
             'war3map.w3b','war3map.w3d','war3map.w3h','war3map.w3q','war3map.wts',
             'war3map.txt','war3map.lua','war3mapMisc.txt','war3mapSkin.txt',
             'war3mapExtra.txt','war3map.wtg','war3map.wct','war3map.imp',
             '(attributes)','(signature)']
    got=[]
    for t in targets:
        try:
            d=read_file_dec(arc,t)
        except Exception as e:
            print("ERR",t,repr(e)); continue
        if d is not None:
            fn='out/'+t.replace('(','_').replace(')','_')
            with open(fn,'wb') as f: f.write(d)
            got.append((t,len(d)))
    for t,n in got: print("OK  %-24s %d bytes"%(t,n))
    # dump full listfile names for reference
    if files:
        names=[x.decode('utf-8','replace') for x in files]
        interesting=[n for n in names if n.lower().endswith(('.j','.lua','.txt','.w3i','.w3u','.w3t','.w3a','.w3b','.w3d','.w3h','.w3q','.wts','.wtg','.wct','.imp','.slk'))]
        with open('out/_interesting.txt','w',encoding='utf-8') as f:
            f.write('\n'.join(interesting))
        print("Interesting script/data files:",len(interesting))

if __name__=='__main__':
    main()