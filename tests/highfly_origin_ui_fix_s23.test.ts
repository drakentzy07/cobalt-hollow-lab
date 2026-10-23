import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {ITEMS,BUILTIN_WORLD} from '../src/sim/data';
import {paperdollDropAction} from '../src/ui/equip_drop_core';
import {Sim} from '../src/sim/sim';
const txt=(p:string)=>readFileSync(p,'utf8');
describe('HIGHFLY ORIGIN UI FIX — S23 creator and Universal gear',()=>{
 it('replaces redundant Draken world header with compact mode selectors and fullscreen fallback',()=>{
  const html=txt('index.html'),main=txt('src/main.ts');
  expect(html).toContain('MUNDO NORMAL · LV1–99');
  expect(html).not.toContain('ENTRAR AL MUNDO · DRAKEN');
  expect(html).toContain('id="hf-origin-creator-fullscreen"');
  expect(html.match(/id="btn-start-offline"/g)).toHaveLength(1);
  expect(main).toContain('creatorFullscreenButton?.addEventListener');
  expect(main).toContain('if (isPhoneTouchDevice()) requestMobileFullscreenLandscape();');
 });
 it('guards untouched Samsung cursor and preserves native IME composition',()=>{
  const main=txt('src/main.ts'),html=txt('index.html');
  expect(html).toContain('id="char-name" type="text" dir="ltr"');
  expect(main).toContain("offlineNameInput.addEventListener('beforeinput'");
  expect(main).toContain('offlineNameInput.setSelectionRange(value.length, value.length)');
  expect(main).toContain('event.isComposing');
 });
 it('supports a real second copy of identical sword on LV1 Universal Hunter',()=>{
  const sword=ITEMS.worn_sword,eq={mainhand:'worn_sword'};
  expect(paperdollDropAction(sword,'offhand','warrior',1,null,eq,undefined,undefined,undefined,false)).toBe('blockedClass');
  expect(paperdollDropAction(sword,'offhand','warrior',1,null,eq,undefined,undefined,undefined,true)).toBe('equip');
  const sim=new Sim({seed:14,playerClass:'warrior',playerName:'Dupla',originUniversalHunter:true,
   compulsoryTutorial:false,world:{...BUILTIN_WORLD,camps:[],groundObjects:[],npcs:{}}});
  const pid=sim.playerId;
  for(const slot of ['mainhand','offhand'] as const)sim.unequipItem(slot,pid);
  sim.addItem('worn_sword',2,pid);
  sim.equipItemToSlot('worn_sword','mainhand',pid);
  sim.equipItemToSlot('worn_sword','offhand',pid);
  expect(sim.players.get(pid)?.equipment.mainhand).toBe('worn_sword');
  expect(sim.players.get(pid)?.equipment.offhand).toBe('worn_sword');
  expect(sim.player.dualWielding).toBe(true);
 });
 it('keeps donor non-Universal restriction and all unique gear constraints',()=>{
  expect(txt('src/ui/char_window.ts').match(/world.player.highflyUniversalHunter === true/g)).toHaveLength(3);
  expect(txt('src/sim/items.ts')).toContain('uniqueEquipConflictSlot(');
  expect(txt('src/sim/items.ts')).toContain('masterwroughtConflictSlot(');
 });
});
