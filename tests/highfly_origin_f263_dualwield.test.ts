import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {isHighflyLeftArmTrack} from '../src/render/characters/highfly_combat_presentation';
describe('F2.6.3 real dual-wield clips',()=>{
 it('includes LEFT Rig_Medium bones and spine support but excludes right arm',()=>{
   expect(isHighflyLeftArmTrack('upperarm.l.quaternion')).toBe(true);
   expect(isHighflyLeftArmTrack('spine.quaternion')).toBe(true);
   expect(isHighflyLeftArmTrack('hand.l.quaternion')).toBe(true);
   expect(isHighflyLeftArmTrack('upperarm.r.quaternion')).toBe(false);
   expect(isHighflyLeftArmTrack('hips.position')).toBe(false);
 });
 it('only applies four-beat left-right dual sequence to the F263 Hunter',()=>{
   const v=readFileSync('src/render/characters/visual.ts','utf8');
   expect(v).toContain("leftOnly?'hf_f263_left_'+name:name");
   expect(v).toContain("f263 && abilityId==='highfly_basic_2'");
   expect(v).toContain("this.def.clips.attackByHand?.dualwield");
 });
});
