import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  HunterTrainingJournal,trainingSlotKey,verifyReportedWorkout,
  activateHunterTrainingJournal,resolveHunterTrainingPrimary,
  clearActiveHunterTrainingJournal
} from './c204_training_journal.ts';
class MemoryStore {
  map=new Map<string,string>();
  getItem(k:string){return this.map.get(k)??null}
  setItem(k:string,v:string){this.map.set(k,v)}
}
const good=(sessionId:string,kind:'strength'|'cardio'='strength')=>({
 sessionId,kind,sets:3,reps:12,loadKg:kind==='strength'?25:0,
 minutes:45,performedAt:'2026-10-24T20:00:00.000Z'
});
test('Training stats persist by Hunter name, isolated world vs laboratory',()=>{
 const store=new MemoryStore();
 const w=new HunterTrainingJournal(' Draken ','world',store);
 w.logWorkout(good('gym-01'));
 w.allocate('STR',1);
 assert.equal(w.snapshot.profile.allocated.STR,1);
 assert.equal(w.snapshot.profile.trainingPointsEarned,1);
 assert.equal(new HunterTrainingJournal('draken','world',store).snapshot.profile.allocated.STR,1);
 assert.equal(new HunterTrainingJournal('Draken','lab',store).snapshot.profile.allocated.STR,0);
 assert.equal(trainingSlotKey('world','DRAKEN'),trainingSlotKey('world','draken'));
});
test('Workout validated, no free points for no evidence, duplicates forbidden',()=>{
 const store=new MemoryStore();
 const w=new HunterTrainingJournal('Test','world',store);
 assert.throws(()=>w.logWorkout({...good('bad'),minutes:1}),/TOO_SMALL|INVALID_WORKOUT/);
 assert.throws(()=>verifyReportedWorkout({...good('bad'),loadKg:0}),/STRENGTH_NEEDS_LOAD/);
 w.logWorkout(good('gym-1'));
 assert.throws(()=>w.logWorkout(good('gym-1')),/DUPLICATE/);
 assert.throws(()=>w.allocate('PER',2),/INVALID_TRAINING_ALLOCATION/);
 const changes=[] as number[];
 const cancel=w.onChange(s=>{changes.push(s.profile.availableTrainingPoints)});
 w.allocate('VIT',1);
 cancel();
 assert.deepEqual(changes,[0]);
});
test('Corrupt persistent state ignored; world still starts',()=>{
 const st=new MemoryStore();
 st.setItem(trainingSlotKey('world','Hunter'),'{oops');
 assert.equal(new HunterTrainingJournal('Hunter','world',st).snapshot.profile.trainingPointsEarned,0);
 st.setItem(trainingSlotKey('world','Hunter'),JSON.stringify({
  version:1,profile:{hunterId:'universal:hunter',trainingPointsEarned:20},entries:[]}));
 assert.equal(new HunterTrainingJournal('Hunter','world',st).snapshot.profile.trainingPointsEarned,0);
});
test('Local bound profile affects only matching Hunter',()=>{
 const st=new MemoryStore();
 const w=activateHunterTrainingJournal('Draken','world',st);
 w.logWorkout(good('001','cardio'));w.allocate('VIT',1);
 assert.equal(resolveHunterTrainingPrimary('Draken')?.VIT,1);
 assert.equal(resolveHunterTrainingPrimary('Different'),null);
 clearActiveHunterTrainingJournal();
 assert.equal(resolveHunterTrainingPrimary('Draken'),null);
});
test('level max 20 independent from training points',()=>{
 const w=new HunterTrainingJournal('H','world',new MemoryStore());
 w.setLevel(20);
 assert.throws(()=>w.setLevel(21),/NOT_IN_1_20/);
 assert.equal(w.snapshot.profile.trainingPointsEarned,0);
});
