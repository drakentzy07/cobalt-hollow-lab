/** GOLDEN PLAY V4-03: MUST restore V4-02 native same-origin character via
 * the original localStorage fallback without ever changing its bytes.
 * Uses real CLEAN save and Sim APIs, fixture-only levels; proves forward-copy.
 * Browser IndexedDB cross-version gate remains separate and mandatory.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD} from '../src/sim/data';
import type {PlayerClass} from '../src/sim/types';
import {loadHighflyOfflineSave,writeHighflyOfflineSave}
  from '../src/game/highfly_offline_save';
const CLASSES:PlayerClass[]=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
const OLD='highfly.offline.primary.v1',NEW='highfly.play.primary.v1';
describe('GOLDEN PLAY V4-03 non-destructive one-Hunter V4-02 migration',()=>{
  it('retains old V4-02 bytes, makes NEW autosave and restores real nine-class Hunter',async()=>{
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
      for(let i=0;i<CLASSES.length;i++){
        store.delete(NEW);store.delete(OLD);
        const cls=CLASSES[i],name='Golden_'+cls;
        const oldSim=new Sim({seed:1000+i,playerClass:cls,noPlayer:true,autoEquip:false,
          world:{...BUILTIN_WORLD,camps:[]},compulsoryTutorial:false,riftPortals:false});
        const pid=oldSim.addPlayer(cls,name,{tutorialGreetingSent:true});
        oldSim.setPlayerLevel(Math.min(99,1+i*11),pid); // TEST FIXTURE, NOT PLAYER FREE LEVEL.
        oldSim.addItem('copper_ore',4+i,pid);
        const meta=oldSim.players.get(pid)!;meta.copper=390+i;
        const state=JSON.parse(JSON.stringify(oldSim.serializeCharacter(pid)));
        const save={version:1 as const,playerClass:cls,name,state,appearance:null,updatedAt:1000+i};
        const oldBytes=JSON.stringify(save);
        store.set(OLD,oldBytes);
        expect(store.get(NEW)).toBeUndefined();
        expect(await loadHighflyOfflineSave(cls,name)).toEqual(save);
        expect(store.get(OLD)).toBe(oldBytes); // READ ONLY legacy, no hidden rewrite.
        expect(store.get(NEW)).toBeUndefined(); // only real game autosave may copy.
        expect(await loadHighflyOfflineSave(cls,name+'_other')).toBeNull();
        writeHighflyOfflineSave(save);
        expect(JSON.parse(store.get(NEW)!)).toEqual(save);
        expect(store.get(OLD)).toBe(oldBytes); // still byte-exact V4-02 backup.
        const loaded=await loadHighflyOfflineSave(cls,name);
        expect(loaded).toEqual(save);
        const current=new Sim({seed:9900+i,playerClass:cls,noPlayer:true,autoEquip:false,
          world:{...BUILTIN_WORLD,camps:[]},compulsoryTutorial:false,riftPortals:false});
        const rid=current.addPlayer(cls,name,{state:JSON.parse(JSON.stringify(loaded!.state)),
          tutorialGreetingSent:true});
        const state2=current.serializeCharacter(rid)!;
        expect(state2.level).toBe(state.level);
        expect(state2.xp).toBe(state.xp);
        expect(state2.copper).toBe(state.copper);
        expect(state2.inventory).toEqual(state.inventory);
        expect(state2.equipment).toEqual(state.equipment);
        expect(state2.gatheringProficiency).toEqual(state.gatheringProficiency);
        expect(state2.knownRecipes).toEqual(state.knownRecipes);
        expect(state2.craftSkills).toEqual(state.craftSkills);
        expect([...current.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
        // V4-02 can autosave later; it must NOT override the newer PLAY snapshot.
        store.set(OLD,JSON.stringify({...save,updatedAt:9999+i,state:{...state,level:1}}));
        expect((await loadHighflyOfflineSave(cls,name))!.state.level).toBe(state.level);
      }
    } finally {
      if(originalStorage)Object.defineProperty(globalThis,'localStorage',originalStorage);
      else delete (globalThis as {localStorage?:unknown}).localStorage;
      if(originalIdb)Object.defineProperty(globalThis,'indexedDB',originalIdb);
      else delete (globalThis as {indexedDB?:unknown}).indexedDB;
    }
  },180000);
});
