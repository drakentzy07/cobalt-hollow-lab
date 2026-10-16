#!/usr/bin/env python3
"""Lossless Radiance RGBE scanline RLE encoder for HIGHFLY Pages staging.

Only compresses files containing truly uncompressed 32-bit RGBE scanlines,
despite their FORMAT=32-bit_rle_rgbe header. Every output is decoded and
compared byte-for-byte to the original raw pixel data before replacement.
No image dimension, RGBE exponent, color, channel, header, or path changes.
Never processes non-RGBE, already RLE, or incomplete inputs.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path

RESOLUTION = re.compile(rb'(?m)^-Y ([0-9]+) \+X ([0-9]+)\r?\n')
WIDTH_LIMIT = 32767

def encode_channel(src: bytes) -> bytes:
    out=bytearray()
    n=len(src)
    i=0
    while i<n:
        run=1
        while i+run<n and run<127 and src[i+run]==src[i]:
            run+=1
        if run>=4:
            out.extend((128+run,src[i]))
            i+=run
            continue
        start=i
        i+=run
        while i<n and i-start<128:
            nxt=1
            while i+nxt<n and nxt<127 and src[i+nxt]==src[i]:
                nxt+=1
            if nxt>=4:
                break
            i+=min(nxt,128-(i-start))
        out.append(i-start)
        out.extend(src[start:i])
    return bytes(out)

def decode_rle_scanline(payload:memoryview, offset:int, width:int) -> tuple[bytes,int]:
    if bytes(payload[offset:offset+4])!=bytes((2,2,width>>8,width&255)):
        raise ValueError('Scanline header invalid')
    offset+=4
    channels=[]
    for _ in range(4):
        ch=bytearray()
        while len(ch)<width:
            if offset>=len(payload):raise ValueError('Truncated RLE')
            count=payload[offset];offset+=1
            if count==0:raise ValueError('Invalid zero RLE packet')
            if count>128:
                if offset>=len(payload):raise ValueError('Truncated repeat')
                ch.extend(bytes((payload[offset],))*(count-128));offset+=1
            else:
                if offset+count>len(payload):raise ValueError('Truncated literals')
                ch.extend(payload[offset:offset+count]);offset+=count
            if len(ch)>width:raise ValueError('Channel overflow')
        channels.append(ch)
    interleaved=bytearray(width*4)
    for k,ch in enumerate(channels):interleaved[k::4]=ch
    return bytes(interleaved),offset

def compress_lossless(original:bytes)->tuple[bytes,dict]|None:
    match=RESOLUTION.search(original)
    if not match or b'FORMAT=32-bit_rle_rgbe' not in original[:match.start()]:
        return None
    h,w=map(int,match.groups())
    if not (8<=w<=WIDTH_LIMIT and 1<=h<=16384):return None
    start=match.end()
    raw=memoryview(original)[start:]
    if len(raw)!=w*h*4:return None  # Already RLE, variant, or malformed.
    output=bytearray(original[:start])
    source_sha=hashlib.sha256(raw).hexdigest()
    for y in range(h):
        line=raw[y*w*4:(y+1)*w*4]
        output.extend((2,2,w>>8,w&255))
        for channel in range(4):
            output.extend(encode_channel(bytes(line[channel::4])))
    if len(output)>=len(original):return None
    new=bytes(output)
    compressed=memoryview(new)[start:]
    pos=0
    checksum=hashlib.sha256()
    for y in range(h):
        scan,pos=decode_rle_scanline(compressed,pos,w)
        checksum.update(scan)
    if pos!=len(compressed) or checksum.hexdigest()!=source_sha:
        raise ValueError('PIXEL_SHA256_MISMATCH')
    return new,dict(width=w,height=h,before=len(original),
                    after=len(new),saved=len(original)-len(new),pixel_sha256=source_sha)

def optimize(root:Path,dry_run:bool,minimum:int=500000)->dict:
    report=[]
    for path in sorted(root.glob('media/env/*.hdr')):
        original=path.read_bytes()
        compressed=compress_lossless(original)
        if compressed is None:continue
        new,meta=compressed
        if meta['saved']<minimum:continue
        if not dry_run:
            # Per-file atomic replace; staged Pages tree ONLY, never source or live.
            import os,tempfile
            fd,tmp=tempfile.mkstemp(prefix='.hdr-rle-',dir=str(path.parent))
            try:
                with os.fdopen(fd,'wb') as f:
                    f.write(new)
                    f.flush()
                    os.fsync(f.fileno())
                os.replace(tmp,path)
            finally:
                if os.path.exists(tmp):os.unlink(tmp)
        report.append({'path':str(path.relative_to(root)),**meta})
    return {'mode':'dry-run' if dry_run else 'stage-only',
            'files':len(report),'saved_bytes':sum(d['saved'] for d in report),
            'details':report}

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('root',type=Path)
    ap.add_argument('--dry-run',action='store_true')
    ap.add_argument('--minimum-saved',type=int,default=500000)
    args=ap.parse_args()
    report=optimize(args.root,args.dry_run,args.minimum_saved)
    print('HIGHFLY_LOSSLESS_HDR_RLE='+json.dumps(report))
