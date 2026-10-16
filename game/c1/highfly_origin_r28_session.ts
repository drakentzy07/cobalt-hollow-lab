/** R28 disposable ability override. Selection lives ONLY in this module's
 * WeakMap: never in saved originHunter.learnedSkillIds or actionBar bindings.
 */
import { ABILITIES } from './content/classes';
import type { ResolvedAbility } from './resolved_ability';
import type { Sim } from './sim';
import { r28Selectable } from './highfly_origin_r28_universal_catalog';

type LabMeta={ originHunter?:unknown; known:ResolvedAbility[] };
const byMeta=new WeakMap<object,string>();
export function r28Resolved(id:string):ResolvedAbility {
 const def=ABILITIES[id];
 if(!def||!r28Selectable(id))throw Error('R28_NATIVE_ABILITY_NOT_ADMITTED_'+id);
 const out:ResolvedAbility={
  def,rank:1,cost:def.cost,castTime:def.castTime,cooldown:def.cooldown,
  effects:[...def.effects],threatFlat:def.threat?.flat??0,
  threatMult:def.threat?.mult??1,bonusCharges:Math.max(0,(def.maxCharges??1)-1),
 };
 if(def.maxCharges!==undefined)out.charges=def.maxCharges;
 return out;
}
/** Re-enter ONLY the selected skill after each source-owned known-list rebuild.
 * This protects level 1->2 and talent changes without modifying the source
 * abilitiesKnownAt() logic or permanent learned/mastery arrays. */
export function r28Reapply(meta:LabMeta):void {
 if(!meta.originHunter)return;
 const id=byMeta.get(meta);
 if(!id)return;
 meta.known=[r28Resolved(id)];
}
export function r28Selected(sim:Sim):string|null {
 const meta=sim.players.get(sim.playerId);
 return meta?byMeta.get(meta)??null:null;
}
export function r28Select(sim:Sim,id:string|null):boolean {
 const meta=sim.players.get(sim.playerId);
 if(!meta?.originHunter||!sim.player.originResources)return false;
 if(id===null){byMeta.delete(meta);meta.known=[];return true;}
 if(!r28Selectable(id))return false;
 byMeta.set(meta,id);
 r28Reapply(meta);
 // Selection cannot silently start the original automatic 1-2-3 combo.
 sim.stopAutoAttack();
 return true;
}
export function r28StartSession(sim:Sim):void {
 const meta=sim.players.get(sim.playerId);
 if(!meta?.originHunter||!sim.player.originResources)throw Error('R28_REQUIRES_DISPOSABLE_ORIGIN_HUNTER');
 // R28 uses the R26 save-disabled laboratory namespace.
 meta.originHunter.resources.maxMana=400;
 meta.originHunter.resources.mana=400;
 meta.originHunter.resources.maxStamina=250;
 meta.originHunter.resources.stamina=250;
 if(!r28Select(sim,'shadow_bolt'))throw Error('R28_DEFAULT_SKILL_NOT_ADMITTED');
}
