import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { ABILITIES } from '../src/sim/content/classes';
import { highflyOriginNativeLearnable } from '../src/sim/highfly_origin_native_spellbook';
import { originCostDecision } from '../src/sim/highfly_origin_universal_resources';

describe('HIGHFLY ORIGIN R1-5+R1-6 P0 — preview-only single Hunter playable flow', () => {
  it('constructs ONE classless-in-UI Hunter and has NO free nine-class kit', () => {
    const game = new Sim({ seed: 621, playerClass: 'warrior', originHunterEnabled:true });
    const profile=game.players.get(game.player.id)?.originHunter;
    expect(profile?.identity).toBe('origin_hunter');
    expect(profile?.learnedSkillIds).toEqual([]);
    expect(game.players.get(game.player.id)?.known).toEqual([]);
    expect(game.player.originResources).toEqual({mana:200,maxMana:200,stamina:100,maxStamina:100});
  });
  it('learns original Mage spell with Warrior body carrier and saves/reloads authoritatively', () => {
    const game = new Sim({ seed:622,playerClass:'warrior',originHunterEnabled:true });
    expect(highflyOriginNativeLearnable('fireball',game.player.level,new Set())).not.toBeNull();
    expect(originCostDecision(ABILITIES.fireball)).toEqual({ok:true,pool:'mana'});
    expect(game.learnOriginHunterSkillTrusted('fireball',game.player.id)).toBe(true);
    expect(game.learnOriginHunterSkillTrusted('fireball',game.player.id)).toBe(false);
    const state=game.serializeCharacter(game.player.id);
    expect(state?.originHunter?.learnedSkillIds).toContain('fireball');
    const restored=new Sim({seed:622,playerClass:'warrior',noPlayer:true});
    const pid=restored.addPlayer('warrior','Hunter',{state:state!});
    expect(restored.players.get(pid)?.originHunter?.learnedSkillIds).toContain('fireball');
    expect(restored.players.get(pid)?.known.map(k=>k.def.id)).toContain('fireball');
    expect(restored.entities.get(pid)?.originResources?.mana).toBe(200);
  });
  it('does not mutate old Warrior saves or unlock ANYTHING for a legacy player', () => {
    const legacy=new Sim({seed:623,playerClass:'warrior'});
    expect(legacy.players.get(legacy.player.id)?.originHunter).toBeUndefined();
    expect(legacy.learnOriginHunterSkillTrusted('fireball',legacy.player.id)).toBe(false);
    expect(legacy.serializeCharacter(legacy.player.id)?.originHunter).toBeUndefined();
  });
  it('has a unique offline save namespace and rejects legacy saves without an Origin marker', () => {
    const file=readFileSync('src/highfly/highfly_origin_trial_runtime.ts','utf8');
    expect(file).toContain("const DB_NAME = 'highfly-origin-trial';");
    expect(file).toContain("const KEY_PREFIX = 'highfly.origin.trial.v1:';");
    expect(file).toContain("v.state.originHunter?.identity === 'origin_hunter'");
    expect(file).toContain("export const ORIGIN_TRIAL_ONLY = import.meta.env.VITE_HIGHFLY_ORIGIN_PREVIEW === '1'");
    expect(file).toContain('indexedDB.open(DB_NAME,1)');
    expect(file).toContain('document.addEventListener(\'visibilitychange\',onVisibility)');
  });
  it('offers single Hunter trial entry WITHOUT an active legacy class selection or online character mutation', () => {
    const main=readFileSync('src/main.ts','utf8');
    expect(main).toContain('installOriginTrialEntrance((name)=>');
    expect(main).toContain("startOffline('warrior',name,0,undefined,undefined,true)");
    expect(main).toContain('originHunterEnabled:true');
    expect(main).toContain('originHunterTrial ? await loadOriginTrialSave(name) : null');
    expect(main).toContain('startOriginTrialAutosave(sim,name)');
    expect(main).toContain('mountOriginTrialTrainer(sim)');
    expect(main).toContain('startOffline(cls, name, selectedSkin');
    expect(main).toContain('await prepareWorldEntry()');
  });
  it('preview trainer only calls the trusted Sim learn method; never grants stats or unlocks over network', () => {
    const file=readFileSync('src/highfly/highfly_origin_trial_runtime.ts','utf8');
    expect(file).toContain('sim.learnOriginHunterSkillTrusted(def.id,sim.playerId)');
    expect(file).toContain('highflyOriginNativeLearnable(def.id,sim.player.level,meta.questsDone)');
    expect(file).toContain('originCostDecision(def).ok');
    expect(file).toContain('if(!ORIGIN_TRIAL_ONLY||document.getElementById');
    expect(file).not.toContain('this.cmd(');
    expect(file).not.toContain('setAttribute(\'stats\'');
    expect(file).not.toContain('getPublicPagesDeployment');
  });
  it('leaves 9 class selection and online character creation intact', () => {
    const main=readFileSync('src/main.ts','utf8');
    expect(main).toContain('handleOnlineSelect');
    expect(main).toContain('handleOfflineStart');
    expect(main).toContain('await api.createCharacter(');
    expect(main).toContain("const offlineAvailable = isOfflineModeAvailable(import.meta.env.DEV);");
  });
});
