/** HIGHFLY P08: real donor corpse -> craft reagent -> native weapon forge -> native
 * Jewelcrafting elemental gem -> actual equipped item copy -> original save/relog.
 *
 * Prerequisite fixtures ONLY: LV21, profession skills, trainer recipes, iron ore,
 * vendor flux, crafting fee and the gem's copper/dust prerequisites. To avoid
 * relying on RNG in CI, the wolf's existing 10% rough_hide row is set to 100%
 * in THIS test process; loot rolling/ownership/transfer are still native Sim.
 * This does NOT certify natural acquisition of all materials or full LV1-99.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,ALL_RECIPES,ITEMS,MOBS,STATIONS} from '../src/sim/data';
import {createMob} from '../src/sim/entity';
import {meleeSwing} from '../src/sim/combat/auto_attack';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft,requiredReagentCount} from '../src/sim/professions/crafting';
import {highflyElementalFinisherReady,highflyWeaponElement} from '../src/sim/combat/highfly_elemental_basic';
import {highflyHuntRewardProfiles} from '../src/highfly/monsters/hunt_rewards';

const MOB='hf_hunt_wolf_21';
const SWORD='ironedge_longsword';
const SWORD_RECIPE='recipe_ironedge_longsword';
const GEM='highfly_fire_gem';
const GEM_RECIPE='recipe_highfly_fire_gem';
const forge=STATIONS.find(x=>x.id==='station_eastbrook_forge');
describe('HIGHFLY P08 continuous native monster material -> forged weapon -> fire gem -> relog',()=>{
  it('consumes ONE actual corpse reagent once, creates/equips authentic item and retains its gem',()=>{
    expect(forge).toBeDefined();
    expect(ITEMS[SWORD]?.kind).toBe('weapon');
    const bonus=highflyHuntRewardProfiles(ITEMS,ALL_RECIPES).find(p=>p.mobId===MOB);
    expect(bonus?.itemId).toBe('rough_hide');
    expect(bonus?.recipeIds).toContain(SWORD_RECIPE);
    const original=MOBS[MOB];
    expect(original).toBeDefined();
    expect(original.loot.filter(e=>e.itemId==='rough_hide')).toHaveLength(1);
    MOBS[MOB]={...original,loot:original.loot.map(r=>
      r.itemId==='rough_hide'?{...r,chance:1}:r)};
    try{
      const sim=new Sim({seed:82081,playerClass:'warrior',noPlayer:true,
        autoEquip:false,world:{...BUILTIN_WORLD,camps:[]},
        compulsoryTutorial:false,riftPortals:false});
      const pid=sim.addPlayer('warrior','P08SmithHunter',{tutorialGreetingSent:true});
      sim.setPlayerLevel(21,pid); // QA precondition, NEVER production power grant.
      const hunter=sim.entities.get(pid)!,meta=sim.players.get(pid)!;
      const initialHide=sim.countItem('rough_hide',pid);
      const victim=createMob(sim.nextId++,MOBS[MOB],21,
        {x:hunter.pos.x,y:hunter.pos.y,z:hunter.pos.z+2});
      victim.hp=1; // QA encounter timing, NOT a 3x player-HP multiplier.
      victim.hostile=true;
      sim.addEntity(victim);
      hunter.facing=Math.atan2(victim.pos.x-hunter.pos.x,victim.pos.z-hunter.pos.z);
      sim.targetEntity(victim.id,pid);
      for(let n=0;n<90&&!victim.dead;n++)meleeSwing(sim.ctx,hunter,victim,0,null,{});
      expect(victim.dead).toBe(true);
      expect(victim.lootable).toBe(true);
      const copperBefore=meta.copper;
      expect(sim.lootCorpse(victim.id,pid)).toBe(true);
      expect(sim.countItem('rough_hide',pid)).toBe(initialHide+1);
      expect(meta.copper).toBeGreaterThan(copperBefore);
      expect(sim.lootCorpse(victim.id,pid)).toBe(false);
      expect(sim.countItem('rough_hide',pid)).toBe(initialHide+1);

      // Licensed trainer/crafting prerequisites belong to the fixture; the
      // crucial rough_hide consumed below came ONLY from the native corpse.
      meta.knownRecipes.add(SWORD_RECIPE);
      meta.knownRecipes.add(GEM_RECIPE);
      meta.craftSkills.weaponcrafting=75;
      meta.craftSkills.jewelcrafting=75;
      meta.copper=Math.max(meta.copper,1000); // forge fee prerequisite only
      const swordRecipe=recipeById(SWORD_RECIPE)!;
      const gemRecipe=recipeById(GEM_RECIPE)!;
      expect(swordRecipe).toMatchObject({professionId:'weaponcrafting',resultItemId:SWORD,stationType:'forge'});
      expect(gemRecipe).toMatchObject({professionId:'jewelcrafting',resultItemId:GEM,stationType:'forge'});
      const addMissing=(recipe:typeof swordRecipe)=>{
        for(const reagent of recipe.reagents){
          if(reagent.itemId==='rough_hide')continue; // MUST use killed wolf drop
          const due=requiredReagentCount(meta,reagent,meta.craftSkills,recipe.professionId).count;
          const present=sim.countItem(reagent.itemId,pid);
          if(present<due)sim.addItem(reagent.itemId,due-present,pid);
        }
      };
      addMissing(swordRecipe);
      addMissing(gemRecipe);
      hunter.pos={...sim.groundPos(forge!.pos.x,forge!.pos.z)};
      hunter.prevPos={...hunter.pos};
      const beforeSword=sim.countItem(SWORD,pid);
      const beforeHide=sim.countItem('rough_hide',pid);
      const result=resolveCraft(sim.ctx,pid,SWORD_RECIPE);
      expect(result.ok,JSON.stringify(result)).toBe(true);
      expect(sim.countItem(SWORD,pid)).toBe(beforeSword+1);
      const hideDue=requiredReagentCount(meta,
        swordRecipe.reagents.find(r=>r.itemId==='rough_hide')!,
        meta.craftSkills,swordRecipe.professionId).count;
      expect(hideDue).toBe(1);
      expect(sim.countItem('rough_hide',pid)).toBe(beforeHide-1);
      sim.equipItem(SWORD,pid);
      expect(meta.equipment.mainhand).toBe(SWORD);
      expect(highflyElementalFinisherReady(hunter)).toBe(false);
      const craftedGem=resolveCraft(sim.ctx,pid,GEM_RECIPE);
      expect(craftedGem.ok,JSON.stringify(craftedGem)).toBe(true);
      expect(sim.countItem(GEM,pid)).toBe(1);
      expect(sim.inlayHighflyGem(GEM,pid)).toMatchObject({ok:true,gem:'fire',weaponId:SWORD});
      expect(sim.countItem(GEM,pid)).toBe(0);
      expect(meta.equipmentInstance.mainhand?.highflyGem).toBe('fire');
      expect(highflyWeaponElement(hunter)).toBe('fire');
      expect(highflyElementalFinisherReady(hunter)).toBe(true);

      const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      const next=new Sim({seed:82082,playerClass:'warrior',noPlayer:true,
        autoEquip:false,world:{...BUILTIN_WORLD,camps:[]},
        compulsoryTutorial:false,riftPortals:false});
      const rid=next.addPlayer('warrior','P08SmithHunter',
        {state:saved,tutorialGreetingSent:true});
      const restored=next.serializeCharacter(rid)!;
      expect(restored.level).toBe(21);
      expect(restored.inventory).toEqual(saved.inventory);
      expect(restored.copper).toBe(saved.copper);
      expect(restored.equipmentInstance.mainhand?.highflyGem).toBe('fire');
      expect(next.players.get(rid)?.equipment.mainhand).toBe(SWORD);
      expect(highflyElementalFinisherReady(next.entities.get(rid)!)).toBe(true);
      expect([...next.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
      console.info('HF_P08_CORPSE_TO_NATIVE_FORGE_WEAPON_GEM_SAVE_GREEN='+JSON.stringify({
        mobId:MOB,material:'rough_hide',recipe:SWORD_RECIPE,equipped:SWORD,
        gemRecipe:GEM_RECIPE,element:'fire',nativeSingleLoot:true,rehydrated:true}));
    }finally{MOBS[MOB]=original;}
  });
});
