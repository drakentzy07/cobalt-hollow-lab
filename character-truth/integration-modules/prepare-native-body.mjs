/* Materialize a SEPARATE Blender-readable body reference, never modify original GLB.
   Khronos glTF Transform reads Meshopt / quantized native rig and writes new plain GLB. */
import path from 'node:path';
import fs from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
const [src,dst]=process.argv.slice(2);
if(!src||!dst)throw Error('USAGE prepare-native-body.mjs ORIGINAL.glb OUT.glb');
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const document=await io.read(src);
const originals=document.getRoot().listSkins();
if(!originals.length||originals.flatMap(s=>s.listJoints()).length<20)throw Error('NATIVE_SKIN_MISSING');
const stats={skins:originals.length,joints:[...new Set(originals.flatMap(s=>s.listJoints().map(j=>j.getName())))],
 meshes:document.getRoot().listMeshes().length,
 nodes:document.getRoot().listNodes().map(n=>({name:n.getName(),mesh:n.getMesh()?.getName(),skin:!!n.getSkin()})).filter(n=>n.skin||/^(M_|Armor_)/.test(n.name)).slice(0,140)};
fs.mkdirSync(path.dirname(dst),{recursive:true});
await io.write(dst,document);
console.log('HIGHFLY_AUTHENTIC_NATIVE_BODY_MESHOPT_DECODED',JSON.stringify(stats));
