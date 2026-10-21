import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { BUILTIN_WORLD } from '../src/sim/data';
import { MAX_LEVEL, xpForLevel, xpToReachLevel } from '../src/sim/types';
import { HIGHFLY_ORIGIN_REAL_MAX_LEVEL, highflyOriginClampLevel, highflyOriginLevelCap, highflyOriginXpCost } from '../src/highfly/origin/progression99';
import { HIGHFLY_LAB_START_LEVEL, HIGHFLY_ORIGIN_MODE_CONTRACT } from '../src/highfly/origin/unified_mode';
const cfg = (originUniversalHunter:boolean) => ({seed:901,playerClass:'warrior' as const,playerName:'Tester',originUniversalHunter,compulsoryTutorial:false,world:{...BUILTIN_WORLD,camps:[],groundObjects:[],npcs:{}}});
describe('HIGHFLY F7.2 RUN1 — authoritative LV99 without altering classic LV20',()=>{
 it('retains LV1–20 costs and derives LV21–99 from one existing cumulative curve',()=>{
  expect(MAX_LEVEL).toBe(20);expect(HIGHFLY_ORIGIN_REAL_MAX_LEVEL).toBe(99);
  for(let level=1;level<=20;level++)expect(highflyOriginXpCost(level,true)).toBe(xpForLevel(level));
  for(let level=20;level<99;level++)expect(highflyOriginXpCost(level,true)).toBe(xpToReachLevel(level+1)-xpToReachLevel(level));
  expect(highflyOriginXpCost(99,true)).toBe(0);expect(highflyOriginLevelCap(false)).toBe(20);expect(highflyOriginLevelCap(true)).toBe(99);
  expect(highflyOriginClampLevel(200,true)).toBe(99);expect(highflyOriginClampLevel(200,false)).toBe(20);
 });
 it('uses real XP to ding 20→21 and persists this level across the native save',()=>{
  const sim=new Sim(cfg(true));sim.setPlayerLevel(20);expect(sim.player.level).toBe(20);
  sim.grantXp(highflyOriginXpCost(20,true));expect(sim.player.level).toBe(21);expect(sim.xp).toBe(0);
  const state=sim.serializeCharacter(sim.playerId);expect(state?.level).toBe(21);
  const next=new Sim({...cfg(true),noPlayer:true});next.addPlayer('warrior','Tester',{state:state!});expect(next.player.level).toBe(21);
  next.setPlayerLevel(99);expect(next.player.level).toBe(99);next.grantXp(1000);expect(next.player.level).toBe(99);
 });
 it('does not change original online/non-HIGHFLY level20 ceiling',()=>{
  const sim=new Sim(cfg(false));sim.setPlayerLevel(99);expect(sim.player.level).toBe(20);sim.grantXp(1_000_000);expect(sim.player.level).toBe(20);
 });
 it('LAB defaults to genuine 99 with editable control; WORLD remains natural and separate',()=>{
  expect(HIGHFLY_LAB_START_LEVEL).toBe(99);
  const w=HIGHFLY_ORIGIN_MODE_CONTRACT.world,l=HIGHFLY_ORIGIN_MODE_CONTRACT.lab;
  expect(w.levelOverride).toBeNull();expect(w.progressAffectsHunter).toBe(true);expect(l.progressAffectsHunter).toBe(false);expect(w.saveLocal).not.toBe(l.saveLocal);
  const main=readFileSync('src/main.ts','utf8');expect(main).toContain("mode === 'lab' && !matchingOfflineSave");expect(main).toContain('mountHighflyLabLevelPanel(sim)');
 });
});
