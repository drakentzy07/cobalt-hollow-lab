/**
 * HIGHFLY R29 actual upstream MIT shader/particles VFX runtime (not gameplay).
 * Source directories are staged unmodified from pinned upstream commits by CI.
 * The native HIGHFLY Sim — NOT these visual managers — owns hit, costs and CD.
 * The laboratory must not call this on refused casts.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildSerpentGeometry } from './vendor/advanced10/assets/SerpentGeometry.js';

import { AbilityManager as Six } from './vendor/casting6/abilities/AbilityManager.js';
import { AbilityManager as Seven } from './vendor/effects7/abilities/AbilityManager.js';
import { AbilityManager as Ten } from './vendor/advanced10/abilities/AbilityManager.js';
import { ParticleEngine as P6 } from './vendor/casting6/particles/ParticleEngine.js';
import { ParticleEngine as P7 } from './vendor/effects7/particles/ParticleEngine.js';
import { ParticleEngine as P10 } from './vendor/advanced10/particles/ParticleEngine.js';
import { LightPool as L6 } from './vendor/casting6/effects/LightPool.js';
import { LightPool as L7 } from './vendor/effects7/effects/LightPool.js';
import { LightPool as L10 } from './vendor/advanced10/effects/LightPool.js';
import { DecalSystem as D6 } from './vendor/casting6/effects/GroundDecals.js';
import { DecalSystem as D7 } from './vendor/effects7/effects/GroundDecals.js';
import { DecalSystem as D10 } from './vendor/advanced10/effects/GroundDecals.js';
import { BurstSystem as B6 } from './vendor/casting6/effects/BurstSphere.js';
import { BurstSystem as B7 } from './vendor/effects7/effects/BurstSphere.js';
import { BurstSystem as B10 } from './vendor/advanced10/effects/BurstSphere.js';
import { FissureSystem as F6 } from './vendor/casting6/effects/GroundFissures.js';
import { ScreenFlash as S6 } from './vendor/casting6/effects/ScreenFlash.js';
import { ScreenFlash as S7 } from './vendor/effects7/effects/ScreenFlash.js';
import { ScreenFlash as S10 } from './vendor/advanced10/effects/ScreenFlash.js';
import { frame as frame6 } from './vendor/casting6/core/FrameUniforms.js';
import { frame as frame7 } from './vendor/effects7/core/FrameUniforms.js';
import { frame as frame10 } from './vendor/advanced10/core/FrameUniforms.js';
import { patchOnBeforeCompile as patch6 } from './vendor/casting6/utils/shaderPatch.js';
import { patchOnBeforeCompile as patch7 } from './vendor/effects7/utils/shaderPatch.js';
import { patchOnBeforeCompile as patch10 } from './vendor/advanced10/utils/shaderPatch.js';

const SOURCES={
 casting6:{M:Six,P:P6,L:L6,D:D6,B:B6,S:S6,F:F6,frame:frame6,patch:patch6},
 effects7:{M:Seven,P:P7,L:L7,D:D7,B:B7,S:S7,F:null,frame:frame7,patch:patch7},
 advanced10:{M:Ten,P:P10,L:L10,D:D10,B:B10,S:S10,F:null,frame:frame10,patch:patch10}
};
const CATALOG={
 casting6:new Set(['ice','thunder','meteor','beam','snare','glacier']),
 effects7:new Set(['pyre','kraken','electrical','earth','portal','aether','firePortal']),
 advanced10:new Set(['ward','acid','growth','cyber','venom','quake','ink','astral','cascade','rend'])
};
function services(scene,source){
 const particles=new source.P(scene);
 const lights=new source.L(scene);
 const decals=new source.D(scene);
 const bursts=new source.B(scene);
 const flash=new source.S();
 const environment={
   scene,
   registerShadowCaster:material=>material,
   registerShadowCasterWithPatch:(material,patch,key)=>source.patch(material,patch,key)
 };
 const rig={shakeOffset:new THREE.Vector3(),shakeRoll:0};
 const shake={add(){},rumble(){},update(){}};
 const svc={scene,environment,particles,lights,decals,bursts,flash,shake,
   dummies:{dummies:[],entities:[],nearby:()=>[],findTargets:()=>[]},
   models:{}, camera:null };
 if(source.F)svc.fissures=new source.F(scene);
 return svc;
}
/** License-clean KayKit-compatible procedural serpent silhouette; the original
 * MIT CyberSerpent source still owns wire, ribbons, ghost copies and rune shader.
 * No unreviewed source GLB/FBX, HDR or diffuse texture is ever shipped.
 */
function highflySerpentGeometry(){
 const points=Array.from({length:26},(_,i)=>{
   const t=i/25;
   return new THREE.Vector3(
     Math.sin(t*Math.PI*2.6)*.17*(1-.45*t),
     Math.sin(t*Math.PI*1.25)*.09+.14*t,
     -2.1+t*4.2);
 });
 const tube=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,.12,12,false);
 const head=new THREE.SphereGeometry(.24,20,14);
 head.scale(1.2,.88,1.5);
 head.translate(points[25].x,points[25].y,points[25].z+.14);
 const combined=mergeGeometries([tube,head],false);
 tube.dispose();head.dispose();
 if(!combined)throw Error('SERPENT_PROCEDURAL_MESH_MERGE_FAILED');
 const root=new THREE.Group();
 root.add(new THREE.Mesh(combined,new THREE.MeshBasicMaterial()));
 const result=buildSerpentGeometry(root,{ghosts:8});
 combined.dispose();
 return result;
}
export class R29OriginalSourceVFX {
 constructor(scene,camera){
   this.scene=scene;
   this.camera=camera;
   // The original MIT shaders place ability geometry in VFX layer 1.
   camera.layers.enable(1);
   this.bySource=new Map();
   this.elapsed=0;
   this.failures=new Map();
   this.serpent=null;
   this.serpentLoadError=null;
   try{this.serpent=highflySerpentGeometry();}
   catch(e){this.serpentLoadError=String(e);}
   this.serpentLoading=Promise.resolve(this.serpent);
 }
 start(sourceId,source,from,to){
   if(!CATALOG[source]?.has(sourceId))return {ok:false,reason:'UNKNOWN_SOURCE'};
   const v=SOURCES[source];
   try{
     if(source==='advanced10' && sourceId==='cyber' && !this.serpent){
       return {ok:false,reason:this.serpentLoadError?'ORIGINAL_SERPENT_ASSET_FAILED':'ORIGINAL_SERPENT_ASSET_LOADING',detail:this.serpentLoadError??undefined};
     }
     let entry=this.bySource.get(source);
     if(!entry){
       const context=services(this.scene,v);
       context.camera=this.camera;
       if(source==='advanced10' && this.serpent)context.models.serpent=this.serpent;
       const manager=new v.M(context);
       entry={context,manager,frame:v.frame};
       this.bySource.set(source,entry);
     }
     const a=new THREE.Vector3(from.x,0,from.z);
     const b=new THREE.Vector3(to.x-from.x,0,to.z-from.z);
     const distance=Math.max(0.2,b.length());
     b.normalize();
     // The source classes themselves create the original procedural geometry,
     // shader materials and pooled particle systems: no generic replacement.
     const cast=entry.manager.cast(a,b,distance,sourceId);
     if(!cast)return {ok:false,reason:'ORIGINAL_MANAGER_REJECTED'};
     return {ok:true,originalVfxModule:source+'/'+sourceId};
   }catch(e){
     const message=String(e?.message??e);
     this.failures.set(source+'/'+sourceId,message);
     return {ok:false,reason:'SOURCE_VFX_RUNTIME_ERROR',detail:message};
   }
 }
 update(dt){
   if(!Number.isFinite(dt)||dt<=0)return;
   const step=Math.min(dt,0.06);
   this.elapsed+=step;
   for(const {context,manager,frame} of this.bySource.values()){
     frame.uTime.value=this.elapsed;
     if(frame.uDelta)frame.uDelta.value=step;
     if(frame.uCameraNear)frame.uCameraNear.value=this.camera.near;
     if(frame.uCameraFar)frame.uCameraFar.value=this.camera.far;
     if(frame.uResolution)frame.uResolution.value.set(
       Math.max(1,this.camera.aspect*1080),1080);
     manager.update(step);
     context.lights.update(step);
     context.decals.update(step);
     context.bursts.update(step);
     context.fissures?.update(step);
     context.flash.update(step);
     // Vendors upload new particle spawn data only when ParticleEngine.flush()
     // runs after each update; no generic replacement particles are introduced.
     context.particles.flush();
   }
 }
 dispose(){
   for(const {context,manager} of this.bySource.values()){
     manager.dispose();
     for(const name of ['particles','lights','decals','bursts','fissures','flash']){
       context[name]?.dispose?.();
     }
   }
   this.bySource.clear();
   this.serpent?.geometry?.dispose?.();
   this.serpent?.ghostGeometry?.dispose?.();
 }
}
