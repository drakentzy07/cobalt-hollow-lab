import {describe,it,expect} from 'vitest';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';

const ids=['highfly_arc_shot','highfly_cross_cut','highfly_breakstep','highfly_storm_circle'];
describe('HIGHFLY REBORN: real native KnownAbility pipeline',()=>{
 it('Hunter internal adapter starts with all four original skills at LV1',()=>{
   const known=abilitiesKnownAt('warrior',1);
   const knownIds=new Set(known.map(k=>k.def.id));
   for(const id of ids){
     expect(CLASSES.warrior.abilities).toContain(id);
     expect(knownIds.has(id)).toBe(true);
     expect(ABILITIES[id].learnLevel).toBe(1);
     expect(ABILITIES[id].castTime).toBe(0);
   }
 });
 it('authoritative targeting and effects match four types',()=>{
   expect(ABILITIES.highfly_arc_shot.targetMode).toBe('position');
   expect(ABILITIES.highfly_storm_circle.targetMode).toBe('position');
   expect(ABILITIES.highfly_cross_cut.effects[0].type).toBe('aoeDamage');
   expect(ABILITIES.highfly_breakstep.effects[0].type).toBe('aoeDamage');
   expect(ABILITIES.highfly_storm_circle.effects[0].type).toBe('groundAoE');
 });
});
