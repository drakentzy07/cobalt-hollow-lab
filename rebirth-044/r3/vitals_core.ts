/** HIGHFLY REBIRTH R3: three real HP/MP/EN pools, opt-in on isolated offline player.
 * The v0.44 class resourceType stays a compatibility input to original talents,
 * forms and save serialization. It is never exposed as a fourth HUD pool.
 */
import type {Entity} from '../../sim/types';
export interface RebirthVitalPools {
  mana:number;maxMana:number;energy:number;maxEnergy:number;
}
type Player=Pick<Entity,'resource'|'resourceType'|'maxResource'|'stats'|'savedMana'|'highflyVitals'>;
const cap=(v:number,max:number)=>Math.max(0,Math.min(max,Number.isFinite(v)?v:0));
export function rebirthMaxMana(p:Player):number {
  return p.resourceType==='mana'?Math.max(1,p.maxResource):Math.max(100,100+Math.max(0,p.stats.int-10)*5);
}
export function rebirthInitializeVitals(p:Player,saved?:Partial<RebirthVitalPools>|null):RebirthVitalPools {
  const maxMana=rebirthMaxMana(p),maxEnergy=100;
  const primaryIsMana=p.resourceType==='mana';
  const initialEnergy=primaryIsMana?maxEnergy:(p.resource>0?p.resource:maxEnergy);
  const v:RebirthVitalPools={
    maxMana, maxEnergy,
    mana:cap(saved?.mana??(primaryIsMana?p.resource:maxMana),maxMana),
    energy:cap(saved?.energy??initialEnergy,maxEnergy),
  };
  p.highflyVitals=v;
  if(!primaryIsMana)p.resource=v.energy; // native rage/focus/energy is an internal EN adapter
  return v;
}
export function rebirthMirrorNativeVitals(p:Player):RebirthVitalPools|null {
  const v=p.highflyVitals;
  if(!v)return null;
  const maxMana=rebirthMaxMana(p);
  v.maxMana=maxMana;
  if(p.resourceType==='mana'){
    v.mana=cap(p.resource,maxMana);
  }else{
    v.energy=cap(p.resource,100);
    // Native druid forms park mana while their live resource is energy/rage.
    if(p.savedMana>0)v.mana=cap(p.savedMana,maxMana);
  }
  return v;
}
export function rebirthRegenSecondaryVitals(p:Player):void {
  const v=p.highflyVitals;
  if(!v)return;
  if(p.resourceType==='mana')v.energy=cap(v.energy+20,v.maxEnergy);
  else v.mana=cap(v.mana+Math.max(8,Math.round(v.maxMana*.04)),v.maxMana);
}
export function rebirthUsesSecondaryEnergy(
  p:Player,ability:{school?:string},isFormChange=false,
):boolean {
  return !!p.highflyVitals && p.resourceType==='mana' &&
    ability.school==='physical' && !isFormChange;
}
export function rebirthSecondaryBalance(p:Player,ability:{school?:string},isFormChange=false):number|null {
  return rebirthUsesSecondaryEnergy(p,ability,isFormChange)?p.highflyVitals!.energy:null;
}
export function rebirthSpendSecondaryEnergy(
  p:Player,ability:{school?:string},cost:number,isFormChange=false,
):boolean {
  const v=p.highflyVitals;
  if(!v||!rebirthUsesSecondaryEnergy(p,ability,isFormChange))return false;
  // Native checks eligibility first. This function is only called after commit.
  v.energy=cap(v.energy-Math.max(0,cost),v.maxEnergy);
  return true;
}
