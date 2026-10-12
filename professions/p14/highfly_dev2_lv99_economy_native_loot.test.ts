/** GOLDEN DEV2: audit the WHOLE original+HIGHFLY 1–99 economy and prove
 * ONE honest LV50 monster→loot→trainer→forge→equip→save loop.
 * No new content tables, no donor monkey-patching, no production XP/stat grants.
 * Melee time, LV50 Hunter, crafting mastery and purchased flux are QA fixtures.
 * Corpse materials come ONLY from authentic low-probability native loot rolls.
 * Not a natural LV1→99 walkthrough or full 9-class balance certification.
 */
import {describe,it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {meleeSwing} from '../src/sim/combat/auto_attack';
import {BUILTIN_WORLD,ITEMS,ALL_RECIPES,MOBS,STATIONS} from '../src/sim/data';
import {MAX_LEVEL} from '../src/sim/types';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft} from '../src/sim/professions/crafting';
import {trainingFeeFor} from '../src/sim/professions/training';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {HF_P13_WEAPON_LEVELS,hfP13ItemId,hfP13RecipeId} from
  '../src/sim/content/highfly_lv99_native_equipment';
import {HIGHFLY_PF6_EXTENDED_ENABLED} from
  '../src/highfly/training/pf6_xp_curve';

const BANDS:[[number,number],...[number,number][]]=[
  [1,9],[10,19],[20,20],[21,29],[30,39],[40,49],
  [50,59],[60,69],[70,79],[80,89],[90,99],
];
const TRACKS=['warrior','scout','caster'] as const;
const VENDOR_ONLY=new Set(['smithing_flux']);
const FORGE=STATIONS.find(s=>s.id==='station_eastbrook_forge');
const MATERIALS=['rough_hide','arcane_essence'] as const;
const NATIVE_MOBS={rough_hide:'hf_hunt_wolf_50',
  arcane_essence:'hf_hunt_revenant_50'} as const;

describe('HIGHFLY GOLDEN DEV2 reuse-first 1–99 loot/equipment economy',()=>{
  it('audits every level and every existing P13 recipe against live native source tables',()=>{
    expect(MAX_LEVEL).toBe(99);
    expect(HIGHFLY_PF6_EXTENDED_ENABLED).toBe(false);
    expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
    expect(HF_P13_WEAPON_LEVELS).toEqual([50,60,70,80,90]);
    expect(new Set(BANDS.flatMap(([lo,hi])=>Array.from(
      {length:hi-lo+1},(_,i)=>lo+i))).size).toBe(99);
    const mobs=Object.values(MOBS).filter(m=>!m.dummy&&!m.ambient);
    const hf=mobs.filter(m=>m.id.startsWith('hf_hunt_'));
    const bands=BANDS.map(([from,to])=>{
      const overlapping=mobs.filter(m=>m.minLevel<=to&&m.maxLevel>=from);
      const registered=hf.filter(m=>m.minLevel<=to&&m.maxLevel>=from);
      const scenario=HIGHFLY_HUNT_SCENARIOS.filter(s=>
        s.minLevel<=to&&s.maxLevel>=from);
      const newRecipes=ALL_RECIPES.filter(r=>
        typeof r.level==='number'&&r.level>=from&&r.level<=to);
      const newCrafts=newRecipes.filter(r=>
        ITEMS[r.resultItemId]?.kind==='weapon'||
        ITEMS[r.resultItemId]?.kind==='armor');
      return {from,to,mobs:overlapping.length,hfMobs:registered.length,
        scenarios:scenario.map(s=>s.id),newRecipes:newRecipes.length,
        newGearRecipes:newCrafts.length,
        originalTerrainProtected:to<=20,
        holes:[
          ...(overlapping.length===0?['NO_NATIVE_MOBS']:[]),
          ...(from>=21&&registered.length===0?['NO_HIGHFLY_MOBS']:[]),
          ...(newRecipes.length===0?['NO_NEW_NOMINAL_RECIPES']:[]),
          ...(newCrafts.length===0?['NO_NEW_NOMINAL_GEAR_RECIPES']:[]),
        ]};
    });
    for(const row of bands){
      expect(row.mobs).toBeGreaterThan(0);
      if(row.from>=21){
        expect(row.hfMobs).toBeGreaterThan(0);
        expect(row.scenarios.length).toBeGreaterThan(0);
      }
    }
    const gear=HF_P13_WEAPON_LEVELS.flatMap(level=>
      TRACKS.map(track=>{
        const recipe=recipeById(hfP13RecipeId(level,track));
        const output=ITEMS[hfP13ItemId(level,track)];
        expect(recipe).toBeDefined();
        expect(output?.kind).toBe('weapon');
        expect(recipe!.acquisition).toContain('trainer');
        const reagents=recipe!.reagents.map(ing=>{
          const possible=mobs.filter(m=>
            m.id.startsWith('hf_hunt_')&&m.minLevel<=level&&m.maxLevel>=level&&
            m.loot.some(l=>l.itemId===ing.itemId&&l.chance>0))
            .map(m=>({mob:m.id,chance:Math.max(...m.loot.filter(l=>
              l.itemId===ing.itemId).map(l=>l.chance))}));
          const vendor=VENDOR_ONLY.has(ing.itemId);
          if(!vendor)expect(possible.length,
            'NO REAL AT-LEVEL DROP: '+ing.itemId+' LV'+level).toBeGreaterThan(0);
          const bestChance=possible.reduce((v,p)=>Math.max(v,p.chance),0);
          return {material:ing.itemId,quantity:ing.count,vendor,
            atLevelNativeSources:possible,
            estimatedKillsAtBestSource:vendor?null:Math.ceil(ing.count/bestChance)};
        });
        return {level,track,recipeId:recipe!.id,output:output.id,
          reagents,estimatedKillsExcludingVendor:reagents.reduce((n,r)=>
            n+(r.estimatedKillsAtBestSource??0),0)};
      }));
    const report={
      status:'DEV2_AUDITED_NOT_BALANCE_CERTIFIED',
      sharedSim:true,originalDonorUntouched:true,level99Normal:true,
      extended100PlusEnabled:false,
      bands,bandCount:bands.length,
      missingNominalGearBands:bands.filter(x=>x.newGearRecipes===0)
        .map(x=>x.from+'-'+x.to),
      gear,gearCount:gear.length,
      risks:[
        'Nominal recipe level is NOT proof of NPC access or legal materials per play session.',
        'Expected kill counts use native per-mob loot chance; do not assume pity/deterministic drops.',
        'NPC vendor smithing_flux and profession skill progression still need natural economy E2E.',
        'LV1-20 must retain original donor encounters and gear, not duplicate them.',
        'Physical S23, real XP leveling pace and nine-class combat balance remain unverified.',
      ]};
    writeFileSync('../highfly_golden_dev2_1_99_band_economy_audit.json',
      JSON.stringify(report,null,2)+'\n','utf8');
    console.info('HF_GOLDEN_DEV2_99_BAND_ECONOMY_REPORT='+JSON.stringify({
      bands:report.bandCount,gear:report.gearCount,
      missingGearNominal:report.missingNominalGearBands,
      expectedKillsByLevel:Object.fromEntries(HF_P13_WEAPON_LEVELS.map(l=>[
        l,gear.find(g=>g.level===l)?.estimatedKillsExcludingVendor])),
      maximumEstimatedKills:Math.max(...gear.map(g=>g.estimatedKillsExcludingVendor)),
    }));
    expect(gear).toHaveLength(15);
  });

  it('gets normal-chance LV50 corpse drops, trains, forges, equips and reloads WITHOUT gifted mob reagents',()=>{
    expect(FORGE?.type).toBe('forge');
    const level=50,recipeId=hfP13RecipeId(level,'warrior');
    const output=hfP13ItemId(level,'warrior');
    const recipe=recipeById(recipeId)!;
    expect(recipe).toBeDefined();
    expect(recipe.reagents.map(x=>x.itemId).sort()).toEqual([
      'arcane_essence','rough_hide','smithing_flux'].sort());
    const sim=new Sim({seed:20261012,playerClass:'warrior',noPlayer:true,
      autoEquip:false,world:{...BUILTIN_WORLD,camps:[]},
      compulsoryTutorial:false,riftPortals:false});
    const pid=sim.addPlayer('warrior','GOLDEN_DEV2_NATIVE',
      {tutorialGreetingSent:true});
    sim.setPlayerLevel(level,pid); // TEST FIXTURE ONLY, no production level grant.
    const hunter=sim.entities.get(pid)!;
    const meta=sim.players.get(pid)!;
    const before=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    const kills:Record<string,number>={};
    // No change to MOBS, loot probabilities or reward registrations.
    // Only the target's HP=1 and spawn point accelerate this CI encounter loop.
    function farm(material:typeof MATERIALS[number],limit:number){
      const mobId=NATIVE_MOBS[material],def=MOBS[mobId];
      expect(def, 'P02I native mob missing '+mobId).toBeDefined();
      expect(def.minLevel).toBe(50);
      const chance=def.loot.find(l=>l.itemId===material)?.chance??0;
      expect(chance).toBeGreaterThan(0);
      expect(chance).toBeLessThan(1);
      const need=recipe.reagents.find(r=>r.itemId===material)!.count;
      const initial=sim.countItem(material,pid);
      let count=0;
      while(sim.countItem(material,pid)-initial<need&&count<limit){
        const target=createMob(sim.nextId++,def,level,{
          x:hunter.pos.x+1,y:hunter.pos.y,z:hunter.pos.z+1});
        target.hp=1; // Time compression fixture, NOT a revised monster balance.
        target.hostile=true;
        sim.addEntity(target);
        hunter.facing=Math.atan2(target.pos.x-hunter.pos.x,target.pos.z-hunter.pos.z);
        sim.targetEntity(target.id,pid);
        for(let n=0;n<90&&!target.dead;n++)
          meleeSwing(sim.ctx,hunter,target,0,null,{});
        expect(target.dead,'CI accelerated native kill failed '+mobId).toBe(true);
        expect(target.lootable).toBe(true);
        sim.lootCorpse(target.id,pid); // Donor loot roll/corpse/ownership/inventory.
        count++;
      }
      kills[material]=count;
      expect(sim.countItem(material,pid)-initial,
        'NATURAL_CHANCE_LOOT_INSUFFICIENT '+mobId).toBeGreaterThanOrEqual(need);
    }
    farm('rough_hide',180);
    farm('arcane_essence',220);
    expect(sim.countItem(output,pid)).toBe(0);
    expect(meta.knownRecipes.has(recipeId)).toBe(false);
    hunter.pos={...sim.groundPos(FORGE!.pos.x,FORGE!.pos.z)};
    hunter.prevPos={...hunter.pos};
    meta.craftSkills.weaponcrafting=75; // Profession skill fixture, NOT real grind.
    const fee=trainingFeeFor(recipe);
    meta.copper=Math.max(meta.copper,fee+100000); // Trainer+forge fee fixture.
    sim.trainRecipe(recipeId,pid);
    expect(meta.lastTrainResult).toMatchObject({ok:true,recipeId});
    // Smithing flux is explicitly a VENDOR good; never pretend it is a mob drop.
    sim.addItem('smithing_flux',
      recipe.reagents.find(x=>x.itemId==='smithing_flux')!.count,pid);
    const materialCountsBefore=Object.fromEntries(MATERIALS.map(m=>
      [m,sim.countItem(m,pid)]));
    const crafted=resolveCraft(sim.ctx,pid,recipeId);
    expect(crafted.ok,JSON.stringify(crafted)).toBe(true);
    expect(sim.countItem(output,pid)).toBe(1);
    for(const material of MATERIALS)
      expect(sim.countItem(material,pid)).toBeLessThan(materialCountsBefore[material]);
    sim.equipItem(output,pid);
    expect(meta.equipment.mainhand).toBe(output);
    const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    expect(saved.trainingProfile).toEqual(before.trainingProfile);
    const restored=new Sim({seed:20261013,playerClass:'warrior',noPlayer:true,
      autoEquip:false,world:{...BUILTIN_WORLD,camps:[]},
      compulsoryTutorial:false,riftPortals:false});
    const npid=restored.addPlayer('warrior','GOLDEN_DEV2_NATIVE',
      {state:saved,tutorialGreetingSent:true});
    const reloaded=JSON.parse(JSON.stringify(restored.serializeCharacter(npid)));
    expect(restored.players.get(npid)?.equipment.mainhand).toBe(output);
    expect(restored.players.get(npid)?.knownRecipes.has(recipeId)).toBe(true);
    expect(reloaded.trainingProfile).toEqual(before.trainingProfile);
    expect([...restored.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
    console.info('HF_GOLDEN_DEV2_AUTHENTIC_RNG_LOOT_TO_FORGE_SAVE='+JSON.stringify({
      level,source:NATIVE_MOBS,kills,output,realChanceNotOverridden:true,
      trainingAndVendorInputsFixture:true,productionStateUnmodified:true,
    }));
  },180000);
});
