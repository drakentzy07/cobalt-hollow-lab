/** HIGHFLY V3-05: one persistent Hunter across ALL four certified systems.
 * Actual donor Sim: harvest cast, station-gated crafting cast, equip,
 * melee damage/death, native loot, CharacterState save/load, PF-6 mirror.
 * No game-source changes; no grants of loot, crafted weapons or Training points.
 *
 * Test fixtures only: equipped starter gathering tools, purchased-flux
 * prerequisite, a learned recipe and LV10. Real trainer/vendor/player levelling
 * UX remains outside this E2E and must be certified before public release.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { MOBS, STATIONS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { meleeSwing } from '../src/sim/combat/auto_attack';
import { recipeById } from '../src/sim/content/recipes';
import { Sim } from '../src/sim/sim';
import { createHighflyHunterProfile } from '../src/highfly/training/core';
import {
  clearActiveHighflyHunterProfile, getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';
import { syncHighflyPf6FromGameplay } from '../src/highfly/training/pf6_progression_sync';
import { placeAtHarvestSpot } from './helpers/harvest_spot';

const RECIPE='recipe_copper_bearded_axe';
const AXE='copper_bearded_axe';
const nodes=(stem:string)=>Array.from({length:6},(_,i)=>stem+(i+1));

afterEach(()=>clearActiveHighflyHunterProfile());

describe('HIGHFLY V3-05 single Hunter integrated journey (native donor + Training mirror)',()=>{
  it('preserves one class, wallet and inventory across gather, forge, kill, loot, PF6 sync and relog',()=>{
    const sim=new Sim({seed:42,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const pid=sim.addPlayer('warrior','OneHunter');
    sim.setPlayerLevel(10,pid); // fixture: item-level gate, NOT earned gameplay XP
    const actor=sim.entities.get(pid),meta=sim.players.get(pid);
    if(!actor||!meta)throw new Error('Missing authentic player');

    const hunter=createHighflyHunterProfile({profileId:'v3-05-one-hunter',classId:'warrior',level:actor.level});
    setActiveHighflyHunterProfile(hunter);
    expect(hunter.training.points).toMatchObject({earned:0,available:0});
    expect(actor.templateId).toBe('warrior');
    const pristineCore=JSON.stringify(hunter.training.core);
    const pristineWallet=JSON.stringify(hunter.training.points);
    const startingCoins=meta.copper;

    // Explicit prerequisite fixtures. All raw materials and the axe MUST
    // be created only by the original gather and crafting resolvers.
    sim.addItem('copper_mining_pick',1,pid);
    sim.addItem('handaxe',1,pid);
    sim.addItem('smithing_flux',1,pid);
    const recipe=recipeById(RECIPE);
    expect(recipe).toBeDefined();
    expect(recipe?.stationType).toBe('forge');
    meta.knownRecipes.add(RECIPE);
    expect(sim.countItem('copper_ore',pid)).toBe(0);
    expect(sim.countItem('ironbark_log',pid)).toBe(0);
    expect(sim.countItem(AXE,pid)).toBe(0);

    let gatherCount=0;
    for(const node of [...nodes('ore_eastbrook_'),...nodes('wood_eastbrook_')]){
      placeAtHarvestSpot(sim,pid,node);
      expect(sim.harvestNode(node,undefined,pid),node+' not gatherable').toBe(true);
      const p=sim.entities.get(pid),m=sim.players.get(pid);
      if(!p||!m)throw Error('Native gather cast lost its Hunter');
      p.castingAbility=null; p.castRemaining=0;
      sim.ctx.completeGatherCast(p,m);
      gatherCount+=sim.drainEvents().filter(x=>x.type==='gatherResult').length;
    }
    expect(gatherCount).toBe(12);
    const ore=sim.countItem('copper_ore',pid),wood=sim.countItem('ironbark_log',pid);
    expect(ore).toBeGreaterThanOrEqual(4);
    expect(wood).toBeGreaterThanOrEqual(2);
    const forge=STATIONS.find(x=>x.id==='station_eastbrook_forge');
    if(!forge)throw Error('Original Eastbrook forge missing');
    actor.pos.x=forge.pos.x;actor.pos.z=forge.pos.z;
    actor.prevPos={...actor.pos};
    sim.craftItem(RECIPE,false,pid,1);
    actor.castingAbility=null;actor.castRemaining=0;
    sim.ctx.completeCraftCast(actor,meta);
    expect(meta.lastCraftResult).toMatchObject({ok:true,itemId:AXE});
    expect(sim.countItem(AXE,pid)).toBe(1);
    expect(sim.countItem('copper_ore',pid)).toBe(ore-4);
    expect(sim.countItem('ironbark_log',pid)).toBe(wood-2);
    sim.equipItem(AXE,pid);
    expect(meta.equipment.mainhand).toBe(AXE);
    expect(sim.countItem(AXE,pid)).toBe(0);

    // Real combat uses the newly equipped Hunter, with a 1-HP wolf test
    // fixture to minimize the fight's duration. Original death + loot code.
    const def=MOBS.forest_wolf;
    expect(def.loot).toContainEqual({copper:8,chance:1});
    const wolf=createMob(sim.nextId++,def,10,{
      x:actor.pos.x,y:actor.pos.y,z:actor.pos.z+2,
    });
    wolf.hp=1;wolf.hostile=true;wolf.aiState='idle';
    sim.addEntity(wolf);
    actor.facing=Math.atan2(wolf.pos.x-actor.pos.x,wolf.pos.z-actor.pos.z);
    sim.targetEntity(wolf.id,pid);
    const beforeXp=meta.xp;
    for(let swing=0;swing<40&&!wolf.dead;swing++)meleeSwing(sim.ctx,actor,wolf,0,null,{});
    expect(wolf.dead).toBe(true);
    const actualXp=meta.xp;
    expect(actualXp).toBeGreaterThanOrEqual(beforeXp); // donor is sole XP authority
    const nativeDrops=wolf.loot?.copper??0;
    expect(nativeDrops).toBeGreaterThan(0);
    expect(meta.copper).toBe(startingCoins);
    expect(sim.lootCorpse(wolf.id,pid)).toBe(true);
    expect(meta.copper).toBe(startingCoins+nativeDrops);
    expect(wolf.loot===null || wolf.loot.copper===0).toBe(true);
    const once=meta.copper;
    sim.lootCorpse(wolf.id,pid);
    expect(meta.copper).toBe(once);

    // PF6 reads settled donor class/level/xp; it must NEVER mint Training
    // points merely for fighting, looting, making gear or gaining RPG XP.
    const mirrored=syncHighflyPf6FromGameplay({
      localEntityId:pid,eventEntityId:pid,classId:'warrior',
      level:actor.level,barXp:meta.xp,
    });
    expect(mirrored?.hunter).toMatchObject({level:actor.level,xp:meta.xp});
    expect(JSON.stringify(mirrored?.training.points)).toBe(pristineWallet);
    expect(JSON.stringify(mirrored?.training.core)).toBe(pristineCore);
    expect(mirrored?.awakening.classId).toBe('warrior');

    // Two distinct original authorities, both saved: donor CharacterState
    // and HIGHFLY Training profile. No re-awakening or double items on relog.
    const donorSave=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    const hunterSave=JSON.parse(JSON.stringify(getActiveHighflyHunterProfile()));
    const reloaded=new Sim({seed:43,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const rid=reloaded.addPlayer('warrior','OneHunter',{state:donorSave});
    clearActiveHighflyHunterProfile();
    setActiveHighflyHunterProfile(hunterSave);
    const rmeta=reloaded.players.get(rid),ractor=reloaded.entities.get(rid);
    if(!rmeta||!ractor)throw Error('Reload lost original Hunter');
    const after=syncHighflyPf6FromGameplay({
      localEntityId:rid,eventEntityId:rid,classId:'warrior',
      level:ractor.level,barXp:rmeta.xp,
    });
    expect(ractor.templateId).toBe('warrior');
    expect(rmeta.equipment.mainhand).toBe(AXE);
    expect(rmeta.knownRecipes.has(RECIPE)).toBe(true);
    expect(reloaded.countItem(AXE,rid)).toBe(0);
    expect(reloaded.countItem('copper_ore',rid)).toBe(ore-4);
    expect(reloaded.countItem('ironbark_log',rid)).toBe(wood-2);
    expect(rmeta.copper).toBe(once);
    expect(after?.hunter.level).toBe(ractor.level);
    expect(after?.hunter.xp).toBe(rmeta.xp);
    expect(after?.awakening.classId).toBe('warrior');
    expect(JSON.stringify(after?.training.points)).toBe(pristineWallet);
    expect(JSON.stringify(after?.training.core)).toBe(pristineCore);
  });
});
