/** HIGHFLY GOLDEN DEV7 — LV99 endgame native verification.
 * Native P13 weapon LV90 + P16 chest LV90, original 9 classes, original Sim.
 * Real P09 hardest dungeon and LV99 elite/captain fights. No fake equipment
 * ownership claim: legal equipment supplied through normal native inventory
 * commands as EXPLICIT QA fixture. Native combat AI/rules/HP/damage untouched.
 * Only level is supplied as CI fixture. Not a natural LV1->99 human playthrough.
 */
import {describe,expect,it} from 'vitest';
import {writeFileSync} from 'node:fs';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {BUILTIN_WORLD,DUNGEONS,ITEMS,MOBS} from '../src/sim/data';
import {DT,type PlayerClass} from '../src/sim/types';
import {HIGHFLY_PF6_EXTENDED_ENABLED} from '../src/highfly/training/pf6_xp_curve';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyNativeHuntDungeonId} from '../src/highfly/monsters/hunt_dungeon_registry';
import {highflyMonsterId} from '../src/highfly/monsters/level99';
import {highflyEncounterId} from '../src/highfly/monsters/hunt_encounters';
import {hfP13ItemId} from '../src/sim/content/highfly_lv99_native_equipment';
import {hfP16ArmorId} from '../src/sim/content/highfly_p16_native_chest_armor';

const CLASSES:PlayerClass[]=[
  'warrior','paladin','hunter','rogue','priest','shaman',
  'mage','warlock','druid',
];
const WEAPON_TRACK:Record<PlayerClass,'warrior'|'scout'|'caster'>={
  warrior:'warrior',paladin:'warrior',hunter:'scout',rogue:'scout',
  priest:'caster',shaman:'warrior',mage:'caster',warlock:'caster',druid:'caster',
};
const ARMOR_TRACK:Record<PlayerClass,'mail'|'leather'|'cloth'>={
  warrior:'mail',paladin:'mail',hunter:'leather',rogue:'leather',
  priest:'cloth',shaman:'mail',mage:'cloth',warlock:'cloth',druid:'leather',
};
const CLASS_ACTION:Record<PlayerClass,readonly string[]>={
  warrior:['mortal_strike','slam','heroic_strike'],
  paladin:['crusader_strike','judgement'],
  hunter:['arcane_shot','steady_shot'],
  rogue:['sinister_strike','eviscerate'],
  priest:['smite','mind_blast'],
  shaman:['lightning_bolt','stormstrike'],
  mage:['fireball','frostbolt'],
  warlock:['shadow_bolt','corruption'],
  druid:['wrath','moonfire'],
};
const WORLD={...BUILTIN_WORLD,camps:[]};
function createHunter(cls:PlayerClass,seed:number){
  const sim=new Sim({seed,playerClass:cls,noPlayer:true,autoEquip:false,
    compulsoryTutorial:false,riftPortals:false,world:WORLD});
  const pid=sim.addPlayer(cls,'HIGHFLY_LV99_NATIVE_ENDGAME',
    {tutorialGreetingSent:true});
  sim.setPlayerLevel(99,pid); // TEST FIXTURE; NO user-level shortcut.
  const meta=sim.players.get(pid)!;
  const weapon=hfP13ItemId(90,WEAPON_TRACK[cls]);
  const chest=hfP16ArmorId(90,ARMOR_TRACK[cls]);
  expect(ITEMS[weapon]?.kind).toBe('weapon');
  expect(ITEMS[chest]?.kind).toBe('armor');
  expect(ITEMS[weapon]?.requiredLevel).toBe(90);
  expect(ITEMS[chest]?.requiredLevel).toBe(90);
  sim.addItem(weapon,1,pid);
  // In the original ClaudeCraft game, a Rogue with a rusty dagger already
  // equipped auto-routes a second one-handed weapon to OFFHAND. This QA
  // explicitly targets MAINHAND to compare all nine class loadouts without
  // changing the authentic dual-wield/equip rules.
  sim.equipItem(weapon,pid,'mainhand');
  expect(meta.equipment.mainhand).toBe(weapon);
  sim.addItem(chest,1,pid);
  sim.equipItem(chest,pid);
  expect(meta.equipment.chest).toBe(chest);
  const actor=sim.entities.get(pid)!;
  return {sim,pid,meta,actor,weapon,chest};
}
const top=()=>HIGHFLY_HUNT_SCENARIOS[
  HIGHFLY_HUNT_SCENARIOS.length-1];
describe('HIGHFLY GOLDEN DEV7 LV99 nine classes — original Sim with earned-legal endgame loadout fixture',()=>{
  it('preserves LV99 normal cap, hardest native world instance, native NPC ownership and clean save 9/9',()=>{
    expect(HIGHFLY_PF6_EXTENDED_ENABLED).toBe(false);
    expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
    expect(top().maxLevel).toBe(99);
    expect(CLASSES).toHaveLength(9);
    const dungeonId=highflyNativeHuntDungeonId(top().id);
    const dungeon=DUNGEONS[dungeonId];
    expect(dungeon?.spawns).toHaveLength(8);
    const captain=highflyEncounterId('captain',top().minLevel);
    expect(dungeon.spawns.some(x=>x.mobId===captain)).toBe(true);
    expect(MOBS[captain]).toMatchObject({boss:true,elite:true,worldBoss:false});
    for(const cls of CLASSES){
      const {sim,pid,meta,actor,weapon,chest}=createHunter(cls,99100+CLASSES.indexOf(cls));
      const orig=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      expect(orig.level).toBe(99);
      expect(sim.enterDungeon(dungeonId,pid)).toBe(true);
      expect(sim.entities.get(pid)).toBe(actor);
      expect(sim.players.get(pid)).toBe(meta);
      const instance=sim.instances.find(i=>i.dungeonId===dungeonId&&i.enteredBy.has(pid));
      expect(instance?.mobIds).toHaveLength(8);
      expect(sim.leaveDungeon(pid)).toBe(true);
      const state=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      expect(state.level).toBe(99);
      expect(meta.equipment.mainhand).toBe(weapon);
      expect(meta.equipment.chest).toBe(chest);
      expect(state.trainingProfile).toEqual(orig.trainingProfile);
      const reloaded=new Sim({seed:99200+CLASSES.indexOf(cls),playerClass:cls,
        noPlayer:true,autoEquip:false,compulsoryTutorial:false,
        riftPortals:false,world:WORLD});
      const nextPid=reloaded.addPlayer(cls,'HIGHFLY_LV99_NATIVE_ENDGAME',
        {state,tutorialGreetingSent:true});
      const nextMeta=reloaded.players.get(nextPid)!;
      expect(reloaded.serializeCharacter(nextPid)?.level).toBe(99);
      expect(nextMeta.equipment.mainhand).toBe(weapon);
      expect(nextMeta.equipment.chest).toBe(chest);
      expect(JSON.parse(JSON.stringify(reloaded.serializeCharacter(nextPid))).trainingProfile)
        .toEqual(orig.trainingProfile);
      expect([...reloaded.entities.values()].filter(x=>x.kind==='player')).toHaveLength(1);
    }
  });
  it('measures nine real LV99 captain fights with proper P13/P16 equipment, no combat buff',()=>{
    const rows=[] as {cls:PlayerClass,weapon:string,chest:string,
      monster:string,action:string,elapsedSeconds:number,
      result:'WIN'|'LOSS'|'TIMEOUT',startHP:number,endHP:number,
      mobHP:number,trainingUnaffected:boolean}[];
    const monster=highflyEncounterId('captain',top().minLevel);
    const def=MOBS[monster];
    expect(def?.maxLevel).toBe(99);
    expect(def.boss).toBe(true);
    for(const cls of CLASSES){
      const {sim,pid,meta,actor,weapon,chest}=createHunter(cls,
        99300+CLASSES.indexOf(cls)*100);
      const profile=JSON.parse(JSON.stringify(sim.serializeCharacter(pid))).trainingProfile;
      const target=createMob(sim.nextId++,def,99,
        {x:actor.pos.x+2,y:actor.pos.y,z:actor.pos.z+2});
      target.hostile=true;
      target.facing=Math.atan2(actor.pos.x-target.pos.x,actor.pos.z-target.pos.z);
      sim.addEntity(target);
      actor.facing=Math.atan2(target.pos.x-actor.pos.x,target.pos.z-actor.pos.z);
      sim.targetEntity(target.id,pid);
      sim.startAutoAttack(pid);
      const action=CLASS_ACTION[cls].find(id=>meta.known.some(a=>a.def.id===id))??'';
      let tick=0;
      const limit=Math.ceil(25/DT),interval=Math.max(1,Math.floor(2.5/DT));
      const startHP=actor.maxHp;
      for(;tick<limit&&!actor.dead&&!target.dead;tick++){
        if(action&&tick%interval===0)sim.castAbility(action,pid);
        sim.tick();
      }
      const state=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      const row={
        cls,weapon,chest,monster,action:action||'NONE',
        elapsedSeconds:Math.round(tick*DT*100)/100,
        result:(target.dead&&!actor.dead?'WIN':actor.dead?'LOSS':'TIMEOUT') as
          'WIN'|'LOSS'|'TIMEOUT',
        startHP,endHP:Math.max(0,actor.hp),mobHP:Math.max(0,target.hp),
        trainingUnaffected:JSON.stringify(state.trainingProfile)===JSON.stringify(profile),
      };
      expect(state.level).toBe(99);
      expect(row.trainingUnaffected).toBe(true);
      expect(row.elapsedSeconds).toBeGreaterThanOrEqual(0);
      rows.push(row);
    }
    expect(rows).toHaveLength(9);
    const totals=Object.fromEntries(['WIN','LOSS','TIMEOUT'].map(outcome=>[
      outcome,rows.filter(r=>r.result===outcome).length]));
    const report={
      status:'DEV7_NATIVE_LV99_CAPTAIN_QA_NOT_HUMAN_BALANCE_CERTIFICATION',
      gear:'P13 native LV90 weapon + P16 native LV90 chest TEST LOADOUT; not rewarded',
      hunter:'Original single Sim, nine original classes, LV99 via TEST fixture',
      combat:'Real 25-second cap Sim.tick with native AI and one selected known class skill',
      missingHumanFeatures:'No real parry/dodge/manual healing/movement optimization',
      extended100Plus:false,totals,rows,
    };
    writeFileSync('../highfly_golden_dev7_lv99_native_captain_combat_gear.json',
      JSON.stringify(report,null,2)+'\n','utf8');
    console.info('HF_GOLDEN_DEV7_LV99_9_CLASS_NATIVE_CAPTAIN_BASELINE='+
      JSON.stringify({totals,classes:rows.length,
        p13Gear:true,p16Chest:true,trainingUnchanged:rows.every(x=>x.trainingUnaffected),
      }));
  },180000);
});
