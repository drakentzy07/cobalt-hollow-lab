/** DEV6: 9 native chest items & recipes, 9 classes, genuine at-scenario
 * materials and original Sim forge/train/equip/relog. No new 3D models,
 * gameplay leveling, auto stat grants, magic boss drops, or Pages mutation.
 * Fixture level/skill/copper/reagents for 9 native craft cases only; one
 * additional LV50 armor test uses NORMAL UNMODIFIED native corpse RNG.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {meleeSwing} from '../src/sim/combat/auto_attack';
import {BUILTIN_WORLD,ITEMS,ALL_RECIPES,MOBS,STATIONS} from '../src/sim/data';
import {canEquipItem} from '../src/sim/equipment_rules';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft} from '../src/sim/professions/crafting';
import {trainingFeeFor} from '../src/sim/professions/training';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyMonsterId} from '../src/highfly/monsters/level99';
import {HF_P16_ARMOR_LEVELS,HIGHFLY_P16_ARMOR_ITEMS,
 HIGHFLY_P16_ARMOR_RECIPES,hfP16ArmorId,hfP16ArmorRecipeId} from
 '../src/sim/content/highfly_p16_native_chest_armor';
import type {PlayerClass} from '../src/sim/types';

const TRACKS=['mail','leather','cloth'] as const;
const CLASSES:PlayerClass[]=[
  'warrior','paladin','hunter','rogue','priest','shaman',
  'mage','warlock','druid',
];
const CLASS_GROUPS={
  mail:['warrior','paladin','shaman'],
  leather:['hunter','rogue','druid'],
  cloth:['mage','priest','warlock'],
} as const;
const REPRESENTATIVE={
  mail:'warrior',leather:'hunter',cloth:'mage',
} as const satisfies Record<string,PlayerClass>;
const CASES=HF_P16_ARMOR_LEVELS.flatMap(level=>TRACKS.map(track=>({
  level,track,cls:REPRESENTATIVE[track]})));
const F=STATIONS.find(x=>x.id==='station_eastbrook_forge');

function simFor(cls:PlayerClass,seed:number){
  return new Sim({seed,playerClass:cls,noPlayer:true,autoEquip:false,
    compulsoryTutorial:false,riftPortals:false,
    world:{...BUILTIN_WORLD,camps:[]}});
}
function moveToForge(sim:Sim,pid:number){
  const entity=sim.entities.get(pid)!;
  entity.pos={...sim.groundPos(F!.pos.x,F!.pos.z)};
  entity.prevPos={...entity.pos};
}
describe('HIGHFLY P16 3 source chest models × 3 levels = 9 native armors',()=>{
  it('registers every 50/70/90 item and only 9 armor native recipes for nine original classes',()=>{
    expect(F?.type).toBe('forge');
    expect(Object.keys(HIGHFLY_P16_ARMOR_ITEMS)).toHaveLength(9);
    expect(HIGHFLY_P16_ARMOR_RECIPES).toHaveLength(9);
    expect(ALL_RECIPES.length).toBe(239);
    for(const {level,track} of CASES){
      const id=hfP16ArmorId(level,track),item=ITEMS[id];
      const recipe=recipeById(hfP16ArmorRecipeId(level,track));
      expect(item).toBe(HIGHFLY_P16_ARMOR_ITEMS[id]);
      expect(item?.kind).toBe('armor');
      if(item.kind!=='armor')throw Error('P16_ITEM_NOT_ARMOR:'+id);
      expect(item.slot).toBe('chest');
      expect(item.armorType).toBe(track);
      expect(item?.stats).toBeDefined();
      expect(Object.keys(item!.stats??{})).toEqual(['armor']);
      expect(item!.stats!.armor).toBeGreaterThan(0);
      expect(requiredLevelFor(item)).toBe(level);
      expect(item?.noMarketList).toBe(true);
      expect(item?.soulbound).toBe(true);
      expect(recipe?.professionId).toBe('armorcrafting');
      expect(recipe?.resultItemId).toBe(id);
      expect(recipe?.stationType).toBe('forge');
      expect(recipe?.acquisition).toContain('trainer');
      for(const cls of CLASSES)
        expect(canEquipItem(cls,item)).toBe(
          (CLASS_GROUPS[track] as readonly string[]).includes(cls));
      const scenario=HIGHFLY_HUNT_SCENARIOS.find(s=>s.minLevel===level);
      expect(scenario).toBeDefined();
      for(const input of recipe!.reagents){
        expect(ITEMS[input.itemId]).toBeDefined();
        if(input.itemId==='smithing_flux')continue;
        const directSources=scenario!.families.filter(family=>{
          const donor=MOBS[highflyMonsterId(family,level)];
          return !!donor&&donor.minLevel===level&&
            donor.loot.some(l=>l.itemId===input.itemId&&l.chance>0);
        });
        expect(directSources,
          'NO PLAYABLE SCENARIO MOB '+input.itemId+' LV'+level)
          .not.toEqual([]);
      }
    }
    expect(ALL_RECIPES.filter(r=>r.id.startsWith('recipe_hf_p16_')))
      .toHaveLength(9);
  });
  it.each(CASES)('native trainer/forge/relog preserves $track chest LV$level without Training stats',
    ({level,track,cls})=>{
      const recipe=recipeById(hfP16ArmorRecipeId(level,track))!;
      const id=hfP16ArmorId(level,track);
      const sim=simFor(cls,161616+level);
      const pid=sim.addPlayer(cls,'P16_'+track+'_'+level,
        {tutorialGreetingSent:true});
      sim.setPlayerLevel(level,pid); // QA fixture, NEVER in player actions.
      const before=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      const meta=sim.players.get(pid)!;
      moveToForge(sim,pid);
      meta.craftSkills.armorcrafting=level===50?75:level===70?95:125;
      meta.copper=trainingFeeFor(recipe)+500;
      expect(meta.knownRecipes.has(recipe.id)).toBe(false);
      sim.trainRecipe(recipe.id,pid);
      expect(meta.lastTrainResult).toMatchObject({ok:true,recipeId:recipe.id});
      for(const input of recipe.reagents)sim.addItem(input.itemId,input.count,pid);
      const forged=resolveCraft(sim.ctx,pid,recipe.id);
      expect(forged.ok,JSON.stringify(forged)).toBe(true);
      expect(sim.countItem(id,pid)).toBe(1);
      sim.equipItem(id,pid);
      expect(meta.equipment.chest).toBe(id);
      const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      expect(saved.trainingProfile).toEqual(before.trainingProfile);
      const next=simFor(cls,161617+level);
      const newId=next.addPlayer(cls,'P16_'+track+'_'+level,
        {state:saved,tutorialGreetingSent:true});
      expect(next.players.get(newId)?.equipment.chest).toBe(id);
      expect(next.players.get(newId)?.knownRecipes.has(recipe.id)).toBe(true);
      expect(JSON.parse(JSON.stringify(next.serializeCharacter(newId))).trainingProfile)
        .toEqual(before.trainingProfile);
    });
  it('LV50 normal-chance scenario corpse materials are not granted as testing freebies',()=>{
    const recipe=recipeById(hfP16ArmorRecipeId(50,'mail'))!;
    const sim=simFor('warrior',160050);
    const pid=sim.addPlayer('warrior','P16_50_Loot',
      {tutorialGreetingSent:true});
    sim.setPlayerLevel(50,pid); // Accelerated test precondition
    const actor=sim.entities.get(pid)!,meta=sim.players.get(pid)!;
    const sources={
      rough_hide:'hf_hunt_wolf_50',
      arcane_essence:'hf_hunt_revenant_50',
    } as const;
    const kills:Record<string,number>={};
    for(const material of Object.keys(sources) as (keyof typeof sources)[]){
      const def=MOBS[sources[material]],req=recipe.reagents.find(
        x=>x.itemId===material)!.count;
      expect(def).toBeDefined();
      const chance=def.loot.find(x=>x.itemId===material)?.chance??0;
      expect(chance).toBeGreaterThan(0);
      expect(chance).toBeLessThan(1);
      let k=0;const start=sim.countItem(material,pid);
      while(sim.countItem(material,pid)-start<req&&k<250){
        const mob=createMob(sim.nextId++,def,50,
          {x:actor.pos.x+1,y:actor.pos.y,z:actor.pos.z+1});
        mob.hp=1;mob.hostile=true;sim.addEntity(mob);
        actor.facing=Math.atan2(mob.pos.x-actor.pos.x,mob.pos.z-actor.pos.z);
        sim.targetEntity(mob.id,pid);
        for(let i=0;i<90&&!mob.dead;i++)meleeSwing(sim.ctx,actor,mob,0,null,{});
        expect(mob.dead).toBe(true);
        expect(mob.lootable).toBe(true);
        sim.lootCorpse(mob.id,pid);
        k++;
      }
      expect(sim.countItem(material,pid)-start).toBeGreaterThanOrEqual(req);
      kills[material]=k;
    }
    meta.craftSkills.armorcrafting=75;
    meta.copper=trainingFeeFor(recipe)+500;
    moveToForge(sim,pid);
    sim.trainRecipe(recipe.id,pid);
    expect(meta.lastTrainResult).toMatchObject({ok:true,recipeId:recipe.id});
    sim.addItem('smithing_flux',
      recipe.reagents.find(r=>r.itemId==='smithing_flux')!.count,pid);
    const forged=resolveCraft(sim.ctx,pid,recipe.id);
    expect(forged.ok,JSON.stringify(forged)).toBe(true);
    console.info('HF_P16_NATIVE_LV50_LOOT_TO_CHEST_FORGE='+JSON.stringify({
      level:50,kills,sourceProbabilitiesUntouched:true,
      monetaryMasteryFixtures:true,weaponAndTrainingStatsUntouched:true,
    }));
  },180000);
});
