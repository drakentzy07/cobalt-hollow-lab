import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {saveKey,validSlot} from '../src/highfly/rebirth/offline_save';
import type {PlayerClass} from '../src/sim/types';
const cfg=(cls:PlayerClass,name:string)=>({seed:24,playerClass:cls,playerName:name,compulsoryTutorial:false});
describe('R6 native character save resume + isolation',()=>{
 it('Rogue uses native CharacterState for XP, bag and level resume',()=>{
  const x=new Sim(cfg('rogue','Draken'));
  const meta=x.players.get(x.playerId)!;meta.xp=17;
  const state=x.serializeCharacter(x.playerId)!;
  expect(state.xp).toBe(17);
  const y=new Sim({...cfg('rogue','Draken'),highflyRebirthOfflineSavedState:state});
  expect(y.players.get(y.playerId)!.xp).toBe(17);
  expect(y.serializeCharacter(y.playerId)!.inventory).toEqual(state.inventory);
  expect(y.player.templateId).toBe('rogue');
 });
 it('Mage skill identity survives native restore',()=>{
  const x=new Sim(cfg('mage','Flame'));
  const state=x.serializeCharacter(x.playerId)!;
  const y=new Sim({...cfg('mage','Flame'),highflyRebirthOfflineSavedState:state});
  expect(y.player.templateId).toBe('mage');
  expect(y.serializeCharacter(y.playerId)!.level).toBe(1);
 });
 it('Nine class keys are separate from WoC and old HIGHFLY saves',()=>{
  const classes=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'] as PlayerClass[];
  const keys=classes.map(x=>saveKey(x,'Draken'));
  expect(new Set(keys).size).toBe(9);
  expect(keys.every(x=>x.startsWith('highfly.rebirth044.offline.r6:'))).toBe(true);
 });
 it('Rejects corrupted and cross-class saves',()=>{
  const x=new Sim(cfg('warrior','Draken'));
  const slot={version:1,origin:'highfly.rebirth044',cls:'warrior',name:'draken',
   character:x.serializeCharacter(x.playerId),appearance:null,helmHidden:false,skin:0,savedAt:0};
  expect(validSlot(slot,'warrior','Draken')).toBe(true);
  expect(validSlot(slot,'rogue','Draken')).toBe(false);
  expect(validSlot(slot,'warrior','Other')).toBe(false);
  expect(validSlot({...slot,character:{...slot.character,level:77}},'warrior','Draken')).toBe(false);
 });
});
