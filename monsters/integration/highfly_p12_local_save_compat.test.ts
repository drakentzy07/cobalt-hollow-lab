/** HIGHFLY release P12: regression for the existing CLEAN offline-save contract.
 *
 * This uses the REAL HighflyOfflineSave read/write module and the ORIGINAL
 * Sim.addPlayer/serializeCharacter save adapter. It deliberately mocks
 * localStorage ONLY to exercise the fallback when IndexedDB is unavailable.
 * This is NOT a real-browser IDB or cross-version deployment certification.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,ITEMS} from '../src/sim/data';
import type {PlayerClass} from '../src/sim/types';
import {loadHighflyOfflineSave,writeHighflyOfflineSave}
  from '../src/game/highfly_offline_save';

const CLASSES:PlayerClass[]=['warrior','paladin','hunter','rogue','priest',
  'shaman','mage','warlock','druid'];
const KEY='highfly.offline.primary.v1';
const world={...BUILTIN_WORLD,camps:[]};
function makeSim(cls:PlayerClass,seed:number){
  return new Sim({seed,playerClass:cls,noPlayer:true,
    compulsoryTutorial:false,riftPortals:false,world});
}
describe('HIGHFLY P12 — actual offline CharacterState compatibility fallback',()=>{
  it('preserves character identity, items, XP, profession state and legacy load for every class',async()=>{
    const store=new Map<string,string>();
    const originalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
    const originalIdb=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
    Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:undefined});
    Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
      getItem:(k:string)=>store.get(k)??null,
      setItem:(k:string,v:string)=>{store.set(k,v);},
      removeItem:(k:string)=>{store.delete(k);},
    }});
    try{
      for(let index=0;index<CLASSES.length;index++){
        const cls=CLASSES[index],name='P12_'+cls;
        const sim=makeSim(cls,121200+index),pid=sim.addPlayer(cls,name,{tutorialGreetingSent:true});
        sim.setPlayerLevel(1+index*10,pid); // QA fixture only; never included in game!
        sim.addItem('copper_ore',1+index,pid);
        const meta=sim.players.get(pid)!;
        meta.copper=1000+index;
        const state=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
        const save={version:1 as const,playerClass:cls,name,state,
          appearance:null,updatedAt:1000+index};
        writeHighflyOfflineSave(save);
        expect(store.has(KEY)).toBe(true);
        const loaded=await loadHighflyOfflineSave(cls,name);
        expect(loaded).toBeTruthy();
        expect(loaded!.version).toBe(1);
        expect(loaded!.playerClass).toBe(cls);
        expect(loaded!.name).toBe(name);
        expect(loaded!.state).toEqual(state);
        expect(await loadHighflyOfflineSave(cls,'other_hunter')).toBeNull();
        const resumed=makeSim(cls,131200+index);
        const newPid=resumed.addPlayer(cls,name,{
          state:JSON.parse(JSON.stringify(loaded!.state)),
          tutorialGreetingSent:true,
        });
        const after=resumed.serializeCharacter(newPid)!;
        expect(after.level).toBe(state.level);
        expect(after.xp).toBe(state.xp);
        expect(after.copper).toBe(state.copper);
        expect(after.inventory).toEqual(state.inventory);
        expect(after.equipment).toEqual(state.equipment);
        expect(after.gatheringProficiency).toEqual(state.gatheringProficiency);
        expect(after.knownRecipes).toEqual(state.knownRecipes);
        expect(after.craftSkills).toEqual(state.craftSkills);
        expect([...resumed.entities.values()].filter(x=>x.kind==='player')).toHaveLength(1);
        // Old saves legitimately lack newer optional gem/profession fields.
        const legacy={...state};
        delete legacy.equipmentInstance;
        delete legacy.highflyProfessions;
        delete legacy.trainingProfile;
        const oldSim=makeSim(cls,141200+index);
        const oldPid=oldSim.addPlayer(cls,name,{state:legacy,tutorialGreetingSent:true});
        const oldState=oldSim.serializeCharacter(oldPid)!;
        expect(oldState.level).toBe(state.level);
        expect(oldState.xp).toBe(state.xp);
        expect(oldState.inventory).toEqual(state.inventory);
      }
    }finally{
      if(originalStorage)Object.defineProperty(globalThis,'localStorage',originalStorage);
      else delete (globalThis as {localStorage?:unknown}).localStorage;
      if(originalIdb)Object.defineProperty(globalThis,'indexedDB',originalIdb);
      else delete (globalThis as {indexedDB?:unknown}).indexedDB;
    }
  },180000);
});
