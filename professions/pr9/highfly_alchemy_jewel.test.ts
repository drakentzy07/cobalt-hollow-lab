import {describe,expect,it} from 'vitest';
import {recipeById} from '../src/sim/content/recipes';
import {STATIONS} from '../src/sim/data';
import {resolveCraft} from '../src/sim/professions/crafting';
import {stationsOfType} from '../src/sim/professions/stations';
import {
  ALCHEMY_JEWEL_PILOT,
  highflyAlchemyJewelCatalogValid,highflyAlchemyJewelStatus,
  recordHighflyAlchemyJewelCraft,
} from '../src/sim/professions/highfly_alchemy_jewel';
import {Sim,type PlayerMeta} from '../src/sim/sim';

const make=(seed:number)=>new Sim({seed,playerClass:'warrior',autoEquip:false});
function craft(sim:Sim,id:string,pid=sim.playerId) {
  const recipe=recipeById(id)!;
  expect(recipe, `missing ${id}`).toBeTruthy();
  const meta=sim.players.get(pid) as PlayerMeta;
  if(recipe.acquisition?.includes('trainer'))meta.knownRecipes.add(recipe.id);
  if(recipe.stationType) {
    const station=stationsOfType(STATIONS,recipe.stationType)[0];
    expect(station).toBeTruthy();
    const e=sim.entities.get(pid)!;
    e.pos.x=station.pos.x;e.pos.z=station.pos.z;e.prevPos={...e.pos};
  }
  for(const ing of recipe.reagents)sim.addItem(ing.itemId,ing.count,pid);
  return resolveCraft(sim.ctx,pid,recipe.id);
}

describe('HIGHFLY PR-9: genuine Alchemy + Jewelcrafting Catalyst/Prismglass bridge',()=>{
  it('pins real 75-skill daily Catalyst and 75-skill Prismglass using one catalyst',()=>{
    expect(highflyAlchemyJewelCatalogValid()).toBe(true);
    const a=recipeById(ALCHEMY_JEWEL_PILOT.alchemy.catalyst)!;
    const j=recipeById(ALCHEMY_JEWEL_PILOT.jewelcrafting.setting)!;
    expect(a.skillReq).toBe(75);
    expect(a.oncePerDay).toBe(true);
    expect(a.stationType).toBe('apothecary');
    expect(a.reagents.map(r=>r.itemId)).toEqual([
      'sunpetal_herb','goldleaf_herb','venom_gland','glass_vial']);
    expect(j.skillReq).toBe(75);
    expect(j.stationType).toBe('forge');
    expect(j.reagents.find(r=>r.itemId==='quickening_catalyst')?.count).toBe(1);
    expect(recipeById(ALCHEMY_JEWEL_PILOT.jewelcrafting.advancedLoop)!
      .reagents.find(r=>r.itemId==='prismglass_setting')?.count).toBe(3);
  });

  it('legacy/old saves get NO invented Knowledge, Gem Core, sockets or history',()=>{
    expect(recordHighflyAlchemyJewelCraft(undefined,
      recipeById('recipe_quickening_catalyst')!)).toBeUndefined();
    const status=highflyAlchemyJewelStatus(undefined);
    expect(status.gemCoreImplemented).toBe(false);
    expect(status.socketEngineImplemented).toBe(false);
    expect(status.alchemy.catalystsCreated).toBe(0);
    expect(status.jewelcrafting.prismglassSettings).toBe(0);
    const sim=make(901);
    expect(sim.highflyAlchemyJewelPilotStatus()).toEqual(status);
    expect(sim.serializeCharacter(sim.playerId)!.highflyProfessions).toBeUndefined();
  });

  it('only the exact crafted output earns catalyst/setting evidence; other branches untouched',()=>{
    const state={version:1 as const,craftXp:{alchemy:123,jewelcrafting:88},
      knowledge:['material.retired'],completedTrials:['trial.weaponcrafting.25'],
      evidence:{'something.old':3}};
    const a=recordHighflyAlchemyJewelCraft(state,recipeById('recipe_quickening_catalyst')!)!;
    expect(a.evidence?.['alchemy.catalyst.quickening_crafted']).toBe(1);
    expect(a.knowledge).toEqual(['material.retired','material.quickening_catalyst',
      'technique.quickening_catalysis']);
    expect(a.craftXp).toEqual(state.craftXp);
    expect(a.completedTrials).toEqual(state.completedTrials);
    const j=recordHighflyAlchemyJewelCraft(a,recipeById('recipe_prismglass_setting')!)!;
    expect(j.evidence?.['jewelcrafting.prismglass.setting_crafted']).toBe(1);
    expect(j.knowledge).toContain('material.prismglass_setting');
    expect(j.knowledge).not.toContain('technique.prismglass_setting'); // copper proof missing
    expect(recordHighflyAlchemyJewelCraft(j,recipeById('recipe_tough_jerky')!)).toBe(j);
  });

  it('real starting potion uses actual monster/herb materials and teaches basic Alchemy',()=>{
    const sim=make(902),pid=sim.playerId;
    const before=sim.serializeCharacter(pid)!;
    expect(craft(sim,'recipe_minor_healing_potion').ok).toBe(true);
    const after=sim.serializeCharacter(pid)!;
    expect(sim.countItem('minor_healing_potion',pid)).toBe(1);
    expect(after.highflyProfessions?.evidence?.['alchemy.brewing.minor_healing_potion']).toBe(1);
    expect(after.highflyProfessions?.knowledge).toContain('material.silverleaf_herb');
    expect(after.highflyProfessions?.knowledge).toContain('technique.basic_alchemy');
    expect(after.highflyProfessions?.craftXp?.alchemy).toBeGreaterThan(0);
    expect(after.craftSkills?.alchemy).toBeGreaterThan(before.craftSkills?.alchemy??0);
    expect(after.highflyProfessions?.craftXp?.jewelcrafting).toBeUndefined();
  });

  it('real copper jewelry needs both distinct crafts before learning precision technique',()=>{
    const sim=make(903),pid=sim.playerId;
    expect(craft(sim,'recipe_hammered_copper_band').ok).toBe(true);
    expect(sim.highflyAlchemyJewelPilotStatus().jewelcrafting.copperBands).toBe(1);
    expect(sim.serializeCharacter(pid)!.highflyProfessions?.knowledge ?? [])
      .not.toContain('technique.copper_jewelry');
    expect(craft(sim,'recipe_polished_copper_loop').ok).toBe(true);
    expect(sim.serializeCharacter(pid)!.highflyProfessions?.knowledge)
      .toContain('technique.copper_jewelry');
    expect(sim.highflyAlchemyJewelPilotStatus().jewelcrafting.copperLoops).toBe(1);
    expect(sim.highflyAlchemyJewelPilotStatus().alchemy.catalystsCreated).toBe(0);
  });

  it('REAL advanced catalyst: respects original daily recipe, material bill, station',()=>{
    const sim=make(904),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    sim.setPlayerLevel(20,pid);
    meta.craftSkills.alchemy=75;
    const before=sim.serializeCharacter(pid)!;
    expect(craft(sim,'recipe_quickening_catalyst').ok).toBe(true);
    const saved=sim.serializeCharacter(pid)!;
    expect(sim.countItem('quickening_catalyst',pid)).toBe(1);
    expect(sim.highflyAlchemyJewelPilotStatus().alchemy.catalystsCreated).toBe(1);
    expect(saved.highflyProfessions?.knowledge).toContain('material.quickening_catalyst');
    expect(saved.highflyProfessions?.knowledge).toContain('technique.quickening_catalysis');
    expect(saved.highflyProfessions?.craftXp?.jewelcrafting).toBeUndefined();
    expect(saved.craftSkills?.jewelcrafting).toBe(before.craftSkills?.jewelcrafting);
    const oldEvidence=saved.highflyProfessions?.evidence?.['alchemy.catalyst.quickening_crafted'];
    const again=craft(sim,'recipe_quickening_catalyst');
    expect(again.ok).toBe(false);
    expect(sim.highflyAlchemyJewelPilotStatus().alchemy.catalystsCreated).toBe(oldEvidence);
  });

  it('REAL two-profession chain: craft Catalyst in apothecary, SPEND it in Prismglass forge',()=>{
    const sim=make(905),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    sim.setPlayerLevel(20,pid);
    meta.craftSkills.alchemy=75;
    meta.craftSkills.jewelcrafting=75;
    expect(craft(sim,'recipe_hammered_copper_band').ok).toBe(true);
    expect(craft(sim,'recipe_quickening_catalyst').ok).toBe(true);
    expect(sim.countItem('quickening_catalyst',pid)).toBe(1);
    const recipe=recipeById('recipe_prismglass_setting')!;
    meta.knownRecipes.add(recipe.id);
    const forge=stationsOfType(STATIONS,'forge')[0],ent=sim.entities.get(pid)!;
    expect(forge).toBeTruthy();
    ent.pos.x=forge.pos.x;ent.pos.z=forge.pos.z;ent.prevPos={...ent.pos};
    for(const item of recipe.reagents) {
      if(item.itemId==='quickening_catalyst')continue; // use REAL crafted item
      sim.addItem(item.itemId,item.count,pid);
    }
    const before=sim.serializeCharacter(pid)!;
    const out=resolveCraft(sim.ctx,pid,recipe.id);
    expect(out.ok).toBe(true);
    expect(sim.countItem('quickening_catalyst',pid)).toBe(0);
    expect(sim.countItem('prismglass_setting',pid)).toBe(1);
    const after=sim.serializeCharacter(pid)!;
    expect(after.highflyProfessions?.evidence?.['alchemy.catalyst.quickening_crafted']).toBe(1);
    expect(after.highflyProfessions?.evidence?.['jewelcrafting.prismglass.setting_crafted']).toBe(1);
    expect(after.highflyProfessions?.knowledge).toContain('technique.prismglass_setting');
    // The frozen donor may grant ZERO raw craft skill at this high skill band.
    // PR-3 deliberately awards NO extra career XP when Claude awards no skill.
    // Never invent XP just to make an advanced recipe appear to progress.
    expect(after.highflyProfessions?.craftXp?.alchemy)
      .toBe(before.highflyProfessions?.craftXp?.alchemy);
    const actualJewelSkillGain=(after.craftSkills?.jewelcrafting??0) -
      (before.craftSkills?.jewelcrafting??0);
    const expectedJewelXp=Math.round(1500*Math.max(0,Math.min(1,actualJewelSkillGain)));
    expect((after.highflyProfessions?.craftXp?.jewelcrafting??0) -
      (before.highflyProfessions?.craftXp?.jewelcrafting??0)).toBe(expectedJewelXp);
    expect(after.highflyProfessions?.practice?.['recipe:recipe_prismglass_setting']).toBe(1);
    expect(after.craftSkills?.alchemy).toBe(before.craftSkills?.alchemy);
    expect(sim.highflyAlchemyJewelPilotStatus().gemCoreImplemented).toBe(false);
    expect(sim.highflyAlchemyJewelPilotStatus().socketEngineImplemented).toBe(false);
  });

  it('REAL failed Prismglass forge never spends materials, teaches technique or earns proof',()=>{
    const sim=make(906),pid=sim.playerId;
    const recipe=recipeById('recipe_prismglass_setting')!;
    const before=sim.serializeCharacter(pid)!;
    const res=resolveCraft(sim.ctx,pid,recipe.id);
    expect(res.ok).toBe(false);
    expect(sim.serializeCharacter(pid)!.highflyProfessions).toBeUndefined();
    expect(sim.serializeCharacter(pid)!.xp).toBe(before.xp);
    expect(sim.countItem('prismglass_setting',pid)).toBe(0);
  });

  it('independent Alchemy/Jewelcrafting knowledge/evidence survive REAL save and reload',()=>{
    const sim=make(907),pid=sim.playerId;
    expect(craft(sim,'recipe_minor_healing_potion').ok).toBe(true);
    expect(craft(sim,'recipe_hammered_copper_band').ok).toBe(true);
    const before=sim.serializeCharacter(pid)!;
    const fresh=new Sim({seed:908,playerClass:'warrior',noPlayer:true});
    const nextPid=fresh.addPlayer('warrior','Returning Alchemist',{state:before});
    const after=fresh.serializeCharacter(nextPid)!;
    expect(after.highflyProfessions).toEqual(before.highflyProfessions);
    expect(after.craftSkills).toEqual(before.craftSkills);
    expect(after.knownRecipes).toEqual(before.knownRecipes);
    expect(after.archetype).toEqual(before.archetype);
    expect(after.gatheringProficiency).toEqual(before.gatheringProficiency);
    expect(after.xp).toEqual(before.xp);
    expect(fresh.highflyAlchemyJewelPilotStatus(nextPid).alchemy.firstBrews).toBe(1);
    expect(fresh.highflyAlchemyJewelPilotStatus(nextPid).jewelcrafting.copperBands).toBe(1);
  });

  it('PR9 does not invent automatic advanced recipe/grandmaster/gem grants',()=>{
    const sim=make(909),pid=sim.playerId;
    const before=sim.serializeCharacter(pid)!;
    expect(craft(sim,'recipe_hammered_copper_band').ok).toBe(true);
    const after=sim.serializeCharacter(pid)!;
    expect(after.knownRecipes).not.toContain('recipe_prismglass_setting');
    expect(after.highflyProfessions?.legendaryProfessions).toBeUndefined();
    expect(after.highflyProfessions?.legendaryArchetypes).toBeUndefined();
    expect(sim.highflyAlchemyJewelPilotStatus().gemCoreImplemented).toBe(false);
    expect(sim.highflyAlchemyJewelPilotStatus().socketEngineImplemented).toBe(false);
    expect(after.level).toBeGreaterThanOrEqual(before.level);
  });
});
