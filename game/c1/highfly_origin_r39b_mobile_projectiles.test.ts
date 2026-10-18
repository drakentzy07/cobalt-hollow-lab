import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {ABILITIES} from '../src/sim/content/classes';
import {
  highflyR39bMobileProjectileCast,abilityCastSurvivesMovement,
} from '../src/sim/combat/cast_move_gate';
import type {Entity} from '../src/sim/types';
const hunter=()=>({originResources:{stamina:70,mp:90},auras:[]} as unknown as Entity);
const legacy=()=>({auras:[]} as unknown as Entity);
const resolved=(id:keyof typeof ABILITIES)=>({def:ABILITIES[id],castTime:ABILITIES[id].castTime??0});
describe('HIGHFLY R39B four genuine mobile projectiles, not fake spells',()=>{
 it('Cinderbolt/Frostbolt/Lightning/Shadow allow Hunter movement while casting',()=>{
   for(const id of ['fireball','frostbolt','lightning_bolt','shadow_bolt'] as const) {
      const spell=resolved(id);
      expect(spell.def.requiresTarget).toBe(true);
      expect(spell.castTime).toBeGreaterThan(0);
      expect(highflyR39bMobileProjectileCast(hunter(),id,spell)).toBe(true);
      expect(abilityCastSurvivesMovement(hunter(),id,spell)).toBe(true);
   }
 });
 it('legacy donor classes retain planted casting and classic mobility flags',()=>{
   for(const id of ['fireball','lightning_bolt'] as const){
     expect(highflyR39bMobileProjectileCast(legacy(),id,resolved(id))).toBe(false);
     expect(abilityCastSurvivesMovement(legacy(),id,resolved(id))).toBe(false);
   }
   expect(abilityCastSurvivesMovement(legacy(),'existing',{def:{castWhileMoving:true}})).toBe(true);
   expect(abilityCastSurvivesMovement(legacy(),'existing',{def:{},castWhileMoving:true})).toBe(true);
 });
 it('no channel, area, instant, counterfeit spell, unknown skill or fake Hunter',()=>{
   const p=hunter();
   expect(highflyR39bMobileProjectileCast(p,'meteor',resolved('meteor'))).toBe(false);
   expect(highflyR39bMobileProjectileCast(p,'blizzard',resolved('blizzard'))).toBe(false);
   expect(highflyR39bMobileProjectileCast(p,'arcane_missiles',resolved('arcane_missiles'))).toBe(false);
   expect(highflyR39bMobileProjectileCast(p,'fake-fireball',resolved('fireball'))).toBe(false);
   expect(highflyR39bMobileProjectileCast(p,'fireball',{def:{...resolved('fireball').def,channel:{duration:3}}})).toBe(false);
   expect(highflyR39bMobileProjectileCast(p,'fireball',{def:{...resolved('fireball').def,targetMode:'position'}})).toBe(false);
   expect(highflyR39bMobileProjectileCast(p,'fireball',{def:{...resolved('fireball').def,castTime:0},castTime:0})).toBe(false);
 });
 it('shared native authority stays, and R39A renderer layer is preserved',()=>{
   const motion=readFileSync('src/sim/player_motion.ts','utf8');
   const lifecycle=readFileSync('src/sim/combat/casting_lifecycle.ts','utf8');
   const renderer=readFileSync('src/render/characters/visual.ts','utf8');
   expect(motion).toContain('abilityCastSurvivesMovement(p, p.castingAbility, casting)');
   expect(lifecycle).toContain('!abilityCastSurvivesMovement(p, ability.id, res)');
   expect(renderer).toContain('r39StartMobileBasic(abilityId)');
   expect(renderer).toContain('r39MaskedMobilePair');
   expect(readFileSync('src/sim/combat/cast_move_gate.ts','utf8')).toContain('highflyR39bMobileProjectileCast(p,abilityId,resolved)');
 });
});
