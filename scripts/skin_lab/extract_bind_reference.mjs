// HIGHFLY Skin Factory — bind-frame reference extractor.
// Reuses the exact Harbormaster math from frozen ClaudeCraft
// scripts/assets/harbormaster_gear/extract_reference.mjs @
// 9b57e49c9676d75962700f828cc00a50a9a988b5.
//
// Never edits warrior_modular.glb. It decodes/dequantizes it, enumerates the
// REAL joints present in its skins, and writes unskinned preview geometry
// transformed by that joint's inverseBindMatrix into the joint bind frame.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'../..');
const DEFAULT_SRC=path.join(ROOT,'public/models/chars/modular/warrior_modular.glb');
const DEFAULT_OUT=path.join(ROOT,'tmp/skin_lab_refs');
export const DEFAULT_REFERENCE_PARTS=[
  'M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR',
  'M_LegL','M_LegR','M_FootL','M_FootR','M_Loin',
  'M_Ear_round','M_Eye_almond','M_Brow_soft','M_Mouth_neutral',
];

function mul(m,v){
  return [
    m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],
    m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],
    m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14],
  ];
}

export async function loadModularBody(file=DEFAULT_SRC){
  await MeshoptDecoder.ready;
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({'meshopt.decoder':MeshoptDecoder});
  const doc=await io.read(file);
  await doc.transform(dequantize());
  return doc;
}

export function realJointNames(doc){
  const names=new Set();
  for(const skin of doc.getRoot().listSkins())
    for(const joint of skin.listJoints()) if(joint.getName()) names.add(joint.getName());
  return [...names].sort();
}

export function boneFramePart(doc,name,bone){
  const node=doc.getRoot().listNodes().find(n=>n.getName()===name||n.getMesh()?.getName()===name);
  const skin=node?.getSkin();
  if(!node||!skin) throw new Error(`no skinned part ${name}`);
  const j=skin.listJoints().findIndex(n=>n.getName()===bone);
  if(j<0) throw new Error(`${name}: no joint ${bone}`);
  const ibm=skin.getInverseBindMatrices()?.getElement(j,new Array(16));
  if(!ibm||ibm.some(v=>!Number.isFinite(v)))
    throw new Error(`${name}: invalid inverseBindMatrix for ${bone}`);
  return node.getMesh().listPrimitives().map(prim=>{
    const pos=prim.getAttribute('POSITION');
    if(!pos) throw new Error(`${name}: primitive without POSITION`);
    const out=new Float32Array(pos.getCount()*3),v=[0,0,0];
    for(let i=0;i<pos.getCount();i++) out.set(mul(ibm,pos.getElement(i,v)),i*3);
    const idx=prim.getIndices();
    return {positions:out,indices:idx?new Uint32Array(idx.getArray()):null};
  });
}

export async function writeBoneReference(src,outDir,bone,parts=DEFAULT_REFERENCE_PARTS){
  const joints=realJointNames(src);
  if(!joints.includes(bone)) throw new Error(`unknown joint "${bone}"`);
  const doc=new Document(),buf=doc.createBuffer(),scene=doc.createScene('HIGHFLY_BIND_REFERENCE');
  let written=0;
  for(const name of parts){
    let chunks;
    try{chunks=boneFramePart(src,name,bone)}catch{continue}
    const mesh=doc.createMesh(name);
    for(const {positions,indices} of chunks){
      const prim=doc.createPrimitive().setAttribute(
        'POSITION',doc.createAccessor().setType('VEC3').setArray(positions).setBuffer(buf)
      );
      if(indices) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(indices).setBuffer(buf));
      mesh.addPrimitive(prim);
    }
    scene.addChild(doc.createNode(name).setMesh(mesh));written++;
  }
  if(!written) throw new Error(`no reference parts supported joint ${bone}`);
  mkdirSync(outDir,{recursive:true});
  const safe=bone.replace(/[^A-Za-z0-9_.-]/g,'_');
  const file=path.join(outDir,`reference_${safe}.glb`);
  await new NodeIO().write(file,doc);
  return {file,bone,parts:written};
}

function parseArgs(argv){
  const out={src:DEFAULT_SRC,out:DEFAULT_OUT,bones:[],list:false,all:false};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(a==='--src') out.src=path.resolve(argv[++i]);
    else if(a==='--out') out.out=path.resolve(argv[++i]);
    else if(a==='--bone') out.bones.push(argv[++i]);
    else if(a==='--list') out.list=true;
    else if(a==='--all') out.all=true;
    else throw new Error(`unknown argument ${a}`);
  }
  return out;
}

async function main(){
  const opt=parseArgs(process.argv.slice(2));
  const src=await loadModularBody(opt.src);
  const joints=realJointNames(src);
  if(opt.list||(!opt.bones.length&&!opt.all)){
    console.log(JSON.stringify({source:opt.src,joints},null,2));
    if(!opt.bones.length&&!opt.all) return;
  }
  const requested=opt.all?joints:opt.bones;
  for(const bone of requested){
    const r=await writeBoneReference(src,opt.out,bone);
    console.log(`BIND_REFERENCE_OK ${r.bone} ${path.relative(process.cwd(),r.file)} parts=${r.parts}`);
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();
