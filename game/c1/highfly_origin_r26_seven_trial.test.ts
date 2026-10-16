import {describe,it,expect} from 'vitest';
import { ABILITIES } from '../src/sim/content/classes';
import { originCostDecision } from '../src/sim/highfly_origin_universal_resources';
import { originR26SessionOnly, ORIGIN_R26_SEVEN_IDS } from '../src/sim/highfly_origin_r26_seven_trial';
import { highflyAimSpec } from '../src/highfly/highfly_origin_r20_premium_aim';
import type {Sim} from '../src/sim/sim';

describe('R26 seven real native abilities, no persisted unlocks',()=>{
  it('each slot references an authored ORIGINAL spell with unmodified costs',()=>{
    expect(ORIGIN_R26_SEVEN_IDS).toEqual([
      'shadow_bolt','meteor','dragons_breath','sinister_strike',
      'heroic_leap','bladestorm','fear'
    ]);
    expect(new Set(ORIGIN_R26_SEVEN_IDS).size).toBe(7);
    expect(ORIGIN_R26_SEVEN_IDS.map(id=>ABILITIES[id].class)).toEqual([
      'warlock','mage','mage','rogue','warrior','warrior','warlock'
    ]);
    for(const id of ORIGIN_R26_SEVEN_IDS){
      const def=ABILITIES[id];
      expect(def).toBeTruthy();
      // Native ABILITIES is authoritative; class base lists are NOT an
      // exhaustive roster (talents and some specs use separate grants).
      expect(def.id).toBe(id);
      expect(originCostDecision(def).ok).toBe(true);
      expect(def.passive).not.toBe(true);
    }
  });
  it('injects native resolved skills in a disposable Sim but learns NOTHING',()=>{
    const originHunter={identity:'origin_hunter',learnedSkillIds:['fireball'],skillMastery:{},
      resources:{maxMana:200,mana:100,maxStamina:100,stamina:90}};
    const meta={originHunter,known:[] as {def:{id:string};cost:number}[]};
    const fake={playerId:9,players:new Map([[9,meta]]),
      player:{originResources:{}}} as unknown as Sim;
    originR26SessionOnly(fake);
    expect(meta.known.map(k=>k.def.id)).toEqual([...ORIGIN_R26_SEVEN_IDS]);
    expect(meta.known.map(k=>k.cost)).toEqual(
      ORIGIN_R26_SEVEN_IDS.map(id=>ABILITIES[id].cost));
    expect(originHunter.learnedSkillIds).toEqual(['fireball']);
    expect(originHunter.resources).toMatchObject({
      maxMana:400,mana:400,maxStamina:250,stamina:250
    });
  });
  it('keeps real area/charge/lunge/melee and targeted shape semantics',()=>{
    const shapes=ORIGIN_R26_SEVEN_IDS.map(id=>highflyAimSpec(id)?.shape);
    expect(shapes).toEqual(['line','circle','cone','line','dash','circle','target']);
    const cone=ABILITIES.dragons_breath.effects.find(e=>e.type==='empoweredCone');
    expect(cone).toBeDefined();
    expect(highflyAimSpec('dragons_breath')?.range).toBe(12);
    expect(highflyAimSpec('bladestorm')?.selfCentered).toBe(true);
    expect(highflyAimSpec('bladestorm')?.radius).toBe(6);
    expect(highflyAimSpec('heroic_leap')?.radius).toBe(6);
    expect(ABILITIES.meteor.targetMode).toBe('position');
    expect(ABILITIES.bladestorm.castWhileMoving).toBe(true);
  });
  it('original costs are classified by nature, not legacy class pool',()=>{
    for(const id of ORIGIN_R26_SEVEN_IDS){
      const def=ABILITIES[id], result=originCostDecision(def);
      expect(result).toEqual({ok:true,pool:def.school==='physical'?'stamina':'mana'});
    }
  });
});
