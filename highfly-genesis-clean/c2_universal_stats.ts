/**
 * HIGHFLY Clean C2 — UNIVERSAL HUNTER training-stat contract.
 * Additive/pure only. No classes, no native Sim mutation, no localStorage,
 * no skill unlocks, no network claims, no save migration.
 */
export const HIGHFLY_UNIVERSAL_MAX_LEVEL = 20 as const;
export const HIGHFLY_UNIVERSAL_CORE_KEYS =
  ['STR','AGI','VIT','PER','INT'] as const;
export type UniversalStat = (typeof HIGHFLY_UNIVERSAL_CORE_KEYS)[number];
export type UniversalStats = Record<UniversalStat,number>;
export type UniversalHunterStats = Readonly<{
  version: 1;
  hunterId: string;
  level: number;
  /** Permanent, real-training-derived primary allocations only. */
  allocated: Readonly<UniversalStats>;
  availableTrainingPoints: number;
  trainingPointsEarned: number;
  /** Exactly-once event keys. Caller is responsible for strong authorization. */
  usedTrainingSessions: readonly string[];
}>;
export type ValidatedTrainingGrant = Readonly<{
  source: 'highfly-validated-training';
  sessionId: string;
  points: number;
}>;

const KEYS = new Set<string>(HIGHFLY_UNIVERSAL_CORE_KEYS);
const zero = (): UniversalStats=>({STR:0,AGI:0,VIT:0,PER:0,INT:0});
const nonNegativeInt=(v:number)=>Number.isSafeInteger(v)&&v>=0;
const sum=(v:Readonly<UniversalStats>)=>HIGHFLY_UNIVERSAL_CORE_KEYS.reduce((a,k)=>a+v[k],0);
export function assertUniversalHunter(p:UniversalHunterStats):void {
  if(p.version!==1 || !p.hunterId.trim())throw Error('HIGHFLY_INVALID_HUNTER');
  if(!Number.isInteger(p.level)||p.level<1||p.level>HIGHFLY_UNIVERSAL_MAX_LEVEL)
    throw Error('HIGHFLY_LEVEL_NOT_IN_1_20');
  if(!nonNegativeInt(p.trainingPointsEarned)||!nonNegativeInt(p.availableTrainingPoints))
    throw Error('HIGHFLY_INVALID_TRAINING_WALLET');
  for(const k of HIGHFLY_UNIVERSAL_CORE_KEYS)
    if(!nonNegativeInt(p.allocated[k]))throw Error('HIGHFLY_INVALID_STAT_'+k);
  if(sum(p.allocated)+p.availableTrainingPoints!==p.trainingPointsEarned)
    throw Error('HIGHFLY_WALLET_NOT_BALANCED');
  if(new Set(p.usedTrainingSessions).size!==p.usedTrainingSessions.length)
    throw Error('HIGHFLY_DUPLICATE_TRAINING_HISTORY');
  if(p.usedTrainingSessions.some(x=>!x.trim()))
    throw Error('HIGHFLY_INVALID_TRAINING_HISTORY');
}
export function createUniversalHunterStats(hunterId:string):UniversalHunterStats {
  const p:UniversalHunterStats={
    version:1,hunterId,level:1,allocated:zero(),
    availableTrainingPoints:0,trainingPointsEarned:0,usedTrainingSessions:[],
  };
  assertUniversalHunter(p);
  return p;
}
export function updateUniversalLevel(p:UniversalHunterStats,level:number):UniversalHunterStats {
  assertUniversalHunter(p);
  if(!Number.isInteger(level)||level<1||level>HIGHFLY_UNIVERSAL_MAX_LEVEL)
    throw Error('HIGHFLY_LEVEL_NOT_IN_1_20');
  const out={...p,level};
  assertUniversalHunter(out);
  return out;
}
/** Grant must be provided only after a trusted Training Core has accepted
 * real-world session evidence. A self-asserted grant is NOT secure verification. */
export function recordValidatedTraining(p:UniversalHunterStats,grant:ValidatedTrainingGrant):UniversalHunterStats {
  assertUniversalHunter(p);
  if(grant.source!=='highfly-validated-training'||
     !grant.sessionId.trim()||!nonNegativeInt(grant.points)||
     grant.points===0||grant.points>20)
    throw Error('HIGHFLY_INVALID_TRAINING_GRANT');
  if(p.usedTrainingSessions.includes(grant.sessionId))
    throw Error('HIGHFLY_TRAINING_SESSION_ALREADY_USED');
  const out:UniversalHunterStats={
    ...p,
    availableTrainingPoints:p.availableTrainingPoints+grant.points,
    trainingPointsEarned:p.trainingPointsEarned+grant.points,
    usedTrainingSessions:[...p.usedTrainingSessions,grant.sessionId],
  };
  assertUniversalHunter(out);
  return out;
}
export function allocateTrainingPoints(p:UniversalHunterStats,stat:UniversalStat,points:number):UniversalHunterStats {
  assertUniversalHunter(p);
  if(!KEYS.has(stat)||!nonNegativeInt(points)||points<1||points>p.availableTrainingPoints)
    throw Error('HIGHFLY_INVALID_TRAINING_ALLOCATION');
  const out:UniversalHunterStats={
    ...p,
    allocated:{...p.allocated,[stat]:p.allocated[stat]+points},
    availableTrainingPoints:p.availableTrainingPoints-points,
  };
  assertUniversalHunter(out);
  return out;
}
export interface UniversalHunterPower {
  /** Percentage of the progression component at this specific snapshot. */
  trainingWeight: 0.65;
  levelWeight: 0.35;
  trainingComponent: number;
  levelComponent: number;
  /** Items affect equipment power separately: never modify Core. */
  equipmentBonus: number;
  total: number;
}
/**
 * Illustrative power split, not a live Sim override. Canonical combat rules
 * must choose normalization once Training stats connect to gameplay.
 */
export function projectUniversalPower(p:UniversalHunterStats,equipmentBonus=0):UniversalHunterPower {
  assertUniversalHunter(p);
  if(!Number.isFinite(equipmentBonus)||equipmentBonus<0)
    throw Error('HIGHFLY_INVALID_EQUIPMENT_BONUS');
  const trainingComponent=0.65*sum(p.allocated);
  const levelComponent=0.35*(p.level-1);
  return {
    trainingWeight:0.65,
    levelWeight:0.35,
    trainingComponent,levelComponent,equipmentBonus,
    total:trainingComponent+levelComponent+equipmentBonus,
  };
}
