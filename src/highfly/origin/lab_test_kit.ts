/** LAB-only sampling of the SAME real items and equip gates used by World.
 * World never calls this; training Core is unchanged, no injected permanent stats.
 */
import { ITEMS } from '../../sim/data';
import { universalHunterCanEquipSlot } from './universal_equipment';
import { requiredLevelFor } from '../../sim/item_level_req';
import type { EquipSlot, ItemDef } from '../../sim/types';

export interface LabKitPick {slot:EquipSlot;itemId:string;requiredLevel:number}
const LAB_KIT_SLOTS:readonly EquipSlot[] = ['mainhand','chest','legs','helmet','shoulder','gloves','feet','waist'];
function power(item:ItemDef):number {
 const stats=item.stats;
 const primary=(stats?.str??0)+(stats?.agi??0)+(stats?.sta??0)+(stats?.int??0)+(stats?.spi??0);
 const armor=stats?.armor??0;
 return item.kind==='weapon'
  ? (item.weapon.min+item.weapon.max)/Math.max(0.8,item.weapon.speed)*2+primary*1.6
  : armor*.33+primary*2;
}
export function highflyLabKitCandidates(level:number):LabKitPick[] {
 if(!Number.isFinite(level)||level<1)return [];
 const best=new Map<EquipSlot,{itemId:string;score:number;requiredLevel:number}>();
 for(const item of Object.values(ITEMS)){
  if(item.kind!=='weapon'&&item.kind!=='armor')continue;
  if(item.masterwrought||item.quality==='legendary')continue;
  const requiredLevel=requiredLevelFor(item);
  if(requiredLevel>level)continue;
  for(const slot of LAB_KIT_SLOTS){
   if(!universalHunterCanEquipSlot(item,slot))continue;
   const score=power(item)+requiredLevel*.08;
   if(score>(best.get(slot)?.score??-Infinity))best.set(slot,{itemId:item.id,score,requiredLevel});
  }
 }
 return LAB_KIT_SLOTS.flatMap(slot=>{
  const pick=best.get(slot);
  return pick?[{slot,itemId:pick.itemId,requiredLevel:pick.requiredLevel}]:[];
 });
}
