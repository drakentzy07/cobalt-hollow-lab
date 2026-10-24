// Verify GLTFLoader (the actual THREE parser used by ClaudeCraft) accepts
// both legal neutral replacement GLBs. Run after sanitization in candidate.
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
for(const name of ['harbormaster_tricorne.glb','harbormaster_spyglass.glb']){
 const bytes=readFileSync('public/models/chars/npc_gear/'+name);
 const input=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
 const out=await new Promise((resolve,reject)=>new GLTFLoader().parse(input,'',resolve,reject));
 if(!out?.scene||out.scene.children.length!==0) throw Error('HIGHFLY_G4_EMPTY_GLB_RENDER_NOT_EMPTY_'+name);
 console.log('HIGHFLY_G4_THREE_GLTF_LOADER_NEUTRAL_ACCESSORY_PASS='+name);
}
