/** SKIN 7: inspect real modular source, never fabricate armor from prompt keywords. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='public/models/chars/modular/warrior_modular.glb';
if(!fs.existsSync(file)){
  const result={stage:'SKIN7_ORIGINAL_SOURCE_NOT_IN_CHECKOUT',nativeSourcePresent:false,originalSourcePath:file,referenceInventoryArtifact:'highfly-character-truth-native-inventory',knightPaladinVerified:false,geometryGenerated:false,bodypaintAccepted:false,minionAccepted:false,publicGameChanged:false,next:'Locate actual modular GLB; do not use V19 recolor as a substitute'};
  fs.mkdirSync('character-truth/skin7-evidence',{recursive:true});
  fs.writeFileSync('character-truth/skin7-evidence/native-armor-audit.json',JSON.stringify(result,null,2));
  console.log('SKIN7_SOURCE_LOCATION_DIAGNOSTIC_COMPLETE=1');
  console.log('SKIN7_NATIVE_ARMOR_GATE_BLOCKED_ORIGINAL_GLB_NOT_YET_AVAILABLE=1');
  process.exit(0);
}
const bytes=fs.readFileSync(file);
assert.equal(bytes.toString('ascii',0,4),'glTF','INVALID_GLTF_MAGIC');
const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
const jsonLen=view.getUint32(12,true);
assert.equal(view.getUint32(16,true),0x4e4f534a,'INVALID_JSON_CHUNK');
const document=JSON.parse(bytes.subarray(20,20+jsonLen).toString('utf8'));
assert(document.skins?.length>0 && document.animations?.length>0,'REQUIRES_RIG_AND_ANIMATIONS');
const nodes=(document.nodes||[]).map(x=>x.name||'');
const meshes=(document.meshes||[]).map(x=>x.name||'');
const all=[...nodes,...meshes];
const knight=all.filter(n=>/^Armor_knight_/i.test(n));
const paladin=all.filter(n=>/^Armor_paladin_/i.test(n));
const slots=all.filter(n=>/^(?:M|F)_(Head|Torso|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR|Loin)$/.test(n));
const rigs=nodes.filter(n=>n==='Rig_Medium');
const result={stage:'SKIN7_NATIVE_SOURCE_AUDIT_ONLY',file,byteLength:bytes.length,skins:document.skins.length,animations:document.animations.length,knightPieceNames:[...new Set(knight)].sort(),paladinPieceNames:[...new Set(paladin)].sort(),nativeSlots:[...new Set(slots)].sort(),rigMediumNames:rigs.length,bodypaintAccepted:false,minionAccepted:false,geometryGenerated:false,publicGameChanged:false};
fs.mkdirSync('character-truth/skin7-evidence',{recursive:true});
fs.writeFileSync('character-truth/skin7-evidence/native-armor-audit.json',JSON.stringify(result,null,2));
assert(knight.length>0,'NATIVE_KNIGHT_ARMOR_NOT_FOUND');
assert(paladin.length>0,'NATIVE_PALADIN_ARMOR_NOT_FOUND');
assert(slots.length>=8,'MODULAR_BODY_SLOTS_NOT_FOUND');
console.log('SKIN7_NATIVE_KNIGHT_PALADIN_SOURCE_AUDIT_GREEN=1');
console.log(JSON.stringify({knight:knight.length,paladin:paladin.length,slots:slots.length,skins:document.skins.length,animations:document.animations.length}));
