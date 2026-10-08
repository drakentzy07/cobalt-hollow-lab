/**
 * HIGHFLY official GLB Meshopt buffer inspection, read-only.
 * Decode into SEPARATE scratch files for the Python inventory reader.
 * The original GLB bytes, hierarchy, mesh / material names and joints stay untouched.
 * Restrict to local GLB BIN chunk and EXT_meshopt_compression buffers.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {MeshoptDecoder} from 'meshoptimizer';

const [source,dest]=process.argv.slice(2);
if(!source||!dest)throw Error('Usage: node decode_meshopt.mjs input.glb decoded-dir');
const raw=fs.readFileSync(source);
if(raw.toString('ascii',0,4)!=='glTF'||raw.readUInt32LE(4)!==2||raw.readUInt32LE(8)!==raw.length)
  throw Error('Invalid glTF 2 GLB header/length');
let p=12,model=null,bin=null;
while(p<raw.length){
  const n=raw.readUInt32LE(p),kind=raw.readUInt32LE(p+4);p+=8;
  if(p+n>raw.length)throw Error('Corrupt GLB chunk');
  if(kind===0x4e4f534a)model=JSON.parse(raw.subarray(p,p+n).toString('utf8'));
  if(kind===0x004e4942){
    if(bin)throw Error('Multiple physical BIN chunks not supported');
    bin=raw.subarray(p,p+n);
  }
  p+=n;
}
if(!model||!bin)throw Error('Missing GLB JSON or BIN');
const metadata={file:path.basename(source),sha256:crypto.createHash('sha256').update(raw).digest('hex'),
  originalBytes:raw.length,originalBufferDeclarations:model.buffers,
  requiredExtensions:model.extensionsRequired||[],virtualBuffers:[]};
await MeshoptDecoder.ready;
const byIndex=new Map();
for(let i=1;i<(model.buffers||[]).length;i++){
  const spec=model.buffers[i];
  if(spec.uri)throw Error('Refusing external virtual buffer '+i+' '+spec.uri.slice(0,35));
  if(!Number.isSafeInteger(spec.byteLength)||spec.byteLength>256*1024*1024)
    throw Error('Out-of-range virtual buffer declaration '+i);
  byIndex.set(i,{data:Buffer.alloc(spec.byteLength),ranges:[]});
}
let views=0;
for(let i=0;i<(model.bufferViews||[]).length;i++){
  const v=model.bufferViews[i],ext=v.extensions?.EXT_meshopt_compression;
  if(!ext)continue;
  const destination=byIndex.get(v.buffer);
  if(!destination)throw Error('Compressed view destination buffer unavailable '+i+' buffer='+v.buffer);
  if(ext.buffer!==0)throw Error('Compressed input must refer to actual GLB BIN chunk: view='+i);
  const inputStart=ext.byteOffset||0,compressedLen=ext.byteLength;
  const targetStart=v.byteOffset||0;
  const decompressedLen=ext.count*ext.byteStride;
  if(!Number.isSafeInteger(decompressedLen)||decompressedLen!==v.byteLength)
    throw Error('Decompressed view size mismatch '+i);
  if(inputStart<0||compressedLen<=0||inputStart+compressedLen>bin.length||
     targetStart<0||targetStart+decompressedLen>destination.data.length)
     throw Error('GLB compressed view exceeds buffer boundaries '+i);
  const src=bin.subarray(inputStart,inputStart+compressedLen);
  const dst=destination.data.subarray(targetStart,targetStart+decompressedLen);
  MeshoptDecoder.decodeGltfBuffer(dst,ext.count,ext.byteStride,src,ext.mode,ext.filter||'NONE');
  destination.ranges.push([targetStart,targetStart+decompressedLen]);
  views++;
}
if(!views&&byIndex.size)throw Error('No EXT_meshopt_compression views were found despite virtual buffers');
fs.mkdirSync(dest,{recursive:true});
for(const [i,item] of byIndex.entries()){
  if(item.ranges.length===0)throw Error('Unpopulated virtual buffer '+i);
  const filename='decoded-buffer-'+i+'.bin';
  fs.writeFileSync(path.join(dest,filename),item.data);
  metadata.virtualBuffers.push({index:i,byteLength:item.data.length,decodedViews:item.ranges.length,
    sha256:crypto.createHash('sha256').update(item.data).digest('hex')});
}
fs.writeFileSync(path.join(dest,'meshopt-decoding-evidence.json'),JSON.stringify(metadata,null,2));
console.log('OFFICIAL_MESHOPT_DECODED_GREEN=1',JSON.stringify({
  input:metadata.file,decodedViews:views,virtualBuffers:metadata.virtualBuffers
}));
