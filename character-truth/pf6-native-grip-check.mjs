/* HIGHFLY SKIN 3 Phase5. Run against bundled ORIGINAL source modules only.
   Math correctness is not proof of visual weapon-to-skin clearance or PF6 final scene. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
 ARMOR_SETS,ARMOR_SLOTS,CLASS_ARMOR_SETS,DEFAULT_APPEARANCE,
 classArmorSet,fullSet,modularPartNames,NEUTRAL_BODY,NEUTRAL_FACE
} from './pf6-original/modular.mjs';
import {WEAPON_GRIP_OVERRIDES,variantGripTransform} from './pf6-original/weapon_grip.mjs';
import {BACK_GRIP_FAMILIES,backGripFor} from './pf6-original/back_grips.mjs';
import {KAYKIT_SHIELD_GRIPS,KAYKIT_ONE_HAND_SWORD_GRIP} from './pf6-original/held_item_grips.mjs';
const originalClassMap={
 warrior:'knight',paladin:'paladin',hunter:'ranger',rogue:'rogue',priest:'mage',
 shaman:'barbarian',mage:'mage',warlock:'mage',druid:'druid'
};
assert.deepEqual(CLASS_ARMOR_SETS,originalClassMap);
assert.equal(ARMOR_SETS.length,7);assert.equal(ARMOR_SLOTS.length,7);
assert.equal(Object.keys(originalClassMap).length,9);
const cases=[];
for(const [cls,set] of Object.entries(originalClassMap)){
 assert.equal(classArmorSet(cls),set);
 for(const gender of ['male','female']){
  const app={...DEFAULT_APPEARANCE,gender,body:{...NEUTRAL_BODY},face:{...NEUTRAL_FACE}};
  const full=fullSet(set),parts=modularPartNames(app,full);
  assert(parts.includes(gender==='male'?'M_Head':'F_Head'),cls+' missing real body head');
  assert(parts.some(p=>p.startsWith('Armor_'+set+'_')),cls+' missing expected source armor');
  assert(!parts.some(p=>p.startsWith(gender==='male'?'F_':'M_')),cls+' contains opposing gender mesh');
  const withoutHelm=modularPartNames(app,{...full,head:null});
  assert(withoutHelm.includes(gender==='male'?'M_Head':'F_Head'));
  cases.push({class:cls,gender,sourceSet:set,originalNodes:parts.length,helmHiddenNodes:withoutHelm.length});
 }
}
const gripCases=[];
const fin=x=>x.every(Number.isFinite),quat=q=>Math.hypot(...q);
const testGrip=(name,override)=>{
 const r=variantGripTransform(2,false,.42,1.7,override);
 const left=variantGripTransform(2,true,.42,1.7,override);
 for(const t of [r,left]){
  assert(fin(t.position)&&fin(t.quaternion)&&Number.isFinite(t.scale)&&t.scale>0);
  assert(Math.abs(quat(t.quaternion)-1)<0.0001);
 }
 gripCases.push({name,right:r,left});
};
testGrip('NATIVE_BASE',undefined);
for(const [name,value] of Object.entries(WEAPON_GRIP_OVERRIDES))testGrip(name,value);
const bag=[];
for(const family of BACK_GRIP_FAMILIES){
 const right=backGripFor(family,'r'),left=backGripFor(family,'l');
 for(const g of [right,left]){
  assert(fin(g.position)&&fin(g.quaternion),'nonfinite sheath '+family);
  assert(Math.abs(quat(g.quaternion)-1)<0.0001,'invalid sheath orientation '+family);
 }
 bag.push({family,right,left});
}
assert(BACK_GRIP_FAMILIES.size>=4,'Suspiciously incomplete original carry table');
assert.equal(KAYKIT_ONE_HAND_SWORD_GRIP.r.position.length,3);
assert.equal(KAYKIT_ONE_HAND_SWORD_GRIP.l.quaternion.length,4);
assert(Object.keys(KAYKIT_SHIELD_GRIPS).length>=3);
for(const [name,row] of Object.entries(KAYKIT_SHIELD_GRIPS)){
 for(const side of ['r','l']){
  assert(fin(row[side].position)&&fin(row[side].quaternion));
  assert(Math.abs(quat(row[side].quaternion)-1)<0.0001);
 }
}
const report={
 upstream:'9b57e49c9676d75962700f828cc00a50a9a988b5',
 sourceOnly:true,finalPF6SceneCertified:false,liveSocketsCertified:false,
 originalClasses:Object.keys(originalClassMap).length,originalArmorSets:ARMOR_SETS.length,
 classGenderCases:cases.length,variantWeaponOverrides:gripCases.length-1,
 sheathedWeaponFamilies:bag.length,shieldStyles:Object.keys(KAYKIT_SHIELD_GRIPS).length,
 classMapping:originalClassMap,
 classProof:cases,grips:gripCases,backGrips:bag,
 verdict:'ORIGINAL_COMPOSITOR_AND_GRIP_MATH_GREEN_WITH_PF6_VISUAL_PENDING'
};
fs.mkdirSync('character-truth/phase5-proof',{recursive:true});
fs.writeFileSync('character-truth/phase5-proof/creator-grip-matrix.json',JSON.stringify(report,null,2));
console.log('HIGHFLY_SKIN3_ORIGINAL_CLASS_GENDER_KITS_GREEN='+cases.length+' GRIP_OVERRIDES='+report.variantWeaponOverrides+' BACK_FAMILIES='+bag.length);
