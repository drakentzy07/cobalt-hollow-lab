import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { modularPartNames, normalizeAppearance } from '../src/render/characters/modular';

const file = (p:string) => readFileSync(p,'utf8');
const fresh=(originHunterEnabled:boolean) =>
  new Sim({seed:7101,playerClass:'warrior',playerName:'Hunter',originHunterEnabled});

describe('CLEAN R1 P1: real unarmed Hunter, native modular underwear, legacy isolation',()=>{
  it('fresh Origin Hunter has no class starter weapon, chest or offhand',()=>{
    const sim=fresh(true);
    expect(sim.player.originResources).toBeDefined();
    expect(sim.equipment.mainhand).toBeUndefined();
    expect(sim.equipment.chest).toBeUndefined();
    expect(sim.equipment.offhand).toBeUndefined();
  });

  it('original nine-class player STILL gets the original native starter kit',()=>{
    const sim=fresh(false);
    expect(sim.player.originResources).toBeUndefined();
    expect(sim.equipment.mainhand).toBeTruthy();
    expect(sim.equipment.chest).toBeTruthy();
  });

  it('a restored Hunter retains exactly the saved equipment, never auto-resets',()=>{
    const original=fresh(true);
    const state=original.serializeCharacter(original.playerId);
    expect(state).not.toBeNull();
    const restored = new Sim({seed:7101,playerClass:'warrior',playerName:'Hunter',
      noPlayer:true,originHunterEnabled:true});
    restored.addPlayer('warrior','Hunter',{state:state!});
    expect(restored.equipment).toEqual(original.equipment);
    expect(restored.player.originResources).toBeDefined();
  });

  it('both true native modular bodies have original undergarment meshes',()=>{
    const male=modularPartNames(normalizeAppearance({gender:'male'}),{});
    const female=modularPartNames(normalizeAppearance({gender:'female'}),{});
    expect(male).toContain('M_Loin');
    expect(female).toContain('F_Loin');
    expect(female).toContain('F_Top');
    expect(male).toContain('M_Torso');
    expect(female).toContain('F_Torso');
  });

  it('the real entry has TWO explicit choices but no donor class picker',()=>{
    const runtime=file('src/highfly/highfly_origin_trial_runtime.ts');
    const main=file('src/main.ts');
    expect(runtime).toContain("id='hf-clean-gender-picker'");
    expect(runtime).toContain("btn.dataset.originGender=variant");
    expect(runtime).toContain("onStart(name,gender)");
    expect(main).toContain("installOriginTrialEntrance((name,gender)=>");
    expect(main).toContain("normalizeAppearance({...modularAppearance,gender})");
    expect(main).toContain("startOffline('warrior',name");
  });
});
