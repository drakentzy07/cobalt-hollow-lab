import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {HighflyAimVisual} from '../src/highfly/highfly_origin_r22_premium_visual';
import {highflyAimSpec,type HighflyAimShape} from '../src/highfly/highfly_origin_r20_premium_aim';
const pos=(m:THREE.Mesh)=>{
 const g=m.geometry as THREE.BufferGeometry;
 const v=g.getAttribute('position') as THREE.BufferAttribute;
 return Array.from({length:g.drawRange.count},(_,i)=>({
   x:v.getX(i),y:v.getY(i),z:v.getZ(i)
 }));
};
const scene=()=>new THREE.Scene();
describe('HIGHFLY R22 premium visual renderer — world units and S23 reuse',()=>{
 it('draws a TAPERED melee arrow with arrowhead entirely INSIDE native preview range',()=>{
   const s=scene(),v=new HighflyAimVisual(s,()=>1.25);
   const spec=highflyAimSpec('sinister_strike')!;
   expect(spec).toMatchObject({shape:'line',range:4.5});
   v.show(spec,{x:0,z:0},{x:0,z:4.5});
   const vertices=v.root.children.flatMap(x=>pos(x as THREE.Mesh));
   expect(vertices.length).toBeGreaterThan(40);
   expect(Math.max(...vertices.map(p=>p.z))).toBeLessThanOrEqual(4.50001);
   expect(Math.min(...vertices.map(p=>p.z))).toBeGreaterThanOrEqual(-.00001);
   // 4 terrain-attached layers of subtly different height.
   expect(new Set(vertices.map(p=>p.y.toFixed(3))).size).toBe(4);
   v.dispose();expect(s.children).not.toContain(v.root);
 });
 it('actual AoE circle is radius seven, including its outer border',()=>{
   const v=new HighflyAimVisual(scene(),()=>0);
   const spec=highflyAimSpec('blizzard')!;
   expect(spec).toMatchObject({shape:'circle',radius:7,range:30});
   v.show(spec,{x:0,z:0},{x:0,z:11});
   const verts=v.root.children.flatMap(x=>pos(x as THREE.Mesh));
   expect(Math.max(...verts.map(p=>Math.hypot(p.x,p.z-11)))).toBeLessThanOrEqual(7.001);
   expect(verts.some(p=>Math.abs(Math.hypot(p.x,p.z-11)-7)<.015)).toBe(true);
   v.dispose();
 });
 it('dash ends at selected destination with a separate authentic landing AoE ring',()=>{
   const v=new HighflyAimVisual(scene(),()=>0);
   const native=highflyAimSpec('heroic_leap')!;
   expect(native).toMatchObject({shape:'dash',range:30,radius:6});
   v.show(native,{x:0,z:0},{x:0,z:18});
   const verts=v.root.children.flatMap(x=>pos(x as THREE.Mesh));
   expect(verts.some(p=>p.z>23.7)).toBe(true); // landing effect: 18 + native radius 6
   expect(verts.some(p=>p.z<5)).toBe(true); // travel arrow starts near caster
   v.dispose();
 });
 it('cone and target prototypes only DRAW, never grant a skill or modify combat state',()=>{
   const v=new HighflyAimVisual(scene(),()=>0);
   const base=highflyAimSpec('fireball')!;
   const testSpecs=[
     {...base,shape:'cone' as HighflyAimShape,range:8,angle:Math.PI/2},
     {...base,shape:'target' as HighflyAimShape,range:4.5}
   ];
   for(const spec of testSpecs){
     v.show(spec,{x:3,z:4},{x:3,z:9});
     expect(v.root.visible).toBe(true);
     expect(v.root.children.flatMap(x=>pos(x as THREE.Mesh)).length).toBeGreaterThan(20);
   }
   v.hide();expect(v.root.visible).toBe(false);
   v.dispose();
 });
 it('reuses the same four GPU geometries and never creates a texture on drag',()=>{
   const v=new HighflyAimVisual(scene(),(x,z)=>Math.sin(x*.03+z*.02));
   const original=v.root.children.map(x=>x);
   const buffers=original.map(x=>(x as THREE.Mesh).geometry.getAttribute('position').array);
   const specs=['fireball','blizzard','heroic_leap','sinister_strike'] as const;
   for(let i=0;i<80;i++){
     const spec=highflyAimSpec(specs[i%specs.length])!;
     v.show(spec,{x:i/5,z:-3},{x:i/5+7,z:5},i%3!==0);
     v.root.children.forEach((node,j)=>{
       const mesh=node as THREE.Mesh;
       expect(node).toBe(original[j]);
       expect(mesh.geometry.getAttribute('position').array).toBe(buffers[j]);
       expect(mesh.geometry.drawRange.count).toBeLessThanOrEqual(2048);
       expect((mesh.material as THREE.MeshBasicMaterial).map).toBeNull();
     });
   }
   v.dispose();
 });
 it('the gallery is explicitly optional and strictly visual: never casts or learns',()=>{
   const runtime=readFileSync('src/highfly/highfly_origin_trial_runtime.ts','utf8');
   expect(runtime).toContain('hf-origin-r22-visual-gallery');
   expect(runtime).toContain('PRUEBA VISUAL DE APUNTADOS');
   const aim=readFileSync('src/highfly/highfly_origin_r17_hud.ts','utf8');
   const section=aim.slice(aim.indexOf('  const visualPreview=(event:Event)=>{'),
     aim.indexOf("  document.addEventListener('hf-origin-aim-gallery',visualPreview);"));
   expect(section).toContain('premium.show(sample');
   expect(section).not.toContain('h.castSlot(');
   expect(section).not.toContain('h.castAt(');
   expect(section).not.toContain('h.setSlot(');
   expect(section).not.toContain('h.target(');
 });
});
