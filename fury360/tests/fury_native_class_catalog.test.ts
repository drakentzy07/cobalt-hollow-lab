import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  FURY_NINE_CLASSES,buildFuryNineClassCatalog,findFuryClassVisual,
} from '../src/native_class_catalog.ts';
const realNativeIds: Record<string,string> = {
  warrior:'charge',paladin:'consecration',hunter:'concussive_shot',
  rogue:'sinister_strike',priest:'holy_nova',shaman:'thunderstorm',
  mage:'fireball',warlock:'shadow_bolt',druid:'wrath',
};
test('nine original class keys + one genuine class-specific native ability each',()=>{
  assert.equal(FURY_NINE_CLASSES.length,9);
  const kits=FURY_NINE_CLASSES.map(id=>({id,abilities:[realNativeIds[id]]}));
  const defs=new Map(FURY_NINE_CLASSES.map(id=>[
    realNativeIds[id],{id:realNativeIds[id],class:id,requiresTarget:true,range:25},
  ] as const));
  const report=buildFuryNineClassCatalog(kits,defs);
  assert.equal(report.complete,true);
  assert.equal(report.totalNativeAbilities,9);
  assert.equal(report.totalVisuals,0); // never invent free aim for hostile lock spells
  assert.equal(report.missingDefinitions,0);
  assert.equal(report.classes.length,9);
});
test('all known native abilities and original class associations are preserved',()=>{
  const kits=FURY_NINE_CLASSES.map(id=>({id,abilities:[realNativeIds[id],'shared-vfx-skill']}));
  const defs=new Map(FURY_NINE_CLASSES.map(id=>[
    realNativeIds[id],{id:realNativeIds[id],class:id,requiresTarget:true,range:25},
  ] as const));
  defs.set('shared-vfx-skill',{id:'shared-vfx-skill',requiresTarget:false,range:15,
    targetMode:'position',effects:[{type:'groundAoE',radius:4}]});
  const report=buildFuryNineClassCatalog(kits,defs);
  assert.equal(report.totalNativeAbilities,18);
  assert.equal(report.totalVisuals,9);
  assert.equal(findFuryClassVisual(report,'mage','shared-vfx-skill')?.spec.radius,4);
  assert.equal(findFuryClassVisual(report,'druid','non-native-hack'),null);
  assert.equal(report.classes[0].abilities[0].ability?.id,'charge');
});
test('missing runtime classes/definitions fail closed, never claim full compatibility',()=>{
  const r=buildFuryNineClassCatalog([{id:'warrior',abilities:['unknown']}],new Map());
  assert.equal(r.complete,false);
  assert.ok(r.missingClasses.includes('druid'));
  assert.equal(r.missingDefinitions,1);
  assert.equal(r.totalVisuals,0);
});
test('native known list dedupes entries, does not create or alter class skills',()=>{
  const kits=[{id:'mage',abilities:['fireball','fireball']}];
  const defs=new Map([['fireball',{id:'fireball',requiresTarget:true,range:30}]]);
  const before=JSON.stringify(kits);
  const report=buildFuryNineClassCatalog(kits,defs,{fireball:{shape:'line',width:1.6}});
  assert.equal(report.classes.find(x=>x.classId==='mage')?.registered,1);
  assert.equal(report.classes.find(x=>x.classId==='mage')?.visuals,1);
  assert.equal(JSON.stringify(kits),before);
});
