/**
 * HIGHFLY FURY F4 — original nine-class ability inventory adapter.
 * The HOST supplies native CLASSES/abilitiesKnownAt metadata. We enumerate
 * original abilities without cloning / rewriting native class declarations.
 */
import { deriveFuryNativeVisual } from './native_visual_registry.ts';
import type { FuryNativeAbility,FuryVisualOverride,FuryVisualMapping } from './native_visual_registry.ts';

export const FURY_NINE_CLASSES = [
  'warrior','paladin','hunter','rogue','priest',
  'shaman','mage','warlock','druid',
] as const;
export type FuryNativeClass = (typeof FURY_NINE_CLASSES)[number];
export interface FuryNativeClassKit {
  readonly id:string;
  /** Native learned abilities including spec/talent resolution if available. */
  readonly abilities:readonly string[];
}
export interface FuryNativeAbilityEntry {
  readonly abilityId:string;
  readonly classId:FuryNativeClass;
  readonly ability:FuryNativeAbility|null;
  readonly visual:FuryVisualMapping|null;
  readonly status:'visual-ready'|'native-targeted'|'no-visual'|'unknown-id'|'passive';
}
export interface FuryNativeClassReport {
  readonly classId:FuryNativeClass;
  readonly registered:number;
  readonly visuals:number;
  readonly unknown:number;
  readonly abilities: readonly FuryNativeAbilityEntry[];
}
export interface FuryNineClassReport {
  readonly complete:boolean;
  readonly classes:readonly FuryNativeClassReport[];
  readonly missingClasses:readonly FuryNativeClass[];
  readonly totalNativeAbilities:number;
  readonly totalVisuals:number;
  readonly missingDefinitions:number;
}
export function buildFuryNineClassCatalog(
  kits: readonly FuryNativeClassKit[],
  defs: ReadonlyMap<string,FuryNativeAbility>,
  visualOverrides:Readonly<Record<string,FuryVisualOverride>>={},
):FuryNineClassReport {
  const byClass=new Map<string,FuryNativeClassKit>();
  for(const c of kits){
    if(!byClass.has(c.id))byClass.set(c.id,c);
  }
  const missingClasses=FURY_NINE_CLASSES.filter(c=>!byClass.has(c));
  const reports:FuryNativeClassReport[]=FURY_NINE_CLASSES.map(classId=>{
    const ids=[...new Set(byClass.get(classId)?.abilities??[])];
    const entries:FuryNativeAbilityEntry[]=ids.map(abilityId=>{
      const ability=defs.get(abilityId)??null;
      if(!ability)return {abilityId,classId,ability:null,visual:null,status:'unknown-id'};
      const visual=deriveFuryNativeVisual(ability,visualOverrides);
      const status:FuryNativeAbilityEntry['status']=ability.passive
        ?'passive':visual?'visual-ready':ability.requiresTarget?'native-targeted':'no-visual';
      return {abilityId,classId,ability,visual,status};
    });
    return {classId,registered:entries.length,
      visuals:entries.filter(e=>e.visual!==null).length,
      unknown:entries.filter(e=>e.ability===null).length,
      abilities:entries};
  });
  return {complete:missingClasses.length===0 && reports.every(r=>r.unknown===0),
    classes:reports,missingClasses,
    totalNativeAbilities:reports.reduce((n,r)=>n+r.registered,0),
    totalVisuals:reports.reduce((n,r)=>n+r.visuals,0),
    missingDefinitions:reports.reduce((n,r)=>n+r.unknown,0)};
}

/** Find visual only when the ability still belongs to THIS resolved native kit. */
export function findFuryClassVisual(
  report:FuryNineClassReport,
  classId:FuryNativeClass,
  abilityId:string,
):FuryVisualMapping|null {
  return report.classes.find(c=>c.classId===classId)
    ?.abilities.find(e=>e.abilityId===abilityId)?.visual ??null;
}
