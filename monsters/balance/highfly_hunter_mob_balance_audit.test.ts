/** HIGHFLY P02M — READ-ONLY Hunter vs actual ClaudeCraft/HIGHFLY monster balance.
 * Produces measured source-derived BASELINE DPS/TTK and transparent avoidance
 * sensitivity, NOT a simulated perfect dodge bot, not human proof, not V4 deploy.
 * 9 real native class chassis, no invented LV99 gear; PF6 XP source is patched
 * ONLY in this disposable GitHub Actions runner.
 */
import { describe,expect,it } from 'vitest';
import { writeFileSync,mkdirSync } from 'node:fs';
import { MOBS,ITEMS,ALL_RECIPES } from '../src/sim/data';
import { createPlayer,createMob,recalcPlayerStats } from '../src/sim/entity';
import { armorReduction, meleeMissChance, mobXpValue, MAX_LEVEL, xpForLevel } from '../src/sim/types';
import { Sim } from '../src/sim/sim';
import { meleeSwing } from '../src/sim/combat/auto_attack';
import { buildHighflyMonsterRoster } from '../src/highfly/monsters/level99';
import { applyHighflyHuntRewardTables,highflyHuntRewardProfiles } from '../src/highfly/monsters/hunt_rewards';
import { buildHighflyHuntEncounters } from '../src/highfly/monsters/hunt_encounters';
import { assessHighflyChallengeKill, highflyChallengeReagentProbability } from '../src/highfly/monsters/hunt_challenge_reward_policy';

const OUT='/tmp/hf-monstruos6-p02m-balance';
mkdirSync(OUT,{recursive:true});
const CLASSES=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'] as const;
const pos={x:0,y:0,z:0};
const mainRoster=applyHighflyHuntRewardTables(buildHighflyMonsterRoster(MOBS),ITEMS,ALL_RECIPES);
const variants=buildHighflyHuntEncounters(mainRoster);
const cases=[...Object.values(mainRoster),...Object.values(variants)] as any[];
const challenges=[0,3,5,8,12] as const; // mobLevel - hunterLevel
const avoidances=[0,0.35,0.70] as const; // COUNTERFACTUAL; no claim real player can achieve them
type R=Record<string,string|number|boolean>;
const rows:R[]=[];
const sq=(n:number)=>Number.isFinite(n)?Math.round(n*1000)/1000:0;
const playerCache=new Map<string,ReturnType<typeof createPlayer>>();
function playerOf(cls:typeof CLASSES[number],level:number) {
  const key=cls+':'+level;
  let p=playerCache.get(key);
  if(!p) {
    p=createPlayer(900001,cls,pos,'P02M Balance Baseline');
    p.level=level;
    recalcPlayerStats(p,cls,{},undefined,{});
    playerCache.set(key,p);
  }
  return p;
}
function addEstimate(m:any,level:number,cls:typeof CLASSES[number],gap:number,skill:number) {
  const hunterLevel=level-gap;
  if(hunterLevel<1||hunterLevel>99)return;
  const hunter=playerOf(cls,hunterLevel);
  const mob=createMob(900002,m,level,{x:0,y:0,z:2});
  const playerHit=Math.max(0.01,1-meleeMissChance(hunterLevel,level)
    -(0.05+Math.max(0,level-hunterLevel)*0.005));
  const mobHit=Math.max(0.01,1-meleeMissChance(level,hunterLevel)
    -hunter.dodgeChance);
  const hunterRaw=((hunter.weapon.min+hunter.weapon.max)/2
    +hunter.attackPower/14*hunter.weapon.speed);
  const hunterHit=Math.max(1,hunterRaw*(1+Math.min(1,hunter.critChance))
    *(1-armorReduction(mob.stats.armor,hunterLevel)));
  const hunterDps=playerHit*hunterHit/Math.max(0.1,hunter.weapon.speed);
  const mobRaw=(mob.weapon.min+mob.weapon.max)/2;
  const mobHitDamage=Math.max(1,mobRaw*1.05
    *(1-armorReduction(hunter.stats.armor,level)));
  const mobDps=mobHit*mobHitDamage/Math.max(0.1,mob.weapon.speed);
  const ttk=mob.maxHp/Math.max(0.01,hunterDps);
  const incoming=ttk*mobDps*(1-skill);
  rows.push({monsterId:m.id, monster:m.name,family:m.family||'',
    elite:!!m.elite,boss:!!m.boss, monsterLevel:level,hunterClass:cls,
    hunterLevel,gap,avoidedEnemyDamageAssumption:skill,
    playerMaxHp:hunter.maxHp,playerArmor:hunter.stats.armor,
    playerAttackPower:hunter.attackPower,playerWeaponMin:hunter.weapon.min,
    playerWeaponMax:hunter.weapon.max,playerHitChance:sq(playerHit),
    monsterHp:mob.maxHp,monsterAttackMin:mob.weapon.min,
    monsterAttackMax:mob.weapon.max,monsterArmor:mob.stats.armor,
    estimatedHunterAutoDps:sq(hunterDps),estimatedMobAutoDps:sq(mobDps),
    estimatedKillSeconds:sq(ttk),estimatedIncomingDamage:sq(incoming),
    incomingAsHunterHp:sq(incoming/Math.max(1,hunter.maxHp)),
    estimatedSurvival:incoming<=hunter.maxHp,
    xpPerKill:mobXpValue(level,hunterLevel)*Number(m.xpMult??1),
    resultKind:'MATH_ONLY_AUTO_ATTACK_NO_SKILLS_NO_GEAR_NO_HUMAN_INPUT',
  });
}
function csv(path:string,data:R[]) {
  const keys=[...new Set(data.flatMap(x=>Object.keys(x)))];
  const cell=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';
  writeFileSync(OUT+'/'+path,'\uFEFF'+keys.map(cell).join(',')+'\n'
    +data.map(r=>keys.map(k=>cell(r[k])).join(',')).join('\n')+'\n');
}
describe('P02M — honest combat risk and legitimate overlevel loot policy (NO DEPLOY)',()=>{
  it('runs complete real template/class/level-gap matrix and publishes NOT CERTIFIED if incomplete',()=>{
    expect(MAX_LEVEL).toBe(99);
    expect(cases).toHaveLength(80);
    expect(highflyHuntRewardProfiles(ITEMS,ALL_RECIPES)).toHaveLength(64);
    for(const m of cases){
      for(const lev of [...new Set([m.minLevel,m.maxLevel])]){
        for(const cls of CLASSES)for(const gap of challenges)
          for(const assumedEvasion of avoidances)
            addEstimate(m,lev,cls,gap,assumedEvasion);
      }
    }
    const nativeDonors=['forest_wolf','webwood_spider','restless_bones',
      'thornpeak_ogre','boneclad_revenant','dragonkin_broodguard',
      'stormcrag_elemental','ridge_stalker'];
    const oldRows:R[]=[];
    for(const id of nativeDonors) {
      const m=MOBS[id];
      if(!m)continue;
      const level=m.minLevel;
      const hunter=playerOf('warrior',Math.max(1,level));
      const mob=createMob(900003,m,level,{x:0,y:0,z:2});
      oldRows.push({id,mobLevel:level,hunterLevel:hunter.level,hunterHp:hunter.maxHp,
        mobHp:mob.maxHp,mobAttackMax:mob.weapon.max,originalLootRows:m.loot.length});
    }
    expect(rows.length).toBeGreaterThan(10000);
    expect(rows.every(r=>Number.isFinite(Number(r.estimatedKillSeconds)) &&
      Number(r.estimatedKillSeconds)>0)).toBe(true);
    expect(new Set(rows.map(r=>r.hunterClass)).size).toBe(9);
    const get=(gap:number,skill:number)=>rows.filter(r=>r.gap===gap&&r.avoidedEnemyDamageAssumption===skill);
    const cmp=get(5,0.70);
    const summary={audit:'P02M_REAL_CHASSIS_PLUS_REAL_MOB_TEMPLATE',certifiedBalanced:false,
      source:'PINNED_CLAUDECRAFT_0_44_0_PLUS_P02I_MONSTERS_PLUS_PF6_LEVEL_CAP',
      playerClasses:CLASSES,classesTested:CLASSES.length,
      monsterTemplateVariants:cases.length,combatMatrixRows:rows.length,
      notASimulationOf:['player_potions','abilities','combos','dash','parry',
        'active_avoidance','mob_special_AI','crafting_gear_LV21_99','trained_stats',
        'S23_physical_touch_latency','world_map_navigation'],
      baselineEquipment:'NO_EQUIPMENT — PESSIMISTIC CHASSIS AUDIT ONLY',
      killTimeOver120Seconds:rows.filter(r=>Number(r.estimatedKillSeconds)>120).length,
      noAvoidanceSurvivalShare:sq(get(0,0).filter(r=>r.estimatedSurvival).length/Math.max(1,get(0,0).length)),
      overlevelPlus5Assumed70AvoidanceSurvivalShare:sq(cmp.filter(r=>r.estimatedSurvival).length/Math.max(1,cmp.length)),
      xpCurveSamples:[1,20,21,40,60,80,98,99].map(level=>({level,required:xpForLevel(level)})),
      level40Vs45:{baseXp:mobXpValue(45,40),sameLevelXp:mobXpValue(40,40)},
      status:'AUDIT_GREEN_BALANCE_NOT_YET_CERTIFIED_NEEDS_GEAR_TRAINING_SKILLS_E2E',
    };
    csv('01_HUNTER_MOB_AUTO_ATTACK_BALANCE_MATRIX.csv',rows);
    csv('02_NATIVE_ORIGINAL_MONSTERS_SAMPLES.csv',oldRows);
    writeFileSync(OUT+'/00_RESUMEN_BALANCE.json',JSON.stringify(summary,null,2)+'\n');
    console.info('HIGHFLY_P02M_BALANCE_AUDIT='+JSON.stringify(summary));
  });
  it('native overlevel combat permits legitimate damage to an ACTUAL full-HP LV45 monster by LV40 player',()=>{
    const sim=new Sim({seed:20526,playerClass:'warrior',noPlayer:true,autoEquip:false,
      compulsoryTutorial:false,riftPortals:false});
    const pid=sim.addPlayer('warrior','HunterP02M');
    sim.setPlayerLevel(40,pid);
    const hunter=sim.entities.get(pid);
    if(!hunter)throw Error('MISSING_REAL_HUNTER');
    const m=mainRoster['hf_hunt_wolf_40'];
    expect(m).toBeDefined();
    const victim=createMob(sim.nextId++,m,45,
      {x:hunter.pos.x,y:hunter.pos.y,z:hunter.pos.z+2});
    sim.addEntity(victim);
    hunter.facing=Math.atan2(victim.pos.x-hunter.pos.x,victim.pos.z-hunter.pos.z);
    sim.targetEntity(victim.id,pid);
    const before=victim.hp;
    let connections=0;
    for(let i=0;i<50;i++)if(meleeSwing(sim.ctx,hunter,victim,0,null,{}))connections++;
    expect(hunter.level).toBe(40);
    expect(victim.level).toBe(45);
    expect(connections).toBeGreaterThan(0);
    expect(victim.hp).toBeLessThan(before);
    expect(before).toBe(victim.maxHp);
    // Does NOT falsely assert the player would survive a real complete fight.
  });
  it('overlevel premium is proportional and never allows quest/boss/party exploitation',()=>{
    const e={
      hunterLevel:40,mobLevel:45,mobId:'hf_hunt_wolf_40',
      hunterId:1,tapOwnerId:1,contributors:1,
      mobMaxHp:800,hunterDamageToMob:800,combatSeconds:45,
      legitimateKill:true,kind:'normal' as const,
    };
    expect(assessHighflyChallengeKill(e)).toMatchObject({qualified:true,overlevel:5});
    const low=assessHighflyChallengeKill({...e,mobLevel:40});
    const high=assessHighflyChallengeKill({...e,mobLevel:53});
    const capped=assessHighflyChallengeKill({...e,mobLevel:99});
    const normal=highflyChallengeReagentProbability(0.18,low);
    const bonus=highflyChallengeReagentProbability(0.18,high);
    expect(normal).toBe(0.18);
    expect(highflyChallengeReagentProbability(0.18,assessHighflyChallengeKill(e))).toBeGreaterThan(normal);
    expect(bonus).toBeLessThanOrEqual(0.26);
    expect(highflyChallengeReagentProbability(0.18,capped)).toBe(bonus);
    for(const disqualify of [
      {...e,kind:'boss' as const},{...e,contributors:2},{...e,tapOwnerId:2},
      {...e,hunterDamageToMob:100},{...e,combatSeconds:0.5},
      {...e,legitimateKill:false},{...e,mobId:'forest_wolf'},
      {...e,hunterLevel:100},
    ])expect(assessHighflyChallengeKill(disqualify).qualified).toBe(false);
    expect(()=>highflyChallengeReagentProbability(1,high)).toThrow('HF_CHALLENGE_ONLY_REGISTERED_EXTRA_REAGENTS');
    const profiles=highflyHuntRewardProfiles(ITEMS,ALL_RECIPES);
    const gain=profiles.map(p=>({
      id:p.mobId,reagent:p.itemId,normalChance:p.chance,
      plus3Chance:highflyChallengeReagentProbability(p.chance,assessHighflyChallengeKill({...e,mobId:p.mobId,mobLevel:p.minLevel+3,hunterLevel:p.minLevel})),
      plus5Chance:highflyChallengeReagentProbability(p.chance,assessHighflyChallengeKill({...e,mobId:p.mobId,mobLevel:p.minLevel+5,hunterLevel:p.minLevel})),
      plus10Chance:highflyChallengeReagentProbability(p.chance,assessHighflyChallengeKill({...e,mobId:p.mobId,mobLevel:Math.min(99,p.minLevel+10),hunterLevel:p.minLevel})),
    }));
    csv('03_CRAFT_REAGENT_ODDS_POLICY_PROPOSED.csv',gain);
    writeFileSync(OUT+'/04_POLITICA_RECOMPENSA_ESTADO.txt',
      'PREVIEW-ONLY; NO V4 kill-time owner-specific RNG hook installed; do not call these chances live.\n'
      +'No gear/rarity change; no extra training stats; XP stays native capped at +20% for +4 levels.\n'
      +'Proof of combat requires actual native kill-time credit and sole owner.\n');
  });
});
