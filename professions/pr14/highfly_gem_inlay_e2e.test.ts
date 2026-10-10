/** V4-02 PR14: real native Gem recipe -> original forge -> single
 * per-copy weapon inlay -> ATK4 -> CharacterState save/reload.
 * Fixtures: disenchant dust, shop flux, learned recipe, LV10 + craftSkill25
 * are preconditions, NOT falsely claimed as player-earned. COPPER ORE
 * must come from the original live world node before this test can proceed.
 */
import {describe,expect,it} from 'vitest';
import {Sim} from '../src/sim/sim';
import {STATIONS} from '../src/sim/data';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft} from '../src/sim/professions/crafting';
import {highflyElementalFinisherReady,highflyWeaponElement} from '../src/sim/combat/highfly_elemental_basic';
import {placeAtHarvestSpot} from './helpers/harvest_spot';

const GEM='highfly_fire_gem',RECIPE='recipe_highfly_fire_gem';
function forgePos(){const st=STATIONS.find(x=>x.id==='station_eastbrook_forge');if(!st)throw Error('Missing real forge');return st.pos}
function move(sim:Sim,pid:number,pos:{x:number;z:number}) {
  const e=sim.entities.get(pid);if(!e)throw Error('Missing hunter');
  e.pos.x=pos.x;e.pos.z=pos.z;e.prevPos={...e.pos};
}

describe('HIGHFLY V4-02 / PR14: real Jewelcrafting gem and native weapon inlay',()=>{
  it('crafts one actual fire gem from gathered copper, consumes it once and survives equip/relog',()=>{
    const sim=new Sim({seed:46,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const pid=sim.addPlayer('warrior','GemHunter');
    const meta=sim.players.get(pid),e=sim.entities.get(pid);
    if(!meta||!e)throw Error('Missing player');
    sim.setPlayerLevel(10,pid);
    meta.craftSkills.jewelcrafting=25; // seeded profession skill gate, NOT earned in this test
    const recipe=recipeById(RECIPE);
    expect(recipe).toBeDefined();
    expect(recipe).toMatchObject({professionId:'jewelcrafting',stationType:'forge',resultItemId:GEM,resultCount:1});
    meta.knownRecipes.add(RECIPE);
    sim.addItem('copper_mining_pick',1,pid);
    sim.addItem('arcane_dust',2,pid); // original disenchant material, prerequisite fixture
    sim.addItem('smithing_flux',1,pid); // original vendor reagent, prerequisite fixture
    sim.addItem('worn_sword',1,pid); // original weapon, prerequisite fixture
    sim.equipItem('worn_sword',pid);
    expect(meta.equipment.mainhand).toBe('worn_sword');
    expect(highflyElementalFinisherReady(e)).toBe(false);
    expect(sim.countItem(GEM,pid)).toBe(0);
    for(let i=1;i<=6;i++){
      const node='ore_eastbrook_'+i;
      placeAtHarvestSpot(sim,pid,node);
      expect(sim.harvestNode(node,undefined,pid),node).toBe(true);
      e.castingAbility=null;e.castRemaining=0;
      sim.ctx.completeGatherCast(e,meta);
      sim.drainEvents();
    }
    const copper=sim.countItem('copper_ore',pid);
    expect(copper).toBeGreaterThanOrEqual(4);
    expect(resolveCraft(sim.ctx,pid,RECIPE).ok).toBe(false); // away from forge
    expect(sim.countItem(GEM,pid)).toBe(0);
    move(sim,pid,forgePos());
    const craft=resolveCraft(sim.ctx,pid,RECIPE);
    expect(craft.ok,JSON.stringify(craft)).toBe(true);
    expect(sim.countItem(GEM,pid)).toBe(1);
    expect(sim.countItem('copper_ore',pid)).toBe(copper-4);
    expect(sim.countItem('arcane_dust',pid)).toBe(0);
    expect(sim.countItem('smithing_flux',pid)).toBe(0);
    move(sim,pid,{x:5000,z:5000});
    expect(sim.inlayHighflyGem(GEM,pid)).toMatchObject({ok:false,reason:'forge_required'});
    expect(sim.countItem(GEM,pid)).toBe(1);
    move(sim,pid,forgePos());
    expect(sim.inlayHighflyGem(GEM,pid)).toMatchObject({ok:true,gem:'fire',weaponId:'worn_sword'});
    expect(sim.countItem(GEM,pid)).toBe(0);
    expect(meta.equipmentInstance.mainhand?.highflyGem).toBe('fire');
    expect(highflyWeaponElement(e)).toBe('fire');
    expect(highflyElementalFinisherReady(e)).toBe(true);
    expect(sim.inlayHighflyGem(GEM,pid)).toMatchObject({ok:false,reason:'already_socketed'});

    const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    expect(saved.equipmentInstance.mainhand.highflyGem).toBe('fire');
    const fresh=new Sim({seed:47,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const next=fresh.addPlayer('warrior','GemHunter',{state:saved});
    const m=fresh.players.get(next),p=fresh.entities.get(next);
    if(!m||!p)throw Error('Rejoined player missing');
    expect(m.equipment.mainhand).toBe('worn_sword');
    expect(m.equipmentInstance.mainhand?.highflyGem).toBe('fire');
    expect(highflyElementalFinisherReady(p)).toBe(true);
    expect(highflyWeaponElement(p)).toBe('fire');
    expect(fresh.countItem(GEM,next)).toBe(0);
    expect(fresh.countItem('copper_ore',next)).toBe(copper-4);
    const second=JSON.parse(JSON.stringify(fresh.serializeCharacter(next)));
    expect(second.equipmentInstance.mainhand.highflyGem).toBe('fire');
  });
  it('does not grant ATK4 from loose gems or alter TRAINING Core to inlay a weapon',()=>{
    const sim=new Sim({seed:49,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const pid=sim.addPlayer('warrior','GemGuardian');
    const meta=sim.players.get(pid),e=sim.entities.get(pid);
    if(!meta||!e)throw Error('Missing actor');
    sim.addItem(GEM,1,pid); // availability fixture: negative loose-gem authorization test
    expect(highflyElementalFinisherReady(e)).toBe(false);
    expect(sim.inlayHighflyGem('fake_gem',pid)).toMatchObject({ok:false,reason:'invalid_gem'});
    expect(sim.inlayHighflyGem(GEM,pid)).toMatchObject({ok:false,reason:'need_weapon'});
    expect(sim.countItem(GEM,pid)).toBe(1);
    sim.addItem('worn_sword',1,pid);
    sim.equipItem('worn_sword',pid);
    expect(highflyElementalFinisherReady(e)).toBe(false);
    move(sim,pid,forgePos());
    expect(sim.inlayHighflyGem(GEM,pid).ok).toBe(true);
    expect(highflyElementalFinisherReady(e)).toBe(true);
    sim.addItem('rusty_hatchet',1,pid);
    sim.equipItem('rusty_hatchet',pid);
    expect(highflyElementalFinisherReady(e)).toBe(false);
    expect(highflyWeaponElement(e)).toBe('base');
    expect(meta.inventory.find(x=>x.itemId==='worn_sword')?.instance?.highflyGem).toBe('fire');
    sim.equipItem('worn_sword',pid);
    expect(highflyWeaponElement(e)).toBe('fire');
    expect(highflyElementalFinisherReady(e)).toBe(true);
  });
});
