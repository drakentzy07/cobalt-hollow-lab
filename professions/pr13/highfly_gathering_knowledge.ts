/**
 * HIGHFLY PR-13 — Real Gathering provenance + Knowledge Core.
 *
 * Authority: frozen donor's already-committed gatherResult, farmHarvested
 * and fishingResult outcomes, NEVER the queued proficiency grant.
 * Mining, logging, herbalism, farming and fishing can add arbitrary future
 * source IDs if they are genuinely emitted by the existing donor systems.
 *
 * Source memory is a PROOF OF SELF-GATHERED OUTPUT, unlike PR-6/11's
 * "materials consumed by craft" proof. No auto monsters, no corpse RewardContext,
 * no new material drops, skill, XP, RNG, reward formulas or wire events.
 */
import { ITEMS } from '../data';
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';

export const HIGHFLY_GATHERING_CAREERS = [
  'mining', 'logging', 'herbalism', 'farming', 'fishing',
] as const;
export type HighflyGatheringCareer = typeof HIGHFLY_GATHERING_CAREERS[number];
export type HighflyGatheringOutcome = {
  professionId:HighflyGatheringCareer;
  kind:'node'|'crop'|'fishing';
  sourceId:string;
  itemId:string;
  /** Number ACTUALLY delivered, post-truncation/grade mapping. */
  quantity:number;
};
const MAX_KEYS=256,MAX_COUNT=1_000_000_000;
const VALID_ID=/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/;
function cleanId(s:string):boolean {
  return s.length>0&&s.length<=100&&VALID_ID.test(s)&&
    s!=='__proto__'&&s!=='constructor'&&s!=='prototype';
}
function evidence(
  state:SavedHighflyProfessionStateV1,
  key:string,
):SavedHighflyProfessionStateV1 {
  const old=state.evidence??{},n=old[key]??0;
  if(n>=MAX_COUNT || (!Object.hasOwn(old,key)&&Object.keys(old).length>=MAX_KEYS))
    return state;
  return {...state,evidence:{...old,[key]:Math.min(MAX_COUNT,Math.max(0,n)+1)}};
}
function knownSource(
  state:SavedHighflyProfessionStateV1,
  key:string,
):SavedHighflyProfessionStateV1 {
  const list=state.discoveredSources??[];
  if(list.includes(key)||list.length>=MAX_KEYS)return state;
  return {...state,discoveredSources:[...list,key]};
}
function knowledge(
  state:SavedHighflyProfessionStateV1,
  key:string,
):SavedHighflyProfessionStateV1 {
  const list=state.knowledge??[];
  if(list.includes(key)||list.length>=MAX_KEYS)return state;
  return {...state,knowledge:[...list,key]};
}
function validOutcome(o:HighflyGatheringOutcome):boolean {
  const expected=o.kind==='crop'?'farming':o.kind==='fishing'?'fishing':null;
  if(expected ? o.professionId!==expected :
    !['mining','logging','herbalism'].includes(o.professionId))return false;
  return HIGHFLY_GATHERING_CAREERS.includes(o.professionId) &&
    cleanId(o.sourceId)&&cleanId(o.itemId) &&
    Object.hasOwn(ITEMS,o.itemId) &&
    Number.isFinite(o.quantity)&&Number.isInteger(o.quantity)&&o.quantity>=1;
}

/** Call ONLY from 3 already-committed donor success arms.
 * No "source" credit on an attempted cast, withered plot, got-away fish,
 * Codfather scripted token, empty hook, bag denial, or /dev grant.
 *
 * Zero gain at gray source still counts self-gathered evidence; no added XP.
 */
export function recordHighflyGatheringOutcome(
  previous:SavedHighflyProfessionStateV1|undefined,
  outcome:HighflyGatheringOutcome,
):SavedHighflyProfessionStateV1|undefined {
  if(!validOutcome(outcome))return previous;
  const original=previous??{version:1 as const};
  const sourceKey=`gather:${outcome.professionId}:${outcome.kind}:${outcome.sourceId}`;
  let next=evidence(original,`gather.success.${outcome.professionId}`);
  next=knownSource(next,sourceKey);
  // Distinct from RECIPE unlock and from consumption evidence.
  if(next.discoveredSources?.includes(sourceKey))
    next=knowledge(next,`source.${outcome.professionId}`);
  const n=next.discoveredSources?.filter(s=>
    s.startsWith(`gather:${outcome.professionId}:`)).length??0;
  if(n>=2)next=knowledge(next,`technique.${outcome.professionId}.source_diversity`);
  return next;
}

export interface HighflyGatheringStatus {
  careers:Record<HighflyGatheringCareer,{
    provenHarvests:number;distinctSources:number;
    sourceKnowledge:boolean;sourceDiversityKnown:boolean;
  }>;
  totalDistinctSources:number;
  monsterRewardContextConnected:false;
  extraItemsGranted:0;
  extraCharacterXpGranted:0;
}
export function highflyGatheringStatus(
  state:SavedHighflyProfessionStateV1|undefined,
):HighflyGatheringStatus {
  const e=state?.evidence??{},k=state?.knowledge??[],src=state?.discoveredSources??[];
  const rows=HIGHFLY_GATHERING_CAREERS.map(professionId=>
    [professionId,{
      provenHarvests:e[`gather.success.${professionId}`]??0,
      distinctSources:src.filter(s=>s.startsWith(`gather:${professionId}:`)).length,
      sourceKnowledge:k.includes(`source.${professionId}`),
      sourceDiversityKnown:k.includes(`technique.${professionId}.source_diversity`),
    }] as const);
  return {
    careers:Object.fromEntries(rows) as HighflyGatheringStatus['careers'],
    totalDistinctSources:src.filter(s=>s.startsWith('gather:')).length,
    monsterRewardContextConnected:false,
    extraItemsGranted:0,
    extraCharacterXpGranted:0,
  };
}
