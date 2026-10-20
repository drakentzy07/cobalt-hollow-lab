import { describe,expect,it } from 'vitest';
import {readFileSync} from 'node:fs';
import {f1StartState,normalizeOriginF1Save,ORIGIN_F23_MASTER_SKILLS,originCanTrainSkill} from '../src/highfly/origin/f1_core';
const code=(p:string)=>readFileSync(p,'utf8');
describe('HIGHFLY F2.3 purchased and persisted Universal Hunter knowledge',()=>{
  it('no skill is gifted by first spawn or starter weapon selection',()=>{
    const s=f1StartState();expect(s.learnedAbilityIds).toBeUndefined();
    expect(ORIGIN_F23_MASTER_SKILLS).toHaveLength(4);
    expect(new Set(ORIGIN_F23_MASTER_SKILLS.map(s=>s.school)).size).toBeGreaterThan(1);
    expect(code('src/sim/sim.ts')).toContain('if (this.cfg.originUniversalHunter) return;');
  });
  it('price and level are both required; cannot buy an already mastered skill',()=>{
    expect(originCanTrainSkill('fireball',1,5,[])).toBe(true);
    expect(originCanTrainSkill('fireball',1,4,[])).toBe(false);
    expect(originCanTrainSkill('heroic_leap',1,100,[])).toBe(false);
    expect(originCanTrainSkill('heroic_leap',6,20,[])).toBe(true);
    expect(originCanTrainSkill('fireball',10,500,['fireball'])).toBe(false);
    expect(originCanTrainSkill('fake_skill',99,999,[])).toBe(false);
  });
  it('only whitelisted acquired IDs survive save parsing; F1 formats remain compatible',()=>{
    const s=normalizeOriginF1Save({...f1StartState(),learnedAbilityIds:['fireball','fireball','bad_spell','charge']});
    expect(s?.learnedAbilityIds).toEqual(['fireball','charge']);
    expect(normalizeOriginF1Save(f1StartState())?.learnedAbilityIds).toBeUndefined();
    const save=code('src/game/highfly_offline_save.ts');
    expect(save).toContain("highfly-offline-f23-combat-beta");
  });
  it('trainer uses the native Sim, deducts money and hydrates its native known list',()=>{
    const ui=code('src/highfly/origin/f1_world_ui.ts');
    expect(ui).toContain('hunter.copper-=skill.copper');
    expect(ui).toContain('hunter.known=(current.learnedAbilityIds??[]).flatMap');
    expect(ui).toContain("sim.player.resourceType='mana'");
    expect(ui).toContain('onStarterGranted();');
    expect(code('src/main.ts')).not.toContain('new FreedomWorld(');
  });
});
