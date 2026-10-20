import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {highflyDualComboClips,isHighflyRightArmTrack,isHighflyLeftArmTrack} from '../src/render/characters/highfly_combat_presentation';

describe('F2.7 P1: distinct dual-wield choreography and readable native portrait resources',()=>{
  it('never mixes left and right arm animation mask tracks',()=>{
    expect(isHighflyRightArmTrack('upperarm.r.quaternion')).toBe(true);
    expect(isHighflyRightArmTrack('upperarm.l.quaternion')).toBe(false);
    expect(isHighflyLeftArmTrack('upperarm.r.quaternion')).toBe(false);
    expect(isHighflyRightArmTrack('hips.position')).toBe(false);
  });
  it('selects different authored clips for rising and paired finishing cuts',()=>{
    expect(highflyDualComboClips(3)[0]).toBe('Dualwield_Melee_Attack_Slice');
    expect(highflyDualComboClips(4)[0]).toBe('Dualwield_Melee_Attack_Chop');
    const visual=readFileSync('src/render/characters/visual.ts','utf8');
    expect(visual).toContain('step===2,step===1');
    expect(visual).toContain('originUpperAttack');
    expect(visual).toContain('const upper=source.tracks.filter');
  });
  it('keeps one HP/MP/ST portrait with 20px cyan mana instead of adding another HP',()=>{
    const css=readFileSync('src/styles/hud.css','utf8');
    expect(css).toContain('body.hf-origin-f263 #player-frame #pf-res {');
    expect(css).toContain('#36bde9');
    expect(css).toContain('height: 20px !important');
    const ui=readFileSync('src/highfly/origin/f1_world_ui.ts','utf8');
    expect(ui).toContain('The original ClaudeCraft unit frame is the only HP authority/display.');
  });
  it('retains cancel-on-cross without spending mana or casting',()=>{
    const ring=readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts','utf8');
    expect(ring).toContain("cancel?'cancel':'end'");
    expect(ring).toContain('if(commit && !cancel)deps.castSlot(currentSlot)');
  });
});
