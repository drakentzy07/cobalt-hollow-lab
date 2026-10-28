import {describe,it,expect} from 'vitest';
import {offlineSaveKey,loadOfflineCharacter,storeOfflineCharacter} from '../src/game/highfly_offline_store';
import {Sim} from '../src/sim/sim';
function memoryStorage(){
  const db=new Map<string,string>();
  return {
    getItem:(k:string)=>db.get(k)??null,
    setItem:(k:string,v:string)=>{db.set(k,v);},
  };
}
describe('HIGHFLY ORIGIN 0.20 persistent offline player',()=>{
  it('round-trips a real Sim save through original addPlayer restoration',()=>{
    const st=memoryStorage();
    const first=new Sim({seed:20061,playerClass:'warrior',playerName:'Draken'});
    first.addItem('healing_potion',1,first.playerId);
    const original=first.serializeCharacter(first.playerId);
    expect(original).not.toBeNull();
    expect(storeOfflineCharacter(st,'warrior','Draken',original)).toBe(true);
    const saved=loadOfflineCharacter(st,'warrior','Draken');
    expect(saved).not.toBeNull();
    const second=new Sim({seed:20061,playerClass:'warrior',playerName:'Draken',noPlayer:true});
    second.addPlayer('warrior','Draken',{state:saved!});
    const restored=second.serializeCharacter(second.playerId);
    expect(restored?.inventory).toEqual(original?.inventory);
    expect(restored?.level).toBe(original?.level);
    expect(restored?.questsDone).toEqual(original?.questsDone);
    expect(restored?.equipment).toEqual(original?.equipment);
  });
  it('separates two offline character identities',()=>{
    const st=memoryStorage();
    const sim=new Sim({seed:20061,playerClass:'warrior',playerName:'Draken'});
    expect(storeOfflineCharacter(st,'warrior','Draken',sim.serializeCharacter(sim.playerId))).toBe(true);
    expect(loadOfflineCharacter(st,'mage','Draken')).toBeNull();
    expect(loadOfflineCharacter(st,'warrior','Another')).toBeNull();
    expect(offlineSaveKey('mage','Draken')).not.toBe(offlineSaveKey('warrior','Draken'));
  });
  it('rejects corrupted state rather than crashing world loading',()=>{
    const st=memoryStorage();
    st.setItem(offlineSaveKey('warrior','Draken'),'{corrupt');
    expect(loadOfflineCharacter(st,'warrior','Draken')).toBeNull();
    st.setItem(offlineSaveKey('warrior','Draken'),JSON.stringify({version:1,cls:'warrior',name:'Draken',state:{level:200}}));
    expect(loadOfflineCharacter(st,'warrior','Draken')).toBeNull();
  });
});
