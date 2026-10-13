/**
 * SF11 — exact 63/63 ORIGINAL SOURCE-DONOR INSPECTION.
 * READ-ONLY PREVIEW: never say all 63 are fused/usable; only 13 have
 * actually passed native Sim effect tests. Output offline HTML + JSON +
 * printable Markdown for future human design & QA, not the live game.
 *
 * This fails closed if any recipe/donor/class changes. It does NOT bypass
 * form/stealth/spec/target restrictions or fabricate VFX/audio validation.
 */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import type {AbilityDef,PlayerClass} from '../src/sim/types';
import {ABILITIES,CLASSES} from '../src/sim/content/classes';
import {HIGHFLY_FUSED_SKILLS,HIGHFLY_PASSIVES} from '../src/highfly/sf3_skill_catalog';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';
import {installSf10NativeExpansion} from '../src/highfly/sf10_three_native_reuses';

const LANG:Record<string,string>={
 warrior:'Guerrero',paladin:'Paladín',hunter:'Cazador',rogue:'Pícaro',
 priest:'Sacerdote',shaman:'Chamán',mage:'Mago',warlock:'Brujo',druid:'Druida'
};
const EXPECTED=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
type SourceInfo={
 id:string;school:string;effects:string[];target:string;range:number;
 minRange:number;castTime:number;cooldown:number;
 restrictions:string[];visualCues:string[];
};
type Row={
 id:string;cls:string;name:string;slot:number;unlock:number;
 state:'NATIVA_EN_SIM'|'SOLO_DISENO';
 aim:string;donors:SourceInfo[];effectsAt99:string[];
 knownSourceRisks:string[];visualQA:'PENDIENTE';physicalS23QA:'PENDIENTE';
};
function effectsAt(d:AbilityDef,lv:number):AbilityDef['effects']{
 let effects=d.effects;
 for(const r of d.ranks??[])if(r.level<=lv)effects=r.effects;
 return effects;
}
function sourceData(d:AbilityDef):SourceInfo{
 const restrictions:string[]=[];
 if(d.specs?.length)restrictions.push('Especialización original: '+d.specs.join('/'));
 if(d.excludeSpecs?.length)restrictions.push('Excluye specs: '+d.excludeSpecs.join('/'));
 if(d.hiddenFromPlayer)restrictions.push('Oculta en ClaudeCraft');
 if(d.passive)restrictions.push('Pasiva; sin lanzamiento directo');
 if(d.requiresForm)restrictions.push('Requiere forma: '+d.requiresForm);
 if(d.requiresStealth)restrictions.push('Requiere sigilo');
 if(d.requiresOutOfCombat)restrictions.push('Fuera de combate');
 if(d.onNextSwing)restrictions.push('Ataque preparado al siguiente golpe');
 if(d.maxCharges)restrictions.push('Sistema de cargas '+d.maxCharges);
 if(d.channel)restrictions.push('Canalización');
 if(d.requiresQuest)restrictions.push('Misión requerida');
 if(d.actionReplacement)restrictions.push('Reemplazo de acción');
 if(d.offGcd)restrictions.push('Fuera del GCD');
 if(d.requiresShield)restrictions.push('Requiere escudo');
 if(d.requiresAuraKind)restrictions.push('Requiere aura específica');
 const cues:string[]=[];
 if(d.castFx)cues.push('castFx:'+d.castFx);
 if(d.projectileFx)cues.push('projectileFx:'+d.projectileFx);
 if(d.projectile)cues.push('projectile:true');
 if(d.school)cues.push('school:'+d.school);
 return {
  id:d.id,school:d.school,effects:[...new Set(effectsAt(d,99).map(x=>x.type))],
  target:d.targetMode==='position'?'suelo/posición':d.requiresTarget?(d.targetType??'enemigo'):'propio/sin objetivo',
  range:d.range,minRange:d.minRange??0,castTime:d.castTime,cooldown:d.cooldown,
  restrictions,visualCues:cues
 };
}
function inferAim(d:AbilityDef[]):string {
 const targetModes=new Set(d.map(x=>x.targetMode==='position'?'zona':x.requiresTarget?(x.targetType??'enemigo'):'propio'));
 if(targetModes.has('zona'))return 'ÁREA / RETÍCULA: revisar combinación';
 if(targetModes.size>1)return 'MIXTO: requiere adaptador de objetivo';
 if(targetModes.has('friendly'))return 'ALIADO / AUTOCURACIÓN';
 if(targetModes.has('any'))return 'ALIADO O ENEMIGO / según efecto';
 if(targetModes.has('propio'))return 'PERSONAL / SIN PUNTERÍA';
 return 'ENEMIGO: automático o arrastre manual';
}
function classifyRisks(d:AbilityDef[],id:string):string[]{
 const risks=d.flatMap(x=>sourceData(x).restrictions.map(r=>x.id+': '+r));
 const target=new Set(d.map(x=>[x.targetMode??'entity',x.targetType??(x.requiresTarget?'enemy':'self'),String(x.requiresTarget)].join('/')));
 if(target.size>1)risks.push('Donantes con objetivos diferentes: adaptador obligatorio');
 if(d.some(x=>!x.effects.length))risks.push('Donante procedimental sin efectos directos: requiere ruta nativa específica');
 if(d.some(x=>x.effects.some(e=>['summon','transform','stance','blinkForward','hunterTrailbreak','groundAura','trap','charge'].includes(e.type))))
  risks.push('Movimiento/invocación/forma/posición: comprobar flujo original completo');
 if(id==='hf_druid_u1')risks.push('CONTRATO INCOHERENTE: los donantes resucitan, pero el diseño habla de ataque de área');
 return [...new Set(risks)];
}
function escapeHtml(t:string):string{return t.replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]??x));}
const installed:string[]=[];
beforeAll(()=>{
 if(Object.keys(ABILITIES).some(k=>k.startsWith('hf_')))
  throw Error('SF11 requires isolated clean ClaudeCraft registry, not a production mutation');
 installed.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 installed.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 expect(installed).toHaveLength(13);
});
afterAll(()=>{
 for(const id of installed){
  delete ABILITIES[id];
  const cls=id.split('_')[1] as PlayerClass;
  const ix=CLASSES[cls].abilities.indexOf(id);
  if(ix>=0)CLASSES[cls].abilities.splice(ix,1);
 }
});
describe('SF11 all 63 designs inspected against exact original donor engine — no counterfeit fused skills',()=>{
 it('inspects every actual donor, nine 7-slot kits, 27 passives and emits internal QA report',()=>{
  const recipes=Object.values(HIGHFLY_FUSED_SKILLS).flat();
  expect(recipes).toHaveLength(63);
  expect(Object.keys(HIGHFLY_FUSED_SKILLS)).toEqual(EXPECTED);
  expect(Object.keys(CLASSES)).toHaveLength(9);
  const passives=Object.values(HIGHFLY_PASSIVES).flat();
  expect(passives).toHaveLength(27);
  const rows:Row[]=[];
  for(const cls of EXPECTED){
    const skills=HIGHFLY_FUSED_SKILLS[cls as PlayerClass];
    expect(skills).toHaveLength(7);
    expect(skills.map(x=>x.slot)).toEqual([1,2,3,4,5,6,7]);
    expect(skills.map(x=>x.unlockLevel)).toEqual([1,5,10,15,20,25,30]);
    for(const spec of skills){
      const original=spec.donors.map(id=>ABILITIES[id]);
      expect(original.length).toBeGreaterThanOrEqual(2);
      expect(original.every(d=>d?.class===spec.classId),spec.id+' missing/wrong-class original source').toBe(true);
      const donors=original as AbilityDef[];
      const integrated=installed.includes(spec.id);
      const actual=integrated?ABILITIES[spec.id]:undefined;
      expect(Boolean(actual),spec.id+' implementation status mismatch').toBe(integrated);
      const risks=classifyRisks(donors,spec.id);
      rows.push({id:spec.id,cls:spec.classId,name:spec.name,slot:spec.slot,unlock:spec.unlockLevel,
       state:integrated?'NATIVA_EN_SIM':'SOLO_DISENO',
       aim:inferAim(actual?[actual]:donors),
       donors:donors.map(sourceData),
       effectsAt99:actual?[...new Set(effectsAt(actual,99).map(e=>e.type))]:[],
       knownSourceRisks:risks,
       visualQA:'PENDIENTE',physicalS23QA:'PENDIENTE'});
    }
  }
  expect(rows).toHaveLength(63);
  expect(new Set(rows.map(r=>r.id)).size).toBe(63);
  expect(rows.filter(r=>r.state==='NATIVA_EN_SIM')).toHaveLength(13);
  expect(rows.filter(r=>r.state==='SOLO_DISENO')).toHaveLength(50);
  expect(rows.filter(r=>r.effectsAt99.length>0)).toHaveLength(13);
  const summary={
   generated:'GitHub Actions SF11 isolated original ClaudeCraft source-inspection',
   actualFusedSkills:13,donorInspectedRecipes:63,designOnly:50,
   classCount:9,passiveDesignCount:27,
   visualCertified:0,physicalSamsungS23Certified:0,
   bossLv99WithFusedKitsCertified:false,
   publicDeploy:false,
   warning:'No confundir inspección de donantes con skills fusionadas ni VFX probados',
  };
  const out=join(process.cwd(),'..','highfly-sf11-internal-audit');
  mkdirSync(out,{recursive:true});
  writeFileSync(join(out,'catalogo-63-interno.json'),JSON.stringify({summary,rows,passives:HIGHFLY_PASSIVES},null,2));
  const md:string[]=[
   '# HIGHFLY SF11 — Inspección interna de las 63 skills',
   '', '**IMPORTANTE:** 13 fusiones nativas verificadas por pruebas Sim; otras 50 siguen como diseño. Aquí se auditan las 63 recetas y sus donantes originales, NO se declaran 63 skills jugables.',
   '', 'No se hizo deploy ni se certificaron VFX/sonidos/smartphone físico.',
   '',...Object.entries(LANG).flatMap(([cl,label])=>[
      '## '+label,'',
      '| LV | Skill HIGHFLY | Estado | Donantes | Efectos reales de la fusión | Riesgos/detalles |',
      '|---|---|---|---|---|---|',
      ...rows.filter(r=>r.cls===cl).map(r=>
       '| '+r.unlock+' | '+r.name+' | '+(r.state==='NATIVA_EN_SIM'?'13 nativas: en Sim':'Diseño: no jugable')+
       ' | '+r.donors.map(d=>d.id).join(' + ')+' | '+(r.effectsAt99.join(', ')||'pendiente')+
       ' | '+(r.knownSourceRisks.join('; ')||'Sin bloqueo estructural básico identificado')+' |'),
      ''
   ]),
   '## Estado global','',
   '13/63 mecánicas reales, 50/63 diseño únicamente, 0/63 presentación visual definitiva certificada.',
   'Próximo trabajo: adaptadores de las 50, kits fusionados contra Capitán LV99, VFX/audio con capturas y QA en S23 Ultra.',
  ];
  writeFileSync(join(out,'inspeccion-63-para-anotar.md'),md.join('\n'));
  const cards=rows.map(r=>`<details class="item ${r.state==='NATIVA_EN_SIM'?'native':'design'}" data-cls="${escapeHtml(r.cls)}" data-state="${escapeHtml(r.state)}"><summary>
    <span class="slot">S${r.slot}</span><span class="title">${escapeHtml(r.name)}</span><small>LV ${r.unlock}</small>
    <span class="status">${r.state==='NATIVA_EN_SIM'?'MECÁNICA EN SIM':'SOLO DISEÑO'}</span></summary>
    <div class="info"><p><b>Donantes originales:</b> ${r.donors.map(d=>escapeHtml(d.id)).join(' + ')}</p>
    <p><b>Apuntado:</b> ${escapeHtml(r.aim)}</p>
    <p><b>Efectos fusionados verificados:</b> ${escapeHtml(r.effectsAt99.join(', ')||'Ninguno implementado aún')}</p>
    <p><b>Restricciones / adaptadores:</b> ${escapeHtml(r.knownSourceRisks.join(' · ')||'Auditoría de integración aún necesaria')}</p>
    ${r.donors.map(d=>`<p><small>${escapeHtml(d.id)} · ${escapeHtml(d.school)} · ${escapeHtml(d.effects.join('/'))} · ${escapeHtml(d.target)} · ${d.range} yd · cues originales: ${escapeHtml(d.visualCues.join(', ')||'sin metadata')}</small></p>`).join('')}
    <p><b>VFX / sonido definitivo:</b> PENDIENTE &nbsp; · &nbsp; <b>Samsung S23 Ultra:</b> PENDIENTE</p></div>
    </details>`).join('\n');
  const html=`<!doctype html><html lang="es"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>HIGHFLY 63 — QA interno</title>
<style>:root{color-scheme:dark}body{margin:0;background:#101522;color:#e7ecf8;font:15px/1.5 system-ui,Arial}.wrap{max-width:1120px;margin:auto;padding:30px 18px}header{padding:22px;border:1px solid #34435d;background:#182238;border-radius:14px}h1{margin:0 0 6px;font-size:28px}h2{margin:24px 0 8px;color:#dde8ff}.risk{background:#352c25;border-left:4px solid #f6c469;padding:12px;margin:18px 0}.metrics{display:flex;gap:12px;flex-wrap:wrap}.metric{padding:13px;background:#202b43;border-radius:10px;min-width:126px}.metric b{font-size:25px;display:block}.filter{padding:12px;background:#202b43;color:#fff;border-radius:8px;border:1px solid #60728a;margin:7px}.item{margin:8px 0;background:#182136;border:1px solid #34425b;border-radius:9px}.item.native{border-left:4px solid #60c895}.item.design{border-left:4px solid #b1a66d}.item summary{display:flex;align-items:center;gap:10px;flex-wrap:wrap;cursor:pointer;padding:12px 15px}.slot{background:#2d3b57;padding:3px 7px;border-radius:5px}.title{font-weight:650;flex:1}.status{font-size:11px;letter-spacing:.02em;font-weight:700;color:#a8e6cd}.design .status{color:#e6d49f}.info{padding:4px 17px 16px;border-top:1px solid #34425b}.info p{margin:10px 0}small{color:#a7b7d2}footer{margin-top:30px;color:#a7b7d2}</style>
<div class="wrap"><header><h1>HIGHFLY · Laboratorio interno de las 63 skills</h1><div>63 recetas auditadas · nueve clases originales · sin despliegue público</div>
<div class="metrics"><div class="metric"><b>63/63</b>donantes auditados</div><div class="metric"><b>13/63</b>fusiones nativas</div><div class="metric"><b>50</b>sólo diseño</div><div class="metric"><b>0/63</b>VFX finales aprobados</div></div>
<div class="risk"><b>Esto es un inspector de diagnóstico, NO 63 habilidades jugables.</b> Las fichas sin implementación muestran las capacidades disponibles en los donantes. No simulan efectos HIGHFLY inexistentes.</div>
<label>Filtrar clase <select id="cls" class="filter"><option value="">Todas</option>${Object.entries(LANG).map(([k,v])=>`<option value="${k}">${escapeHtml(v)}</option>`).join('')}</select></label>
<label>Estado <select id="state" class="filter"><option value="">Todos</option><option value="NATIVA_EN_SIM">Nativas</option><option value="SOLO_DISENO">Por implementar</option></select></label></header>
${Object.entries(LANG).map(([cl,label])=>`<section data-class-section="${cl}"><h2>${escapeHtml(label)}</h2>${rows.filter(r=>r.cls===cl).map(r=>cards.split('\n').find(x=>x.includes('data-cls="'+cl+'"')&&x.includes('>'+escapeHtml(r.name)+'</span>'))||'').join('\n')}</section>`).join('\n')}
<footer>HIGHFLY SF11 • original ClaudeCraft v0.44.0 • contrato de diseño, no licencia visual ni QA físico. 27 pasivas diseñadas fuera de las 63 activas.</footer></div>
<script>const sel=document.getElementById('cls'),status=document.getElementById('state');function filter(){document.querySelectorAll('.item').forEach(e=>{e.hidden=!!((sel.value&&e.dataset.cls!==sel.value)||(status.value&&e.dataset.state!==status.value))});document.querySelectorAll('[data-class-section]').forEach(s=>{s.hidden=!Array.from(s.querySelectorAll('.item')).some(x=>!x.hidden)})}sel.addEventListener('change',filter);status.addEventListener('change',filter);</script></html>`;
  writeFileSync(join(out,'inspector-63-interno.html'),html);
  console.info('HF_SF11_INTERNAL_63_DONOR_QA='+JSON.stringify(summary));
  console.info('HF_SF11_INTERNAL_REPORT_ARTIFACT=highfly-sf11-internal-audit/');
  expect(rows.reduce((n,r)=>n+r.donors.length,0)).toBeGreaterThanOrEqual(126);
 },30000);
});
