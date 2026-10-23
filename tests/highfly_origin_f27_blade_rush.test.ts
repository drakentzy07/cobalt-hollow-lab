import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import type {Entity} from '../src/sim/types';
import type {SimContext} from '../src/sim/sim_context';
import {finishHighflyBladeRush,HIGHFLY_BLADE_RUSH_ID} from '../src/highfly/combat/f27_blade_rush';
import {highflyAimShape} from '../src/highfly/combat/f24_aim_core';
import { highflyFluidNextStep } from '../src/highfly/combat/combo_fluidity';
import {f1StartState,normalizeOriginF1Save,originCanTrainSkill} from '../src/highfly/origin/f1_core';

const read=(p:string)=>readFileSync(p,'utf8');
describe('F2.7 P3 — physically traveling Blade Rush and real four-contact combo',()=>{
  it('a charge refused by cliffs/roots never deals remote damage and clears its one-shot flag',()=>{
    const p={highflyBladeRushPending:true} as Entity;
    finishHighflyBladeRush({} as SimContext,p,null,false);
    expect(p.highflyBladeRushPending).toBeUndefined();
    const p2={} as Entity;
    finishHighflyBladeRush({} as SimContext,p2,null,true);
    expect(p2.highflyBladeRushPending).toBeUndefined();
  });
  it('reuses native charge pathfinding and applies real weapon contact on arrival',()=>{
    expect(HIGHFLY_BLADE_RUSH_ID).toBe('highfly_blade_rush');
    expect(highflyAimShape(HIGHFLY_BLADE_RUSH_ID)).toBe('dash');
    const move=read('src/sim/sim.ts');
    expect(move).toContain('finishChargeArrival(this.ctx, p, target ?? null, arrived);');
    expect(move).toContain('!manualBladeRush');
    const route=read('src/sim/combat/charge_route.ts');
    expect(route).toContain('finishHighflyBladeRush(ctx, runner, target, arrived);');
    const dispatch=read('src/sim/combat/effect_dispatch.ts');
    expect(dispatch).toContain("ability.id==='highfly_blade_rush'");
    const skill=read('src/highfly/combat/f27_blade_rush.ts');
    expect(skill).toContain('meleeSwing(ctx,runner,target,4');
    expect(skill).toContain('autoAttack:false');
  });
  it('learns Blade Rush without giving away a skill or corrupting previous Hunter saves',()=>{
    expect(originCanTrainSkill('highfly_blade_rush',2,500,[])).toBe(false);
    expect(originCanTrainSkill('highfly_blade_rush',3,12,[])).toBe(true);
    const saved=normalizeOriginF1Save({...f1StartState(),learnedAbilityIds:['fireball','highfly_blade_rush','meteor']});
    expect(saved?.learnedAbilityIds).toEqual(['fireball','highfly_blade_rush','meteor']);
    const ui=read('src/highfly/origin/f1_world_ui.ts');
    expect(ui).toContain("id==='highfly_blade_rush'");
    expect(ui).toContain('highflyStaminaCost:18');
    expect(ui).toContain("effects:[{type:'charge' as const}]");
  });
  it('offers fourth PHYSICAL strike even without a gem, while gem bonus remains conditional',()=>{
    const hud=read('src/ui/hud.ts');
    expect(hud).toContain('highflyFluidNextStep(this.highflyComboStep)');
    expect(highflyFluidNextStep(3)).toBe(4);
    expect(hud).toContain('const finishesChain = next === 4;');
    const attack=read('src/sim/combat/auto_attack.ts');
    expect(attack).not.toContain("if (step === 4 && !highflyElementalFinisherReady(p)) return false;");
    expect(attack).toContain("if (landed && step === 4 && element !== 'base')");
  });
  it('guides movement toward a target without falsely displaying a full damage lane',()=>{
    const v=read('src/render/ground_aim_reticle_visual.ts');
    expect(v).toContain("}else if(shape==='dash'){");
    expect(v).toContain('this.softLaneGeometry.setDrawRange(0,0);');
    expect(v).toContain('segment(x+ox,z+oz,aim.x+ox,aim.z+oz);');
  });
});
