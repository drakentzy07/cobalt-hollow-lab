import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { grantDevotion, canActivateDivineAscension } from '../src/sim/paladin_devotion';
import { originAimSelect, originUtilitySkill } from '../src/highfly/highfly_origin_r17_hud';

describe('HIGHFLY ORIGIN R1-7: true native Divine Ascension for classless Hunter',()=>{
  it('initializes native devotion at ZERO only for opted-in Hunter, not legacy warrior',()=>{
    const origin=new Sim({seed:701,playerClass:'warrior',originHunterEnabled:true});
    const classic=new Sim({seed:701,playerClass:'warrior'});
    expect(origin.player.originResources).toBeDefined();
    expect(origin.player.paladinDevotion?.value).toBe(0);
    expect(classic.player.paladinDevotion).toBeUndefined();
    expect(grantDevotion(classic.player,20)).toBe(0);
  });
  it('learns original ascension, earns devotion from original hook, then activates without free charge',()=>{
    const sim=new Sim({seed:702,playerClass:'warrior',originHunterEnabled:true});
    expect(sim.learnOriginHunterSkillTrusted('divine_ascension')).toBe(true);
    expect(canActivateDivineAscension(sim.player)).toBe(false);
    expect(grantDevotion(sim.player,20)).toBe(20);
    expect(canActivateDivineAscension(sim.player)).toBe(true);
    sim.castAbility('divine_ascension');
    expect(sim.player.paladinDevotion?.ascensionCharges).toBeGreaterThan(0);
    expect(sim.player.paladinDevotion?.value).toBe(0);
  });
  it('preserves native equipment API; removes only new-preview offhand',()=>{
    const sim=new Sim({seed:703,playerClass:'warrior',originHunterEnabled:true});
    expect(sim.equipment.offhand).toBe('eastbrook_buckler');
    expect(sim.unequipItem('offhand')).toBe(true);
    expect(sim.equipment.offhand).toBeUndefined();
    expect(sim.equipment.mainhand).toBe('worn_sword');
  });
});
describe('HIGHFLY ORIGIN R1-7: 10 combat + 8 utility, native actions only',()=>{
  it('classifies protective skills below and offensive skills in S1-S10',()=>{
    expect(originUtilitySkill('divine_ascension')).toBe(true);
    expect(originUtilitySkill('divine_protection')).toBe(true);
    expect(originUtilitySkill('holy_light')).toBe(true);
    expect(originUtilitySkill('sinister_strike')).toBe(false);
    expect(originUtilitySkill('shield_bash')).toBe(false);
  });
  it('aims at a directional enemy only within the native skill range; never targets friendlies',()=>{
    const player={pos:{x:0,z:0},facing:0};
    const mobs=[
      {id:2,kind:'mob',dead:false,hostile:true,hp:90,maxHp:100,pos:{x:0,z:6}},
      {id:3,kind:'mob',dead:false,hostile:true,hp:10,maxHp:100,pos:{x:0,z:9}},
      {id:4,kind:'mob',dead:false,hostile:false,hp:1,maxHp:100,pos:{x:0,z:2}},
      {id:5,kind:'mob',dead:true,hostile:true,hp:0,maxHp:100,pos:{x:0,z:1}},
      {id:6,kind:'mob',dead:false,hostile:true,hp:1,maxHp:100,pos:{x:0,z:50}},
    ];
    expect(originAimSelect(player,mobs,{dx:0,dy:-80},30,'nearest')).toBe(2);
    expect(originAimSelect(player,mobs,{dx:0,dy:-80},30,'lowest-hp')).toBe(3);
    expect(originAimSelect(player,mobs,{dx:0,dy:80},30,'nearest')).toBeNull();
  });
  it('copies neither combat engine nor automatic attack paths',()=>{
    const module=readFileSync('src/highfly/highfly_origin_r17_hud.ts','utf8');
    const hud=readFileSync('src/ui/hud.ts','utf8');
    const trial=readFileSync('src/highfly/highfly_origin_trial_runtime.ts','utf8');
    expect(hud).toContain('installOriginAimAndLoadout({');
    expect(hud).toContain('this.commitHotbarActions(');
    expect(hud).toContain('this.sim.targetEntity(id)');
    expect(hud).toContain('this.castSlot(slot)');
    expect(module).not.toContain('startAutoAttack');
    expect(trial).toContain('hf-origin-utility-row');
    expect(trial).toContain('ORDENAR SKILLS / BUFFS');
  });
});
