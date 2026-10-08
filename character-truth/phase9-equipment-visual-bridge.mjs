/* HIGHFLY SKIN3 Phase9 — real upstream equipment vs real character graphics bridge.
 * Source pin checked in CI; this tool MUST NOT edit PF6, the creator, stats, or assets.
 * The 13 gameplay slots and the 7 original armor visual slots are different namespaces.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {ALL_EQUIP_SLOTS,isEquipSlot} from './phase9-original/sim/types.mjs';
import {slotAcceptsItem,resolveEquipSlot} from './phase9-original/sim/equipment_rules.mjs';
import {
 ARMOR_SLOTS,ARMOR_SETS,DEFAULT_APPEARANCE,
 modularPartNames,modularGeometryKey,fullSet
} from './phase9-original/render/characters/modular.mjs';

const read=p=>fs.readFileSync(path.join('character-truth/phase9-original/src',p),'utf8');
const dest=path.join('character-truth','phase9-proof');
fs.mkdirSync(dest,{recursive:true});
const source=Object.fromEntries([
 'src/sim/types.ts','src/sim/equipment_rules.ts','src/sim/items.ts',
 'src/sim/character_state.ts','src/sim/professions/crafting.ts',
 'src/render/characters/modular.ts','src/render/characters/player_look_core.ts',
 'src/render/characters/assets.ts','src/net/weapon_skin_optimistic.ts',
 'src/sim/content/weapon_skins.ts','src/world_api/inventory.ts'
].map(p=>[p,read(p)]));

const need=(file,re,meaning)=>{
 assert.match(source[file],re,'Missing native bridge '+meaning+' in '+file);
};
assert.equal(ALL_EQUIP_SLOTS.length,13,'Different original paperdoll slot count');
assert.equal(new Set(ALL_EQUIP_SLOTS).size,13);
assert.equal(ARMOR_SLOTS.length,7,'Native visual slots changed');
assert.equal(ARMOR_SETS.length,7);
const gameplay=[...ALL_EQUIP_SLOTS],visual=[...ARMOR_SLOTS];
for(const k of gameplay)assert(isEquipSlot(k));
assert(!isEquipSlot('head')&&!isEquipSlot('back'),'Visual slot accidentally treated as gameplay slot');
assert(!visual.includes('helmet'),'Gameplay slot incorrectly treated as visual slot');
const candidates={
 helmet:'head',shoulder:'arms',chest:'chest',gloves:'hands',legs:'legs',feet:'feet'
};
assert.equal(Object.keys(candidates).length,6);
for(const [game,visualSlot] of Object.entries(candidates)){
 assert(gameplay.includes(game)&&visual.includes(visualSlot),'Speculative non-existent slot mapping');
}
const unmappedGameplay=gameplay.filter(x=>!(x in candidates));
assert.deepEqual(unmappedGameplay,['mainhand','offhand','neck','waist','ring1','ring2','trinket']);
const unmappedVisual=visual.filter(x=>!Object.values(candidates).includes(x));
assert.deepEqual(unmappedVisual,['back']);
const sword={id:'phase9-test-sword',kind:'weapon',slot:'mainhand',weapon:{min:1,max:2,speed:2},quality:'common'};
const armor={id:'phase9-test-chest',kind:'armor',slot:'chest',armorType:'mail',quality:'common'};
const shield={id:'phase9-test-shield',kind:'armor',slot:'offhand',shield:true,quality:'common'};
const ring={id:'phase9-test-ring',kind:'armor',slot:'ring',quality:'common'};
assert(slotAcceptsItem(sword,'mainhand')&&!slotAcceptsItem(sword,'helmet'));
assert(slotAcceptsItem(armor,'chest')&&!slotAcceptsItem(armor,'mainhand'));
assert(slotAcceptsItem(shield,'offhand')&&!slotAcceptsItem(shield,'mainhand'));
assert.equal(resolveEquipSlot(ring,{}),'ring1');
assert.equal(resolveEquipSlot(ring,{ring1:'already'}),'ring2');
assert.equal(resolveEquipSlot(ring,{ring1:'one',ring2:'two'}),'ring1');
for(const gender of ['male','female']){
 const app={...DEFAULT_APPEARANCE,gender};
 const naked=modularPartNames(app,{}),f=fullSet('knight'),full=modularPartNames(app,f);
 const name=gender==='male'?'M_Torso':'F_Torso';
 assert(naked.includes(name)&&full.includes(name),'Original body geometry lost under armor');
 const mixed=Object.fromEntries(visual.map((slot,i)=>[slot,ARMOR_SETS[i]]));
 const hybrid=modularPartNames(app,mixed);
 assert(hybrid.includes(name)&&hybrid.some(n=>n.startsWith('Armor_')));
 assert.notEqual(modularGeometryKey(app,f),modularGeometryKey(app,mixed));
 assert.notEqual(modularGeometryKey(app,f),modularGeometryKey(app,{...f,head:null}));
}
need('src/sim/items.ts',/export function equipItem\(/,'authoritative item equip');
need('src/sim/items.ts',/export function unequipItem\(/,'authoritative item unequip');
need('src/sim/items.ts',/delete meta\.equipment\[slot\]/,'worn slot removal');
need('src/sim/items.ts',/returnEquippedItemToBags\(/,'actual unequip to inventory');
need('src/sim/items.ts',/recalcPlayerStats\(/,'gameplay derived stats authority');
need('src/sim/character_state.ts',/equipment:\s*PlayerEquipment;/,'persistence gameplay equipment');
need('src/sim/character_state.ts',/equipmentInstance\?\s*:/,'persisted equipment instance');
need('src/sim/character_state.ts',/helmHidden\?:\s*boolean/,'visual helmet preference saved');
need('src/world_api/inventory.ts',/unequipItem\(slot:\s*EquipSlot\)/,'client unequip interface');
need('src/world_api/inventory.ts',/equipItemToSlot\(/,'client equip slot interface');
need('src/render/characters/assets.ts',/export function setHeldWeapon\(/,'live weapon visual swap');
need('src/render/characters/assets.ts',/export function setHeldOffhand\(/,'live offhand visual swap');
need('src/render/characters/assets.ts',/export function assembleModular\(/,'modular skinned renderer');
need('src/render/characters/assets.ts',/modularPartNames\(look\.app,\s*look\.worn\)/,'real compositor renderer connection');
need('src/render/characters/player_look_core.ts',/export function inWorldLookFor\(/,'in-world appearance bridge');
need('src/render/characters/player_look_core.ts',/const full = fullSet\(armorSet\)/,'class kit compose is full-set');
need('src/render/characters/player_look_core.ts',/return composedLook\(e\.modularAppearance,/,'in world author look');
need('src/sim/professions/crafting.ts',/craft/i,'craft system exists');
need('src/sim/content/weapon_skins.ts',/Cosmetic only:/,'weapon cosmetic not stats');
const lookCode=source['src/render/characters/player_look_core.ts'];
const composed=lookCode.slice(lookCode.indexOf('export function composedLook('),lookCode.indexOf('export function inWorldLookFor('));
assert(composed.includes('fullSet(armorSet)')&&composed.includes('helmHidden'));
assert(!/equippedItems|equipmentInstance|equippedVisualSlots/.test(composed),'Original look may already use equipped armor; re-audit.');
const itemSource=source['src/sim/items.ts'];
const equipStarts=itemSource.indexOf('export function equipItem('),unequipStarts=itemSource.indexOf('export function unequipItem(');
assert(equipStarts>=0&&unequipStarts>equipStarts);
const report={
 contract:'HIGHFLY_SKIN3_PHASE9_ORIGINAL_INVENTORY_VISUAL_BRIDGE_READ_ONLY',
 frozenOriginal:'9b57e49c9676d75962700f828cc00a50a9a988b5',
 proofChain:{nativeCageRun:37825143482,realPF6CreatorRun:37821747438,realPF6WorldRun:37817801074},
 verified:{
  gameplaySlots:gameplay,gameplaySlotCount:gameplay.length,
  originalVisualSlots:visual,visualSlotCount:visual.length,
  originalArmorSets:[...ARMOR_SETS],
  sourceMappingsForPilot:candidates,
  gameplaySlotsWithoutDirectVisualSlot:unmappedGameplay,
  visualSlotsWithoutGameplaySlot:unmappedVisual,
  authoritativeItemEquipUnequip:true,
  equipmentAndInstancePersistedInCharacterState:true,
  localPlayerAppearanceViaModularAppearance:true,
  actualOriginalLookUsesClassFullSetRatherThanItemByItem:true,
  runtimeWeaponSwapVisualHooksExist:true,
  runtimeOffhandSwapVisualHooksExist:true,
  cosmeticWeaponSkinLayerExists:true,
  sevenSlotSourceLabMixingWorks:true,
  originalItemRulesTests:8
 },
 integrationsRequired:[
  'Define per-slot visual identity for EACH legitimate equipped armor item: do not infer kit from unrelated class.',
  'Attach appearance to authoritative equipment state, preserving item copy and crafting provenance; save and load safely.',
  'Keep original item legality, armor type restrictions, stat derivation and combat unchanged.',
  'For 6 direct armor-slot candidates, verify corresponding actual models and slot coverage; waist and jewelry require explicit choices.',
  'Treat back cosmetics as their own policy because gameplay has no back equipment slot.',
  'Use original setHeldWeapon and setHeldOffhand with native bone transforms; new weapons need authored compatible 3D model.',
  'Verify items manufactured by the actual professions/crafting pipeline before connecting new cosmetic equip IDs.',
  'Validate Creator/gameplay/portrait and offline save/reload; mobile S23 landscape benchmark.',
 ],
 nonclaims:{
  noPF6GameplayIntegrationYet:true,
  noSourceModelsCreated:true,
  noNewItemDefinitions:true,
  noLiveEquipSwapTest:true,
  noInventoryPersistenceTest:true,
  noEquipmentToVisualMappingInPF6Proven:true,
  noStatsTrainingBridgeMutation:true,
  noFinalLegendarySkinApproval:true
 },
 nextStep:'Build independent equipment-to-visual adapter with optional saved appearance loadout; validate visual swaps on real frozen PF6 before any gameplay merge'
};
fs.writeFileSync(path.join(dest,'equipment-visual-bridge.json'),JSON.stringify(report,null,2));
const md=[
 '# HIGHFLY · SKIN 3 · Phase 9 — Real item system vs visual equipment',
 '',
 '## Source verified (GREEN)',
 '13 LIVE simulation paperdoll slots, 7 separate armoring slots in the character GLB.',
 'Items can be equipped, unequipped, validated, returned to bags and saved with item instances.',
 'Native renderer has mutable visible mainhand/offhand attach routines.',
 'Native player look currently selects a full class armor set plus helmet-hidden bit, not each inventory armor item.',
 '',
 '## Direct candidate mapping, pending gameplay integration',
 ...Object.entries(candidates).map(([k,v])=>'- game '+k+' -> visual '+v),
 'Unmapped gameplay: '+unmappedGameplay.join(', '),
 'Unmapped armor visual: '+unmappedVisual.join(', '),
 '',
 '## Hard safety gates',
 'No new weapons or armors authored yet; no PF6 mutation; no stats bridge mutation.',
 'Do not count a GREEN static source bridge as an in-game physical equip/unequip or save/reload success.',
 'No new gear may add HIGHFLY fitness STR/AGI/VIT/PER/INT.',
 'Visual skin identity must be cosmetic; gameplay equipment authority remains the original item validation.',
 'Prove every recipe/crafted item to saved instance to world view, and test S23 after source-only adapter validation.',
 '',
 'Verdict: NATIVE_EQUIPMENT_AND_VISUAL_SOURCE_BRIDGE_GREEN__GAMEPLAY_SLOT_SKINS_NOT_YET_CONNECTED.'
].join('\n');
fs.writeFileSync(path.join(dest,'PHASE9_VERDICT.md'),md+'\n');
console.log('HIGHFLY_SKIN3_PHASE9_NATIVE_BRIDGE_GREEN=1 GAMEPLAY_SLOTS='+gameplay.length+
 ' VISUAL_SLOTS='+visual.length+' DIRECT_CANDIDATE_MAPS='+Object.keys(candidates).length+
 ' REMAINING_GAMEPLAY='+unmappedGameplay.length+' ORIGINAL_ITEM_WEAPON_HOOKS=1 NO_GAMEPLAY_MUTATION=1');
