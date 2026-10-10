/** HIGHFLY V3-03 — LEGITIMATE GATHER -> FORGE -> EQUIP -> SAVE/LOAD.
 * Executes original ClaudeCraft Sim methods and world stations only.
 *
 * Harness setup (NOT player-earned): copper pick, logging handaxe,
 * smithing flux (vendor reagent), and a trainer-taught recipe. These are
 * explicit fixtures until trainer/vendor UI is verified in V3-04.
 * All copper ore and ironbark log MUST be gathered from original live nodes.
 * No grants of ore, wood, crafted gear, rarity, stats or XP are permitted.
 */
import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { STATIONS } from '../src/sim/data';
import { recipeById } from '../src/sim/content/recipes';
import { placeAtHarvestSpot } from './helpers/harvest_spot';

const RECIPE='recipe_copper_bearded_axe';
const AXE='copper_bearded_axe';
const ORE_NODES=Array.from({length:6},(_,i)=>'ore_eastbrook_'+(i+1));
const WOOD_NODES=Array.from({length:6},(_,i)=>'wood_eastbrook_'+(i+1));

function finishGather(sim: Sim,pid: number): void {
  const player=sim.entities.get(pid);
  const meta=sim.players.get(pid);
  if(!player||!meta)throw new Error('Missing authentic Sim actor');
  player.castingAbility=null;
  player.castRemaining=0;
  sim.ctx.completeGatherCast(player,meta);
}
function finishCraft(sim: Sim,pid: number): void {
  const player=sim.entities.get(pid);
  const meta=sim.players.get(pid);
  if(!player||!meta)throw new Error('Missing authentic Sim crafter');
  player.castingAbility=null;
  player.castRemaining=0;
  sim.ctx.completeCraftCast(player,meta);
}
function moveTo(sim: Sim,pid:number,point:{x:number;z:number}) {
  const actor=sim.entities.get(pid);
  if(!actor)throw new Error('Missing actor to move');
  actor.pos.x=point.x;
  actor.pos.z=point.z;
  actor.prevPos={...actor.pos};
}
function makeRealHunter() {
  const sim=new Sim({seed:42,playerClass:'warrior',noPlayer:true,autoEquip:false});
  const pid=sim.addPlayer('warrior','ForgeHunter');
  sim.setPlayerLevel(10,pid); // legitimately equip-ready LV10 test fixture, not XP cheating.
  const meta=sim.players.get(pid);
  if(!meta)throw new Error('Missing real PlayerMeta');
  // Only starter tools and the vendor/trainer prerequisite are injected.
  sim.addItem('copper_mining_pick',1,pid);
  sim.addItem('handaxe',1,pid);
  sim.addItem('smithing_flux',1,pid);
  const recipe=recipeById(RECIPE);
  if(!recipe)throw new Error('Original copper axe recipe missing');
  expect(recipe.professionId).toBe('weaponcrafting');
  expect(recipe.stationType).toBe('forge');
  expect(recipe.reagents).toEqual([
    {itemId:'copper_ore',count:4},
    {itemId:'ironbark_log',count:2},
    {itemId:'smithing_flux',count:1},
  ]);
  meta.knownRecipes.add(RECIPE); // simulated genuine trainer prerequisite.
  return {sim,pid,meta};
}
describe('V3-03 authentic ClaudeCraft gathering, forging, persistence and item integrity',()=>{
  it('gathers ore and ironbark from world nodes, gates distant forge, crafts once, equips and persists',()=>{
    const {sim,pid,meta}=makeRealHunter();
    expect(sim.countItem('copper_ore',pid)).toBe(0);
    expect(sim.countItem('ironbark_log',pid)).toBe(0);
    expect(sim.countItem(AXE,pid)).toBe(0);
    let legitimateGatherEvents=0;
    for(const nodeId of [...ORE_NODES,...WOOD_NODES]){
      placeAtHarvestSpot(sim,pid,nodeId);
      const started=sim.harvestNode(nodeId,undefined,pid);
      expect(started,'cannot start real gather node '+nodeId).toBe(true);
      finishGather(sim,pid);
      legitimateGatherEvents+=sim.drainEvents().filter(e=>e.type==='gatherResult').length;
    }
    expect(legitimateGatherEvents).toBe(12);
    const ore=sim.countItem('copper_ore',pid),wood=sim.countItem('ironbark_log',pid);
    expect(ore,'no genuine copper ore from six zone1 ore veins').toBeGreaterThanOrEqual(4);
    expect(wood,'no genuine ironbark logs from six zone1 trees').toBeGreaterThanOrEqual(2);

    // Negative real-world authorization, tested BEFORE crafting. No consumption.
    moveTo(sim,pid,{x:5000,z:5000});
    sim.craftItem(RECIPE,false,pid,1);
    expect(meta.lastCraftResult?.ok).toBe(false);
    expect(meta.lastCraftResult?.reason).toBe('station_required');
    expect(sim.countItem('copper_ore',pid)).toBe(ore);
    expect(sim.countItem('ironbark_log',pid)).toBe(wood);
    expect(sim.countItem(AXE,pid)).toBe(0);

    const forge=STATIONS.find(s=>s.id==='station_eastbrook_forge');
    expect(forge).toBeDefined();
    if(!forge)throw new Error('Missing authentic Eastbrook forge');
    moveTo(sim,pid,forge.pos);
    sim.craftItem(RECIPE,false,pid,1);
    finishCraft(sim,pid);
    expect(meta.lastCraftResult,'no actual forge cast result').toMatchObject({ok:true,itemId:AXE});
    expect(sim.countItem(AXE,pid)).toBe(1);
    expect(sim.countItem('copper_ore',pid)).toBe(ore-4);
    expect(sim.countItem('ironbark_log',pid)).toBe(wood-2);
    expect(sim.countItem('smithing_flux',pid)).toBe(0);

    sim.equipItem(AXE,pid);
    expect(meta.equipment.mainhand).toBe(AXE);
    expect(sim.countItem(AXE,pid)).toBe(0);

    const state=sim.serializeCharacter(pid);
    expect(state).not.toBeNull();
    const packed=JSON.parse(JSON.stringify(state));
    const reloaded=new Sim({seed:43,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const loadedPid=reloaded.addPlayer('warrior','ForgeHunter',{state:packed});
    const loadedMeta=reloaded.players.get(loadedPid);
    expect(loadedMeta?.equipment.mainhand).toBe(AXE);
    expect(loadedMeta?.knownRecipes.has(RECIPE)).toBe(true);
    expect(reloaded.countItem('copper_ore',loadedPid)).toBe(ore-4);
    expect(reloaded.countItem('ironbark_log',loadedPid)).toBe(wood-2);
    expect(reloaded.countItem('smithing_flux',loadedPid)).toBe(0);
    expect(reloaded.player.level).toBe(10);
  });
});
