import { describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { BUILTIN_WORLD, ITEMS, MOBS, ALL_RECIPES } from '../src/sim/data';
import { requiredLevelFor } from '../src/sim/item_level_req';
import { HIGHFLY_F72_ITEMS,HIGHFLY_F72_HUNT_CAMPS,HIGHFLY_F72_RECIPES } from '../src/highfly/origin/f72_hunt';
import { highflyLabKitCandidates } from '../src/highfly/origin/lab_test_kit';
const cfg=(lab:boolean)=>({seed:911,playerClass:'warrior' as const,playerName:lab?'DrakenLAB':'Draken',
  originUniversalHunter:true,originLabHunter:lab,compulsoryTutorial:false,
  world:{...BUILTIN_WORLD,camps:[],groundObjects:[],npcs:{}}});
describe('F7.2 RUN3: S4, rescue, real LAB equipment and earned LV21–30 gear',()=>{
 it('the LAB only can jump back and prepare actual equipped gear',()=>{
  const lab=new Sim(cfg(true)),world=new Sim(cfg(false));
  lab.setPlayerLevel(30);
  const before={hp:lab.player.maxHp,ap:lab.player.attackPower};
  const kit=lab.highflyLabPrepareKit();
  expect(kit.length).toBeGreaterThanOrEqual(3);
  expect(Object.values(lab.equipment).filter(Boolean).length).toBeGreaterThanOrEqual(3);
  expect(lab.player.maxHp>before.hp || lab.player.attackPower>before.ap).toBe(true);
  expect(highflyLabKitCandidates(30).every(x=>x.requiredLevel<=30)).toBe(true);
  expect(world.highflyLabPrepareKit()).toEqual([]);
  expect(world.highflyLabTravelToHunt()).toBe(false);
  expect(world.highflyLabReturnToEastbrook()).toBe(false);
  expect(lab.highflyLabTravelToHunt()).toBe(true);
  expect(lab.player.pos.z).toBeGreaterThan(780);
  expect(lab.highflyLabReturnToEastbrook()).toBe(true);
  expect(lab.player.pos.z).toBeLessThan(-60);
 });
 it('requires real LV23, LV27 and LV30 for HIGHFLY equipment, original gear unchanged',()=>{
  expect(requiredLevelFor(ITEMS.hf_f72_ridge_blade)).toBe(23);
  expect(requiredLevelFor(ITEMS.hf_f72_crag_mail)).toBe(27);
  expect(requiredLevelFor(ITEMS.hf_f72_captain_cleaver)).toBe(30);
  expect(requiredLevelFor(ITEMS.worn_sword)).toBe(1);
  const w=new Sim(cfg(false));w.setPlayerLevel(20);
  expect(w.player.level).toBe(20);
  for(const item of Object.values(HIGHFLY_F72_ITEMS))expect(ITEMS[item.id]).toBeDefined();
 });
 it('actual hunt awards registered gear/materials; profession recipes have acquisition gates',()=>{
  expect(HIGHFLY_F72_HUNT_CAMPS.reduce((a,x)=>a+x.count,0)).toBe(11);
  const drops=HIGHFLY_F72_HUNT_CAMPS.flatMap(c=>MOBS[c.mobId].loot.map(l=>l.itemId).filter(Boolean));
  expect(drops).toContain('hf_f72_ridge_fang');
  expect(drops).toContain('hf_f72_crag_core');
  expect(drops).toContain('hf_f72_captain_cleaver');
  for(const row of HIGHFLY_F72_RECIPES){
   expect(ALL_RECIPES.find(r=>r.id===row.id)).toBeDefined();
   expect(row.acquisition?.length).toBeGreaterThan(0);
   expect(ITEMS[row.resultItemId]).toBeDefined();
   for(const reagent of row.reagents)expect(ITEMS[reagent.itemId]).toBeDefined();
  }
 });
 it('player sheet no longer displays the forced Warrior specialty',()=>{
  const sheet=readFileSync('src/ui/character_progression_view.ts','utf8');
  expect(sheet).toContain('if(sim.cfg.originUniversalHunter)');
  expect(sheet).toContain('Sin especialización obligatoria');
  const hud=readFileSync('src/ui/hud.ts','utf8');
  expect(hud).toContain('highflyRestoreLabSkillSlots(): boolean');
  const css=readFileSync('src/styles/hud.mobile.css','utf8');
  expect(css).toContain('mobile-action-slot[data-mobile-index="3"]');
 });
});
