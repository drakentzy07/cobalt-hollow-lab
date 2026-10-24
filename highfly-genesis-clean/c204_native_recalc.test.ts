import {describe,it,expect,afterEach} from 'vitest';
import {createPlayer,recalcPlayerStats} from '../src/sim/entity';
import {
  activateHunterTrainingJournal,clearActiveHunterTrainingJournal
} from '../src/highfly/training/training_journal';

afterEach(()=>clearActiveHunterTrainingJournal());
describe('C2-04 real native simulation stat integration',()=>{
 it('training STR reaches actual player stats, not just UI labels',()=>{
   const e=createPlayer(311,'warrior',{x:0,y:0,z:0},'Draken');
   recalcPlayerStats(e,'warrior',{},undefined,{});
   const old={...e.stats};
   const j=activateHunterTrainingJournal('Draken','world',null);
   j.logWorkout({
     sessionId:'test-1',kind:'strength',sets:3,reps:10,loadKg:30,
     minutes:45,performedAt:'2026-10-24T21:00:00Z'
   });
   j.allocate('STR',1);
   recalcPlayerStats(e,'warrior',{},undefined,{});
   expect(e.stats.str).toBe(old.str+1);
   expect(e.stats.agi).toBe(old.agi);
   expect(e.stats.sta).toBe(old.sta);
   expect(e.stats.int).toBe(old.int);
   expect(e.stats.spi).toBe(old.spi);
   // Recalculating again is idempotent: no double counting across frames.
   recalcPlayerStats(e,'warrior',{},undefined,{});
   expect(e.stats.str).toBe(old.str+1);
 });
 it('training VIT maps only to original stamina and derived HP',()=>{
   const e=createPlayer(312,'warrior',{x:0,y:0,z:0},'Draken');
   recalcPlayerStats(e,'warrior',{},undefined,{});
   const initialSta=e.stats.sta,initialHP=e.maxHp;
   const j=activateHunterTrainingJournal('Draken','world',null);
   j.logWorkout({
     sessionId:'cardio-1',kind:'cardio',sets:3,reps:10,loadKg:0,
     minutes:30,performedAt:'2026-10-24T21:00:00Z'
   });
   j.allocate('VIT',1);
   recalcPlayerStats(e,'warrior',{},undefined,{});
   expect(e.stats.sta).toBe(initialSta+1);
   expect(e.maxHp).toBeGreaterThanOrEqual(initialHP);
 });
 it('unrelated or mob character stays at ClaudeCraft original stats',()=>{
   const a=createPlayer(313,'warrior',{x:0,y:0,z:0},'SomeoneElse');
   recalcPlayerStats(a,'warrior',{},undefined,{});
   const base=a.stats.str;
   const j=activateHunterTrainingJournal('Draken','world',null);
   j.logWorkout({
     sessionId:'test-2',kind:'strength',sets:3,reps:10,loadKg:30,
     minutes:45,performedAt:'2026-10-24T21:00:00Z'
   });
   j.allocate('STR',1);
   recalcPlayerStats(a,'warrior',{},undefined,{});
   expect(a.stats.str).toBe(base);
 });
});
