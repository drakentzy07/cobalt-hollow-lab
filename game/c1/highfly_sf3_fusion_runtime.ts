/** SF3 LAB: fuse donor mechanics using the original combat Sim, never a second engine. */
import type { AbilityDef } from '../sim/types';
import { HIGHFLY_FUSED_SKILLS, type HighflyClass } from './sf3_skill_catalog';

const ADDITIVE = new Set(['directDamage','dot','slow','stun','sunder','absorb','heal','aoeDamage','aoeHeal']);
function cappedRider<E extends {type:string}>(effect:E):E {
  const copy={...effect} as E & { min?:number;max?:number;total?:number;amount?:number;duration?:number };
  if(['directDamage','aoeDamage','heal','aoeHeal'].includes(effect.type)){
    if(typeof copy.min==='number')copy.min=Math.max(1,Math.round(copy.min*0.3));
    if(typeof copy.max==='number')copy.max=Math.max(1,Math.round(copy.max*0.3));
  }
  if(effect.type==='dot'&&typeof copy.total==='number')copy.total=Math.max(1,Math.round(copy.total*0.3));
  if(effect.type==='absorb'&&typeof copy.amount==='number')copy.amount=Math.max(1,Math.round(copy.amount*0.3));
  if(effect.type==='stun'&&typeof copy.duration==='number')copy.duration=Math.min(copy.duration,1);
  return copy;
}
function effectsAt(def:AbilityDef,level:number):AbilityDef['effects'] {
  let result=def.effects;
  for(const rank of def.ranks??[])if(level>=rank.level)result=rank.effects;
  return result;
}
export interface HighflyFusionAudit {
  total:number; nativeFusionCount:number; additiveCombos:number;
  needsSpecialHandling:string[];
}
export function installHighflySF3Fusions(
  abilities:Record<string,AbilityDef>,
  classDefs:Record<HighflyClass,{abilities:string[]}>,
):HighflyFusionAudit {
  const issues:string[]=[];
  let added=0;
  const specials:string[]=[];
  for(const specs of Object.values(HIGHFLY_FUSED_SKILLS))for(const spec of specs){
    if(abilities[spec.id])throw Error('SF3 duplicate '+spec.id);
    const donors=spec.donors.map(id=>abilities[id]);
    if(donors.some(x=>!x)){
      issues.push(spec.id+': missing '+spec.donors.filter(id=>!abilities[id]).join(','));
      continue;
    }
    const primary=donors[0]!;
    const second=donors[1]!;
    const levels=new Set<number>([spec.unlockLevel]);
    for(const d of donors)for(const rank of d!.ranks??[])
      if(rank.level>spec.unlockLevel)levels.add(rank.level);
    const snapshots=[...levels].sort((a,b)=>a-b).map(level=>{
      const base=[...(effectsAt(primary,level)??[])];
      const baseKinds=new Set(base.map(e=>e.type));
      const riders:typeof base=[];
      const sameTargetMode=primary.requiresTarget===second.requiresTarget &&
        (primary.targetType??'enemy')===(second.targetType??'enemy') &&
        (primary.targetMode??'entity')===(second.targetMode??'entity');
      if(sameTargetMode){
        for(const effect of effectsAt(second,level)??[]){
          if(!ADDITIVE.has(effect.type))continue;
          if(baseKinds.has(effect.type) &&
             effect.type!=='directDamage' && effect.type!=='aoeDamage')continue;
          riders.push(cappedRider(effect));
          if(riders.length>=2)break;
        }
      }
      return {level,effects:[...base,...riders],combined:riders.length>0};
    });
    const combined=snapshots.some(x=>x.combined);
    if(!combined)specials.push(spec.id);
    const def:AbilityDef={
      ...primary,id:spec.id,name:spec.name,class:spec.classId,
      learnLevel:spec.unlockLevel,
      description:'HIGHFLY '+spec.name+'. Donantes: '+spec.donors.join(' + ')+
        '. '+(combined?'Efectos nativos fusionados.':'Requiere adaptador especifico para su segundo efecto.'),
      specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
      requiresQuest:undefined,hiddenFromPlayer:false,passive:false,
      cooldown:Math.max(primary.cooldown,spec.ultimate?25:5),
      effects:snapshots[0]?.effects??primary.effects,
      ranks:snapshots.slice(1).map((snap,i)=>({
        rank:i+2,level:snap.level,
        cost:primary.ranks?.filter(rank=>rank.level<=snap.level).at(-1)?.cost??primary.cost,
        effects:snap.effects??[],
      })),
    };
    abilities[spec.id]=def;
    if(!classDefs[spec.classId].abilities.includes(spec.id))
      classDefs[spec.classId].abilities.push(spec.id);
    added++;
  }
  if(issues.length)throw Error('SF3 invalid donor definitions: '+issues.join(' | '));
  return {total:Object.values(HIGHFLY_FUSED_SKILLS).reduce((n,a)=>n+a.length,0),
    nativeFusionCount:added,additiveCombos:added-specials.length,needsSpecialHandling:specials};
}
