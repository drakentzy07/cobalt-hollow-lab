/** One Hunter can train all nine schools and equip any *level-eligible* item.
 * Do not weaken the donor's class, quest, quality, UNIQUE or slot rules:
 * this adapter is invoked ONLY when Sim.cfg.originUniversalHunter is true.
 */
import type { EquipSlot, ItemDef } from '../../sim/types';
import { isShieldItem, weaponHand } from '../../sim/equipment_rules';

export function universalHunterCanEquip(item:ItemDef):boolean {
  return item.kind==='weapon' || item.kind==='armor' || item.kind==='held_offhand';
}
export function universalHunterCanEquipSlot(item:ItemDef,slot:EquipSlot):boolean {
  if (!universalHunterCanEquip(item))return false;
  if (item.kind==='armor'){
    if(item.slot==='ring')return slot==='ring1'||slot==='ring2';
    return item.slot===slot;
  }
  if(item.kind==='held_offhand')return slot==='offhand';
  if(isShieldItem(item))return slot==='offhand';
  if(item.kind!=='weapon')return false;
  if(slot==='mainhand')return true;
  // Keep ordinary real-world hand occupancy constraints: two-hand weapons
  // occupy both hands unless a future Titan Grip skill is LEARNED.
  return slot==='offhand' && weaponHand(item)==='onehand';
}
