/** HIGHFLY ORIGIN R20 — premium AIM visual only. Reuses MIT patterns,
 * not third-party assets. Native ClaudeCraft Sim remains the casting authority.
 * MIT design references: achrefelouafi/LinearAbilityExtThreeJS and
 * achrefelouafi/LinearAbiltyCastingThreeJS. No code/assets copied.
 */
import * as THREE from 'three';
import { ABILITIES } from '../sim/content/classes';
export type HighflyAimShape = 'line'|'cone'|'circle'|'dash'|'target';
export interface HighflyAimSpec {
  shape:HighflyAimShape; range:number; minRange:number; radius:number; width:number; angle:number;
  targetRequired:boolean; selfCentered:boolean;
}
const LINE_IDS=new Set(['arcane_shot','venom_dart','fireball','lightning_bolt','chain_lightning','shadow_bolt','mind_blast','wrath','starfire']);
const DASH_IDS=new Set(['heroic_leap','solar_step','trailbreak','veilstep']);
/** Cones require verified native cone collision semantics. No arbitrary
 * cone is assigned to a single-target strike solely for visual effect. */
const CONE_IDS=new Set<string>();
export function highflyAimSpec(id:string):HighflyAimSpec|null {
 const def=ABILITIES[id];if(!def)return null;
 const range=Math.max(0,Number(def.range??0));
 const effects=def.effects as readonly ({radius?:number;type:string;distance?:number;landingAoe?:{radius?:number}})[];
 const aoe=effects.find(e=>typeof e.radius==='number'||typeof e.landingAoe?.radius==='number');
 const radius=aoe?.radius??aoe?.landingAoe?.radius??0;
 const positional=def.targetMode==='position';
 const movement=effects.some(e=>e.type==='repositionToAim'||e.type==='blinkForward');
 const actualRange=movement && range===0
   ? Math.max(0,...effects.map(e=>e.type==='blinkForward'?(e.distance??0):0))
   : def.requiresTarget && range===0 ? 4.5 : range; // native melee reach preview ONLY
 const selfCentered=range===0&&!positional&&!movement;
 let shape:HighflyAimShape='target';
 if(DASH_IDS.has(id)&&(positional||movement))shape='dash';
 else if(def.class==='rogue'&&def.requiresTarget&&range===0
   &&effects.some(e=>e.type==='weaponStrike'))shape='line'; // short Wicked Slash / Ambush lane
 else if(positional)shape='circle';
 else if(CONE_IDS.has(id))shape='cone';
 else if(LINE_IDS.has(id)&&def.requiresTarget)shape='line';
 return {shape,range:actualRange,minRange:Math.max(0,Number(def.minRange??0)),
   radius:Math.max(0,radius),width:range===0?1.5:0.95,angle:Math.PI/3,
   targetRequired:Boolean(def.requiresTarget),selfCentered};
}
type Pt={x:number;z:number};
type Terrain=(x:number,z:number)=>number;
/** One shared, bounded mesh + outline. All buffers allocated once.
 * Vertex heights follow the native seeded terrain; no floating HTML halos.
 */
export class HighflyAimVisual {
 readonly root=new THREE.Group();
 private readonly fillBuffer=new Float32Array(1536*3);
 private readonly edgeBuffer=new Float32Array(1536*3);
 private readonly fillGeometry=new THREE.BufferGeometry();
 private readonly edgeGeometry=new THREE.BufferGeometry();
 private readonly fillMaterial=new THREE.MeshBasicMaterial({color:0x63cefa,transparent:true,opacity:0.18,depthWrite:false,side:THREE.DoubleSide});
 private readonly edgeMaterial=new THREE.LineBasicMaterial({color:0x83eaff,transparent:true,opacity:0.96,depthWrite:false});
 private readonly fill:THREE.Mesh;
 private readonly edge:THREE.LineSegments;
 private a=0;private b=0;
 constructor(private readonly scene:THREE.Scene,private readonly ground:Terrain){
   this.fillGeometry.setAttribute('position',new THREE.BufferAttribute(this.fillBuffer,3).setUsage(THREE.DynamicDrawUsage));
   this.edgeGeometry.setAttribute('position',new THREE.BufferAttribute(this.edgeBuffer,3).setUsage(THREE.DynamicDrawUsage));
   this.fill=new THREE.Mesh(this.fillGeometry,this.fillMaterial);
   this.edge=new THREE.LineSegments(this.edgeGeometry,this.edgeMaterial);
   this.fill.frustumCulled=false;this.edge.frustumCulled=false;
   this.fill.renderOrder=701;this.edge.renderOrder=702;
   this.root.name='HIGHFLY_ORIGIN_R20_AIM_PREVIEW';
   this.root.add(this.fill,this.edge);this.scene.add(this.root);
   this.root.visible=false;
 }
 private put(buffer:Float32Array,index:number,p:Pt):number{
   buffer[index++]=p.x;buffer[index++]=this.ground(p.x,p.z)+0.11;buffer[index++]=p.z;return index;
 }
 private tri(a:Pt,b:Pt,c:Pt):void{
   if(this.a+9>this.fillBuffer.length)return;
   this.a=this.put(this.fillBuffer,this.a,a);this.a=this.put(this.fillBuffer,this.a,b);this.a=this.put(this.fillBuffer,this.a,c);
 }
 private line(a:Pt,b:Pt):void{
   if(this.b+6>this.edgeBuffer.length)return;
   this.b=this.put(this.edgeBuffer,this.b,a);this.b=this.put(this.edgeBuffer,this.b,b);
 }
 private fan(center:Pt,radius:number,start:number,end:number,segments:number):void{
   if(radius<=0)return;
   let previous={x:center.x+Math.sin(start)*radius,z:center.z+Math.cos(start)*radius};
   for(let i=1;i<=segments;i++){
     const t=start+(end-start)*i/segments;
     const next={x:center.x+Math.sin(t)*radius,z:center.z+Math.cos(t)*radius};
     this.tri(center,previous,next);this.line(previous,next);previous=next;
   }
 }
 private quad(a:Pt,b:Pt,c:Pt,d:Pt):void{
   this.tri(a,b,c);this.tri(a,c,d);
   this.line(a,b);this.line(b,c);this.line(c,d);this.line(d,a);
 }
 show(spec:HighflyAimSpec,actor:Pt,target:Pt,valid=true):void{
   this.a=0;this.b=0;
   let dx=target.x-actor.x,dz=target.z-actor.z;
   const raw=Math.hypot(dx,dz);
   if(raw<0.001){dx=0;dz=1;}else{dx/=raw;dz/=raw;}
   const distance=Math.min(spec.range||30,Math.max(0.5,raw));
   const tip={x:actor.x+dx*distance,z:actor.z+dz*distance};
   const rx=dz,rz=-dx;
   const side=(x:number,z:number,t:number):Pt=>({x:x+rx*t,z:z+rz*t});
   if(spec.shape==='line'){
     const w=spec.width/2;
     this.quad(side(actor.x,actor.z,-w),side(tip.x,tip.z,-w),side(tip.x,tip.z,w),side(actor.x,actor.z,w));
     const arrow= Math.min(1.5, Math.max(0.7,distance*0.12));
     this.tri({x:tip.x+dx*arrow,z:tip.z+dz*arrow},side(tip.x-dx*arrow,tip.z-dz*arrow,-arrow*.6),side(tip.x-dx*arrow,tip.z-dz*arrow,arrow*.6));
   }else if(spec.shape==='cone'){
     const yaw=Math.atan2(dx,dz);
     this.fan(actor,Math.max(0.8,distance),yaw-spec.angle/2,yaw+spec.angle/2,24);
     this.line(actor,{x:actor.x+Math.sin(yaw-spec.angle/2)*distance,z:actor.z+Math.cos(yaw-spec.angle/2)*distance});
     this.line(actor,{x:actor.x+Math.sin(yaw+spec.angle/2)*distance,z:actor.z+Math.cos(yaw+spec.angle/2)*distance});
   }else if(spec.shape==='dash'){
     const w=0.36;
     this.quad(side(actor.x,actor.z,-w),side(tip.x,tip.z,-w),side(tip.x,tip.z,w),side(actor.x,actor.z,w));
     const ar=Math.min(2,Math.max(.8,distance*.18));
     this.tri({x:tip.x+dx*.35,z:tip.z+dz*.35},
       side(tip.x-dx*ar,tip.z-dz*ar,-ar*.7),
       side(tip.x-dx*ar,tip.z-dz*ar,ar*.7));
     if(spec.radius>0)this.fan(tip,spec.radius,0,Math.PI*2,32);
   }else if(spec.shape==='circle'){
     this.fan(tip,spec.radius||0.1,0,Math.PI*2,32);
     this.line({x:tip.x-.6,z:tip.z},{x:tip.x+.6,z:tip.z});
     this.line({x:tip.x,z:tip.z-.6},{x:tip.x,z:tip.z+.6});
   }else{
     const r=0.85;
     this.fan(tip,r,0,Math.PI*2,24);
   }
   this.fillGeometry.setDrawRange(0,this.a/3);
   this.edgeGeometry.setDrawRange(0,this.b/3);
   (this.fillGeometry.attributes.position as THREE.BufferAttribute).needsUpdate=true;
   (this.edgeGeometry.attributes.position as THREE.BufferAttribute).needsUpdate=true;
   this.fillMaterial.color.setHex(valid?0x69cafa:0xff6b69);
   this.edgeMaterial.color.setHex(valid?0x88eaff:0xff9a91);
   this.root.visible=true;
 }
 hide():void{this.root.visible=false;}
 dispose():void{
   this.scene.remove(this.root);
   this.fillGeometry.dispose();this.edgeGeometry.dispose();
   this.fillMaterial.dispose();this.edgeMaterial.dispose();
 }
}
