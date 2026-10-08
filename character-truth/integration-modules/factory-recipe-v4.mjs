/** HIGHFLY SKIN3 V4 complete design recipe.
 * Keeps V3 painter and V3 molder as frozen, separate authorities.
 * Contains visual recipes ONLY. No gameplay equipment authority / stats.
 */
import {readDesign,emptyDesign,SOURCE_REV,PARTS,migrateSinglePartV2} from './paint-recipe-v3.mjs';
import {validShape,shapeZero,ZERO_SHAPE} from './native-molder-v3.mjs';
const keysExact=(o,allow)=>Object.keys(o).every(k=>allow.includes(k));
const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function raw(x){
 if(typeof x!=='string')return x;
 if(x.length>16384)throw Error('RECIPE_TOO_LARGE');
 return JSON.parse(x);
}
export function readFactoryV4(serialized){
 const x=raw(serialized);
 if(!plain(x)||!keysExact(x,['schemaVersion','rig','sourceRevision','design','shapes'])||
    x.schemaVersion!==4||x.rig!=='Rig_Medium'||x.sourceRevision!==SOURCE_REV||
    !plain(x.design)||!plain(x.shapes))throw Error('INVALID_FACTORY_V4');
 // V3 delegates exact official 7-slot+paint validation; no bypass.
 const design=readDesign(x.design);
 if(design.rig!==x.rig||design.sourceRevision!==x.sourceRevision)throw Error('RIG_SOURCE_CONFLICT');
 const cleanShapes={};
 const names=Object.keys(x.shapes);
 if(names.length>7)throw Error('TOO_MANY_MOLDS');
 for(const slot of names){
  if(!PARTS.includes(slot)||!has(design.parts,slot))throw Error('UNAUTHORIZED_OR_ORPHAN_MOLD_'+slot);
  const profile=validShape(x.shapes[slot]);
  if(!shapeZero(profile))cleanShapes[slot]=profile;
 }
 return {schemaVersion:4,rig:'Rig_Medium',sourceRevision:SOURCE_REV,design,shapes:cleanShapes};
}
export function factoryV4(design=emptyDesign(),shapes={}){
 return readFactoryV4({schemaVersion:4,rig:'Rig_Medium',sourceRevision:SOURCE_REV,design,shapes});
}
export function saveFactoryV4(x){
 return JSON.stringify(readFactoryV4(x));
}
/** V3 painter recipes intentionally do not contain shape information. */
export function upgradePaintV3(legacyV3){
 return factoryV4(readDesign(raw(legacyV3)),{});
}
/** V2 old design migrated to a one-part V4 recipe. Does not touch original storage. */
export function upgradeOnePartV2(legacyV2,gender='male'){
 return factoryV4(migrateSinglePartV2(raw(legacyV2),gender),{});
}
export function exportFactoryBoundary(x){
 // For game integration later; NEVER use to write CharacterState.
 const safe=readFactoryV4(x);
 return {sourceOnly:true,visualRig:safe.rig,
   actualEquipAuthority:false,gameSaveWritten:false,
   trainingStatsTouched:false,
   slots:Object.fromEntries(PARTS.map(k=>[k,safe.design.parts[k]?.set??null])),
   shapes:Object.keys(safe.shapes)};
}
