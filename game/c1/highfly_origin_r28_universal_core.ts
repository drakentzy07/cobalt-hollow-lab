/** R28 P1: disposable native skill trial authority. No persistent unlocks. */
import { ABILITIES } from './content/classes';
import { originCostDecision } from './highfly_origin_universal_resources';
import type { ResolvedAbility } from './resolved_ability';
import type { Sim } from './sim';
type NativeMeta = NonNullable<ReturnType<Sim['players']['get']>>;
const trial = new WeakMap<NativeMeta, Set<string>>();
export type R28Availability = 'native-ready' | 'passive' | 'hidden' | 'resource-incompatible' | 'unknown';
export function originR28Availability(id: string): R28Availability {
  const def=ABILITIES[id];
  if (!def) return 'unknown';
  if (def.hiddenFromPlayer) return 'hidden';
  if (def.passive) return 'passive';
  if (!originCostDecision(def).ok) return 'resource-incompatible';
  return 'native-ready';
}
function resolveNative(id: string): ResolvedAbility {
  const def=ABILITIES[id];
  return {
    def,rank:1,cost:def.cost,castTime:def.castTime,cooldown:def.cooldown,
    effects:[...def.effects],threatFlat:def.threat?.flat??0,threatMult:def.threat?.mult??1,
    bonusCharges:Math.max(0,(def.maxCharges??1)-1),
    ...(def.maxCharges===undefined?{}:{charges:def.maxCharges}),
  };
}
/** Called only by the isolated R28 tester, never by a public client command. */
export function originR28TrialSelect(sim:Sim,id:string):boolean {
  const meta=sim.players.get(sim.playerId);
  if(!meta?.originHunter||!sim.player.originResources||originR28Availability(id)!=='native-ready')
    return false;
  let ids=trial.get(meta);
  if(!ids){ids=new Set();trial.set(meta,ids);}
  ids.add(id);
  originR28Reconcile(meta);
  return true;
}
/** Called after the native abilitiesKnownAt rebuild at every level/spec refresh. */
export function originR28Reconcile(meta:NativeMeta):void {
  const ids=trial.get(meta);
  if(!ids||!meta.originHunter)return;
  const seen=new Set(meta.known.map(k=>k.def.id));
  for(const id of ids) {
    if(originR28Availability(id)!=='native-ready'||seen.has(id))continue;
    meta.known.push(resolveNative(id));seen.add(id);
  }
}
export function originR28TrialIds(sim:Sim):readonly string[]{
  const meta=sim.players.get(sim.playerId);
  return meta?[...(trial.get(meta)??[])]:[];
}
export function originR28NativeCatalog():readonly {id:string;name:string;school:string;type:string;availability:R28Availability;cost:number;cooldown:number}[]{
  return Object.values(ABILITIES).map(def=>({
    id:def.id,name:def.name,school:def.class,type:def.targetMode??def.targetType??'self',
    availability:originR28Availability(def.id),cost:def.cost,cooldown:def.cooldown,
  })).sort((a,b)=>a.school.localeCompare(b.school)||a.name.localeCompare(b.name));
}
