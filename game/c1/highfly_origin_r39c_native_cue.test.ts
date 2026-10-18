import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {Sim} from '../src/sim/sim';
import {
  r39CIsNativeBasicCue,r39CNativeBasicCue,r39CClassifyStrike,r39CConnectWindow,
} from '../src/sim/highfly_r39c_combat_context';

describe('R39C first cumulative integration: real native ATK cue and branch policy',()=>{
  it('R39A now runs on the real native 1-2-3-4 animation cue, never on spells',()=>{
    for(const step of [1,2,3,4] as const){
      expect(r39CIsNativeBasicCue(r39CNativeBasicCue(step))).toBe(true);
    }
    for(const id of ['fireball','meteor','shadow_bolt','heroic_leap','highfly_basic_5','highfly_basic_0',undefined]){
      expect(r39CIsNativeBasicCue(id)).toBe(false);
    }
    const renderer=readFileSync('src/render/renderer.ts','utf8');
    const visual=readFileSync('src/render/characters/visual.ts','utf8');
    expect(renderer).toContain("this.triggerAttack(ev.sourceId,'highfly_basic_'+ev.step)");
    expect(visual).toContain('!r39CIsNativeBasicCue(abilityId)');
    expect(visual).toContain('r39MaskedMobilePair(runClip,attackClip)');
  });
  it('classifies running and airborne without auto-triggering attacks',()=>{
    expect(r39CClassifyStrike({onGround:true,vy:0,horizontalSpeed:0})).toBe('ground');
    expect(r39CClassifyStrike({onGround:true,vy:0,horizontalSpeed:4})).toBe('running');
    expect(r39CClassifyStrike({onGround:false,vy:2,horizontalSpeed:4})).toBe('air');
    expect(r39CClassifyStrike({onGround:false,vy:-3,horizontalSpeed:2})).toBe('plunge');
    expect(r39CClassifyStrike({onGround:true,vy:0,horizontalSpeed:2,dead:true})).toBe(null);
  });
  it('connect window requires another accepted manual press and genuine gem for step 4',()=>{
    const ctx={originalAccepted:true,grounded:true,gemReady:false};
    expect(r39CConnectWindow(1,2,230,ctx)).toBe(true);
    expect(r39CConnectWindow(1,3,230,{...ctx,gemReady:true})).toBe(false);
    expect(r39CConnectWindow(1,2,230,{...ctx,originalAccepted:false})).toBe(false);
    expect(r39CConnectWindow(3,4,250,ctx)).toBe(false);
    expect(r39CConnectWindow(3,4,250,{...ctx,gemReady:true})).toBe(true);
  });
  it('Sim remains the authority for real stamina and elemental lock, R39B retained',()=>{
    const sim=new Sim({seed:361501,playerClass:'warrior',originHunterEnabled:true,compulsoryTutorial:false});
    sim.player.targetId=null;
    const before=sim.player.originResources!.stamina;
    expect(sim.highflyBasicAttack(1)).toBe(true);
    expect(sim.player.originResources!.stamina).toBe(before-4);
    expect(sim.highflyElementalFinisherReady()).toBe(false);
    expect(sim.highflyBasicAttack(4)).toBe(false);
    const gate=readFileSync('src/sim/combat/cast_move_gate.ts','utf8');
    expect(gate).toContain('highflyR39bMobileProjectileCast(p,abilityId,resolved)');
  });
});
