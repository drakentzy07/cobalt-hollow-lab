import * as THREE from 'three';

// HIGHFLY Avatar Anatomical Fit v1.
// Rig_Medium bind coordinates only. Every front-facing helmet subsystem
// shares the same real facial anchors; move no eye independently of its mask.
const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
const rel=(c,s,x,y,z)=>vec(c.x+s.x*x,c.y+s.y*y,c.z+s.z*z);
const percent=(v,d,max)=>limit(v/d,-max,max);
function displacement(target,design,size,cap=.31){
  if(!target||!design)return vec(0,0,0);
  const diff=target.clone().sub(design);
  diff.x=limit(diff.x,-size.x*cap,size.x*cap);
  diff.y=limit(diff.y,-size.y*cap,size.y*cap);
  diff.z=limit(diff.z,-size.z*.20,size.z*.20);
  return diff;
}
function blend(a,b,t){return a.clone().lerp(b,t)}
function normSide(o){
 const n=o.name;
 if(/(?:_L|Left|\-L)(?:$|_)/i.test(n))return -1;
 if(/(?:_R|Right|\-R)(?:$|_)/i.test(n))return 1;
 if(/_-1$/.test(n))return -1;
 if(/_1$/.test(n))return 1;
 return 0;
}
function checkedPoint(p){return !!p&&[p.x,p.y,p.z].every(Number.isFinite)}
function alignFrontShell(o,c,s,dEye,dMouth,dBrow){
 const attr=o.geometry?.attributes?.position;
 if(!attr)return false;
 let altered=0;
 for(let i=0;i<attr.count;i++){
   const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i);
   const forward=limit((z-c.z)/(s.z*.5),0,1);
   if(forward<=0)continue;
   const normalizedY=(y-c.y)/s.y;
   const eyeWeight=Math.exp(-Math.pow((normalizedY-.15)/.23,2));
   const jawWeight=Math.exp(-Math.pow((normalizedY+.36)/.25,2));
   const browWeight=Math.exp(-Math.pow((normalizedY-.39)/.23,2));
   const v=vec(0,0,0).addScaledVector(dEye,eyeWeight)
     .addScaledVector(dMouth,jawWeight).addScaledVector(dBrow,browWeight)
     .multiplyScalar(forward*.64);
   attr.setXYZ(i,x+v.x,y+v.y,z+v.z);altered++;
 }
 if(altered){attr.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingBox();}
 return altered>0;
}
export function deriveFaceFit(bounds,landmarks,{eyeOffset=0}={}){
 if(!landmarks?.verified||!checkedPoint(landmarks.leftEye)||!checkedPoint(landmarks.rightEye))
   throw Error('Anatomía requerida: M_Eye_almond izquierdo y derecho auténticos.');
 const {center:c,size:s}=bounds;
 const native={eye:{left:landmarks.leftEye,right:landmarks.rightEye},
   brow:{left:landmarks.leftBrow,right:landmarks.rightBrow},
   ear:{left:landmarks.leftEar,right:landmarks.rightEar},
   mouth:landmarks.mouth};
 const halfEyeDesign={
   left:rel(c,s,-.275,.160,.535),right:rel(c,s,.275,.160,.535)
 };
 const eye={
   left:displacement(native.eye.left.clone().add(vec(0,eyeOffset*s.y,s.z*.055)),halfEyeDesign.left,s),
   right:displacement(native.eye.right.clone().add(vec(0,eyeOffset*s.y,s.z*.055)),halfEyeDesign.right,s)
 };
 const eyeMid=blend(eye.left,eye.right,.5);
 const fallbackBrow=rel(c,s,0,.23,.51),fallbackMouth=rel(c,s,0,-.39,.54);
 const browMid=landmarks.browVerified&&checkedPoint(landmarks.brow)
   ?displacement(landmarks.brow.clone().add(vec(0,s.y*.055,s.z*.03)),fallbackBrow,s):eyeMid.clone();
 const mouth=landmarks.mouthVerified&&checkedPoint(native.mouth)
   ?displacement(native.mouth.clone().add(vec(0,-s.y*.055,s.z*.06)),fallbackMouth,s):eyeMid.clone();
 const brow={
   left:landmarks.browVerified&&checkedPoint(native.brow.left)
     ?displacement(native.brow.left.clone().add(vec(0,s.y*.055,s.z*.03)),rel(c,s,-.29,.235,.50),s):browMid.clone(),
   right:landmarks.browVerified&&checkedPoint(native.brow.right)
     ?displacement(native.brow.right.clone().add(vec(0,s.y*.055,s.z*.03)),rel(c,s,.29,.235,.50),s):browMid.clone()
 };
 const ear={
   left:landmarks.earVerified&&checkedPoint(native.ear.left)
     ?displacement(native.ear.left,rel(c,s,-.48,.04,-.06),s):vec(0,0,0),
   right:landmarks.earVerified&&checkedPoint(native.ear.right)
     ?displacement(native.ear.right,rel(c,s,.48,.04,-.06),s):vec(0,0,0)
 };
 return {eye,brow,mouth,ear,eyeMid,browMid,
   real:{eyeY:landmarks.eyeY,mouthY:landmarks.mouth?.y??null,browY:landmarks.brow?.y??null},
   coverage:{eyes:true,brows:landmarks.browVerified===true,mouth:landmarks.mouthVerified===true,
     ears:landmarks.earVerified===true},
   origin:'M_Head/M_Eye_almond/M_Brow_soft/M_Mouth_neutral/M_Ear_round'};
}
export function fitEntireHelmet(root,bounds,landmarks,options={}){
 const plan=deriveFaceFit(bounds,landmarks,options);
 const changed=[],affected=new Set(),parts=new Set(),fallbacks=[];
 const s=bounds.size,c=bounds.center;
 // Hard-fail for missing eyes. Brow/mouth/ear absent => retain existing geometry and
 // disclose partial fitting, never pretend their anatomy was measured.
 if(!plan.coverage.brows)fallbacks.push('cejas sin referencia bilateral: usan base proporcional');
 if(!plan.coverage.mouth)fallbacks.push('boca sin referencia: usa referencia del área ocular');
 if(!plan.coverage.ears)fallbacks.push('orejas sin referencia bilateral: nuca sin traslación auricular');
 for(const mesh of root.children){
   if(!mesh.isMesh)continue;
   const n=mesh.name,part=mesh.userData.creatorHelmetPart||'unknown';
   const side=normSide(mesh),E=side<0?plan.eye.left:side>0?plan.eye.right:plan.eyeMid;
   const B=side<0?plan.brow.left:side>0?plan.brow.right:plan.browMid;
   const A=side<0?plan.ear.left:side>0?plan.ear.right:vec(0,0,0);
   let delta=null;
   if(n.includes('ForgedShell')){
     if(alignFrontShell(mesh,c,s,plan.eyeMid,plan.mouth,plan.browMid))
       changed.push(n),affected.add('shell');
     continue;
   }
   if(n.includes('EyeLeft')||n.includes('EyeRight')||n.includes('RecessedSocket')){
     delta=E;parts.add('eyes');
   }else if(n.includes('IvoryBrow')){delta=B;parts.add('brows');
   }else if(n.includes('ForeheadAvianChevron')){delta=blend(plan.browMid,plan.eyeMid,.35);parts.add('forehead');
   }else if(n.includes('ForeheadCrystal')){delta=plan.browMid;parts.add('forehead');
   }else if(n.includes('LowerMask')){delta=blend(plan.eyeMid,plan.mouth,.65);parts.add('mask');
   }else if(n.includes('ChinEdge')){delta=plan.mouth;parts.add('mouth');
   }else if(n.includes('CurvedAvianBeak')){delta=blend(plan.eyeMid,plan.mouth,.38);parts.add('beak');
   }else if(n.includes('BeakSeam')){delta=blend(plan.eyeMid,plan.mouth,.65);parts.add('beak');
   }else if(n.includes('CheekArmor')){delta=blend(E,plan.mouth,.57);parts.add('cheeks');
   }else if(n.includes('TempleFeather')){delta=A.clone().multiplyScalar(.76);parts.add('ears');
   }else if(n.includes('CheekFeather')){delta=A.clone().multiplyScalar(.65);parts.add('nape');
   }else if(n.includes('Crest')){delta=A.clone().multiplyScalar(.26);parts.add('crest');
   }else{continue;}
   if(delta.lengthSq()>0){mesh.position.add(delta);changed.push(n);affected.add(part);}
 }
 root.userData.facialFit={
   version:1,verified:true,coverage:plan.coverage,anchors:plan.origin,
   meshMoves:changed.length,partTypes:[...parts],deformedParts:[...affected],
   eyeTargetY:plan.real.eyeY,
   visorYOffset:(plan.eye.left.y+plan.eye.right.y)/2,
   mouthTargetY:plan.real.mouthY,browTargetY:plan.real.browY,
   warnings:fallbacks
 };
 return root.userData.facialFit;
}
