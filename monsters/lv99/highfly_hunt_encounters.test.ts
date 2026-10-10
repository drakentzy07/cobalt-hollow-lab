/** P02F: 16 native elite/captain templates, opt-in isolated 8-mob arenas. */
import { describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, CAMPS, getActiveWorldContent, MOBS, setActiveWorldContent, ZONES } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import { createMob } from '../src/sim/entity';
import { meleeSwing } from '../src/sim/combat/auto_attack';
import { HIGHFLY_HUNT_SCENARIOS } from '../src/highfly/monsters/hunt_scenarios';
import { highflyMonsterId } from '../src/highfly/monsters/level99';
import {
  buildHighflyHuntEncounters, highflyEncounterId, HIGHFLY_ENCOUNTER_CAP,
  addHighflyHuntEncounterWorld,
} from '../src/highfly/monsters/hunt_encounters';
import {
  createHighflyHuntBrowserSession, highflyHuntBrowserRequest,
} from '../src/highfly/monsters/hunt_browser_pilot';

describe('HIGHFLY P02F opt-in regional elites and captain fights',()=>{
  it('registers exactly 16 REAL safe native templates retaining source reward tables',()=>{
    const original=getActiveWorldContent();
    const ids=Object.keys(MOBS).filter(id=>id.startsWith('hf_enc_'));
    expect(ids).toHaveLength(16);
    expect(HIGHFLY_ENCOUNTER_CAP.simultaneousMobs).toBe(8);
    for(const s of HIGHFLY_HUNT_SCENARIOS){
      for(const mode of ['elite','captain'] as const){
        const id=highflyEncounterId(mode,s.minLevel);
        const m=MOBS[id];
        const source=MOBS[highflyMonsterId(s.families[mode==='elite'?1:0],s.minLevel)];
        expect(m).toBeDefined();
        expect([m.minLevel,m.maxLevel]).toEqual([s.minLevel,s.maxLevel]);
        expect(m.family).toBe(source.family);
        expect(m.elite).toBe(true);
        expect(Boolean(m.boss)).toBe(mode==='captain');
        expect(m.worldBoss).toBe(false);
        expect(m.rare).toBe(false);
        expect(m.requiresQuestId).toBeUndefined();
        expect(m.loot).toEqual(source.loot);
        expect(m.componentTags).toEqual(source.componentTags);
        expect(m.xpMult).toBe(source.xpMult);
        expect(m.summonAdds).toBeUndefined();
        expect(m.deathZoneCast).toBeUndefined();
        expect(m.deathZoneStrike).toBeUndefined();
        expect(m.hardLeashRadius).toBe(38);
        if(mode==='captain'){
          expect(m.bigCast?.castTime).toBeGreaterThanOrEqual(2.5);
          expect(m.bigCast?.radius).toBeLessThanOrEqual(5);
          expect(m.enrage?.dmgMult).toBeLessThanOrEqual(1.14);
        }else{
          expect(m.bigCast).toBeUndefined();
        }
        const created=createMob(55,m,s.minLevel,{x:0,y:8,z:200});
        const ordinary=createMob(56,source,s.minLevel,{x:0,y:8,z:200});
        expect(created.maxHp).toBeGreaterThan(ordinary.maxHp);
      }
    }
    expect(getActiveWorldContent()).toBe(original);
    expect(original).toBe(BUILTIN_WORLD);
    expect(CAMPS.some(c=>c.mobId.startsWith('hf_enc_'))).toBe(false);
  });

  it('offers a separate one-elite or one-captain route in each band, never exceeding 8 live mobs',()=>{
    const prev=getActiveWorldContent();
    try {
      for(const s of HIGHFLY_HUNT_SCENARIOS) {
        const standard=createHighflyHuntBrowserSession(s.minLevel);
        expect(standard.encounterMode).toBeNull();
        expect(standard.world.camps).toHaveLength(4);
        for(const mode of ['elite','captain'] as const){
          const pilot=createHighflyHuntBrowserSession(s.minLevel,20061,mode);
          const w=pilot.world;
          expect(w.camps).toHaveLength(5);
          expect(w.camps.slice(0,3)).toEqual(standard.world.camps.slice(0,3));
          expect(w.camps[3].mobId).toBe(standard.world.camps[3].mobId);
          expect(w.camps[3].count).toBe(1);
          expect(w.camps[4].mobId).toBe(highflyEncounterId(mode,s.minLevel));
          expect(w.camps[4].count).toBe(1);
          expect(w.camps.every(c=>c.offStream)).toBe(true);
          expect(w.camps.reduce((n,c)=>n+c.count,0)).toBe(8);
          expect(w.zones[0].pois).toHaveLength(7);
          expect(w.roads).toHaveLength(4);
          expect(w.props.decorProps).toHaveLength(12);
          expect(w.npcs).toEqual({});
          expect(w.services).toBeUndefined();
          expect(w.placements).toEqual([]);
          expect(w.terrainEdits).toHaveLength(6);
          expect(getActiveWorldContent()).toBe(prev);
        }
      }
    } finally {setActiveWorldContent(prev);}
    expect(prev).toBe(BUILTIN_WORLD);
    expect(CAMPS.some(c=>c.mobId.startsWith('hf_enc_'))).toBe(false);
    expect(ZONES.some(z=>z.id.startsWith('hf_hunt_'))).toBe(false);
  });

  it('requires BOTH explicit preview build and canonical trial mode; unknown/Extended fail closed',()=>{
    const good=new URLSearchParams('hfHunt=21&hfEncounter=elite');
    expect(highflyHuntBrowserRequest(good,false)).toBeNull();
    expect(highflyHuntBrowserRequest(good,true)?.encounterMode).toBe('elite');
    expect(highflyHuntBrowserRequest(new URLSearchParams('hfHunt=90&hfEncounter=captain'),true)?.encounterMode).toBe('captain');
    for(const query of [
      'hfHunt=21&hfEncounter=legendary','hfHunt=21&hfEncounter=worldBoss',
      'hfHunt=21&hfEncounter=', 'hfHunt=99&hfEncounter=elite',
      'hfHunt=100&hfEncounter=elite','hfHunt=21&hfEncounter=boss',
    ])expect(highflyHuntBrowserRequest(new URLSearchParams(query),true)).toBeNull();
    expect(()=>createHighflyHuntBrowserSession(21,20061,'worldBoss' as never))
      .toThrow('HF_HUNT_BROWSER_INVALID_ENCOUNTER');
    expect(()=>highflyEncounterId('captain',100)).toThrow('HF_HUNT_ENCOUNTER_INVALID_KIND_OR_LEVEL');
  });

  it('rejects mutated/public worlds, missing captains, and duplicate native registrations',()=>{
    const base=createHighflyHuntBrowserSession(21).world;
    // An untouched four-camp scenic island IS valid. A second mutation,
    // however, must fail closed instead of doubling the boss population.
    const once=addHighflyHuntEncounterWorld(base,'hf_hunt_woods_21','captain',MOBS);
    expect(once.camps).toHaveLength(5);
    expect(()=>addHighflyHuntEncounterWorld(once,'hf_hunt_woods_21','captain',MOBS))
      .toThrow('HF_HUNT_ENCOUNTER_UNSAFE_WORLD');
    expect(()=>addHighflyHuntEncounterWorld({...base,roads:[]},
      'hf_hunt_woods_21','captain',MOBS))
      .toThrow('HF_HUNT_ENCOUNTER_UNSAFE_WORLD');
    expect(()=>addHighflyHuntEncounterWorld(BUILTIN_WORLD,'hf_hunt_woods_21','captain',MOBS))
      .toThrow('HF_HUNT_ENCOUNTER_UNSAFE_WORLD');
    expect(()=>buildHighflyHuntEncounters(MOBS)).toThrow('HF_HUNT_ENCOUNTER_ID_COLLISION');
  });

  it('spawns 7 native trash + 1 boss/elite and supports real combat and once-only corpse loot',()=>{
    for(const mode of ['elite','captain'] as const){
      const preview=createHighflyHuntBrowserSession(21,20061,mode);
      setActiveWorldContent(preview.world);
      try {
        const sim=new Sim({seed:20061,playerClass:'warrior',noPlayer:true,autoEquip:false,
          world:preview.world,compulsoryTutorial:false,riftPortals:false});
        const native=[...sim.entities.values()].filter(e=>e.kind==='mob'&&e.templateId.startsWith('hf_'));
        const special=native.filter(e=>e.templateId===highflyEncounterId(mode,21));
        expect(native).toHaveLength(8);
        expect(special).toHaveLength(1);
        const boss=special[0];
        const pid=sim.addPlayer('warrior','HuntBossP02F');
        sim.setPlayerLevel(21,pid);
        const hunter=sim.entities.get(pid),meta=sim.players.get(pid);
        if(!hunter||!meta)throw Error('HF_P02F_HUNTER_MISSING');
        const beforeCoins=meta.copper;
        boss.hp=1;
        boss.hostile=true;
        hunter.pos={...boss.pos,z:boss.pos.z-2};
        hunter.prevPos={...hunter.pos};
        hunter.facing=Math.atan2(boss.pos.x-hunter.pos.x,boss.pos.z-hunter.pos.z);
        sim.targetEntity(boss.id,pid);
        expect(sim.lootCorpse(boss.id,pid)).toBe(false);
        for(let i=0;i<90&&!boss.dead;i++)meleeSwing(sim.ctx,hunter,boss,0,null,{});
        expect(boss.dead).toBe(true);
        expect(boss.lootable).toBe(true);
        const copper=boss.loot?.copper??0;
        expect(copper).toBeGreaterThan(0);
        expect(sim.lootCorpse(boss.id,pid)).toBe(true);
        expect(meta.copper).toBe(beforeCoins+copper);
        sim.lootCorpse(boss.id,pid);
        expect(meta.copper).toBe(beforeCoins+copper);
        const saved=sim.serializeCharacter(pid);
        const loaded=new Sim({seed:20063,playerClass:'warrior',noPlayer:true,
          autoEquip:false,world:preview.world});
        const loadedId=loaded.addPlayer('warrior','HuntBossP02F',
          {state:JSON.parse(JSON.stringify(saved))});
        expect(loaded.players.get(loadedId)?.copper).toBe(beforeCoins+copper);
      } finally {setActiveWorldContent(null);}
    }
  });
});
