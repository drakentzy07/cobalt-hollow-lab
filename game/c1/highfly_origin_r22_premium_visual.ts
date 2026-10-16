/**
 * HIGHFLY ORIGIN R22 — Mobile-first world-space targeting presentation.
 *
 * MIT-compatible original implementation inspired by AimController/indicator
 * separation in achrefelouafi's LinearAbilityExtThreeJS and
 * LinearAbiltyCastingThreeJS. No external models, shaders or VFX copied.
 * Geometry = preview only. Native ClaudeCraft Sim still owns casts, targets,
 * collision, stamina/mana and damage. One scene, no separate camera.
 */
import * as THREE from 'three';
import type {HighflyAimShape, HighflyAimSpec} from './highfly_origin_r20_premium_aim';
type P={x:number;z:number};
type Terrain=(x:number,z:number)=>number;
type Surface={
  geom:THREE.BufferGeometry;
  coords:Float32Array;
  mesh:THREE.Mesh;
  material:THREE.MeshBasicMaterial;
  used:number;
  offset:number;
};
/** Static memory ceiling per surface. Every preview updates these same arrays. */
const MAX_VERTS=2048;
const TAU=Math.PI*2;
const point=(x:number,z:number):P=>({x,z});
const mix=(a:P,b:P,t:number):P=>point(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);
const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(x,hi));

export class HighflyAimVisual {
 readonly root=new THREE.Group();
 private readonly aura:Surface;
 private readonly fill:Surface;
 private readonly edge:Surface;
 private readonly glyph:Surface;
 private readonly surfaces:Surface[];
 constructor(private readonly scene:THREE.Scene,private readonly terrain:Terrain){
   const surface=(name:string,color:number,opacity:number,offset:number,renderOrder:number):Surface=>{
     const coords=new Float32Array(MAX_VERTS*3);
     const geom=new THREE.BufferGeometry();
     geom.setAttribute('position',new THREE.BufferAttribute(coords,3).setUsage(THREE.DynamicDrawUsage));
     geom.setDrawRange(0,0);
     const material=new THREE.MeshBasicMaterial({
       color,opacity,transparent:true,depthWrite:false,
       side:THREE.DoubleSide,toneMapped:false
     });
     const mesh=new THREE.Mesh(geom,material);
     mesh.frustumCulled=false;
     mesh.renderOrder=renderOrder;
     mesh.name=name;
     this.root.add(mesh);
     return {geom,coords,mesh,material,used:0,offset};
   };
   this.root.name='HIGHFLY_ORIGIN_R22_PREMIUM_AIM';
   this.aura=surface('aim-soft-edge',0x2abbe9,.10,.075,710);
   this.fill=surface('aim-fill',0x29c4f6,.21,.091,711);
   this.edge=surface('aim-silhouette',0x7ddcff,.87,.116,712);
   this.glyph=surface('aim-glyphs',0xdcfaff,.85,.132,713);
   this.surfaces=[this.aura,this.fill,this.edge,this.glyph];
   this.root.visible=false;
   this.scene.add(this.root);
 }
 private emit(s:Surface,p:P):void {
   if(s.used>=MAX_VERTS)return;
   const n=s.used++*3;
   s.coords[n]=p.x;
   s.coords[n+1]=this.terrain(p.x,p.z)+s.offset;
   s.coords[n+2]=p.z;
 }
 private tri(s:Surface,a:P,b:P,c:P):void{
   if(s.used+3>MAX_VERTS)return;
   this.emit(s,a);this.emit(s,b);this.emit(s,c);
 }
 private quad(s:Surface,a:P,b:P,c:P,d:P):void{
   this.tri(s,a,b,c);this.tri(s,a,c,d);
 }
 private strip(s:Surface,a:P,b:P,w:number):void{
   if(w<=0)return;
   const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
   if(length<.001)return;
   const nx=-dz/length*w*.5,nz=dx/length*w*.5;
   this.quad(s,point(a.x+nx,a.z+nz),point(b.x+nx,b.z+nz),
               point(b.x-nx,b.z-nz),point(a.x-nx,a.z-nz));
 }
 private disc(s:Surface,c:P,r:number,steps=48):void{
   if(r<=0)return;
   let prev=point(c.x+r,c.z);
   for(let i=1;i<=steps;i++){
     const t=TAU*i/steps,next=point(c.x+r*Math.cos(t),c.z+r*Math.sin(t));
     this.tri(s,c,prev,next);prev=next;
   }
 }
 private annulus(s:Surface,c:P,outer:number,band:number,steps=48):void{
   if(outer<=0)return;
   const inner=Math.max(0,outer-band);
   for(let i=0;i<steps;i++){
     const a=TAU*i/steps,b=TAU*(i+1)/steps;
     const oa=point(c.x+outer*Math.cos(a),c.z+outer*Math.sin(a));
     const ob=point(c.x+outer*Math.cos(b),c.z+outer*Math.sin(b));
     const ia=point(c.x+inner*Math.cos(a),c.z+inner*Math.sin(a));
     const ib=point(c.x+inner*Math.cos(b),c.z+inner*Math.sin(b));
     this.quad(s,ia,oa,ob,ib);
   }
 }
 private shapeArrow(origin:P,end:P,length:number,width:number,role:'line'|'dash'):void{
   const dx=(end.x-origin.x)/length,dz=(end.z-origin.z)/length;
   const rx=dz,rz=-dx;
   const side=(p:P,s:number)=>point(p.x+rx*s,p.z+rz*s);
   // All preview geometry, including the arrowhead, stays INSIDE range.
   const head=Math.min(length*.43,clamp(length*.19,.24,1.9));
   const tail=Math.min(length*.12,clamp(length*.12,.08,.85));
   const start=point(origin.x+dx*tail,origin.z+dz*tail);
   const base=point(end.x-dx*head,end.z-dz*head);
   const shaft=role==='dash'?clamp(width*.31,.18,.43):clamp(width*.37,.22,.48);
   const neck=role==='dash'?clamp(width*.40,.28,.54):clamp(width*.49,.34,.70);
   const tip= end;
   const left0=side(start,-shaft),right0=side(start,shaft);
   const left1=side(base,-neck),right1=side(base,neck);
   // Soft silhouette and taper; no squared-off rectangle.
   this.quad(this.aura,side(start,-shaft*1.75),side(base,-neck*1.65),
     side(base,neck*1.65),side(start,shaft*1.75));
   this.quad(this.fill,left0,left1,right1,right0);
   const headWidth=clamp(width*(role==='dash'?1.15:1.30),.58,1.55);
   const headL=side(base,-headWidth),headR=side(base,headWidth);
   this.tri(this.aura,side(base,-headWidth*1.13),tip,side(base,headWidth*1.13));
   this.tri(this.fill,headL,tip,headR);
   const sw=clamp(width*.065,.045,.10);
   this.strip(this.edge,left0,left1,sw);
   this.strip(this.edge,right0,right1,sw);
   this.strip(this.edge,headL,tip,sw);
   this.strip(this.edge,tip,headR,sw);
   // One or two small centered chevrons give direction without covering the actor.
   const chevrons=length>10?2:1;
   for(let i=1;i<=chevrons;i++){
     const along=clamp(.21+i*.23,.2,.72);
     const mid=point(origin.x+dx*length*along,origin.z+dz*length*along);
     const apex=point(mid.x+dx*.34,mid.z+dz*.34);
     const tailLeft=side(mid,-.22),tailRight=side(mid,.22);
     this.strip(this.glyph,tailLeft,apex,.06);
     this.strip(this.glyph,apex,tailRight,.06);
   }
 }
 private drawCone(origin:P,heading:number,reach:number,angle:number):void{
   const half=clamp(angle,.12,Math.PI*1.2)/2;
   const steps=28;
   let previous=point(origin.x+Math.sin(heading-half)*reach,
                      origin.z+Math.cos(heading-half)*reach);
   for(let i=1;i<=steps;i++){
     const theta=heading-half+2*half*i/steps;
     const next=point(origin.x+Math.sin(theta)*reach,origin.z+Math.cos(theta)*reach);
     this.tri(this.fill,origin,previous,next);
     this.strip(this.edge,previous,next,.06);
     previous=next;
   }
   const left=point(origin.x+Math.sin(heading-half)*reach,origin.z+Math.cos(heading-half)*reach);
   const right=point(origin.x+Math.sin(heading+half)*reach,origin.z+Math.cos(heading+half)*reach);
   this.strip(this.edge,origin,left,.065);this.strip(this.edge,origin,right,.065);
   const centre=point(origin.x+Math.sin(heading)*reach*.62,origin.z+Math.cos(heading)*reach*.62);
   const a=point(centre.x+Math.sin(heading)*.55,centre.z+Math.cos(heading)*.55);
   this.strip(this.glyph,centre,a,.08);
 }
 private marker(c:P,r:number):void{
   const radius=Math.max(.55,r);
   this.disc(this.fill,c,radius,40);
   this.annulus(this.aura,c,radius,Math.min(radius*.30,.58),40);
   this.annulus(this.edge,c,radius,Math.min(radius*.05,.13),48);
   const tick=clamp(radius*.16,.22,.65),gap=clamp(radius*.08,.14,.35);
   this.strip(this.glyph,point(c.x-radius+gap,c.z),point(c.x-radius+gap+tick,c.z),.075);
   this.strip(this.glyph,point(c.x+radius-gap-tick,c.z),point(c.x+radius-gap,c.z),.075);
   this.strip(this.glyph,point(c.x,c.z-radius+gap),point(c.x,c.z-radius+gap+tick),.075);
   this.strip(this.glyph,point(c.x,c.z+radius-gap-tick),point(c.x,c.z+radius-gap),.075);
   this.disc(this.glyph,c,Math.min(radius*.055,.22),12);
 }
 show(spec:HighflyAimSpec,actor:P,target:P,valid=true):void{
   if(![actor.x,actor.z,target.x,target.z,spec.range,spec.radius].every(Number.isFinite)){
     this.hide();return;
   }
   for(const s of this.surfaces)s.used=0;
   const dx=target.x-actor.x,dz=target.z-actor.z;
   const raw=Math.hypot(dx,dz);
   const ux=raw>.0001?dx/raw:0,uz=raw>.0001?dz/raw:1;
   const reach=Math.max(.5,spec.range||.5);
   const distance=clamp(raw,.5,reach);
   const end=point(actor.x+ux*distance,actor.z+uz*distance);
   const yaw=Math.atan2(ux,uz);
   const shape:HighflyAimShape=spec.shape;
   if(shape==='line')this.shapeArrow(actor,end,distance,spec.width,'line');
   else if(shape==='cone')this.drawCone(actor,yaw,distance,spec.angle);
   else if(shape==='circle')this.marker(end,Math.max(.2,spec.radius));
   else if(shape==='dash'){
     this.shapeArrow(actor,end,distance,spec.width,'dash');
     this.marker(end,Math.max(.55,spec.radius));
   }else this.marker(end,.85);
   const scheme=valid
     ? (shape==='dash'?[0xd7a353,0xe5b66b,0xffdfa3,0xffeed6]
        :shape==='circle'?[0x329baf,0x37cdcb,0x95f5e1,0xe9fff5]
        :shape==='target'?[0x9d7ac8,0xb5a4e9,0xd8c3ff,0xf4edff]
        :[0x268db2,0x3baeda,0x9ce8ff,0xe5fbff])
     :[0xa34545,0xd45858,0xff9996,0xffd6d1];
   for(let i=0;i<this.surfaces.length;i++){
     const s=this.surfaces[i];
     s.geom.setDrawRange(0,s.used);
     (s.geom.attributes.position as THREE.BufferAttribute).needsUpdate=true;
     s.material.color.setHex(scheme[i]);
   }
   this.root.visible=true;
 }
 hide():void{this.root.visible=false;}
 dispose():void{
   this.scene.remove(this.root);
   for(const s of this.surfaces){s.geom.dispose();s.material.dispose();}
 }
}
