/** HIGHFLY ORIGIN R21 — screen-faithful MANUAL drag, no auto-snapping.
 * Pure input geometry; the ClaudeCraft Sim owns all damage, range, LOS and casts.
 */
export interface AimXZ {x:number;z:number}
export interface AimScreen {x:number;y:number;behind:boolean}
export interface AimUnit {
 id:number;dead:boolean;hostile?:boolean;hp:number;maxHp:number;
 kind:string;pos:{x:number;z:number};
}
export type AimProjection=(x:number,y:number,z:number)=>AimScreen;
export interface AimResolved {point:AimXZ;dir:AimXZ;distance:number;projected:boolean}
export const HIGHFLY_MELEE_PREVIEW_REACH=4.5;
/** Used only for target acquisition / preview of range=0 native melee.
 * Never overrides the native authoritative actual melee limit.
 */
export function highflyEffectiveAimRange(def:{range?:number;requiresTarget?:boolean;effects?:readonly {type:string;distance?:number}[]}):number{
 const native=Number(def.range??0);
 if(native>0)return native;
 if(def.requiresTarget)return HIGHFLY_MELEE_PREVIEW_REACH;
 return Math.max(0,...(def.effects??[]).map(e=>e.type==='blinkForward'?(e.distance??0):0));
}
/** Inverse local projection Jacobian. A swipe toward SCREEN right means the
 * world arrow will project toward SCREEN right, regardless of camera yaw.
 * Projection samples are anchored on the live Hunter each time we aim.
 */
export function highflyManualAim(actor:{x:number;y?:number;z:number},
 dx:number,dy:number,range:number,shape:'line'|'cone'|'circle'|'dash'|'target',
 project:AimProjection,cameraYaw=0):AimResolved {
 const h=actor.y??0, step=4;
 const c=project(actor.x,h,actor.z);
 const px=project(actor.x+step,h,actor.z);
 const pz=project(actor.x,h,actor.z+step);
 const a=(px.x-c.x)/step,b=(pz.x-c.x)/step;
 const cc=(px.y-c.y)/step,d=(pz.y-c.y)/step;
 const det=a*d-b*cc;
 let wx=0,wz=0,projected=false;
 if(!c.behind&&!px.behind&&!pz.behind&&Number.isFinite(det)&&Math.abs(det)>0.08){
   wx=(dx*d-b*dy)/det;
   wz=(a*dy-cc*dx)/det;
   projected=Number.isFinite(wx)&&Number.isFinite(wz);
 }
 if(!projected){
   // Matches camera-relative joystick compass when perspective degenerates.
   wx=Math.cos(cameraYaw)*dx-Math.sin(cameraYaw)*dy;
   wz=-Math.sin(cameraYaw)*dx-Math.cos(cameraYaw)*dy;
 }
 const length=Math.hypot(wx,wz);
 if(length<1e-5){
   wx=Math.sin(cameraYaw);wz=Math.cos(cameraYaw);
 }else{wx/=length;wz/=length;}
 const reach=Math.max(0.5,range);
 // LINE and targeted melee show a fixed native-length lane. Circle / dash
 // let the user choose a landing distance with the right thumb.
 const dragLength=Math.hypot(dx,dy);
 const distance=shape==='circle'||shape==='dash'
   ? Math.max(Math.min(2.5,reach),Math.min(reach,reach*dragLength/115))
   : reach;
 return {point:{x:actor.x+wx*distance,z:actor.z+wz*distance},
   dir:{x:wx,z:wz},distance,projected};
}
/** An entity-targeted native skill cannot hit empty space. Manual drags
 * narrow to a ray corridor; no nearest/lowestHP preference is consulted.
 * The preview geometry NEVER moves to the enemy's position.
 */
export function highflyManualRayTarget(actor:AimXZ,units:readonly AimUnit[],
 dir:AimXZ,range:number,halfWidth=1.2,minRange=0):number|null {
 const possible=units.flatMap(e=>{
   if(e.dead||e.hp<=0||!e.hostile||e.kind==='player')return [];
   const dx=e.pos.x-actor.x,dz=e.pos.z-actor.z;
   const along=dx*dir.x+dz*dir.z;
   const across=Math.abs(dx*dir.z-dz*dir.x);
   if(along<Math.max(0,minRange)||along>range||across>halfWidth)return [];
   return [{id:e.id,along,across}];
 });
 // Clear manual intent wins. Smallest perpendicular miss first, not lowest HP.
 possible.sort((a,b)=>a.across-b.across||a.along-b.along);
 return possible[0]?.id??null;
}
