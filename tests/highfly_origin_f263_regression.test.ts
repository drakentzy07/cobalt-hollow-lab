import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {highflyDirectionalFlip,HIGHFLY_SOMERSAULT_SECONDS} from '../src/render/characters/highfly_combat_presentation';
import {highflyF262GroundContact} from '../src/highfly/combat/f26_skillshot_core';
describe('F2.6.3 S23 critical input regressions',()=>{
 it('four directions map to the actual chosen axis',()=>{
  const t=HIGHFLY_SOMERSAULT_SECONDS/2;
  expect(highflyDirectionalFlip(t,'forward').pitch).toBeGreaterThan(0);
  expect(highflyDirectionalFlip(t,'back').pitch).toBeLessThan(0);
  expect(highflyDirectionalFlip(t,'left').roll).toBeLessThan(0);
  expect(highflyDirectionalFlip(t,'right').roll).toBeGreaterThan(0);
 });
 it('widens the soft collision corridor but preserves manual misses',()=>{
  const a={x:0,y:6,z:0},b={x:0,y:2,z:10};
  expect(highflyF262GroundContact(a,b,{x:2,z:5})).not.toBeNull();
  expect(highflyF262GroundContact(a,b,{x:3.5,z:5})).toBeNull();
  expect(readFileSync('src/render/ground_aim_reticle_visual.ts','utf8')).toContain('const halfWidth=2.1');
 });
 it('cancel X pointerup cannot commit an acknowledged gesture',()=>{
  const s=readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts','utf8');
  expect(s).toContain("cancel?'cancel':'end'");
  expect(s).toContain('if(commit && !cancel)deps.castSlot(currentSlot)');
 });
});
