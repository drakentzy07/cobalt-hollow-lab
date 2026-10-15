import { describe,it,expect } from 'vitest';
import * as THREE from 'three';
import { highflyAimSpec,HighflyAimVisual,type HighflyAimShape } from '../src/highfly/highfly_origin_r20_premium_aim';
import { originAimSelect } from '../src/highfly/highfly_origin_r17_hud';
describe('HIGHFLY ORIGIN R20 — GPU targeting from native ability contracts',()=>{
 it('maps verified native skill effects, not guesses or aesthetics',()=>{
   expect(highflyAimSpec('fireball')?.shape).toBe('line');
   expect(highflyAimSpec('arcane_shot')?.minRange).toBe(8);
   expect(highflyAimSpec('blizzard')).toMatchObject({shape:'circle',radius:7,range:30});
   expect(highflyAimSpec('volley')).toMatchObject({shape:'circle',radius:8,range:35});
   expect(highflyAimSpec('heroic_leap')).toMatchObject({shape:'dash',radius:6,range:30});
   expect(highflyAimSpec('thunderstorm')?.selfCentered).toBe(true);
   expect(highflyAimSpec('no_such_skill')).toBeNull();
 });
 it('renders bounded GPU geometry for all 5 classes and disposes cleanly',()=>{
   const scene=new THREE.Scene();
   const view=new HighflyAimVisual(scene,()=>0);
   const spec=highflyAimSpec('heroic_leap')!;
   for(const shape of ['line','cone','circle','dash','target'] as HighflyAimShape[]){
     view.show({...spec,shape,radius:shape==='circle'?7:spec.radius},
       {x:0,z:0},{x:5,z:8});
     expect(view.root.visible).toBe(true);
     const geometries=view.root.children as (THREE.Mesh|THREE.LineSegments)[];
     expect(geometries[0].geometry.drawRange.count).toBeGreaterThan(0);
     expect(geometries[1].geometry.drawRange.count).toBeGreaterThan(0);
   }
   view.hide();expect(view.root.visible).toBe(false);
   view.dispose();expect(scene.children.includes(view.root)).toBe(false);
 });
 it('never auto-targets outside native skill range',()=>{
   const actor={pos:{x:0,z:0},facing:0};
   const enemies=[{id:2,kind:'mob',dead:false,hostile:true,hp:10,maxHp:30,pos:{x:0,z:7}}];
   expect(originAimSelect(actor,enemies,null,6,'nearest')).toBeNull();
   expect(originAimSelect(actor,enemies,null,8,'nearest')).toBe(2);
 });
});
