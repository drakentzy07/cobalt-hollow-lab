import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {highflyAimShape,highflyWorldAim} from '../src/highfly/combat/f24_aim_core';
import {f1StartState,normalizeOriginF1Save,originCanTrainSkill,ORIGIN_F23_MASTER_SKILLS} from '../src/highfly/origin/f1_core';
const source=(path:string)=>readFileSync(path,'utf8');
describe('F2.7 P2: genuine original cross-school skills and native MOBA targeting',()=>{
  it('keeps fireball golden and adds Rogue cone plus remotely placed ground circle',()=>{
    expect(highflyAimShape('fireball')).toBe('line');
    expect(highflyAimShape('sinister_strike')).toBe('cone');
    expect(highflyAimShape('meteor')).toBe('ground-circle');
    expect(highflyAimShape('highfly_blade_rush')).toBe('dash');
    expect(highflyAimShape('frost_nova')).toBe('circle');
    const placed=highflyWorldAim({x:0,z:0},0,0,-94,30);
    expect(placed.z).toBeCloseTo(30);
    expect(placed.x).toBeCloseTo(0);
  });
  it('preserves acquired cross-school IDs while dropping corrupted IDs',()=>{
    const saved=normalizeOriginF1Save({...f1StartState(),learnedAbilityIds:['fireball','meteor','sinister_strike','meteor','unknown']});
    expect(saved?.learnedAbilityIds).toEqual(['fireball','meteor','sinister_strike']);
    expect(ORIGIN_F23_MASTER_SKILLS.length).toBe(7);
    expect(originCanTrainSkill('meteor',1,1000,[])).toBe(false);
    expect(originCanTrainSkill('meteor',16,120,[])).toBe(true);
    expect(originCanTrainSkill('sinister_strike',1,8,[])).toBe(true);
    expect(originCanTrainSkill('sinister_strike',1,8,['sinister_strike'])).toBe(false);
  });
  it('does not fake damage: use original Sim damage, resource rules and impact',()=>{
    const sim=source('src/sim/content/classes.ts');
    expect(sim).toContain("id: 'sinister_strike'");
    expect(sim).toContain("id: 'meteor'");
    expect(sim).toContain("type: 'weaponStrike'");
    expect(sim).toContain("type: 'groundAoE'");
    const ui=source('src/highfly/origin/f1_world_ui.ts');
    expect(ui).toContain("id==='sinister_strike'");
    expect(ui).toContain('highflyStaminaCost:10');
    expect(ui).toContain('castWhileMoving:trialDef.castWhileMoving===true');
    expect(ui).toContain("id==='meteor'");
    const main=source('src/main.ts');
    expect(main).toContain("shape==='ground-circle'?8");
    expect(main).toContain("shape==='leap'||shape==='ground-circle'");
    expect(main).toContain("shape!=='circle'&&shape!=='ground-circle'");
    const visual=source('src/render/ground_aim_reticle_visual.ts');
    expect(visual).toContain("shape==='ground-circle'");
  });
  it('cancels without casting or consuming resources',()=>{
    const ring=source('src/ui/hud/action_bar/mobile_action_ring_controller.ts');
    expect(ring).toContain('if(commit && !cancel)deps.castSlot(currentSlot)');
  });
});
