/**
 * HIGHFLY Clean C2-04 real-training diary and persistence.
 * Offline device-local only: a user-reported workout is NOT independently
 * verified by sensors or a trainer. This API validates shape, minimum work,
 * uniqueness and sensible bounds, not physical reality.
 */
import {
  allocateTrainingPoints, assertUniversalHunter, createUniversalHunterStats,
  recordValidatedTraining, updateUniversalLevel,
  type UniversalHunterStats, type UniversalStat
} from './c2_universal_stats.ts';

export type TrainingKind='strength'|'agility'|'cardio'|'perception'|'study';
export type TrainingProof=Readonly<{
  sessionId:string;
  kind:TrainingKind;
  sets:number;reps:number;loadKg:number;minutes:number;
  performedAt:string;
}>;
export type StoredHunter=Readonly<{
  version:1;
  profile:UniversalHunterStats;
  entries: readonly TrainingProof[];
}>;
export interface TrainingStorage {
  getItem(key:string):string|null;
  setItem(key:string,value:string):void;
}
export type TrainingWorld='world'|'lab';
const STAT_BY_KIND:Readonly<Record<TrainingKind,UniversalStat>>={
  strength:'STR',agility:'AGI',cardio:'VIT',perception:'PER',study:'INT'
};
const KINDS=new Set<TrainingKind>(['strength','agility','cardio','perception','study']);
export function trainingSlotKey(world:TrainingWorld,hunterName:string):string{
  const n=hunterName.trim().normalize('NFKC').toLowerCase();
  if(!n || n.length>72)throw Error('HIGHFLY_INVALID_HUNTER_NAME');
  return 'highfly:clean:v1:training:'+world+':'+encodeURIComponent(n);
}
export function verifyReportedWorkout(a:TrainingProof):Readonly<{stat:UniversalStat,points:number}>{
  if(!a.sessionId.trim()||a.sessionId.length>120||!KINDS.has(a.kind))
    throw Error('HIGHFLY_INVALID_WORKOUT_KIND_OR_ID');
  if(!Number.isInteger(a.sets)||a.sets<1||a.sets>12 ||
     !Number.isInteger(a.reps)||a.reps<1||a.reps>50||
     !Number.isFinite(a.loadKg)||a.loadKg<0||a.loadKg>500||
     !Number.isFinite(a.minutes)||a.minutes<5||a.minutes>240||
     !Number.isFinite(Date.parse(a.performedAt)))
    throw Error('HIGHFLY_INVALID_WORKOUT_MEASUREMENTS');
  // Require meaningful reported effort to prevent a one-tap free grant.
  // This is STILL self-reported; future device/provider proof is independent.
  const volume=a.sets*a.reps;
  if(volume<10||a.minutes<10)throw Error('HIGHFLY_WORKOUT_TOO_SMALL');
  if(a.kind==='strength'&&a.loadKg<=0)
    throw Error('HIGHFLY_STRENGTH_NEEDS_LOAD');
  const stat=STAT_BY_KIND[a.kind];
  return {stat,points:1};
}
function validStored(value:unknown,hunterId:string):value is StoredHunter {
  if(!value||typeof value!=='object')return false;
  const a=value as Partial<StoredHunter>;
  if(a.version!==1||!a.profile||!Array.isArray(a.entries))return false;
  try{
    assertUniversalHunter(a.profile);
    if(a.profile.hunterId!==hunterId)return false;
    if(a.entries.length>2500)return false;
    const ids=new Set<string>();
    for(const item of a.entries){
      verifyReportedWorkout(item);
      if(ids.has(item.sessionId))return false;
      ids.add(item.sessionId);
    }
    return ids.size===a.profile.usedTrainingSessions.length &&
       a.profile.usedTrainingSessions.every(x=>ids.has(x));
  }catch{return false}
}
export class HunterTrainingJournal {
  readonly world:TrainingWorld;
  readonly hunterName:string;
  private store:TrainingStorage|null;
  private state:StoredHunter;
  private readonly listeners=new Set<(state:StoredHunter)=>void>();
  constructor(hunterName:string,world:TrainingWorld,store:TrainingStorage|null){
    this.hunterName=hunterName.trim();
    this.world=world;
    this.store=store;
    const hunterId='universal:'+encodeURIComponent(this.hunterName.toLowerCase());
    let initial:StoredHunter={version:1,profile:createUniversalHunterStats(hunterId),entries:[]};
    try{
      const content=store?.getItem(trainingSlotKey(world,this.hunterName));
      if(content){
        const parsed:unknown=JSON.parse(content);
        if(validStored(parsed,hunterId)) initial=parsed;
      }
    }catch{/* private-mode/denied storage: do not crash game */}
    this.state=initial;
  }
  get snapshot():StoredHunter{
    return {
      version:1,
      profile:{...this.state.profile,
        allocated:{...this.state.profile.allocated},
        usedTrainingSessions:[...this.state.profile.usedTrainingSessions]},
      entries:[...this.state.entries],
    };
  }
  onChange(cb:(x:StoredHunter)=>void):()=>void {
    this.listeners.add(cb);
    return ()=>{this.listeners.delete(cb)};
  }
  private commit(next:StoredHunter):StoredHunter {
    if(!validStored(next,this.state.profile.hunterId))
      throw Error('HIGHFLY_INVALID_TRAINING_PROFILE');
    // Save first: avoid reporting points as earned when persistent store rejected.
    if(this.store){
      try{this.store.setItem(trainingSlotKey(this.world,this.hunterName),JSON.stringify(next))}
      catch {/* transient private-mode: keep functioning in memory */ }
    }
    this.state=next;
    for(const cb of this.listeners)cb(this.snapshot);
    return this.snapshot;
  }
  setLevel(level:number):StoredHunter{
    const profile=updateUniversalLevel(this.state.profile,level);
    return this.commit({...this.state,profile});
  }
  logWorkout(record:TrainingProof):StoredHunter {
    const grant=verifyReportedWorkout(record);
    if(this.state.entries.some(e=>e.sessionId===record.sessionId))
      throw Error('HIGHFLY_DUPLICATE_WORKOUT');
    // Exactly once per session, attributed to intended primary stat.
    const next=recordValidatedTraining(this.state.profile,{
      source:'highfly-validated-training',
      sessionId:record.sessionId,points:grant.points
    });
    return this.commit({...this.state,profile:next,entries:[...this.state.entries,record]});
  }
  allocate(stat:UniversalStat,points:number):StoredHunter{
    return this.commit({...this.state,
      profile:allocateTrainingPoints(this.state.profile,stat,points)});
  }
}
let active:HunterTrainingJournal|null=null;
export function activateHunterTrainingJournal(
  name:string,world:TrainingWorld,storage:TrainingStorage|null,
):HunterTrainingJournal{
  active=new HunterTrainingJournal(name,world,storage);
  return active;
}
export function activeHunterTrainingJournal():HunterTrainingJournal|null{return active}
export function resolveHunterTrainingPrimary(name:string):Readonly<Record<UniversalStat,number>>|null{
  const j=active;
  if(!j || j.hunterName.trim().toLowerCase()!==name.trim().toLowerCase())return null;
  return j.snapshot.profile.allocated;
}
export function clearActiveHunterTrainingJournal():void{active=null}
