import assert from 'node:assert/strict';
import {test} from 'node:test';
import {deriveFuryNativeVisual} from '../src/native_visual_registry.ts';
const base={id:'native-meteor',class:'mage',range:30,requiresTarget:false,
  targetMode:'position' as const,effects:[{type:'groundAoE',radius:5}]};
test('native authored ground AoE produces visible circle with its exact radius',()=>{
  const m=deriveFuryNativeVisual(base)!;
  assert.equal(m.spec.shape,'circle');
  assert.equal(m.spec.range,30);
  assert.equal(m.spec.radius,5);
  assert.equal(m.spec.abilityId,'native-meteor');
});
test('targeted projectile/heal, passive and self-centered channel never become free aim',()=>{
  assert.equal(deriveFuryNativeVisual({...base,requiresTarget:true,targetMode:undefined}),null);
  assert.equal(deriveFuryNativeVisual({...base,passive:true}),null);
  assert.equal(deriveFuryNativeVisual({...base,selfCentered:true}),null);
  assert.equal(deriveFuryNativeVisual({...base,effects:[{type:'damage'}]}),null);
  assert.equal(deriveFuryNativeVisual({...base,hiddenFromPlayer:true}),null);
});
test('explicit native ability visual overrides work across nine different original classes',()=>{
  const classes=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
  for(const cls of classes){
    const b={id:'native-'+cls,class:cls,range:17,requiresTarget:true,targetType:'enemy' as const};
    const m=deriveFuryNativeVisual(b,{[b.id]:{shape:'line',width:2}});
    assert.equal(m?.spec.shape,'line');
    assert.equal(m?.spec.abilityId,b.id);
    assert.equal(m?.spec.range,17);
  }
});
test('friendly native magic can receive friendly-tone reticles without touching effect',()=>{
  const b={...base,targetType:'friendly' as const,effects:[{type:'groundAoE',radius:8,allyBuffPct:0.2}]};
  const m=deriveFuryNativeVisual(b)!;
  assert.equal(m.tone,'friendly');
  assert.equal(m.spec.radius,8);
  assert.equal(b.effects[0].allyBuffPct,0.2);
});
