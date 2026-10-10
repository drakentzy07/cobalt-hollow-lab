/** HIGHFLY V4-02 PR15 — three physical gems share PR14 native pipeline.
 * Known trainer recipes, mining reagents, disenchanting essence/shard, vendor
 * flux, Jewelcrafting skill, level and worn sword are explicit TEST FIXTURES.
 * They are not claimed as earned by a new character. Actual crafting, inlay,
 * original save/reload, ATK4/CC rider and anti-duplication MUST be native.
 */
import {describe,expect,it} from 'vitest';
import {Sim} from '../src/sim/sim';
import {STATIONS,MOBS} from '../src/sim/data';
import {createMob} from '../src/sim/entity';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft} from '../src/sim/professions/crafting';
import {highflyElementalFinisherReady,highflyWeaponElement,applyHighflyElementalFinisher} from '../src/sim/combat/highfly_elemental_basic';
import {highflyEquippedGem} from '../src/sim/professions/highfly_gem_socket';
const modes=[
  {gem:'highfly_frost_gem',recipe:'recipe_highfly_frost_gem',mode:'frost',rider:'slow',skill:35,ore:'iron_ore',oreCount:4,essence:'arcane_essence',essenceCount:2,flux:1},
  {gem:'highfly_lightning_gem',recipe:'recipe_highfly_lightning_gem',mode:'lightning',rider:'stun',skill:60,ore:'thorium_ore',oreCount:3,essence:'arcane_shard',essenceCount:1,flux:2},
] as const;
const station=STATIONS.find(x=>x.id==='station_eastbrook_forge');
if(!station)throw Error('Native Eastbrook forge missing');
function move(sim:Sim,pid:number,x:number,z:number){
  const p=sim.entities.get(pid);if(!p)throw Error('Hunter missing');
  p.pos.x=x;p.pos.z=z;p.prevPos={...p.pos};
}
describe('V4-02 PR15 — native frost and lightning gemstone expansion',()=>{
for(const row of modes){
  it(row.mode+' crafts in actual forge, inlays weapon copy once, triggers ATK4 rider and reloads',()=>{
    const sim=new Sim({seed:157,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const pid=sim.addPlayer('warrior','GemTester');
    const p=sim.entities.get(pid),meta=sim.players.get(pid);
    if(!p||!meta)throw Error('Player missing');
    sim.setPlayerLevel(30,pid); // fixture, NOT player earned
    meta.craftSkills.jewelcrafting=75; // seeded skill, NOT player earned
    meta.knownRecipes.add(row.recipe); // trainer acquisition fixture
    const recipe=recipeById(row.recipe);
    expect(recipe).toMatchObject({professionId:'jewelcrafting',resultItemId:row.gem,stationType:'forge',skillReq:row.skill,acquisition:['trainer']});
    sim.addItem(row.ore,row.oreCount,pid); // authentic item, prerequisite fixture
    sim.addItem(row.essence,row.essenceCount,pid);
    sim.addItem('smithing_flux',row.flux,pid);
    sim.addItem('worn_sword',1,pid);
    const startingOre=sim.countItem(row.ore,pid);
    const startingEssence=sim.countItem(row.essence,pid);
    const startingFlux=sim.countItem('smithing_flux',pid);
    sim.equipItem('worn_sword',pid);
    expect(highflyElementalFinisherReady(p)).toBe(false);
    expect(sim.countItem(row.gem,pid)).toBe(0);
    move(sim,pid,5000,5000);
    expect(resolveCraft(sim.ctx,pid,row.recipe).ok).toBe(false);
    expect(sim.countItem(row.gem,pid)).toBe(0);
    move(sim,pid,station.pos.x,station.pos.z);
    const crafted=resolveCraft(sim.ctx,pid,row.recipe);
    expect(crafted.ok,JSON.stringify(crafted)).toBe(true);
    expect(sim.countItem(row.gem,pid)).toBe(1);
    // Donor starts with some materials. Native crafting consumes EXACTLY
    // the recipe costs; it must not erase pre-existing inventory stacks.
    expect(sim.countItem(row.ore,pid)).toBe(startingOre-row.oreCount);
    expect(sim.countItem(row.essence,pid)).toBe(startingEssence-row.essenceCount);
    expect(sim.countItem('smithing_flux',pid)).toBe(startingFlux-row.flux);
    expect(highflyWeaponElement(p)).toBe('base');
    expect(sim.inlayHighflyGem(row.gem,pid)).toMatchObject({ok:true,gem:row.mode,weaponId:'worn_sword'});
    expect(sim.countItem(row.gem,pid)).toBe(0);
    expect(meta.equipmentInstance.mainhand?.highflyGem).toBe(row.mode);
    expect(highflyEquippedGem(sim.ctx,pid)).toBe(row.mode);
    expect(highflyWeaponElement(p)).toBe(row.mode);
    expect(highflyElementalFinisherReady(p)).toBe(true);
    expect(sim.inlayHighflyGem(row.gem,pid)).toMatchObject({ok:false,reason:'already_socketed'});
    const wolf=createMob(sim.nextId++,MOBS.forest_wolf,1,{x:p.pos.x,y:p.pos.y,z:p.pos.z+2});
    wolf.hostile=true;wolf.maxHp=wolf.hp=5000;
    sim.addEntity(wolf);
    const hp=wolf.hp;
    applyHighflyElementalFinisher(sim.ctx,p,wolf,row.mode);
    expect(wolf.hp).toBe(hp); // native damage—not VFX—owns HP
    expect(wolf.auras.some(a=>a.kind===row.rider)).toBe(true);
    const state=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    expect(state.equipmentInstance.mainhand.highflyGem).toBe(row.mode);
    const reloaded=new Sim({seed:158,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const rid=reloaded.addPlayer('warrior','GemTester',{state});
    const m=reloaded.players.get(rid),q=reloaded.entities.get(rid);
    if(!m||!q)throw Error('Saved character lost');
    expect(m.equipmentInstance.mainhand?.highflyGem).toBe(row.mode);
    expect(highflyElementalFinisherReady(q)).toBe(true);
    expect(highflyWeaponElement(q)).toBe(row.mode);
    expect(reloaded.countItem(row.gem,rid)).toBe(0);
  });
}
it('does not let one physical weapon copy inherit a different copy’s element',()=>{
  const sim=new Sim({seed:159,playerClass:'warrior',noPlayer:true,autoEquip:false});
  const pid=sim.addPlayer('warrior','TwinTester');
  const p=sim.entities.get(pid),meta=sim.players.get(pid);
  if(!p||!meta)throw Error('Missing actor');
  sim.addItem('worn_sword',2,pid);
  sim.addItem('highfly_frost_gem',1,pid);
  sim.addItem('highfly_lightning_gem',1,pid);
  sim.equipItem('worn_sword',pid);
  move(sim,pid,station.pos.x,station.pos.z);
  expect(sim.inlayHighflyGem('highfly_frost_gem',pid)).toMatchObject({ok:true,gem:'frost'});
  expect(meta.equipmentInstance.mainhand?.highflyGem).toBe('frost');
  sim.addItem('rusty_hatchet',1,pid);
  sim.equipItem('rusty_hatchet',pid);
  expect(highflyElementalFinisherReady(p)).toBe(false);
  expect(meta.inventory.filter(x=>x.itemId==='worn_sword').some(x=>x.instance?.highflyGem==='frost')).toBe(true);
  expect(sim.countItem('highfly_lightning_gem',pid)).toBe(1);
});
});
