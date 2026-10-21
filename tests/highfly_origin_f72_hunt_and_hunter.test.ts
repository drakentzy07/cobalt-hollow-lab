import {describe,expect,it} from 'vitest';
import { readFileSync } from 'node:fs';
import { BUILTIN_WORLD, DUNGEONS, MOBS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import { HIGHFLY_F72_HUNT_MOBS } from '../src/highfly/origin/f72_hunt';
import { HIGHFLY_GATE_ID, HIGHFLY_GATE_SPAWNS } from '../src/highfly/origin/f73_gate';
import { ORIGIN_F1_SCHOOLS } from '../src/highfly/origin/f1_core';
describe('HIGHFLY F7.2 RUN2 — avatar identity, classless tree and real LV21–30 hunt',()=>{
 it('registers 11 instanced creatures with real loot, leaving the donor overworld untouched',()=>{
  expect(HIGHFLY_GATE_SPAWNS).toHaveLength(11);
  const [a,b,c]=Object.values(HIGHFLY_F72_HUNT_MOBS);
  expect([a.minLevel,b.minLevel,c.maxLevel]).toEqual([21,25,30]);
  for(const spawn of HIGHFLY_GATE_SPAWNS){
   expect(MOBS[spawn.mobId]).toBeDefined();
   for(const drop of MOBS[spawn.mobId].loot){expect(drop.questId).toBeUndefined();}
  }
  expect(DUNGEONS[HIGHFLY_GATE_ID].spawns).toEqual(HIGHFLY_GATE_SPAWNS);
  expect(BUILTIN_WORLD.camps.some(x=>x.mobId.startsWith('hf_f72_'))).toBe(false);
 });
 it('builds new content only in the original offline Hunter world',()=>{
  const lab=new Sim({seed:901,playerClass:'warrior',playerName:'DrakenLAB',originUniversalHunter:true,originLabHunter:true,compulsoryTutorial:false,
   world:{...BUILTIN_WORLD,camps:[],npcs:{},groundObjects:[]}});
  expect([...lab.entities.values()].some(e=>e.kind==='mob'&&e.templateId.startsWith('hf_f72_'))).toBe(false);
  expect(lab.highflyLabTravelToHunt()).toBe(true);
  const monsters=[...lab.entities.values()].filter(e=>e.kind==='mob'&&e.templateId.startsWith('hf_f72_'));
  expect(monsters.length).toBe(11);expect(monsters.some(e=>e.level===30)).toBe(true);
  expect(lab.player.pos.x).toBeGreaterThan(100_000);
  const world=new Sim({seed:902,playerClass:'warrior',playerName:'Draken',originUniversalHunter:true,compulsoryTutorial:false,
   world:{...BUILTIN_WORLD,camps:[],npcs:{},groundObjects:[]}});
  expect(world.highflyLabTravelToHunt()).toBe(false);
 });
 it('does not let the donor Warrior specialization mutate our classless Hunter',()=>{
  const sim=new Sim({seed:903,playerClass:'warrior',playerName:'Hunter',originUniversalHunter:true,compulsoryTutorial:false,
   world:{...BUILTIN_WORLD,camps:[],groundObjects:[],npcs:{}}});
  expect(sim.setSpec('arms')).toBe(false);
  expect(sim.respec()).toBe(false);
  const vanilla=new Sim({seed:904,playerClass:'warrior',playerName:'Native',compulsoryTutorial:false,
   world:{...BUILTIN_WORLD,camps:[],groundObjects:[],npcs:{}}});
  expect(vanilla.cfg.originUniversalHunter).toBe(false);
  expect(ORIGIN_F1_SCHOOLS).toHaveLength(9);
  const tal=readFileSync('src/ui/talents_window.ts','utf8');
  expect(tal).toContain('renderUniversalHunter(root)');
  expect(tal).toContain('Nueve escuelas · sin clase obligatoria');
 });
 it('refuses the wrong Warrior portrait while the authored Hunter headshot loads',()=>{
  const paint=readFileSync('src/ui/unit_portrait_painter.ts','utf8');
  expect(paint).toContain("canvas.id === 'pf-portrait'");
  expect(paint).toContain("this.drawCrest(canvas, 'class_hunter')");
  expect(readFileSync('src/highfly/origin/f7_portrait_crop.ts','utf8')).toContain('pf-portrait');
 });
});
