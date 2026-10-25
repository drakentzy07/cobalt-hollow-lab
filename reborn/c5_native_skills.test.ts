import {describe,it,expect} from 'vitest';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
const ids=['highfly_arc_shot','highfly_cross_cut','highfly_breakstep','highfly_storm_circle'];
describe('C5 original skills via 0.44.7 native Sim KnownAbility (not preview-only)',()=>{
 it('learned at level 1 through adapter until universal class removal',()=>{
   const known=new Set(abilitiesKnownAt('warrior',1).map(k=>k.def.id));
   for(const id of ids){
     expect(CLASSES.warrior.abilities).toContain(id);
     expect(known.has(id)).toBe(true);
   }
 });
 it('S1 native projectile / S2 cone / S3 area / S4 delayed meteor',()=>{
   expect(ABILITIES.highfly_arc_shot.projectile).toBe(true);
   expect(ABILITIES.highfly_arc_shot.requiresTarget).toBe(true);
   expect(ABILITIES.highfly_arc_shot.effects[0].type).toBe('directDamage');
   expect(ABILITIES.highfly_cross_cut.effects[0].type).toBe('aoeDamage');
   expect(ABILITIES.highfly_breakstep.effects[0].type).toBe('aoeDamage');
   expect(ABILITIES.highfly_storm_circle.targetMode).toBe('position');
   expect(ABILITIES.highfly_storm_circle.effects[0].type).toBe('groundAoE');
   expect(ABILITIES.highfly_storm_circle.effects[0]).toHaveProperty('delayed',true);
 });
});
