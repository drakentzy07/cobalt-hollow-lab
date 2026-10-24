import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
 HIGHFLY_UNIVERSAL_MAX_LEVEL,HIGHFLY_UNIVERSAL_CORE_KEYS,
 createUniversalHunterStats,recordValidatedTraining,allocateTrainingPoints,
 updateUniversalLevel,projectUniversalPower,assertUniversalHunter,
} from './c2_universal_stats.ts';

test('HIGHFLY universal Hunter has five stats, no class, LV20 max',()=>{
  const h=createUniversalHunterStats('draken-original');
  assert.equal(HIGHFLY_UNIVERSAL_MAX_LEVEL,20);
  assert.deepEqual([...HIGHFLY_UNIVERSAL_CORE_KEYS],['STR','AGI','VIT','PER','INT']);
  assert.equal('classId' in h,false);
  assert.equal('subclassId' in h,false);
  assert.equal(h.level,1);
  assert.deepEqual(h.allocated,{STR:0,AGI:0,VIT:0,PER:0,INT:0});
  assert.throws(()=>updateUniversalLevel(h,99),/HIGHFLY_LEVEL_NOT_IN_1_20/);
  assert.equal(updateUniversalLevel(h,20).level,20);
});
test('validated training earns once, not from item or level',()=>{
  const h=createUniversalHunterStats('h-1');
  const trained=recordValidatedTraining(h,{source:'highfly-validated-training',sessionId:'gym-001',points:5});
  assert.equal(h.availableTrainingPoints,0);
  assert.equal(trained.availableTrainingPoints,5);
  assert.equal(trained.trainingPointsEarned,5);
  assert.deepEqual(trained.allocated,h.allocated);
  assert.throws(()=>recordValidatedTraining(trained,{source:'highfly-validated-training',sessionId:'gym-001',points:5}),/ALREADY_USED/);
  const a=allocateTrainingPoints(trained,'AGI',3);
  const b=allocateTrainingPoints(a,'VIT',2);
  assert.equal(b.allocated.AGI,3);
  assert.equal(b.allocated.VIT,2);
  assert.equal(b.availableTrainingPoints,0);
  assert.equal(b.trainingPointsEarned,5);
  assertUniversalHunter(b);
  assert.throws(()=>allocateTrainingPoints(b,'STR',1),/INVALID_TRAINING_ALLOCATION/);
  assert.throws(()=>allocateTrainingPoints(trained,'MP' as never,1),/INVALID_TRAINING_ALLOCATION/);
});
test('level and gear never mutate permanent training stats',()=>{
  const h=createUniversalHunterStats('h-2');
  const leveled=updateUniversalLevel(h,20);
  const powered=projectUniversalPower(leveled,12);
  assert.equal(powered.trainingWeight,.65);
  assert.equal(powered.levelWeight,.35);
  assert.equal(powered.trainingComponent,0);
  assert.equal(powered.equipmentBonus,12);
  assert.deepEqual(h.allocated,leveled.allocated);
  assert.equal(Object.hasOwn(leveled,'gear'),false);
  assert.throws(()=>projectUniversalPower(leveled,-1),/INVALID_EQUIPMENT_BONUS/);
});
test('invalid grants, corrupted wallets, duplicated history fail closed',()=>{
  const h=createUniversalHunterStats('valid');
  assert.throws(()=>recordValidatedTraining(h,{source:'highfly-validated-training',sessionId:'',points:4}),/INVALID_TRAINING_GRANT/);
  assert.throws(()=>recordValidatedTraining(h,{source:'highfly-validated-training',sessionId:'gym',points:0}),/INVALID_TRAINING_GRANT/);
  assert.throws(()=>recordValidatedTraining(h,{source:'highfly-validated-training',sessionId:'gym',points:21}),/INVALID_TRAINING_GRANT/);
  assert.throws(()=>assertUniversalHunter({...h,availableTrainingPoints:1}),/HIGHFLY_WALLET_NOT_BALANCED/);
  assert.throws(()=>assertUniversalHunter({...h,usedTrainingSessions:['gym','gym']}),/HIGHFLY_DUPLICATE_TRAINING_HISTORY/);
});
