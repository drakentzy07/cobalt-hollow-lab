import {describe,it,expect} from 'vitest';
import {ABILITIES} from '../src/sim/content/classes';
import {
 R29_PREMIUM_CONTRACTS,R29_PREMIUM_READY_TO_CAST,
 installR29PremiumNativeContracts
} from '../src/sim/highfly_origin_r29_premium_native';
import {R27_PREMIUM_23} from '../src/sim/highfly_origin_r27_premium23_catalog';
import {highflyAimSpec,HighflyAimVisual} from '../src/highfly/highfly_origin_r20_premium_aim';
import * as THREE from 'three';

describe('R29 P2 authoritative spells + unique vendor aiming contract',()=>{
 it('maps all 23 pinned source VFX ids uniquely with no phantom damage for pending mechanisms',()=>{
   expect(R29_PREMIUM_CONTRACTS).toHaveLength(23);
   expect(new Set(R29_PREMIUM_CONTRACTS.map(s=>s.id)).size).toBe(23);
   expect(R29_PREMIUM_CONTRACTS.map(s=>s.id))
     .toEqual(R27_PREMIUM_23.map(s=>s.id));
   installR29PremiumNativeContracts();
   installR29PremiumNativeContracts();
   expect(R29_PREMIUM_READY_TO_CAST.length).toBeGreaterThan(10);
   for(const c of R29_PREMIUM_CONTRACTS){
     const n=ABILITIES[c.id];
     expect(n.id).toBe(c.id);
     expect(n.cost).toBe(c.mana);
     expect(n.cooldown).toBe(c.cooldown);
     expect(n.targetMode).toBe(c.aim==='line'?undefined:'position');
     const complete=c.readiness!=='visual-only-behavior-pending';
     expect(n.hiddenFromPlayer).toBe(!complete);
     if(!complete)expect(n.effects).toEqual([]);
     else expect(n.effects[0]?.type).toMatch(/directDamage|groundAoE/);
   }
 });
 it('all 5 source aim families remain distinctive and native synced',()=>{
   installR29PremiumNativeContracts();
   const shapes=new Set();
   for(const c of R29_PREMIUM_CONTRACTS){
     const aim=highflyAimSpec(c.id);
     expect(aim?.range).toBe(c.range);
     expect(aim?.radius).toBe(c.radius);
     expect(aim?.shape).toBe(c.aim);
     shapes.add(aim?.shape);
   }
   expect([...shapes].sort()).toEqual(['circle','gate','line','ring','scribe']);
 });
 it('MIT original rings, gates and runes are separate bounded terrain geometry',()=>{
   const scene=new THREE.Scene(), visual=new HighflyAimVisual(scene,()=>0);
   const spec=highflyAimSpec('hf_vfx23_tidewrought_ring')!;
   for(const shape of ['ring','gate','scribe'] as const){
     visual.show({...spec,shape},{x:2,z:3},{x:8,z:11});
     expect(visual.root.visible).toBe(true);
     const render=visual.root.children[0] as THREE.Mesh;
     expect(render.geometry.drawRange.count).toBeGreaterThan(0);
   }
   visual.dispose();
   expect(scene.children.includes(visual.root)).toBe(false);
 });
});
