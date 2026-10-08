import * as THREE from 'three';
import {normalizeHelmet} from './helmet.mjs';

/** Procedural low-poly-to-smooth feather studio, native HEAD-bone local coordinates. */
export const RECIPE_VERSION = 1;
export const MATERIALS = Object.freeze({
  graphite:{metalness:.72,roughness:.35},
  silver:{metalness:.83,roughness:.29},
  leather:{metalness:.12,roughness:.74},
  arcane:{metalness:.43,roughness:.32}
});
export function defaultRecipe(){
  return {version:1,theme:'CORVUS',material:'graphite',symmetry:true,showFeathers:false,helmet:normalizeHelmet(),
    pieces:[
      {id:'crown',name:'Corona central',x:0,y:.26,z:-.25,length:.82,width:.18,bend:.32,tilt:-.12,twist:0,color:'#718396',accent:'#a8b6cb',mirror:false},
      {id:'temple',name:'Plumas laterales',x:.51,y:.13,z:-.23,length:.74,width:.17,bend:.46,tilt:.38,twist:18,color:'#1a1e2a',accent:'#7766bc',mirror:true},
      {id:'neck',name:'Plumas de nuca',x:.46,y:-.23,z:-.55,length:.67,width:.20,bend:.58,tilt:.27,twist:-16,color:'#303846',accent:'#9aa8bd',mirror:true},
      {id:'spear',name:'Penacho superior',x:.24,y:.47,z:-.19,length:.54,width:.11,bend:.25,tilt:.11,twist:22,color:'#3f475a',accent:'#b2a6d8',mirror:true}
    ]
  };
}
export function sanitizeRecipe(input){
  if(!input||input.version!==RECIPE_VERSION||!Array.isArray(input.pieces))throw Error('Versión de diseño no compatible');
  if(input.pieces.length>60)throw Error('Demasiadas piezas (máximo 60)');
  const range=(v,min,max,alt)=>Number.isFinite(+v)?Math.max(min,Math.min(max,+v)):alt;
  const color=v=>/^#[0-9a-fA-F]{6}$/.test(String(v))?String(v):'#718396';
  return {version:1,theme:String(input.theme||'CORVUS').slice(0,60),material:MATERIALS[input.material]?input.material:'graphite',symmetry:input.symmetry!==false,
    showFeathers:input.showFeathers===true,helmet:normalizeHelmet(input.helmet),
    pieces:input.pieces.map((p,i)=>({
      id:String(p.id||'f'+i).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,42)||'f'+i,
      name:String(p.name||'Pluma '+(i+1)).slice(0,50),
      x:range(p.x,-1.6,1.6,0),y:range(p.y,-1.6,1.6,0),z:range(p.z,-1.6,1.6,0),
      length:range(p.length,.18,1.9,.65),width:range(p.width,.04,.5,.13),
      rx:range(p.rx,-180,180,0),ry:range(p.ry,-180,180,0),rz:range(p.rz,-180,180,0),scale:range(p.scale,.3,2.5,1),
      bend:range(p.bend,-1,1,.3),tilt:range(p.tilt,-1.2,1.2,0),twist:range(p.twist,-75,75,0),
      color:color(p.color),accent:color(p.accent),mirror:p.mirror===true
    }))
  };
}
export function makeFeather(spec,dims,side=1,matType='graphite'){
  // C1 continuous Catmull-Rom spine, ridge + layered ribbon closed as a true mesh.
  const s=spec,headW=dims.x,headH=dims.y,headD=dims.z;
  const w=headW*s.width,L=headH*s.length,curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0),
    new THREE.Vector3(side*s.tilt*L*.20,L*.30,-s.bend*headD*.13),
    new THREE.Vector3(side*s.tilt*L*.64,L*.72,-s.bend*headD*.50),
    new THREE.Vector3(side*s.tilt*L,L,-s.bend*headD)
  ],false,'centripetal');
  const n=24,cols=5,v=[],indices=[],uv=[],twist=THREE.MathUtils.degToRad(s.twist)*side;
  for(let j=0;j<=n;j++){
    const t=j/n,p=curve.getPoint(t),a=twist*t;
    const breadth=w*Math.pow(Math.sin(Math.PI*Math.max(.001,Math.min(.999,t))),.66)*(1-.35*t);
    for(let k=0;k<cols;k++){
      const u=(k/(cols-1))*2-1;
      const ridge=(1-u*u)*breadth*.27;
      const xx=u*breadth*Math.cos(a)-ridge*Math.sin(a),zz=u*breadth*Math.sin(a)+ridge*Math.cos(a);
      v.push(p.x+xx,p.y,p.z+zz);
      uv.push(k/(cols-1),t);
    }
  }
  for(let j=0;j<n;j++)for(let k=0;k<cols-1;k++){
    const a=j*cols+k,b=a+1,c=a+cols,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  // Back surface adds deliberate thickness so export produces closed solid geometry.
  const topCount=v.length/3,thickness=Math.max(.004,headD*.012);
  for(let i=0;i<topCount;i++){v.push(v[i*3],v[i*3+1],v[i*3+2]-thickness);uv.push(uv[i*2],uv[i*2+1]);}
  const first=indices.length;for(let i=0;i<first;i+=3)indices.push(indices[i+2]+topCount,indices[i+1]+topCount,indices[i]+topCount);
  for(let j=0;j<n;j++)for(const k of [0,cols-1]){
    const a=j*cols+k,b=(j+1)*cols+k,c=a+topCount,d=b+topCount;
    if(k===0)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);
  }
  for(let k=0;k<cols-1;k++){
    const e=n*cols+k;
    indices.push(k,k+topCount,k+1,k+1+topCount,k+1,k+topCount);
    indices.push(e,e+1,e+topCount,e+1,e+1+topCount,e+topCount);
  }
  const geom=new THREE.BufferGeometry();
  geom.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geom.setIndex(indices);geom.computeVertexNormals();
  const params=MATERIALS[matType]||MATERIALS.graphite;
  const body=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color:s.color,...params,side:THREE.DoubleSide}));
  body.name='HF_Feather_'+s.id+(side<0?'_L':'_R');
  body.userData.creatorPieceId=s.id;body.castShadow=true;body.receiveShadow=true;
  // Raised center quill and a thin bright gradient-like edge, both independent meshes.
  const quillPath=new THREE.CatmullRomCurve3([.12,.38,.63,.89].map(t=>{
    const p=curve.getPoint(t);p.z+=headD*.012;return p;
  }));
  const quill=new THREE.Mesh(new THREE.TubeGeometry(quillPath,20,Math.max(.0025,headW*.008),5,false),
    new THREE.MeshStandardMaterial({color:s.accent,metalness:.68,roughness:.30}));
  quill.name='HF_Quill_'+s.id+(side<0?'_L':'_R');quill.userData.creatorPieceId=s.id;quill.castShadow=true;
  return [body,quill];
}
export function buildFeatherSet(recipe,bounds){
  const group=new THREE.Group();group.name='HIGHFLY_CREATOR_HEAD_ACCESSORIES';
  group.userData.hfAttachBone='head';group.userData.hfSource='Rig_Medium';
  const center=bounds.center,dims=bounds.size;
  for(const s of recipe.pieces){
    const sides=s.mirror&&recipe.symmetry?[-1,1]:[s.x<0?-1:1];
    for(const side of sides){
      const pivot=new THREE.Group();pivot.name='HF_Piece_'+s.id+(side<0?'_L':'_R');
      pivot.userData.creatorPieceId=s.id;
      pivot.position.set(center.x+side*Math.abs(s.x)*dims.x*.8,center.y+s.y*dims.y,center.z+s.z*dims.z);
      pivot.rotation.set(THREE.MathUtils.degToRad(s.rx||0),THREE.MathUtils.degToRad((s.ry||0)*side),THREE.MathUtils.degToRad((s.rz||0)*side));
      pivot.scale.setScalar(s.scale||1);
      for(const mesh of makeFeather(s,dims,side,recipe.material))pivot.add(mesh);
      group.add(pivot);
    }
  }
  return group;
}
export function checkGeometry(group){
  let meshCount=0,verts=0,nonfinite=0;
  group.traverse(o=>{if(!o.isMesh)return;meshCount++;const p=o.geometry?.attributes?.position;
    if(p){verts+=p.count;for(const x of p.array)if(!Number.isFinite(x))nonfinite++;}});
  return {meshCount,vertices:verts,nonfinite,valid:meshCount>0&&verts>0&&nonfinite===0};
}
