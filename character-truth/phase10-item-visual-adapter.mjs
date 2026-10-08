/* HIGHFLY SKIN 3 Phase10. Isolated ORIGINAL item-to-visual bridge prototype.
 * Items are actual original catalog IDs verified in CI. Original kits are
 * VISUAL PREVIEW mappings, NOT these items' official distinct authored 3D art.
 * No PF6 gameplay item changes, no manufactured custom items, no stats.
 */
import {slotAcceptsItem,canEquipItemInSlot} from './phase10-generated/equipment_rules.mjs';
import {ARMOR_SLOTS,ARMOR_SETS,DEFAULT_APPEARANCE,modularPartNames} from './phase10-generated/modular.mjs';

export const PILOT_CATALOG=Object.freeze({
 militia_vest:{id:'militia_vest',name:'Militia Chainvest',kind:'armor',slot:'chest',armorType:'mail',quality:'uncommon',preview:{slot:'chest',set:'knight'}},
 shadow_jerkin:{id:'shadow_jerkin',name:'Shadowstitch Jerkin',kind:'armor',slot:'chest',armorType:'leather',quality:'uncommon',preview:{slot:'chest',set:'rogue'}},
 woven_robe:{id:'woven_robe',name:'Valewoven Robe',kind:'armor',slot:'chest',armorType:'cloth',quality:'uncommon',preview:{slot:'chest',set:'mage'}},
 oiled_boots:{id:'oiled_boots',name:'Oiled Leather Boots',kind:'armor',slot:'feet',armorType:'leather',quality:'uncommon',preview:{slot:'feet',set:'ranger'}},
 greyjaw_hide_boots:{id:'greyjaw_hide_boots',name:'Greyjaw Hide Boots',kind:'armor',slot:'feet',armorType:'leather',quality:'uncommon',preview:{slot:'feet',set:'rogue'}},
 quilted_trousers:{id:'quilted_trousers',name:'Quilted Trousers',kind:'armor',slot:'legs',armorType:'cloth',quality:'uncommon',preview:{slot:'legs',set:'mage'}},
 worn_sword:{id:'worn_sword',name:'Pitted Shortsword',kind:'weapon',slot:'mainhand',quality:'common',weapon:{min:2,max:5,speed:2},preview:null}
});
export const PILOT_IDS=Object.freeze(Object.keys(PILOT_CATALOG));
const SLOT_ORDER=['mainhand','offhand','helmet','neck','shoulder','chest','waist','legs','gloves','feet','ring1','ring2','trinket'];
const same=(x)=>JSON.parse(JSON.stringify(x));
const fail=(code)=>({ok:false,code});
function invariant(condition,code){if(!condition)throw Error(code)}
export function initialPilot(gender='male'){
 invariant(gender==='male'||gender==='female','GENDER');
 return {v:1,cls:'warrior',gender,
  inventory:PILOT_IDS.map((itemId,i)=>({itemId,copyId:'source-demo-'+(i+1)})),
  equipment:{}};
}
export function validatePilot(s){
 invariant(s&&s.v===1&&s.cls==='warrior','SCHEMA_OR_CLASS');
 invariant(s.gender==='male'||s.gender==='female','INVALID_GENDER');
 invariant(Array.isArray(s.inventory)&&s.inventory.length<=40,'INVENTORY_SCHEMA');
 invariant(s.equipment&&!Array.isArray(s.equipment)&&typeof s.equipment==='object','EQUIPMENT_SCHEMA');
 const used=new Set();
 for(const copy of s.inventory){
  invariant(copy&&PILOT_CATALOG[copy.itemId]&&/^source-demo-\d+$/.test(copy.copyId),'UNKNOWN_COPY');
  invariant(!used.has(copy.copyId),'DUPLICATED_COPY');
  used.add(copy.copyId);
 }
 for(const [slot,copy] of Object.entries(s.equipment)){
  invariant(SLOT_ORDER.includes(slot),'UNKNOWN_EQUIP_SLOT');
  invariant(copy&&PILOT_CATALOG[copy.itemId]&&/^source-demo-\d+$/.test(copy.copyId),'BAD_EQUIP_COPY');
  invariant(!used.has(copy.copyId),'DUPLICATED_COPY');
  used.add(copy.copyId);
  const def=PILOT_CATALOG[copy.itemId];
  invariant(slotAcceptsItem(def,slot),'INVALID_SLOT');
  invariant(canEquipItemInSlot(s.cls,def,slot),'CLASS_DENIED');
 }
 invariant(used.size===PILOT_IDS.length,'MISSING_OR_UNKNOWN_COPIES');
 return true;
}
function commit(s){validatePilot(s);return s}
export function equipPilot(s,copyId,slot){
 validatePilot(s);
 const n=same(s),i=n.inventory.findIndex(v=>v.copyId===copyId);
 if(i<0)return fail('NOT_IN_BAGS');
 if(!SLOT_ORDER.includes(slot))return fail('INVALID_SLOT');
 const def=PILOT_CATALOG[n.inventory[i].itemId];
 if(!slotAcceptsItem(def,slot))return fail('ITEM_WRONG_SLOT');
 if(!canEquipItemInSlot(n.cls,def,slot))return fail('CLASS_DENIED');
 const selected=n.inventory.splice(i,1)[0];
 if(n.equipment[slot])n.inventory.push(n.equipment[slot]);
 n.equipment[slot]=selected;
 return {ok:true,state:commit(n)};
}
export function unequipPilot(s,slot){
 validatePilot(s);
 if(!s.equipment[slot])return fail('SLOT_EMPTY');
 if(s.inventory.length>=40)return fail('BAGS_FULL');
 const n=same(s);
 n.inventory.push(n.equipment[slot]);delete n.equipment[slot];
 return {ok:true,state:commit(n)};
}
export function setPilotGender(s,gender){
 validatePilot(s);
 if(!['male','female'].includes(gender))return fail('INVALID_GENDER');
 const n=same(s);n.gender=gender;return {ok:true,state:commit(n)};
}
export function visualPilot(s){
 validatePilot(s);
 const worn={};
 for(const part of ARMOR_SLOTS)worn[part]=null;
 const mapped=[];
 for(const [slot,copy] of Object.entries(s.equipment)){
  const def=PILOT_CATALOG[copy.itemId];
  if(!def.preview)continue;
  const {slot:part,set}=def.preview;
  invariant(ARMOR_SLOTS.includes(part)&&ARMOR_SETS.includes(set),'INVALID_NATIVE_KIT');
  worn[part]=set;
  mapped.push({itemId:copy.itemId,gameplaySlot:slot,visualSlot:part,originalKit:set,
   previewArtOnly:true,notItemSpecificAuthoredMesh:true});
 }
 const app={...DEFAULT_APPEARANCE,gender:s.gender};
 const nodes=modularPartNames(app,worn);
 invariant(nodes.includes(s.gender==='male'?'M_Torso':'F_Torso'),'NATIVE_BODY_MISSING');
 return {gender:s.gender,worn,nodes,mapped,
  equippedWeaponId:s.equipment.mainhand?.itemId??null,
  weaponVisualProof:false,physicallyEquippedInPF6:false,
  originalKitPartPreview:true};
}
export function savePilot(s){validatePilot(s);return JSON.stringify(s);}
export function loadPilot(json){const s=JSON.parse(json);validatePilot(s);return same(s);}
export function documentPilotLimits(){
 return {sourceOnly:true,actualPF6Save:false,actualGameplayEquip:false,
  cosmeticsReusedFromRealNativeKits:true,individualItemAuthentic3DArtwork:false,
  gameplayStatsTouched:false,mainhandActuallyAttachedInGLB:false};
}
