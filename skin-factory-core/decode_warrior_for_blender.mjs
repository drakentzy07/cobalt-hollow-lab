/** Decode meshopt + dequantize original source for real Blender transfer cage. */
import {loadModularBody} from '../scripts/skin_lab/extract_bind_reference.mjs';
import {NodeIO} from '@gltf-transform/core';
import {pathToFileURL} from 'node:url';
const [src,dst]=process.argv.slice(2);
if(!src||!dst)throw Error('USAGE node decode_warrior_for_blender.mjs source.glb uncompressed.glb');
const d=await loadModularBody(src);
if(d.getRoot().listAnimations().length!==22)throw Error('SOURCE_22_CLIPS_REQUIRED');
if(!d.getRoot().listSkins().some(s=>s.listJoints().length===23))throw Error('SOURCE_23_BONE_SKIN_REQUIRED');
await new NodeIO().write(dst,d);
console.log('HIGHFLY_CLAUDECRAFT_BLENDER_MESHOPT_DECODED',dst);
