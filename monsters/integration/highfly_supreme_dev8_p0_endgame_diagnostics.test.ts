/** HIGHFLY SUPREME DEV8 — read-only NORMAL LV99 combat diagnostics.
 * Compares the DEV7 bot's single-skill 25s policy with a longer native
 * known-ability rotation, under identical seeds and legitimate EQUIP rules.
 * Any gear and LV99 are TEST FIXTURES. No human inputs, parry, potion,
 * navigation, healing intelligence, or proof of naturally earning the items.
 * A GREEN run means telemetry executed, not that boss balance is good.
 */
import {describe,expect,it} from 'vitest';
import {writeFileSync} from 'node:fs';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {BUILTIN_WORLD,ITEMS,MOBS} from '../src/sim/data';
import {DT,type PlayerClass} from '../src/sim/types';
import {HIGHFLY_PF6_EXTENDED_ENABLED} from '../src/highfly/training/pf6_xp_curve';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyEncounterId} from '../src/highfly/monsters/hunt_encounters';
import {hfP13ItemId} from '../src/sim/content/highfly_lv99_native_equipment';
import {hfP16ArmorId} from '../src/sim/content/highfly_p16_native_chest_armor';

const CLASSES:PlayerClass[]=[
  'warrior','paladin','hunter','rogue','priest','shaman',
  'mage','warlock','druid',
];
const WEAPONS:Record<PlayerClass,'warrior'|'scout'|'caster'>={
  warrior:'warrior',paladin:'warrior',hunter:'scout',rogue:'scout',
  priest:'caster',shaman:'warrior',mage:'caster',warlock:'caster',druid:'caster',
};
const ARMORS:Record<PlayerClass,'mail'|'leather'|'cloth'>={
  warrior:'mail',paladin:'mail',hunter:'leather',rogue:'leather',
  priest:'cloth',shaman:'mail',mage:'cloth',warlock:'cloth',druid:'leather',
};
const PRIORITY:Record<PlayerClass,string[]>={
  warrior:['mortal_strike','slam','heroic_strike','rend'],
  paladin:['hammer_of_grace','crusader_strike','judgement','holy_strike'],
  hunter:['arcane_shot','steady_shot','serpent_sting'],
  rogue:['sinister_strike','eviscerate','backstab'],
  priest:['smite','mind_blast','shadow_word_pain'],
  shaman:['lightning_bolt','earth_shock','stormstrike'],
  mage:['fireball','frostbolt','arcane_blast'],
  warlock:['shadow_bolt','corruption','immolate'],
  druid:['wrath','moonfire','claw'],
};
type Policy='single_25s'|'rotation_40s';
type Result='WIN'|'LOSS'|'TIMEOUT';
type FightRow={
  cls:PlayerClass;policy:Policy;seed:number;captainId:string;
  weapon:string;chest:string;knownSkills:string[];attemptedSkills:string[];
  castAttempts:number;playerHitEvents:number;enemyHitEvents:number;
  playerDamage:number;enemyDamage:number;hunterMaxHp:number;
  hunterEndHp:number;captainMaxHp:number;captainEndHp:number;
  captainHpRemainingPct:number;seconds:number;result:Result;
  trainingUnchanged:boolean;level99Preserved:boolean;
};
const world={...BUILTIN_WORLD,camps:[]};
function fight(cls:PlayerClass,policy:Policy):FightRow {
  const seed=880000+CLASSES.indexOf(cls)*111;
  const sim=new Sim({seed,playerClass:cls,noPlayer:true,autoEquip:false,
    compulsoryTutorial:false,riftPortals:false,world});
  const pid=sim.addPlayer(cls,'HF_SUPREME_DEV8_NO_DEPLOY',
    {tutorialGreetingSent:true});
  sim.setPlayerLevel(99,pid); // synthetic CI level, never player XP
  const meta=sim.players.get(pid)!;
  const player=sim.entities.get(pid)!;
  const weapon=hfP13ItemId(90,WEAPONS[cls]);
  const chest=hfP16ArmorId(90,ARMORS[cls]);
  expect(ITEMS[weapon]?.requiredLevel).toBe(90);
  expect(ITEMS[chest]?.requiredLevel).toBe(90);
  sim.addItem(weapon,1,pid);
  // Native auto-equip sends Rogue's second dagger to offhand; force
  // explicit MAINHAND only in QA, without changing dual-wield game rules.
  sim.equipItem(weapon,pid,'mainhand');
  sim.addItem(chest,1,pid);
  sim.equipItem(chest,pid);
  expect(meta.equipment.mainhand).toBe(weapon);
  expect(meta.equipment.chest).toBe(chest);
  const startingTraining=JSON.stringify(
    JSON.parse(JSON.stringify(sim.serializeCharacter(pid))).trainingProfile);
  const scenario=HIGHFLY_HUNT_SCENARIOS.at(-1)!;
  expect(scenario.maxLevel).toBe(99);
  const captainId=highflyEncounterId('captain',scenario.minLevel);
  const mobDef=MOBS[captainId];
  expect(mobDef).toMatchObject({boss:true,elite:true,worldBoss:false});
  const mob=createMob(sim.nextId++,mobDef,99,{
    x:player.pos.x+2,y:player.pos.y,z:player.pos.z+2});
  mob.hostile=true;
  mob.facing=Math.atan2(player.pos.x-mob.pos.x,player.pos.z-mob.pos.z);
  sim.addEntity(mob);
  player.facing=Math.atan2(mob.pos.x-player.pos.x,mob.pos.z-player.pos.z);
  sim.targetEntity(mob.id,pid);
  sim.startAutoAttack(pid);
  const known=PRIORITY[cls].filter(id=>meta.known.some(a=>a.def.id===id));
  expect(known.length,'NO_KNOWN_CLASS_ACTION_FOR_'+cls).toBeGreaterThan(0);
  const maxSeconds=policy==='single_25s'?25:40;
  const maxTicks=Math.ceil(maxSeconds/DT);
  const castEvery=Math.max(1,Math.floor(2.5/DT));
  let ticks=0,casts=0,playerHits=0,enemyHits=0,playerDmg=0,enemyDmg=0;
  const used:string[]=[];
  for(;ticks<maxTicks&&!player.dead&&!mob.dead;ticks++){
    if(ticks%castEvery===0&&known.length){
      const action=policy==='single_25s'
        ?known[0]
        :known[casts%known.length];
      sim.castAbility(action,pid);
      used.push(action);
      casts++;
    }
    const events=sim.tick();
    for(const ev of events){
      if(ev.type!=='damage'||!(ev.amount>0))continue;
      if(ev.sourceId===pid&&ev.targetId===mob.id){
        playerHits++;playerDmg+=ev.amount;
      }
      if(ev.sourceId===mob.id&&ev.targetId===pid){
        enemyHits++;enemyDmg+=ev.amount;
      }
    }
  }
  const end=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
  const remaining=Math.max(0,mob.hp);
  return {
    cls,policy,seed,captainId,weapon,chest,
    knownSkills:known,attemptedSkills:[...new Set(used)],
    castAttempts:casts,playerHitEvents:playerHits,enemyHitEvents:enemyHits,
    playerDamage:Math.round(playerDmg),enemyDamage:Math.round(enemyDmg),
    hunterMaxHp:player.maxHp,hunterEndHp:Math.max(0,player.hp),
    captainMaxHp:mob.maxHp,captainEndHp:remaining,
    captainHpRemainingPct:Math.round(10000*remaining/mob.maxHp)/100,
    seconds:Math.round(ticks*DT*100)/100,
    result:mob.dead&&!player.dead?'WIN':player.dead?'LOSS':'TIMEOUT',
    trainingUnchanged:JSON.stringify(end.trainingProfile)===startingTraining,
    level99Preserved:end.level===99,
  };
}
describe('HIGHFLY SUPREME DEV8 P0 — 9-class native LV99 diagnosis (NO DEPLOY)',()=>{
  it('compares single known skill with longer multi-skill bot, without rewarding or buffing anyone',()=>{
    expect(HIGHFLY_PF6_EXTENDED_ENABLED).toBe(false);
    expect(CLASSES).toHaveLength(9);
    const rows:FightRow[]=[];
    for(const cls of CLASSES){
      rows.push(fight(cls,'single_25s'));
      rows.push(fight(cls,'rotation_40s'));
    }
    const aggregate=(policy:Policy)=>{
      const subset=rows.filter(r=>r.policy===policy);
      return {
        wins:subset.filter(r=>r.result==='WIN').length,
        losses:subset.filter(r=>r.result==='LOSS').length,
        timeouts:subset.filter(r=>r.result==='TIMEOUT').length,
        classesWithZeroPlayerDamage:subset.filter(r=>r.playerDamage===0).map(r=>r.cls),
        meanCaptainHpRemainingPct:Math.round(
          100*subset.reduce((sum,r)=>sum+r.captainHpRemainingPct,0)/subset.length)/100,
        byClass:Object.fromEntries(subset.map(r=>[r.cls,{
          outcome:r.result,hpRemainingPct:r.captainHpRemainingPct,
          outgoingDamage:r.playerDamage,incomingDamage:r.enemyDamage,
          knownSkills:r.knownSkills,attemptedSkills:r.attemptedSkills,
        }])),
      };
    };
    const summary={
      status:'DEV8_DIAGNOSTIC_ONLY_NOT_HUMAN_FAIRNESS_OR_NATURAL_LV1_TO_99',
      noProductionCodeChanges:true,
      noStatMint:true,extended100Plus:false,
      classes:CLASSES.length,simulationRows:rows.length,
      equipment:'Explicit test-given class-legal LV90 P13 weapon/P16 armor',
      omitted:'No real player movement, parry, dash, healing, consumables or NPC/loot acquisition',
      single25:aggregate('single_25s'),
      rotation40:aggregate('rotation_40s'),
      humanAndPhysicalS23Certified:false,
    };
    writeFileSync('../highfly_supreme_dev8_p0_endgame_diagnostics.json',
      JSON.stringify({summary,rows},null,2)+'\n','utf8');
    console.info('HF_SUPREME_DEV8_P0_ENDGAME_DIAGNOSTICS='+JSON.stringify(summary));
    expect(rows).toHaveLength(18);
    expect(rows.every(r=>r.trainingUnchanged&&r.level99Preserved)).toBe(true);
    expect(rows.every(r=>r.weapon&&r.chest&&Number.isFinite(r.captainHpRemainingPct))).toBe(true);
    expect(rows.reduce((sum,r)=>sum+r.playerHitEvents,0)).toBeGreaterThan(0);
  },180000);
});
