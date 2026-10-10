#!/usr/bin/env node
/** SKIN7 BLOCK 1: audit actual pinned GREEN V20 GLB artifacts, not synthetic fixtures.
 * This is read-only and reports what is present, including limits. It never modifies GLBs.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.argv[2]||'character-truth/skin7-frozen-v20/assets';
const out=process.argv[3]||'character-truth/skin7-evidence/audit-native-assets.json';
const files=['HIGHFLY-V19-LEGENDARY-COMBINED.glb',
 'HIGHFLY-V19-LEGENDARY-ORNAMENTS.glb','HIGHFLY-NIGHTFALL-rigged-body.glb',
 'HIGHFLY-KAGE-ONI-head.glb'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function inspect(file){
 const buf=fs.readFileSync(root+'/'+file);
 assert(buf.length>=10000&&buf.length<=20_000_000,'ASSET_BYTES_OUT_OF_EXPECTED_RANGE_'+file);
 assert.equal(buf.toString('ascii',0,4),'glTF','GLB_MAGIC_'+file);
 assert.equal(buf.readUInt32LE(4),2,'GLB_VERSION_'+file);
 assert.equal(buf.readUInt32LE(8),buf.length,'GLB_LENGTH_'+file);
 const jsonlen=buf.readUInt32LE(12);
 assert(jsonlen<=buf.length-20&&buf.readUInt32LE(16)===0x4e4f534a,'GLB_JSON_CHUNK_INVALID');
 const gltf=JSON.parse(buf.toString('utf8',20,20+jsonlen).trim());
 assert.equal(gltf.asset?.version,'2.0');
 const nodes=gltf.nodes||[],meshes=gltf.meshes||[],skins=gltf.skins||[];
 const names=nodes.map(n=>n.name||'');
 const joints=skins.flatMap(x=>x.joints||[]).map(i=>nodes[i]?.name);
 const uniqueJoints=[...new Set(joints)];
 const authored=names.filter(n=>/^HFV(?:8|12|19)_[MF]_(?:CHEST|BACK|ARMS|HANDS|LEGS|FEET)_/.test(n));
 const v19=names.filter(n=>/^HFV19_[MF]_/.test(n));
 const skinned=nodes.filter(n=>Number.isInteger(n.skin)&&Number.isInteger(n.mesh));
 const badSkinNodes=skinned.filter(n=>!skins[n.skin]);
 const badPrimitives=skinned.filter(n=>(meshes[n.mesh]?.primitives||[]).some(p=>
  !Number.isInteger(p.attributes?.JOINTS_0)||!Number.isInteger(p.attributes?.WEIGHTS_0)));
 assert.equal(badSkinNodes.length,0,'MISSING_SKIN_'+file);
 assert.equal(badPrimitives.length,0,'MISSING_VERTEX_JOINT_WEIGHT_'+file);
 const isBody=file.includes('NIGHTFALL'),isV19=file.includes('V19');
 if(isBody||isV19){
  assert(skins.length>0,'RIGGED_GLTF_REQUIRED_'+file);
  assert(uniqueJoints.includes('head')&&uniqueJoints.includes('upperarm.l')&&
    uniqueJoints.includes('upperarm.r')&&uniqueJoints.includes('spine'),
    'GENUINE_BONE_NAMES_MISSING_'+file);
  assert(uniqueJoints.length<=23&&uniqueJoints.length>=20,'NATIVE_23_RIG_MISMATCH_'+file);
  assert(skinned.length>=30,'INSUFFICIENT_WEIGHTED_MESHES_'+file);
  assert.equal(nodes.filter(n=>/^(M_|F_)(Head|Torso|Arm[LR]|Hand[LR]|Leg[LR]|Foot[LR]|Loin)$/.test(n)).length,0,
   'FORBIDDEN_ORIGINAL_BODY_MESH_IN_ARMOR_GLTF_'+file);
 }
 if(isV19)assert(v19.length===32,'V19_NEW_GEOMETRY_COUNT_DRIFT_'+v19.length);
 return {filename:file,sha256:sha(buf),bytes:buf.length,
  gltfVersion:gltf.asset?.version,meshCount:meshes.length,
  skinCount:skins.length,skinnedMeshNodes:skinned.length,
  originalJointNames:uniqueJoints.sort(),originalJointCount:uniqueJoints.length,
  hasRigMediumNode:names.includes('Rig_Medium'),
  v19NewAuthoredNodes:v19.length,allAuthoredArmorNodes:authored.length,
  originalBodySourceNodes:0,materials:(gltf.materials||[]).length,
  assetGenerator:gltf.asset?.generator||null};
}
const assets=files.map(inspect);
const report={schema:'highfly.skin7.native-asset-audit/1',checkedFrom:'PINNED_GREEN_V20_ARTIFACT',
 nativeExpected:'Rig_Medium, 23 source bones',sourceOriginalCharacterNotBundled:true,
 assets,limitations:[
 'Static glTF/GLB structure and joint-names checked; this does not prove inverse bind matrices match native actor at animation time.',
 'Blender weighted deformation and original browser mounting were previously tested in the V19 and V20 GREEN workflows.',
 'Does NOT validate actual Unity Editor import, shader fidelity, real physical S23, triangle-level clipping, or premium art quality.'
 ]};
fs.mkdirSync(out.slice(0,out.lastIndexOf('/')),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log('HIGHFLY_SKIN7_STEP1_PINNED_REAL_GLB_NATIVE_ASSET_AUDIT_GREEN=1 '+assets.map(a=>a.filename+':'+a.skinnedMeshNodes).join(' '));
