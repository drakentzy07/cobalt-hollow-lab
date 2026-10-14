/** HIGHFLY SF27: FINAL FIVE native combat, resurrection and guardian simulation. */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {HIGHFLY_FUSED_SKILLS} from '../src/highfly/sf3_skill_catalog';
import type {AbilityDef} from '../src/sim/types';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {MOBS} from '../src/sim/data';
import type {PlayerClass} from '../src/sim/types';
import {placeAbilityOnSlot,isAbilityActionBarEligible} from '../src/ui/hud/action_bar/hotbar';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';
import {installSf10NativeExpansion} from '../src/highfly/sf10_three_native_reuses';
import {installSf12NativeExpansion} from '../src/highfly/sf12_three_native_mechanics';
import {installSf13Compatible} from '../src/highfly/sf13_mass_native_gate';
import {installSf14HandAdapters} from '../src/highfly/sf14_hand_native_adapters';
import {installSf15EightNative} from '../src/highfly/sf15_eight_native_batch';
import {installSf16UniqueNative} from '../src/highfly/sf16_eight_support_elemental';
import {installSf17ThreeNative} from '../src/highfly/sf17_three_unique_native';
import {installSf18ThreeNative} from '../src/highfly/sf18_four_native_effects';
import {installSf19TwoNative} from '../src/highfly/sf19_two_melee_native';
import {installSf20TwoNative} from '../src/highfly/sf20_two_source_effects';
import {installSf21ThreeNative} from '../src/highfly/sf21_three_complex_source';
import {installSf22ThreeNative} from '../src/highfly/sf22_three_original_compat';
import {installSf23ThreeNative} from '../src/highfly/sf23_three_native_fusions';
import {installSf24ThreeNative} from '../src/highfly/sf24_hunter_druid_three_native';
import {installSf25TwoNative} from '../src/highfly/sf25_shaman_warlock_two_native';
import {installSf26FiveNative} from '../src/highfly/sf26_five_native_wave_a';
import {SF27_IDS,installSf27FinalFive} from '../src/highfly/sf27_final_five_native';
const installed:string[]=[];
beforeAll(()=>{
 expect(Object.keys(ABILITIES).filter(x=>x.startsWith('hf_'))).toHaveLength(0);
 installed.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 installed.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 installed.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 installed.push(...installSf13Compatible(ABILITIES,CLASSES));
 installed.push(...installSf14HandAdapters(ABILITIES,CLASSES));
 installed.push(...installSf15EightNative(ABILITIES,CLASSES));
 installed.push(...installSf16UniqueNative(ABILITIES,CLASSES));
 installed.push(...installSf17ThreeNative(ABILITIES,CLASSES));
 installed.push(...installSf18ThreeNative(ABILITIES,CLASSES));
 installed.push(...installSf19TwoNative(ABILITIES,CLASSES));
 installed.push(...installSf20TwoNative(ABILITIES,CLASSES));
 installed.push(...installSf21ThreeNative(ABILITIES,CLASSES));
 installed.push(...installSf22ThreeNative(ABILITIES,CLASSES));
 installed.push(...installSf23ThreeNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(48);
 installed.push(...installSf24ThreeNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(51);
 installed.push(...installSf25TwoNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(53);
 installed.push(...installSf26FiveNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(58);
 installed.push(...installSf27FinalFive(ABILITIES,CLASSES));
 expect(installed).toHaveLength(63);
 expect(new Set(installed).size).toBe(63);
});
afterAll(()=>{
 for(const id of installed){
  delete ABILITIES[id];
  const arr=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);
 }
});

function fx(d:AbilityDef):string[]{
 return [d.castFx?'castFx:'+d.castFx:null,d.projectileFx?'projectileFx:'+d.projectileFx:null,
  d.projectile?'projectile:true':null].filter((x):x is string=>x!==null);
}
function effects(d:AbilityDef):string[]{
 let e=d.effects;for(const r of d.ranks??[])if(r.level<=99)e=r.effects;
 return [...new Set(e.map(x=>x.type))];
}
const classes=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'] as const;
function roles(d:AbilityDef):string[]{
 const e=effects(d),r:string[]=[];
 for(const [role,re] of [
  ['movilidad',/charge|blink|teleport|reposition/i],
  ['sanación',/heal|resurrect|hot/i],
  ['defensa',/shield|guard|absorb|block/i],
  ['control',/stun|incapacitate|fear|root|slow/i],
  ['invocación',/summon|pet|guardian/i],
  ['área',/aoe|chain|ground/i],
  ['ataque',/strike|damage|bleed|dot|weapon/i],
  ['apoyo',/buff|imbue|aura|form/i]
 ] as const)if(e.some(x=>re.test(x)))r.push(role);
 if(d.targetMode==='position')r.push('apuntado suelo');
 return r.length?r:['utilidad'];
}
describe('SF28 original donors vs final 63 + VISUAL/PHYSICAL QA truth',()=>{
 it('inspects exact source/fused cast fields and writes 63×9 original comparison',()=>{
  const data:any[]=[];const shortlist:Record<string,any[]>={};
  for(const cls of classes){
   const originals=[...new Map(CLASSES[cls].abilities.map(id=>ABILITIES[id])
     .filter((d):d is AbilityDef=>Boolean(d&&!d.passive&&!d.hiddenFromPlayer&&!d.requiresQuest))
     .map(d=>[d.id,d])).values()];
   expect(originals.length).toBeGreaterThanOrEqual(7);
   const picks:AbilityDef[]=[],represented=new Set<string>();
   for(let i=0;i<7;i++){
    const scored=originals.filter(d=>!picks.includes(d)).map(d=>{
     const rs=roles(d);
     return {d,s:rs.filter(x=>!represented.has(x)).length*6+fx(d).length*2+
       rs.length*.25-Math.max(0,d.learnLevel-30)*.01+
       (d.specs?.length?-2:0)-(d.requiresStealth||d.requiresForm||d.requiresAuraKind?1:0)};
    }).sort((a,b)=>b.s-a.s||a.d.learnLevel-b.d.learnLevel||a.d.id.localeCompare(b.d.id));
    const best=scored[0].d;picks.push(best);for(const r of roles(best))represented.add(r);
   }
   shortlist[cls]=picks.map(d=>({id:d.id,name:d.name,roles:roles(d),fx:fx(d)}));
   for(const spec of HIGHFLY_FUSED_SKILLS[cls]){
    const current=ABILITIES[spec.id];expect(current,spec.id).toBeDefined();
    const donors=spec.donors.map(id=>ABILITIES[id]);expect(donors.every(Boolean)).toBe(true);
    const originalFx=[...new Set(donors.flatMap(fx))];
    const currentFx=fx(current);
    const originalKinds=[...new Set(donors.flatMap(effects))],currentKinds=effects(current);
    const missing=originalKinds.filter(x=>!currentKinds.includes(x));
    const warnings:string[]=[];
    if(missing.length)warnings.push('Sin array de efecto 1:1, comprobar hooks nativos en Sim');
    if(originalFx.some(x=>!currentFx.includes(x)))warnings.push('Cues originales no heredados explícitamente, revisar eventos dinámicos y renderer');
    if(donors.some(d=>d.targetMode!==current.targetMode||d.requiresTarget!==current.requiresTarget))
      warnings.push('Contrato de puntería distinto');
    if(donors.some(d=>d.specs?.length))warnings.push('Donantes con especialización original');
    if(donors.some(d=>d.channel||d.requiresOutOfCombat||d.requiresStealth))
      warnings.push('Verificar canalización, combate y/o sigilo');
    data.push({id:spec.id,classId:cls,slot:spec.slot,unlockLevel:spec.unlockLevel,
      name:spec.name,donors:spec.donors,sourceEffects:originalKinds,
      fusionEffects:currentKinds,missingDirectEffects:missing,
      sourceFx:originalFx,fusionFx:currentFx,
      sourceCast:donors.map(d=>({id:d.id,castTime:d.castTime,cooldown:d.cooldown})),
      currentCast:{castTime:current.castTime,cooldown:current.cooldown},
      warnings,risk:missing.length>1||warnings.length>2?'ALTA':warnings.length>0?'MEDIA':'NORMAL',
      visualQA:'PENDIENTE',physicalS23QA:'PENDIENTE'});
   }
  }
  expect(data).toHaveLength(63);
  expect(new Set(data.map(x=>x.id)).size).toBe(63);
  expect(Object.keys(shortlist)).toHaveLength(9);
  const summary={nativeSimCertifications:63,classCount:9,
    originalsPerClassCandidate:7,visualVerified:0,physicalSamsungS23Verified:0,
    publishedOnPages:false,
    disclaimer:'Read-only static comparison. VFX properties and source effects are NOT rendered visual proof. Original shortlist heuristic, NOT final winner.'};
  const folder=join(process.cwd(),'..','highfly-sf28-compare');
  mkdirSync(folder,{recursive:true});
  writeFileSync(join(folder,'auditoria-63-fusiones-vs-originales.json'),
    JSON.stringify({summary,skills:data,candidateSevenOriginals:shortlist},null,2));
  const md=[
   '# HIGHFLY SF28 — Comparación REAL del catálogo de 63',
   '',
   '**Certificación técnica: 63/63 SF27 GREEN. VFX visibles: pendiente. S23 físico: pendiente.**',
   '',
   'Los siete originales propuestos por clase son una PRESELECCIÓN HEURÍSTICA basada en cobertura de mecánicas y cues explícitos; NO se afirma que sean visualmente superiores ni mejores en juego.',
   '',
   'Las ausencias de tipos de efecto en el array pueden resolverse por adaptadores source-native. Requieren revisar eventos y capturas. Nada de esto altera el juego ni publica a Pages.',
   ''
  ];
  for(const cls of classes){
   md.push('## '+cls,'',
    '**7 originales candidatos:** '+shortlist[cls].map(x=>x.name+' ('+x.id+')').join(' · '),'',
    '| LV | Fusión | Donantes originales | Tipos sin correspondencia 1:1 | FX donantes → fusión | Riesgo |',
    '|---:|---|---|---|---|---|');
   for(const s of data.filter(x=>x.classId===cls)){
    md.push('| '+s.unlockLevel+' | '+s.name+' | '+s.donors.join(' + ')+
     ' | '+(s.missingDirectEffects.join(', ')||'Ninguno')+
     ' | '+(s.sourceFx.join(', ')||'(dinámicos)')+' → '+
       (s.fusionFx.join(', ')||'(dinámicos)')+' | '+s.risk+' |');
   }
   md.push('');
  }
  md.push('## Próximas verificaciones','',
   '1. Video real para cada clase: 7 skills fusionadas frente a 7 originales, mismas condiciones.',
   '2. Revisar mecánica, gesto, cámara, retícula, impacto, persistencia de auras y VFX por evento.',
   '3. REUSE FIRST: copiar los VFX/audio/clips originales sólo si las señales Sim coinciden.',
   '4. Comparar balance en LV1/30/99 y jugabilidad táctil Android S23 Ultra horizontal.',
   '5. Elegir las 7 definitivas por clase; sin decisión automática.',
   '');
  writeFileSync(join(folder,'auditoria-63-fusiones-vs-originales.md'),md.join('\n'));
  console.log('HF_SF28_FULL_63_VS_SOURCE_CANDIDATE_SEVEN_VFX_TRUTH_REPORT_GREEN=1');
 },30000);
});
