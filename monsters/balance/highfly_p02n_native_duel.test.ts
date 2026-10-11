/** P02N — LIVE native Sim tick PvE fights: NINE classes × ALL 80 HIGHFLY 21-99
 * variants × equal-level/+5 challenge. This is a fully RUNNABLE headless
 * baseline, not a human-like AI and not a final guaranteed-win balance verdict.
 * Native mob AI/casts/affixes/kill/XP/corpse all execute each tick.
 * Never writes user saves, actual Training proof or public game.
 */
import { describe,expect,it } from 'vitest';
import { mkdirSync,writeFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { MOBS, ITEMS,ALL_RECIPES,BUILTIN_WORLD,ZONES } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { emptyZoneProps,DT, type PlayerClass, type MobTemplate } from '../src/sim/types';
import { buildHighflyMonsterRoster } from '../src/highfly/monsters/level99';
import { applyHighflyHuntRewardTables } from '../src/highfly/monsters/hunt_rewards';
import { buildHighflyHuntEncounters } from '../src/highfly/monsters/hunt_encounters';
import { createHighflyHunterProfile } from '../src/highfly/training/core';
import { applyTrainingBridge } from '../src/highfly/training/bridge';
import { requiredLevelFor } from '../src/sim/item_level_req';

const PATH='/tmp/hf-monstruos6-p02n-combat-sim';
mkdirSync(PATH,{recursive:true});
const classes:PlayerClass[]=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
const normal=applyHighflyHuntRewardTables(buildHighflyMonsterRoster(MOBS),ITEMS,ALL_RECIPES);
const special=buildHighflyHuntEncounters(normal);
const all:MobTemplate[]=[...Object.values(normal),...Object.values(special)];
// Test-runner-local registration of content; original entries are not overwritten.
// No exported code or default world mutation outside this ephemeral Vitest process.
for(const [id,m] of Object.entries({...normal,...special})){
  if(MOBS[id])throw Error('P02N_MOB_COLLISION:'+id);
  MOBS[id]=m;
}
const world={
  ...BUILTIN_WORLD,zones:[ZONES[0]],camps:[],npcs:{},groundObjects:[],
  props:emptyZoneProps(),roads:[],placements:[],blockers:[],
  terrainEdits:[],biomePaint:undefined,services:undefined,
};
const abilityOptions:Record<PlayerClass,string[]>={
 warrior:['mortal_strike','slam','heroic_strike','rend'],
 paladin:['crusader_strike','judgement','holy_strike'],
 hunter:['arcane_shot','steady_shot','serpent_sting'],
 rogue:['sinister_strike','eviscerate','backstab'],
 priest:['smite','mind_blast','shadow_word_pain'],
 shaman:['lightning_bolt','earth_shock','stormstrike'],
 mage:['fireball','frostbolt','arcane_blast'],
 warlock:['shadow_bolt','corruption','immolate'],
 druid:['wrath','moonfire','claw'],
};
type Row=Record<string,string|number|boolean>;
const rows:Row[]=[];
const shardCount=Number(process.env.HF_P02N_SHARD_COUNT??'8');
const shardIndex=Number(process.env.HF_P02N_SHARD_INDEX??'0');
if(!Number.isInteger(shardCount)||shardCount!==8||
 !Number.isInteger(shardIndex)||shardIndex<0||shardIndex>=shardCount)
 throw Error('HF_P02N_UNSAFE_SHARD_RANGE');

function runFight(cls:PlayerClass,template:MobTemplate,mobLevel:number,gap:0|5,
  trained:boolean,seed:number,seconds:number):Row {
  const level=mobLevel-gap;
  const sim=new Sim({seed,playerClass:cls,noPlayer:true,autoEquip:true,
    riftPortals:false,compulsoryTutorial:false,world});
  const pid=sim.addPlayer(cls,'P02N '+cls,{autoEquip:true,tutorialGreetingSent:true});
  sim.setPlayerLevel(level,pid);
  const hunter=sim.entities.get(pid),meta=sim.players.get(pid);
  if(!hunter||!meta)throw Error('P02N_NO_REAL_HUNTER');
  // Select native legal weapon via REAL equipping commands: never fake gear DPS.
  const gear=[...Object.values(ITEMS)]
    .filter((item:any)=>item.kind==='weapon' && item.slot==='mainhand'
      && requiredLevelFor(item)<=level && (!item.requiredClass || item.requiredClass.includes(cls))
      && item.weapon && item.quality!=='legendary')
    .sort((a:any,b:any)=>((b.weapon.min+b.weapon.max)/(2*b.weapon.speed))
      -((a.weapon.min+a.weapon.max)/(2*a.weapon.speed)));
  let weaponAdded='';
  for(const item of gear.slice(0,15)){
    try {
      sim.addItem(item.id,1,pid);
      sim.equipItem(item.id,pid);
      if(meta.equipment.mainhand===item.id){weaponAdded=item.id;break;}
    } catch {}
  }
  // These are synthetic TRAINING SENSITIVITY scenarios (not awarded points).
  // For trained cases inject only authoritative Training Bridge derived AP/HP,
  // never changing saved Core, wallet, XP, or user achievements.
  let trainingHpBonus=0,trainingApBonus=0;
  if(trained){
    const profile=createHighflyHunterProfile({
      profileId:'p02n-ephemeral-'+cls,classId:cls,level,
    });
    const core=profile.training.core;
    const synthetic=Object.fromEntries(Object.entries(core).map(([key,val])=>[
      key,{...val,trainingGrowth:(key==='STR'||key==='VIT')?75:35},
    ])) as typeof core;
    const result=applyTrainingBridge({baseline:{
      physicalAP:hunter.attackPower,stagger:1,power:1,moveSpeed:hunter.moveSpeed,
      maxHP:hunter.maxHp,precision:1,weakPointMultiplier:1,
      critChance:hunter.critChance,resourceCostMultiplier:1,resourceRecovery:1,
    },core:synthetic,flags:{enabled:true,applyMovement:false,
      applyPerception:true,applyIntelligence:false}});
    trainingHpBonus=result.combat.maxHP-hunter.maxHp;
    trainingApBonus=result.combat.physicalAP-hunter.attackPower;
    hunter.attackPower=result.combat.physicalAP;
    hunter.maxHp=Math.round(result.combat.maxHP);
    hunter.hp=hunter.maxHp;
    hunter.critChance=result.combat.critChance;
  }
  const creature=createMob(sim.nextId++,template,mobLevel,{
    x:hunter.pos.x+2,y:hunter.pos.y,z:hunter.pos.z+2,
  });
  creature.hostile=true;
  creature.offStreamIdle=false;
  creature.facing=Math.atan2(hunter.pos.x-creature.pos.x,hunter.pos.z-creature.pos.z);
  sim.addEntity(creature);
  hunter.facing=Math.atan2(creature.pos.x-hunter.pos.x,creature.pos.z-hunter.pos.z);
  sim.targetEntity(creature.id,pid);
  sim.startAutoAttack(pid);
  // Actual-known skills only; rejected ability casts never bypass native gates.
  const known=meta.known.map(a=>a.def.id);
  const selected=abilityOptions[cls].find(a=>known.includes(a))??'';
  const hunterHpStart=hunter.maxHp, mobHpStart=creature.maxHp;
  const xpStart=meta.lifetimeXp;
  const maxTicks=Math.ceil(seconds/DT);
  let ticks=0,castAttempts=0,playerDamageEvents=0,mobDamageEvents=0;
  const deathState={hunterDead:false,mobDead:false};
  for(;ticks<maxTicks && !hunter.dead && !creature.dead;ticks++){
    if(selected && ticks % Math.max(1,Math.floor(2.5/DT))===0){
      sim.castAbility(selected,pid);
      castAttempts++;
    }
    // tick() RETURNS and clears this frame's native combat events.
    // Never call drainEvents() AFTER tick() or the combat log becomes empty.
    const events=sim.tick();
    for(const ev of events){
      if(ev.type==='damage' && ev.sourceId===pid && ev.targetId===creature.id
        && ev.amount>0)playerDamageEvents++;
      if(ev.type==='damage' && ev.sourceId===creature.id && ev.targetId===pid
        && ev.amount>0)mobDamageEvents++;
    }
  }
  deathState.hunterDead=hunter.dead;
  deathState.mobDead=creature.dead;
  const corpseCopper=creature.loot?.copper??0;
  const corpseItemIds=(creature.loot?.items??[]).map(x=>x.itemId).join(';');
  const claimed=creature.dead ? sim.lootCorpse(creature.id,pid) : false;
  const row={
    classId:cls,monsterId:template.id,monsterLevel:mobLevel,hunterLevel:level,
    gap,trainScenario:trained?'SYNTHETIC_PLUS_BRIDGE':'UNTUNED',
    weaponId:weaponAdded||meta.equipment.mainhand||'STARTER_OR_NONE',
    hunterHpStart,monsterHpStart:mobHpStart,
    trainingHypotheticalHpGain:Math.round(trainingHpBonus),
    trainingHypotheticalApGain:Math.round(trainingApBonus),
    nativeAbilitySelected:selected||'NONE',abilityAttempts:castAttempts,
    damageEventsPlayer:playerDamageEvents,damageEventsMob:mobDamageEvents,
    hunterHpRemaining:Math.max(0,hunter.hp),
    monsterHpRemaining:Math.max(0,creature.hp),
    elapsedSeconds:Math.round(ticks*DT*100)/100,
    result:creature.dead&&!hunter.dead?'WIN':hunter.dead?'LOSS':'TIMEOUT',
    mobCorpseGenerated:creature.dead,lootClaimed:claimed,
    corpseCopper,corpseItemIds,
    gameplayXpGained:meta.lifetimeXp-xpStart,
    note:'NATIVE_SIM_TICK_AI_AUTO_AND_SELECTED_KNOWN_SKILL_NO_ACTIVE_HUMAN_DODGE',
  };
  rows.push(row);
  return row;
}
function writeCsv(file:string,items:Row[]){
 const keys=[...new Set(items.flatMap(x=>Object.keys(x)))];
 const q=(x:unknown)=>'"'+String(x??'').replaceAll('"','""')+'"';
 writeFileSync(PATH+'/'+file,'\uFEFF'+keys.map(q).join(',')+'\n'
  +items.map(r=>keys.map(k=>q(r[k])).join(',')).join('\n')+'\n');
}
describe('P02N real native AI PvE fight lab (never public deploy)',()=>{
 it('runs full 80 monsters x 9 classes with actual native AI vs Hunter, at-level and +5',()=>{
   expect(all).toHaveLength(80);
   expect(classes).toHaveLength(9);
   const problems:string[]=[];
   // Full roster and 9 classes: 80*9*2 = 1,440 native timed duels.
   for(let idx=0;idx<all.length;idx++){
     if(idx%shardCount!==shardIndex)continue;
     const m=all[idx];
     const mobLevel=Math.min(m.maxLevel,m.minLevel+5);
     for(let ci=0;ci<classes.length;ci++){
       const cls=classes[ci];
       for(const gap of [0,5] as const){
         if(mobLevel-gap<1)continue;
         try{runFight(cls,m,mobLevel,gap,idx%2===0,67000+idx*97+ci*11+gap,8)}
         catch(e){problems.push(m.id+':'+cls+':gap'+gap+':'+String(e));}
       }
     }
   }
   writeCsv('01_DUELOS_SHARD_'+shardIndex+'.csv',rows);
   const sample=rows.filter(r=>r.gap===5);
   const classifications=(items:Row[])=>Object.fromEntries(['WIN','LOSS','TIMEOUT'].map(
     v=>[v,items.filter(r=>r.result===v).length]));
   const summary={
      source:'EXACT_NATIVE_CLAUDECRAFT_SIM_P02I_HUNT_PF6_LV99',
      classes:classes.length,monsterTemplates:all.length,attempted:(all.length/shardCount)*classes.length*2,
      shardIndex,shardCount,
      shardMonsterTemplates:all.length/shardCount,

      completed:rows.length,exceptions:problems.slice(0,40),
      resultsAtLevel:classifications(rows.filter(r=>r.gap===0)),
      resultsPlus5:classifications(sample),
      nativeAIUsed:true,actualAbilitiesAttempted:rows.filter(r=>r.nativeAbilitySelected!=='NONE').length,
      nativeLootClaims:rows.filter(r=>r.lootClaimed).length,
      skillInputMode:'STATIONARY_SKILL_CAST_PLUS_AUTO_ATTACK; NO DODGE/PARRY HUMAN INPUT',
      training:'SYNTHETIC_BRIDGE_FOR_SENSITIVITY_ONLY; NOT REAL SESSION EVIDENCE',
      equipment:'NATIVE_ITEMS_EQUIPPED_VIA_SIM_API_NOT_PF9_21_99_GEAR_PROGRESSION',
      balancedCertified:false,
      publicAppTouched:false,
      gates:['PF9_21_99_ITEMIZATION','ACTIVE_PARRY_DASH','COMBOS_1_2_3_4_GEM',
        '9_CLASS_FULL_ROTATIONS','99_EXTENDED_CLOSED','HUMAN_S23_QA',
        'REAL_TRAINING_SENSITIVITY','NATIVE_LOOT_ODDS_ECONOMY'],
    };
   writeFileSync(PATH+'/00_RESUMEN_DUELOS_SIM_SHARD_'+shardIndex+'.json',JSON.stringify(summary,null,2)+'\n');
   console.info('HIGHFLY_P02N_NATIVE_SIM_REPORT='+JSON.stringify(summary));
   expect(problems).toEqual([]);
   expect(rows).toHaveLength(180);
   expect(rows.some(r=>Number(r.damageEventsPlayer)>0)).toBe(true);
   expect(rows.some(r=>Number(r.damageEventsMob)>0)).toBe(true);
   expect(new Set(rows.map(r=>r.classId)).size).toBe(9);
 });
});
