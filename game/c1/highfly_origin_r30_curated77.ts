/** R30 playtest manifest — reviewed original IDs, NOT a claim of 77 certified.
 * Native entries have no prerequisite buffs, stealth, execute windows, pets,
 * combo-spend, class restriction or old rage/focus/ruin spending requirement.
 * 23 source effects retained, including 9 explicitly blocked unfinished ones.
 * These are trial selections, not permanent player unlocks.
 */
import { ABILITIES } from './content/classes';
import { originCostDecision } from './highfly_origin_universal_resources';
import { R27_PREMIUM_23 } from './highfly_origin_r27_premium23_catalog';
import { R29_PREMIUM_CONTRACTS } from './highfly_origin_r29_premium_native';

/** Ordered choices, not unconditional enrollment: inspect final assembled ABILITIES.
 * Backups are deliberately explicit, never silently pull an arbitrary spell.
 * None of the originals is modified, unhidden or forced through casting gates.
 */
export const R30_PREFERRED_BY_SCHOOL = {
 warrior:['thunder_clap','whirlwind','heroic_leap','mortal_strike','storm_bolt'],
 paladin:['hammer_of_grace','dawnfall','holy_shock','consecration','final_edict'],
 hunter:['arcane_shot','volley','concussive_shot','frostjaw_trap','shrapnel_charge'],
 rogue:['sinister_strike','venom_dart','gouge','hemorrhage','crippling_poison'],
 priest:['smite','shadow_word_pain','mind_blast','holy_nova','scouring_mercy'],
 shaman:['lightning_bolt','lava_burst','thunderstorm','earthquake','frost_shock'],
 mage:['fireball','frostbolt','blizzard','flamestrike','cone_of_cold'],
 warlock:['shadow_bolt','immolate','corruption','soul_lance','curse_of_agony'],
 druid:['wrath','moonfire','entangling_roots','hurricane','starfire'],
} as const;

type R30School=keyof typeof R30_PREFERRED_BY_SCHOOL;
const BACKUPS: Record<R30School,readonly string[]>={
 warrior:['faultline','cleave','hamstring','revenge','bladestorm','overpower','slam','bloodthirst'],
 paladin:['solar_invocation','hammer_of_wrath','mercy_lance','vowkeeper_strike','exorcism','crusader_strike'],
 hunter:['serpent_sting','raptor_strike','wing_clip','aimed_shot','mongoose_bite','rapid_fire'],
 rogue:['backstab','garrote','cheap_shot','kick'],
 priest:['mind_flay'],
 shaman:['earth_shock','flame_shock','stormstrike'],
 mage:['fire_blast','arcane_explosion','meteor','arcane_missiles','pyroblast','ice_lance','flurry'],
 warlock:['searing_pain','siphon_life','corpse_explosion','conflagrate'],
 druid:['insect_swarm','moonlash','sunlance'],
};
const R30_OFFENSIVE_EFFECTS=new Set([
 'directDamage','aoeDamage','groundAoE','weaponStrike','weaponDamage',
 'projectileDamage','dot','drainTick','frostjawTrap','hunterShrapnel',
 'root','stun','incapacitate','slow',
]);
const R30_CONDITIONAL_KEYS=[
 'requiresStealth','requiresForm','requiresAuraKind','requiresTargetHpBelow',
 'requiresShield','requiresQuest','requiresBehind','requiresPet',
 'spendsCombo','spendsAllResource','onNextSwing','devotionCost',
 'ruinCost','soulFragmentCost'
] as const;

/** Static, fail-closed preflight for the REAL post-overlay native registry.
 * Does not claim the rendered animation/VFX is verified: that needs browser QA.
 */
export function r30AdmissionReasons(id:string,school:R30School):string[]{
 const d=ABILITIES[id];
 if(!d)return ['missingDefinition'];
 const problems:string[]=[];
 if(d.class!==school)problems.push('wrongSchool:'+d.class);
 if(d.hiddenFromPlayer)problems.push('hiddenFromPlayer');
 if(d.passive)problems.push('passive');
 const extra=d as unknown as Record<string,unknown>;
 for(const k of R30_CONDITIONAL_KEYS)if(extra[k])problems.push(k);
 // Future engine requirements are not silently ignored.
 for(const k of Object.keys(extra))
  if(k.startsWith('requires')&&!['requiresTarget',...R30_CONDITIONAL_KEYS].includes(k) && extra[k])
   problems.push('unreviewedGate:'+k);
 if(d.targetType==='friendly')problems.push('friendlyTargetOnly');
 if(d.effects.length===0)problems.push('noNativeEffects');
 else if(!d.effects.some(e=>R30_OFFENSIVE_EFFECTS.has(e.type)))
  problems.push('noOffensiveOrControlEffect');
 const cost=originCostDecision(d);
 if(!cost.ok)problems.push('resourceNotUnified:'+cost.reason);
 return [...new Set(problems)];
}
function curateSchool(school:R30School):string[]{
 const choices=[...R30_PREFERRED_BY_SCHOOL[school],...BACKUPS[school]];
 const chosen:string[]=[];
 for(const id of choices)
  if(!chosen.includes(id)&&r30AdmissionReasons(id,school).length===0){
   chosen.push(id);
   if(chosen.length===5)break;
  }
 return chosen;
}
export const R30_ORIGINAL_BY_SCHOOL: Record<R30School,readonly string[]>={
 warrior:curateSchool('warrior'),paladin:curateSchool('paladin'),
 hunter:curateSchool('hunter'),rogue:curateSchool('rogue'),
 priest:curateSchool('priest'),shaman:curateSchool('shaman'),
 mage:curateSchool('mage'),warlock:curateSchool('warlock'),
 druid:curateSchool('druid'),
};
export const R30_ORIGINAL_45:readonly string[]=Object.values(R30_ORIGINAL_BY_SCHOOL).flat();

export const R30_PREMIUM_23:readonly string[]=R27_PREMIUM_23.map(c=>c.id);

/** Proposed, not yet granted passives. Needs real Sim integration and QA.
 * Passive design is intentionally unconditional; mastery unlock is separate.
 */
export const R30_PASSIVE_DESIGNS = [
 {id:'hf_passive_warrior_resolve',school:'warrior',name:'Temple de Acero',stat:'physicalDamagePct',value:0.04},
 {id:'hf_passive_paladin_grace',school:'paladin',name:'Gracia Radiante',stat:'damageReductionPct',value:0.03},
 {id:'hf_passive_hunter_precision',school:'hunter',name:'Precision del Cazador',stat:'rangedDamagePct',value:0.04},
 {id:'hf_passive_rogue_footwork',school:'rogue',name:'Paso del Asesino',stat:'movementSpeedPct',value:0.04},
 {id:'hf_passive_priest_devotion',school:'priest',name:'Voluntad Interior',stat:'spellDamagePct',value:0.04},
 {id:'hf_passive_shaman_resonance',school:'shaman',name:'Resonancia Elemental',stat:'natureDamagePct',value:0.04},
 {id:'hf_passive_mage_conduit',school:'mage',name:'Conductor Arcano',stat:'spellDamagePct',value:0.04},
 {id:'hf_passive_warlock_shadow',school:'warlock',name:'Afinidad Oscura',stat:'shadowDamagePct',value:0.04},
 {id:'hf_passive_druid_regrowth',school:'druid',name:'Pulso Natural',stat:'manaRegenPct',value:0.05},
] as const;
export const R30_TOTAL_DESIGN_SCOPE=R30_ORIGINAL_45.length+R30_PREMIUM_23.length+R30_PASSIVE_DESIGNS.length;

/** All requested IDs are checked, including rejected ones, in ONE pass.
 * The report deliberately separates structural checks from browser/Android QA.
 */
export function r30PreflightReport(){
 const schools=(Object.keys(R30_PREFERRED_BY_SCHOOL) as R30School[]).map(school=>{
  const candidates=[...R30_PREFERRED_BY_SCHOOL[school],...BACKUPS[school]];
  const selected=[...R30_ORIGINAL_BY_SCHOOL[school]];
  return {
   school,requested:[...R30_PREFERRED_BY_SCHOOL[school]],selected,
   rejected:candidates.filter(id=>r30AdmissionReasons(id,school).length>0).map(id=>({
    id,reasons:r30AdmissionReasons(id,school),
    category:R30_PREFERRED_BY_SCHOOL[school].includes(id as never)?'preferred':'backup'
   })),
   readyAlternates:candidates.filter(id=>!selected.includes(id)&&r30AdmissionReasons(id,school).length===0),
   replacements:selected.filter(id=>!R30_PREFERRED_BY_SCHOOL[school].includes(id as never)),
   underfilled:Math.max(0,5-selected.length)
  };
 });
 const abilities=schools.flatMap(s=>s.selected.map(id=>{
  const d=ABILITIES[id],admission=originCostDecision(d);
  const mode=d.targetMode==='position'?'GROUND':
    d.effects.some(e=>e.type==='repositionToAim')?'DASH':
    d.requiresTarget?'TARGET':d.range===0?'SELF':'DIRECTION';
  return {
   id,school:s.school,name:d.name,hidden:Boolean(d.hiddenFromPlayer),
   conditions:r30AdmissionReasons(id,s.school),
   nativeMechanics:d.effects.map(e=>e.type),
   aimMode:mode,range:d.range,castTime:d.castTime,cooldown:d.cooldown,
   resource:admission.ok?admission.pool:'BLOCKED',
   minimumLevel:d.learnLevel,
   ranksLv1to20:(d.ranks??[]).filter(r=>r.level<=20).map(r=>({level:r.level,rank:r.rank})),
   scalingLv21to99:'R30 provisional output only; no persistent native rank edits',
   animation:'not verified by static audit',
   vfx:'not verified by static audit',
   independentPreflight:true,
   independentNativeSimAndAndroid:'requires end-to-end QA'
  };
 }));
 return {
  schema:'HIGHFLY_R30_POST_OVERLAY_45_AUDIT_V1',
  source:'runtime ABILITIES after all production overlays; opt-in R30 donor worktree',
  totals:{selected:abilities.length,schools:schools.length,premium:R30_PREMIUM_23.length,
   passiveDesigns:R30_PASSIVE_DESIGNS.length},
  underfilledSchools:schools.filter(s=>s.underfilled>0).map(s=>({school:s.school,missing:s.underfilled})),
  schools,abilities,
  caveats:['Admission and costs are structural checks, not proof of an animated cast.',
    '9 pending premium behaviors and 9 passive designs are NOT playable.',
    'Do not release without native Sim/TS/browser and physical Android confirmation.']
 };
}
export function r30AuditSelected():{original:number,premium:number,passiveDesigns:number,premiumBlocked:number}{
 const report=r30PreflightReport();
 const failures:string[]=[];
 if(new Set(R30_ORIGINAL_45).size!==45||R30_PREMIUM_23.length!==23||
    R30_PASSIVE_DESIGNS.length!==9||R30_TOTAL_DESIGN_SCOPE!==77)
  failures.push('INVALID_CATALOG_COUNT:'+JSON.stringify(report.totals));
 for(const entry of report.underfilledSchools)failures.push('UNDERFILLED_'+entry.school+':'+entry.missing);
 for(const a of report.abilities)if(a.conditions.length)
  failures.push('NOT_ADMITTED_'+a.id+':'+a.conditions.join(','));
 for(const p of R30_PASSIVE_DESIGNS)
  if(p.value<=0||p.value>0.15)failures.push('BAD_PASSIVE_'+p.id);
 if(R30_PREMIUM_23.some((id,i)=>id!==R29_PREMIUM_CONTRACTS[i]?.id))
  failures.push('PREMIUM_MANIFEST_DRIFT');
 if(failures.length)throw Error('R30_BULK_AUDIT_FAILURES\n'+failures.join('\n'));
 return {original:45,premium:23,passiveDesigns:9,
   premiumBlocked:R29_PREMIUM_CONTRACTS.filter(c=>c.readiness==='visual-only-behavior-pending').length};
}
