import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { ABILITIES } from '../src/sim/content/classes';
import { originCostDecision } from '../src/sim/highfly_origin_universal_resources';
import { originAimSelect, originUtilitySkill, originSkillRole } from '../src/highfly/highfly_origin_r17_hud';

describe('HIGHFLY ORIGIN R1-7: honest non-equippable class skill references',()=>{
  it('keeps Divine Ascension in library until its specialist effects are truly useful',()=>{
    expect(originSkillRole('divine_ascension')).toBe('reference');
    expect(originCostDecision(ABILITIES.divine_ascension).ok).toBe(false);
    const hunter=new Sim({seed:701,playerClass:'warrior',originHunterEnabled:true});
    const warrior=new Sim({seed:701,playerClass:'warrior'});
    expect(hunter.player.paladinDevotion).toBeUndefined();
    expect(warrior.player.paladinDevotion).toBeUndefined();
  });
  it('native offhand removal works without changing legacy equipment',()=>{
    const sim=new Sim({seed:703,playerClass:'warrior',originHunterEnabled:true});
    expect(sim.equipment.offhand).toBe('eastbrook_buckler');
    expect(sim.unequipItem('offhand')).toBe(true);
    expect(sim.equipment.offhand).toBeUndefined();
    expect(sim.equipment.mainhand).toBe('worn_sword');
  });
});
describe('HIGHFLY ORIGIN R1-7: 10 combat + 8 utility, native actions only',()=>{
  it('classifies protective skills below and offensive skills in S1-S10',()=>{
    expect(originSkillRole('divine_ascension')).toBe('reference');
    expect(originSkillRole('holy_light')).toBe('support');
    expect(originUtilitySkill('divine_protection')).toBe(true);
    expect(originSkillRole('demon_skin')).toBe('support');
    expect(originSkillRole('rockbiter_weapon')).toBe('reference');
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
    expect(originAimSelect(player,mobs,{dx:0,dy:80},30,'nearest',Math.PI)).toBe(2);
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
    expect(trial).toContain('BIBLIOTECA · CONSULTA');
    expect(trial).toContain('mountOriginR18Editor(');
    expect(module).toContain('.mobile-action-slot[data-mobile-index]');
    expect(module).toContain('h.ringSlot(');
    expect(module).toContain('h.cameraYaw()');
  });
});
