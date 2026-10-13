/** HIGHFLY SKIN 8 / native articulation continuity pass.
 * Runtime-only additions. No GLB, skeleton, source animation or public app edits.
 * Derived from the 11 verified canonical Paladin slots. Artistic approval pending.
 */
import * as THREE from 'three';
const S=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const bounds=m=>new THREE.Box3().setFromBufferAttribute(m.geometry.getAttribute('position'));
const center=b=>b.getCenter(new THREE.Vector3());
const size=b=>b.getSize(new THREE.Vector3());
function donors(scene){
 const map=new Map(S.map(s=>[s,[]]));
 scene.traverse(o=>{
  const slot=o.name?.startsWith('Armor_paladin_')?o.name.slice('Armor_paladin_'.length):'';
  if(!map.has(slot))return;
  o.traverse(child=>{
   if(child.isSkinnedMesh&&child.name?.startsWith('Armor_paladin_')&&!map.get(slot).includes(child))map.get(slot).push(child);
  });
 });
 if([...map.values()].flat().length!==17||[...map.values()].some(v=>!v.length))throw Error('SKIN8_NATIVE_17_FAIL');
 return new Map([...map].map(([k,v])=>[k,v.sort((a,b)=>b.geometry.attributes.position.count-a.geometry.attributes.position.count)[0]]));
}
function projectSkin(host,g){
 const a=host.geometry.attributes.position,ix=host.geometry.attributes.skinIndex,wt=host.geometry.attributes.skinWeight,d=g.attributes.position;
 const ii=new Uint16Array(d.count*4),ww=new Float32Array(d.count*4);
 for(let i=0;i<d.count;i++){
  let nearest=0,min=Infinity;const x=d.getX(i),y=d.getY(i),z=d.getZ(i);
  for(let j=0;j<a.count;j++){const dist=(x-a.getX(j))**2+(y-a.getY(j))**2+(z-a.getZ(j))**2;if(dist<min){min=dist;nearest=j;}}
  let sum=0;for(let k=0;k<4;k++){ii[i*4+k]=ix.getComponent(nearest,k);ww[i*4+k]=wt.getComponent(nearest,k);sum+=ww[i*4+k];}
  if(sum<1e-8){ii[i*4]=0;ww[i*4]=1;}else for(let k=0;k<4;k++)ww[i*4+k]/=sum;
 }
 g.setAttribute('skinIndex',new THREE.BufferAttribute(ii,4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(ww,4));
 return g;
}
export function integrateNativeArmor(gltf,style){
 const dm=donors(gltf.scene),added=[],ids=new Set();
 const palette={
 violet:[0x080c18,0xaaaecb,0x713bb8],dragon:[0x30100d,0xe3a052,0x932b22],
 celestial:[0x9aaed0,0xf2d899,0x73d7ff],royal:[0xbfc8d5,0xe4b44e,0x285ab3],
 berserker:[0x18171b,0xb3a49a,0x69232c],arcane:[0x272b60,0x8d85d1,0x43c9cb]
 }[style];
 if(!palette)throw Error('SKIN8_STYLE_UNKNOWN '+style);
 const materials=palette.map((c,i)=>new THREE.MeshStandardMaterial({color:c,roughness:i===0?.64:.29,metalness:i===0?.25:.72,side:THREE.DoubleSide}));
 const shell=(slot,tag,g,material=0)=>{
  const host=dm.get(slot);if(!host)throw Error('SKIN8_MISSING_SLOT '+slot);
  g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new THREE.SkinnedMesh(projectSkin(host,g),materials[material]);
  mesh.name='HF_SKIN8_'+style+'_'+slot+'_'+tag;
  mesh.bind(host.skeleton,host.bindMatrix.clone());mesh.frustumCulled=false;host.parent.add(mesh);
  added.push(mesh);ids.add(slot);return mesh;
 };
 const capsule=(slot,tag,a,b,r1,r2,mat=0)=>{
  const path=b.clone().sub(a),len=path.length();if(len<.0001)return;
  const g=new THREE.CylinderGeometry(r2,r1,len,12,1,false);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),path.normalize()));
  g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());shell(slot,tag,g,mat);
 };
 const chest=bounds(dm.get('Chest')),head=bounds(dm.get('Head'));const C=center(chest),H=center(head),cs=size(chest),hs=size(head);
 // Continuous close-fitting neck gasket: sits between head/chest bounds rather than floating above either.
 const neckBottom=Math.min(chest.max.y,head.min.y),neckTop=Math.max(chest.max.y,head.min.y);
 const lo=Math.min(neckBottom,neckTop),hi=Math.max(neckBottom,neckTop);
 const neckR=Math.min(cs.x,hs.x)*.28;
 capsule('Chest','cervical-gasket',new THREE.Vector3(H.x,lo-.015,C.z),new THREE.Vector3(H.x,hi+.025,H.z),neckR,neckR*.91,0);
 const collarY=chest.max.y-cs.y*.045;
 const collar=new THREE.TorusGeometry(neckR*1.18,Math.max(.009,cs.x*.012),8,24);
 collar.rotateX(Math.PI*.5);collar.translate(H.x,collarY,H.z);shell('Chest','collar-rim',collar,1);
 // Continuous waist and segmented hanging tassets share native torso & leg articulation.
 const beltY=chest.min.y+cs.y*.12, waistW=cs.x*.81;
 const belt=new THREE.BoxGeometry(waistW,cs.y*.10,cs.z*.60);
 belt.translate(C.x,beltY,C.z);shell('Chest','waist-belt',belt,0);
 for(const [side,slot] of [[-1,'LegL'],[1,'LegR']]){
  const leg=bounds(dm.get(slot)),L=center(leg),ls=size(leg);
  const start=new THREE.Vector3(L.x,beltY-cs.y*.01,C.z);
  const end=new THREE.Vector3(L.x,Math.max(leg.min.y+ls.y*.70,beltY-cs.y*.30),L.z);
  capsule(slot,'articulated-tasset',start,end,Math.max(.018,ls.x*.37),Math.max(.014,ls.x*.28),side<0?1:0);
  const kneeY=leg.min.y+ls.y*.36;
  const knee=new THREE.SphereGeometry(Math.max(.025,ls.x*.41),12,8);
  knee.scale(1,.59,.65);knee.translate(L.x,kneeY,leg.max.z+ls.z*.045);
  shell(slot,'knee-cup',knee,1);
  const footSlot=side<0?'FootL':'FootR',foot=bounds(dm.get(footSlot)),F=center(foot);
  capsule(slot,'greave-transition',new THREE.Vector3(L.x,kneeY-ls.y*.10,L.z),new THREE.Vector3(F.x,foot.max.y,F.z),Math.max(.014,ls.x*.32),Math.max(.014,ls.x*.30));
 }
 for(const slot of ['ArmL','ArmR']){
  const arm=bounds(dm.get(slot)),A=center(arm),as=size(arm);
  const joint=new THREE.SphereGeometry(Math.max(.02,as.x*.44),12,8);
  joint.scale(1,.70,.83);joint.translate(A.x,arm.max.y-as.y*.16,A.z);
  shell(slot,'pauldron-joint',joint,0);
  // Tabbed transition tucked underneath the outer pauldron.
  capsule(slot,'shoulder-underlap',
   new THREE.Vector3(A.x*.75+C.x*.25,arm.max.y-as.y*.12,A.z),
   new THREE.Vector3(A.x,arm.max.y-as.y*.36,A.z),Math.max(.018,as.x*.36),Math.max(.015,as.x*.31),1);
 }
 if(style==='berserker'||style==='dragon'){
  // Keep silhouettes weighted on the shoulder joint; no unbound decorative objects.
  for(const slot of ['ArmL','ArmR']){
   const b=bounds(dm.get(slot)),p=center(b),s=size(b);
   const g=new THREE.SphereGeometry(s.x*(style==='berserker'?.67:.49),12,8);
   g.scale(1,.55,1.10);g.translate(p.x,b.max.y-s.y*.18,p.z);shell(slot,'signature-heavy-pauldrons',g,2);
  }
 }
 const proof={pass:'SKIN8_NATIVE_CONTINUITY_01',connectors:added.length,
  nativeSlots:dm.size,originalPrimitives:17,originalBones:23,clips:gltf.animations.length,
  allConnectorsSkinned:added.every(m=>m.isSkinnedMesh&&m.skeleton.bones.length===23),
  connectorSlots:[...ids],sourceImmutable:true,artReviewed:false,clippingReviewed:false,physicalAndroid:false};
 if(proof.clips!==22||!proof.allConnectorsSkinned)throw Error('SKIN8_CONTINUITY_GATE_RED');
 return proof;
}
