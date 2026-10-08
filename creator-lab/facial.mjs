import * as THREE from 'three';

// HIGHFLY native facial landmarks. All coordinates stay in Rig_Medium / head bind space.
// Never invent eye or mouth coordinates; report a missing anatomical mesh explicitly.
const NAMES=Object.freeze({eye:'M_Eye_almond',brow:'M_Brow_soft',mouth:'M_Mouth_neutral',head:'M_Head'});
function getPoints(scene,name){
  const node=scene.getObjectByName(name);
  if(!node)return [];
  node.updateWorldMatrix(true,true);
  const pts=[];
  node.traverse(o=>{
    if(!o.isMesh||!o.geometry?.attributes?.position)return;
    o.updateWorldMatrix(true,false);
    const a=o.geometry.attributes.position,p=new THREE.Vector3();
    for(let i=0;i<a.count;i++){
      p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);
      if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z))pts.push(p.clone());
    }
  });
  return pts;
}
function median(nums){if(!nums.length)return null;const a=[...nums].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]}
function center(points){if(!points.length)return null;return new THREE.Vector3(median(points.map(x=>x.x)),median(points.map(x=>x.y)),median(points.map(x=>x.z)))}
export function nativeFacialLandmarks(referenceScene){
  const mesh=referenceScene.getObjectByName(NAMES.head);
  if(!mesh)throw Error('M_Head bind real ausente; guías anatómicas canceladas');
  const base=new THREE.Box3().setFromObject(mesh),headCenter=base.getCenter(new THREE.Vector3());
  const points={};for(const [part,name] of Object.entries(NAMES))points[part]=getPoints(referenceScene,name);
  const rawEye=points.eye,eps=base.getSize(new THREE.Vector3()).x*.045;
  const left=rawEye.filter(v=>v.x<headCenter.x-eps),right=rawEye.filter(v=>v.x>headCenter.x+eps);
  const leftCenter=center(left),rightCenter=center(right);
  const exact=!!(leftCenter&&rightCenter&&left.length>6&&right.length>6);
  const midEyes=exact?(leftCenter.y+rightCenter.y)/2:null;
  const brow=center(points.brow),mouth=center(points.mouth);
  const data={
    source:'reference_head.glb / authentic inverseBindMatrix',
    verified:exact,meshNames:Object.fromEntries(Object.entries(NAMES).map(([key,name])=>[key,!!referenceScene.getObjectByName(name)])),
    leftEye:leftCenter,rightEye:rightCenter,eyeY:midEyes,brow,mouth,
    headSize:base.getSize(new THREE.Vector3()),headCenter,
    samples:{eye:rawEye.length,left:left.length,right:right.length,brow:points.brow.length,mouth:points.mouth.length}
  };
  return data;
}
export function facialOverlay(landmarks){
  const group=new THREE.Group();group.name='HIGHFLY_NATIVE_FACE_LANDMARKS';
  group.userData.reference='real_GLB_head_bind';
  const markers=[['L',landmarks.leftEye,0x80e0ff],['R',landmarks.rightEye,0x80e0ff],
    ['CEJA',landmarks.brow,0xffcf87],['BOCA',landmarks.mouth,0xed7894]];
  const size=landmarks.headSize.length()*.019;
  for(const [name,pos,color] of markers){if(!pos)continue;
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(size,10,8),
      new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.95}));
    mesh.position.copy(pos);mesh.renderOrder=950;mesh.name='LANDMARK_'+name;mesh.userData.facialLandmark=name;
    group.add(mesh);
  }
  group.visible=false;
  return group;
}
