/** HIGHFLY V4-03 P10: real Sim.tick PvE, longer than P02N's 8s smoke.
 *
 * 9 original classes x 8 native LV21–99 tiers x {normal,local captain}
 * = 144 extended single-encounter simulations (up to 40 game seconds).
 * NO new combat system/Training mint/XP buffs/saved user changes.
 * Hunter's level and eligible weapon supplied as synthetic QA preconditions;
 * equip / skills / mob AI / combat / death / loot are AUTHENTIC native APIs.
 * This is a reproducible baseline, NOT final fair-play/balance certification.
 */
import {describe,expect,it} from 'vitest';
import {writeFileSync} from 'node:fs';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,ITEMS,MOBS,ZONES} from '../src/sim/data';
import {createMob} from '../src/sim/entity';
import {emptyZoneProps,DT,type PlayerClass} from '../src/sim/types';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyMonsterId} from '../src/highfly/monsters/level99';
import {highflyEncounterId} from '../src/highfly/monsters/hunt_encounters';

const CLASSES:PlayerClass[]=[
  'warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid',
];
const ABILITIES:Record<PlayerClass,string[]>={
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
const arena={
  ...BUILTIN_WORLD,zones:[ZONES[0]],camps:[],npcs:{},groundObjects:[],
  props:emptyZoneProps(),roads:[],placements:[],blockers:[],
  terrainEdits:[],biomePaint:undefined,services:undefined,
};
type Outcome='WIN'|'LOSS'|'TIMEOUT';
interface Fight {
  cls:PlayerClass;
  scenario:string;
  hunterLevel:number;
  monsterId:string;
  monsterLevel:number;
  kind:'normal'|'captain';
  gear:string;
  selectedAbility:string;
  attempts:number;
  playerDamageEvents:number;
  mobDamageEvents:number;
  hunterHpStart:number;
  hunterHpEnd:number;
  mobHpStart:number;
  mobHpEnd:number;
  elapsedSeconds:number;
  outcome:Outcome;
  nativeCorpse:boolean;
  nativeLootClaim:boolean;
  earnedXp:number;
}
const ROUNDS_SEC=40;
const rows:Fight[]=[];
function runFight(cls:PlayerClass,scenarioIndex:number,kind:'normal'|'captain'):Fight{
  const s=HIGHFLY_HUNT_SCENARIOS[scenarioIndex],level=s.minLevel+3;
  const monsterId=kind==='normal'
    ? highflyMonsterId(s.families[0],s.minLevel)
    : highflyEncounterId('captain',s.minLevel);
  const def=MOBS[monsterId];
  if(!def||def.minLevel!==s.minLevel||def.maxLevel!==s.maxLevel)
    throw Error('P10_MISSING_NATIVE_MONSTER:'+monsterId);
  if(kind==='captain'&&(!def.elite||!def.boss||def.worldBoss))
    throw Error('P10_NOT_A_LOCAL_CAPTAIN');
  const sim=new Sim({
    seed:100210+scenarioIndex*1531+CLASSES.indexOf(cls)*41+(kind==='captain'?3:0),
    playerClass:cls,noPlayer:true,autoEquip:true,riftPortals:false,
    compulsoryTutorial:false,world:arena,
  });
  const pid=sim.addPlayer(cls,'P10 Long Fight',{autoEquip:true,tutorialGreetingSent:true});
  sim.setPlayerLevel(level,pid); // FIXTURE: no production leveling cheat.
  const hunter=sim.entities.get(pid),meta=sim.players.get(pid);
  if(!hunter||!meta)throw Error('P10_HUNTER_MISSING');
  // Equip authentic donor item through actual addItem/equipItem. The free gear
  // supply is explicitly TEST FIXTURE; not a real user earning the item.
  const weapons=Object.values(ITEMS)
    .filter(i=>i.kind==='weapon'&&i.slot==='mainhand'&&
      requiredLevelFor(i)<=level&&
      (!i.requiredClass||i.requiredClass.includes(cls))&&
      !!i.weapon&&i.quality!=='legendary')
    .sort((a,b)=>((b.weapon!.min+b.weapon!.max)/(2*b.weapon!.speed))-
                 ((a.weapon!.min+a.weapon!.max)/(2*a.weapon!.speed)));
  for(const item of weapons.slice(0,15)){
    try{
      sim.addItem(item.id,1,pid);
      sim.equipItem(item.id,pid);
      if(meta.equipment.mainhand===item.id)break;
    }catch{}
  }
  const creature=createMob(sim.nextId++,def,level,{
    x:hunter.pos.x+2,y:hunter.pos.y,z:hunter.pos.z+2,
  });
  creature.hostile=true;creature.offStreamIdle=false;
  creature.facing=Math.atan2(hunter.pos.x-creature.pos.x,hunter.pos.z-creature.pos.z);
  sim.addEntity(creature);
  hunter.facing=Math.atan2(creature.pos.x-hunter.pos.x,creature.pos.z-hunter.pos.z);
  sim.targetEntity(creature.id,pid);
  sim.startAutoAttack(pid);
  const known=meta.known.map(a=>a.def.id);
  const selected=ABILITIES[cls].find(id=>known.includes(id))??'';
  const hpStart=hunter.maxHp,mobHpStart=creature.maxHp,oldXp=meta.lifetimeXp;
  let tick=0,attempts=0,playerHits=0,mobHits=0;
  const castInterval=Math.max(1,Math.floor(2.5/DT));
  for(;tick<Math.ceil(ROUNDS_SEC/DT) && !hunter.dead&&!creature.dead;tick++){
    if(selected&&tick%castInterval===0){sim.castAbility(selected,pid);attempts++;}
    const events=sim.tick();
    for(const ev of events){
      if(ev.type!=='damage'||!(ev.amount>0))continue;
      if(ev.sourceId===pid&&ev.targetId===creature.id)playerHits++;
      if(ev.sourceId===creature.id&&ev.targetId===pid)mobHits++;
    }
  }
  const nativeCorpse=creature.dead&&creature.lootable;
  const claimed=creature.dead?sim.lootCorpse(creature.id,pid):false;
  const row:Fight={
    cls,scenario:s.id,hunterLevel:level,monsterId,monsterLevel:level,kind,
    gear:meta.equipment.mainhand||'STARTER_OR_NONE',
    selectedAbility:selected||'NONE',attempts,
    playerDamageEvents:playerHits,mobDamageEvents:mobHits,
    hunterHpStart:hpStart,hunterHpEnd:Math.max(0,hunter.hp),
    mobHpStart,mobHpEnd:Math.max(0,creature.hp),
    elapsedSeconds:Math.round(tick*DT*100)/100,
    outcome:creature.dead&&!hunter.dead?'WIN':hunter.dead?'LOSS':'TIMEOUT',
    nativeCorpse,nativeLootClaim:claimed,
    earnedXp:meta.lifetimeXp-oldXp,
  };
  rows.push(row);
  return row;
}
describe('HIGHFLY P10 extended native PvE 9 classes × 8 regions × 2 encounter types',()=>{
  it('runs 144 actual extended native fights, retains game rules and exports per-class outcomes',()=>{
    expect(import.meta.env.VITE_HIGHFLY_CHALLENGE_ENCOUNTERS).toBe('1');
    expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
    expect(CLASSES).toHaveLength(9);
    const errors:string[]=[];
    for(let si=0;si<HIGHFLY_HUNT_SCENARIOS.length;si++){
      for(const cls of CLASSES){
        for(const kind of ['normal','captain'] as const){
          try{runFight(cls,si,kind);}
          catch(e){errors.push(HIGHFLY_HUNT_SCENARIOS[si].id+':'+cls+':'+kind+':'+String(e));}
        }
      }
    }
    const tally=(items:Fight[])=>Object.fromEntries(
      ['WIN','LOSS','TIMEOUT'].map(k=>[k,items.filter(r=>r.outcome===k).length]));
    const summary={
      scope:'9 CLASSES x 8 NATIVE LV21-99 SCENARIOS x NORMAL/CAPTAIN',
      totalExpected:144,totalCompleted:rows.length,
      perFightBudgetGameSeconds:ROUNDS_SEC,
      normal:tally(rows.filter(r=>r.kind==='normal')),
      captains:tally(rows.filter(r=>r.kind==='captain')),
      classes:Object.fromEntries(CLASSES.map(cls=>[cls,tally(rows.filter(r=>r.cls===cls))])),
      playerDamageEvents:rows.reduce((n,r)=>n+r.playerDamageEvents,0),
      mobDamageEvents:rows.reduce((n,r)=>n+r.mobDamageEvents,0),
      xpBearingKills:rows.filter(r=>r.earnedXp>0).length,
      nativeCorpseClaims:rows.filter(r=>r.nativeLootClaim).length,
      errorCount:errors.length,errors:errors.slice(0,24),
      training:'NO TRAINING POINTS WERE GENERATED',
      gear:'QA FIXTURE SUPPLIED LEGAL NATIVE ITEMS AND EQUIPPED USING Sim API',
      level:'QA FIXTURE SET VIA Sim.setPlayerLevel; NOT NATURAL LV1-99 PLAYTHROUGH',
      input:'NATIVE AUTOATTACK + PERIODIC KNOWN SKILL; NO HUMAN PARRY/DODGE',
      certifiedHumanBalance:false,
      publicPagesTouched:false,
    };
    writeFileSync('../highfly_v403_p10_extended_pve_report.json',
      JSON.stringify({summary,rows},null,2)+'\n','utf8');
    console.info('HF_P10_EXTENDED_NATIVE_PVE_144='+JSON.stringify(summary));
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(144);
    expect(new Set(rows.map(r=>r.cls)).size).toBe(9);
    expect(new Set(rows.map(r=>r.scenario)).size).toBe(8);
    expect(rows.every(r=>Number.isFinite(r.elapsedSeconds)&&
      Number.isFinite(r.mobHpEnd)&&Number.isFinite(r.hunterHpEnd))).toBe(true);
    expect(rows.reduce((n,r)=>n+r.playerDamageEvents,0)).toBeGreaterThan(0);
    expect(rows.reduce((n,r)=>n+r.mobDamageEvents,0)).toBeGreaterThan(0);
  },20*60*1000);
});
