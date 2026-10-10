/**
 * SKIN7 THE REAL HERRERO: original upstream 0.44.0 seven armor slots.
 * A forge replaces active equipment nodes in ONE slot; native body ALWAYS remains
 * (upstream modularPartNames actually preserves base skin to fill armor gaps).
 * This model does NOT add a second Nightfall armor. Source GLB 11 paladin meshes.
 */
export const SOURCE=Object.freeze({
 upstream:'9b57e49c9676d75962700f828cc00a50a9a988b5',
 glb:'public/models/chars/modular/warrior_modular.glb',
 blobSha1:'e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2',
 rig:'Rig_Medium',bones:23,parts:11
});
export const SLOTS=Object.freeze(['head','chest','arms','hands','legs','feet','back']);
export const PALADIN=Object.freeze({
 head:Object.freeze(['Armor_paladin_Head']),
 chest:Object.freeze(['Armor_paladin_Chest']),
 arms:Object.freeze(['Armor_paladin_ArmL','Armor_paladin_ArmR']),
 hands:Object.freeze(['Armor_paladin_HandL','Armor_paladin_HandR']),
 legs:Object.freeze(['Armor_paladin_LegL','Armor_paladin_LegR']),
 feet:Object.freeze(['Armor_paladin_FootL','Armor_paladin_FootR']),
 back:Object.freeze(['Armor_paladin_Back'])
});
const BODY=Object.freeze({
 M:Object.freeze({head:['M_Head'],chest:['M_Torso'],arms:['M_ArmL','M_ArmR'],
 hands:['M_HandL','M_HandR'],legs:['M_LegL','M_LegR'],feet:['M_FootL','M_FootR'],back:[]}),
 F:Object.freeze({head:['F_Head'],chest:['F_Torso'],arms:['F_ArmL','F_ArmR'],
 hands:['F_HandL','F_HandR'],legs:['F_LegL','F_LegR'],feet:['F_FootL','F_FootR'],back:[]})
});
function assert(condition,msg){if(!condition)throw Error('SKIN7_'+msg)}
export function validateKit(kit){
 assert(kit&&typeof kit==='object'&&!Array.isArray(kit),'KIT_EXPECTED');
 assert(kit.rig===SOURCE.rig&&kit.nativeJointCount===SOURCE.bones,'ORIGINAL_RIG_ONLY');
 const keys=Object.keys(kit.equipment||{});
 assert(keys.every(k=>SLOTS.includes(k)),'UNKNOWN_EQUIPMENT_SLOT');
 const normalized={};
 for(const slot of SLOTS){
  const item=kit.equipment?.[slot];
  if(item===null||item===undefined){normalized[slot]=null;continue}
  assert(item&&typeof item==='object'&&!Array.isArray(item),'BAD_PIECE_'+slot);
  assert(item.slot===slot&&['original-paladin','forge-skin7'].includes(item.origin),'FOREIGN_GEAR_'+slot);
  assert(Array.isArray(item.nodes)&&item.nodes.length>0&&item.nodes.length<=4,'BAD_GEAR_NODES_'+slot);
  const names=PALADIN[slot];
  if(item.origin==='original-paladin')assert(JSON.stringify(names)===JSON.stringify(item.nodes),'ORIGINAL_NODE_DRIFT_'+slot);
  else for(const n of item.nodes)assert(/^HF7RF_[A-Za-z0-9_]{5,80}$/.test(n),'FORGED_NODE_INVALID_'+slot);
  assert(item.originalSource?.every(n=>names.includes(n))&&item.originalSource.length===names.length,
   'NATIVE_SOURCE_PROVENANCE_'+slot);
  normalized[slot]={slot,origin:item.origin,nodes:[...item.nodes],
   originalSource:[...item.originalSource]};
 }
 return {rig:SOURCE.rig,nativeJointCount:SOURCE.bones,equipment:normalized};
}
export function originalPaladinKit(){
 return validateKit({rig:SOURCE.rig,nativeJointCount:SOURCE.bones,
  equipment:Object.fromEntries(SLOTS.map(slot=>[slot,{
   slot,origin:'original-paladin',nodes:[...PALADIN[slot]],originalSource:[...PALADIN[slot]]
  }]))});
}
export function replaceEquipmentSlot(kit,slot,forgedNames){
 const original=validateKit(kit);
 assert(SLOTS.includes(slot),'BAD_SLOT');
 assert(Array.isArray(forgedNames)&&forgedNames.length>0,'EMPTY_FORGED_PIECE');
 const next=structuredClone(original);
 const last=original.equipment[slot];
 assert(last,'EMPTY_BASE_SLOT_CANNOT_REFORGE');
 next.equipment[slot]={slot,origin:'forge-skin7',nodes:forgedNames,
  originalSource:last.originalSource};
 return validateKit(next);
}
export function returnToOriginal(kit,slot){
 const normalized=validateKit(kit);
 assert(SLOTS.includes(slot),'BAD_SLOT');
 const next=structuredClone(normalized);
 next.equipment[slot]={slot,origin:'original-paladin',
  nodes:[...PALADIN[slot]],originalSource:[...PALADIN[slot]]};
 return validateKit(next);
}
export function composeEquipmentPlan(kit,gender){
 const valid=validateKit(kit);
 assert(['M','F'].includes(gender),'GENDER');
 const active=SLOTS.flatMap(slot=>valid.equipment[slot]?.nodes||[]);
 const absent=SLOTS.filter(slot=>!valid.equipment[slot]);
 const nativeBody=SLOTS.flatMap(slot=>BODY[gender][slot]);
 const undergarments=gender==='M'?['M_Loin']:['F_Loin','F_Top'];
 const loin=gender+'_Loin';
 const covered=!!valid.equipment.legs;
 const headwear=!!valid.equipment.head;
 const fullHelmet=headwear; // paladin and descendants both FULL by contract
 const suppressedLoin=covered?[loin]:[];
 const visibleUndergarments=undergarments.filter(n=>!suppressedLoin.includes(n));
 return {
  rig:SOURCE.rig,gender,activeEquipmentNodes:active,
  keepOriginalBodyNodes:nativeBody,
  keepUndergarmentNodes:visibleUndergarments,
  hideUndergarmentNodes:suppressedLoin,
  suppressUnderFullHelmet:fullHelmet?['ear','earring','beard','hair']:[],
  keepFacialFeatures:['eye','brow','mouth'],
  bareSlots:absent,
  hideUnselectedArmorNodes:true, // ALL OTHER kit armor pieces must be hidden in source GLB
  forbiddenOverlaySources:['HFV8_','HFV12_','HFV19_','HIGHFLY_V10_NIGHTFALL'],
  noGameDeploy:true
 };
}
/** Reforge knowledge: verified source anchors and parametric edits, NOT fictional AI training.
 * The future Blender forge must translate this recipe to actual vertices and validate output.
 */
export function makeReforgeRecipe({kit,slot,shape,reference=null}){
 const source=validateKit(kit);
 assert(SLOTS.includes(slot),'INVALID_RECIPE_SLOT');
 const old=source.equipment[slot];
 assert(old&&old.originalSource.length>0,'MISSING_ORIGINAL_GEOMETRY_TO_LEARN');
 assert(shape&&typeof shape==='object','SHAPE_REQUIRED');
 const permitted=['width','height','depth','curvature','flare','edgeThickness'];
 assert(Object.keys(shape).every(k=>permitted.includes(k)),'UNKNOWN_SHAPE_CONTROL');
 const values={};
 for(const [key,value] of Object.entries(shape)){
  const low=key==='curvature'||key==='flare'?-1:key==='edgeThickness'?.005:.65;
  const high=key==='curvature'||key==='flare'?1:key==='edgeThickness'?.12:1.5;
  assert(typeof value==='number'&&Number.isFinite(value)&&value>=low&&value<=high,
   'UNSAFE_REFORGE_SHAPE_'+key);
  values[key]=value;
 }
 assert(reference===null||(typeof reference==='string'&&reference.length<=1000),'BAD_REFERENCE');
 return {schema:'highfly.skin7.native-reforge-recipe/1',baseSet:'paladin',
  immutableSourceCommit:SOURCE.upstream,immutableSourceGLBBlob:SOURCE.blobSha1,
  nativeSourceMeshNames:[...old.originalSource],slot,
  forgeMethod:'MODIFY_SELECTED_SOURCE_ARMOR_MESH_NOT_ADDITIVE_NIGHTFALL',
  edit:values,reference,
  newGeometryRequired:true,needsFullAnimationAndVisualReview:true,
  artistApproved:false,gameDeployed:false};
}
