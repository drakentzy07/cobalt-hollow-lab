import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {HIGHFLY_F263_GROUND_HIT_RADIUS,highflyF262GroundContact} from '../src/highfly/combat/f26_skillshot_core';
import {HIGHFLY_SOMERSAULT_SECONDS,highflyF263DirectionalFlip,highflyWeaponBasicClips,isHighflyLeftArmTrack} from '../src/render/characters/highfly_combat_presentation';
describe('F2.6.3 S23 root-cause stability',()=>{
  it('all four directional second jumps: forward and backward full flips, lateral rolls',()=>{
    const f=highflyF263DirectionalFlip(HIGHFLY_SOMERSAULT_SECONDS/2,'forward');
    expect(f.pitch).toBeGreaterThan(3);
    expect(f.roll).toBe(0);
    expect(highflyF263DirectionalFlip(.36,'left').roll).toBeLessThan(-3);
    const back=highflyF263DirectionalFlip(HIGHFLY_SOMERSAULT_SECONDS/2,'back');
    expect(back.pitch).toBeLessThan(-3);
    expect(back.roll).toBe(0);
    expect(back.pitch).toBeCloseTo(-f.pitch,5);
    expect(highflyF263DirectionalFlip(0,'back')).toEqual({pitch:0,roll:0});
    expect(highflyF263DirectionalFlip(HIGHFLY_SOMERSAULT_SECONDS,'back')).toEqual({pitch:0,roll:0});
  });
  it('a near wolf gets forgiving 2D overlap but a distant aim still misses',()=>{
    const a={x:0,y:6,z:0},b={x:0,y:1,z:10};
    expect(HIGHFLY_F263_GROUND_HIT_RADIUS).toBeGreaterThan(1.35);
    expect(highflyF262GroundContact(a,b,{x:1.8,z:6},HIGHFLY_F263_GROUND_HIT_RADIUS)).not.toBeNull();
    expect(highflyF262GroundContact(a,b,{x:4,z:6},HIGHFLY_F263_GROUND_HIT_RADIUS)).toBeNull();
  });
  it('cancel acknowledgement must not cast',()=>{
    const s=readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts','utf8');
    expect(s).toContain('if(commit && !cancel)deps.castSlot(currentSlot)');
    expect(s).toContain("cancel?'cancel':'end'");
  });
  it('weapon attacks differ by family and dual-wield second strike uses LEFT tracks',()=>{
    expect(highflyWeaponBasicClips('rusty_hatchet',2)[0]).toBe('1H_Melee_Attack_Slice_Diagonal');
    expect(highflyWeaponBasicClips('bronzework_mace',1)[0]).toBe('1H_Melee_Attack_Chop');
    expect(highflyWeaponBasicClips('worn_sword',1)[0]).toBe('1H_Melee_Attack_Chop');
    expect(isHighflyLeftArmTrack('upperarm.l.quaternion')).toBe(true);
    expect(isHighflyLeftArmTrack('upperarm.r.quaternion')).toBe(false);
    expect(isHighflyLeftArmTrack('hips.position')).toBe(false);
    const visual=readFileSync('src/render/characters/visual.ts','utf8');
    expect(visual).toContain('highflyWeaponBasicClips(this.weaponItemId,step)');
    expect(visual).toContain('true,abilityId,step===2,step===1');
  });
  it('imports previous lab without overwriting it and shows MP ST under HP',()=>{
    const save=readFileSync('src/game/highfly_offline_save.ts','utf8');
    expect(save).toContain('highfly.origin.f263-combat-beta.primary.v1');
    expect(save).toContain("readLocal(F27_PAGES_LAB?'highfly.origin.f263-combat-beta.primary.v1':'highfly.origin.f262-combat-beta.primary.v1')");
    const css=readFileSync('src/styles/hud.css','utf8');
    expect(css).toContain('body.hf-origin-f263 #player-frame #pf-resource');
    expect(css).toContain('body.hf-origin-f263 #player-frame #hf-origin-f1-resource-meter');
  });
});