/** HIGHFLY V4-03 P03 — actual native kill -> corpse -> XP and coins ->
 * inventory -> original CharacterState -> rehydrate.
 *
 * NOT a synthetic 8s timeout duel, a fake DamageEvent, duplicate loot roll
 * or HP x3. All damage is produced by Sim.castAbility/auto-attack during tick.
 * Battle approach is fixture placement, not certified mobile navigation.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,ITEMS,MOBS} from '../src/sim/data';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyMonsterId} from '../src/highfly/monsters/level99';
import {admitHighflyNativeDungeonWave} from '../src/highfly/monsters/hunt_native_dungeon';
import {DT} from '../src/sim/types';

const scenario=HIGHFLY_HUNT_SCENARIOS[0];
const wolf=highflyMonsterId('wolf',21);
const request={
  scenarioId:scenario.id,dungeonId:'hollow_crypt',level:23,mobIds:[wolf],
};
function prepare(seed:number){
  // Claudecraft's true dungeon entry, native XP/loot/inventory authority and
  // normal 1x HP. Strip outdoor camps only for runtime speed; never publish.
  const sim=new Sim({seed,playerClass:'warrior',noPlayer:true,
    world:{...BUILTIN_WORLD,camps:[]},
    compulsoryTutorial:false,riftPortals:false});
  const pid=sim.addPlayer('warrior','NativeHunterP03',{tutorialGreetingSent:true});
  sim.setPlayerLevel(26,pid); // TEST FIXTURE. Entry code cannot increase level.
  const player=sim.entities.get(pid)!, meta=sim.players.get(pid)!;
  // Equip through REAL native item commands and level/class gates, not
  // direct attackPower assignment. No legendary or dev-only weapon.
  const weapons=Object.values(ITEMS).filter(item=>
    item.kind==='weapon' && item.slot==='mainhand' &&
    item.weapon && requiredLevelFor(item)<=26 &&
    (!item.requiredClass || item.requiredClass.includes('warrior')) &&
    item.quality!=='legendary'
  ).sort((a,b)=>{
    const d=(item:typeof a)=>item.weapon?((item.weapon.min+item.weapon.max)/2/item.weapon.speed):0;
    return d(b)-d(a);
  });
  for(const w of weapons.slice(0,20)){
    sim.addItem(w.id,1,pid);
    sim.equipItem(w.id,pid);
    if(meta.equipment.mainhand===w.id)break;
  }
  expect(meta.equipment.mainhand).toBeTruthy();
  expect(sim.enterDungeon('hollow_crypt',pid)).toBe(true);
  const admission=admitHighflyNativeDungeonWave(sim,pid,request);
  expect(admission.ok).toBe(true);
  if(!admission.ok)throw Error(admission.reason);
  const mob=sim.entities.get(admission.spawnedIds[0])!;
  expect(mob.templateId).toBe(wolf);
  // Test spawn-proximity fixture, NOT a claim of a world-navigation proof.
  player.pos=sim.groundPos(mob.pos.x-2,mob.pos.z-1);
  player.prevPos={...player.pos};
  sim.rebucket(player);
  player.facing=Math.atan2(mob.pos.x-player.pos.x,mob.pos.z-player.pos.z);
  sim.targetEntity(mob.id,pid);
  sim.startAutoAttack(pid);
  return {sim,pid,player,meta,mob,weapon:meta.equipment.mainhand};
}
describe('HIGHFLY V4-03 P03: real dungeon mob lifecycle, one Hunter and original save',()=>{
  it('native attacks kill a real HF mob, grant XP and a lootable corpse with original wallet persistence',()=>{
    expect(MOBS[wolf]).toBeDefined();
    const {sim,pid,player,meta,mob,weapon}=prepare(203019);
    const beforeXp=meta.lifetimeXp;
    const beforeCopper=meta.copper;
    const beforeInv=sim.serializeCharacter(pid)!.inventory;
    const known=meta.known.map(a=>a.def.id);
    const skill=['mortal_strike','slam','heroic_strike','rend'].find(x=>known.includes(x));
    let outgoing=0, incoming=0;
    const maxTicks=Math.floor(160/DT);
    let ticks=0;
    for(;ticks<maxTicks && !mob.dead && !player.dead;ticks++){
      if(skill && ticks%Math.round(2.5/DT)===0)sim.castAbility(skill,pid);
      const events=sim.tick();
      for(const e of events){
        if(e.type==='damage'&&e.sourceId===pid&&e.targetId===mob.id&&e.amount>0)outgoing++;
        if(e.type==='damage'&&e.sourceId===mob.id&&e.targetId===pid&&e.amount>0)incoming++;
      }
    }
    const result={mobDead:mob.dead,hunterDead:player.dead,level:player.level,
      hpStart:player.maxHp,hpFinal:player.hp,monsterLevel:mob.level,
      weapon,skill:skill??'AUTO_ONLY',nativeOutgoingEvents:outgoing,
      nativeIncomingEvents:incoming,
      seconds:Math.round(ticks*DT*100)/100,
      xpBefore:beforeXp,xpAfter:meta.lifetimeXp,lootable:mob.lootable,
      copperOnCorpse:mob.loot?.copper??null,
      itemsOnCorpse:mob.loot?.items.map(s=>({id:s.itemId,count:s.count}))??[]};
    console.info('V403_P03_NATIVE_KILL_TRACE='+JSON.stringify(result));
    expect(outgoing).toBeGreaterThan(0);
    expect(result.mobDead).toBe(true);
    expect(result.hunterDead).toBe(false);
    expect(meta.lifetimeXp).toBeGreaterThan(beforeXp);
    // Donor corpse lifecycle determines when looting becomes available.
    for(let i=0;i<150 && !mob.lootable;i++)sim.tick();
    const walletPreLoot=meta.copper;
    const firstClaim=sim.lootCorpse(mob.id,pid);
    // Autoloot can claim while tick() runs; accepted only if original
    // player's WALLET actually increased (guaranteed corpse copper).
    expect(meta.copper).toBeGreaterThan(beforeCopper);
    expect(firstClaim||meta.copper>walletPreLoot).toBe(true);
    const afterOne=meta.copper;
    expect(sim.lootCorpse(mob.id,pid)).toBe(false);
    expect(meta.copper).toBe(afterOne);
    const saved=sim.serializeCharacter(pid)!;
    expect(saved.level).toBe(26);
    expect(saved.copper).toBe(afterOne);
    expect(saved.inventory).toEqual(sim.serializeCharacter(pid)!.inventory);
    expect(saved.inventory.length).toBeGreaterThanOrEqual(beforeInv.length);
    // Native dungeon exit can be locked by combat: a finished kill removes
    // the HF foe and should permit ordinary donor leave.
    expect(sim.leaveDungeon(pid)).toBe(true);
    const rejoin=new Sim({seed:203019,playerClass:'warrior',noPlayer:true,
      world:{...BUILTIN_WORLD,camps:[]},riftPortals:false,compulsoryTutorial:false});
    const newId=rejoin.addPlayer('warrior','NativeHunterP03',{
      state:sim.serializeCharacter(pid)!,tutorialGreetingSent:true,
    });
    const restored=rejoin.serializeCharacter(newId)!;
    expect(restored.level).toBe(26);
    expect(restored.xp).toBe(sim.serializeCharacter(pid)!.xp);
    expect(restored.copper).toBe(afterOne);
    expect(restored.inventory).toEqual(sim.serializeCharacter(pid)!.inventory);
    expect(restored.gatheringProficiency).toEqual(sim.serializeCharacter(pid)!.gatheringProficiency);
    expect([...rejoin.entities.values()].filter(x=>x.kind==='player')).toHaveLength(1);
    console.info('V403_P03_NATIVE_KILL_LOOT_SAVE_REAL_GREEN='+JSON.stringify({
      xpGain:meta.lifetimeXp-beforeXp,copperGain:afterOne-beforeCopper,
      originalHunter:true,realNativeLoot:true,saveRehydrated:true}));
  });
});
