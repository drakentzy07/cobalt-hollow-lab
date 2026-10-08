import {describe,expect,it} from 'vitest';
import {recipeById} from '../src/sim/content/recipes';
import {STATIONS} from '../src/sim/data';
import {resolveCraft} from '../src/sim/professions/crafting';
import {stationsOfType} from '../src/sim/professions/stations';
import {
  LEATHER_TEXTILE_PILOT,highflyLeatherTextileCatalogValid,
  highflyLeatherTextileStatus,recordHighflyLeatherTextileCraft,
} from '../src/sim/professions/highfly_leather_textile';
import {Sim,type PlayerMeta} from '../src/sim/sim';

const make=(seed:number)=>new Sim({seed,playerClass:'warrior',autoEquip:false});
function craft(sim:Sim,id:string,pid=sim.playerId){
  const r=recipeById(id)!;
  expect(r).toBeTruthy();
  const meta=sim.players.get(pid) as PlayerMeta;
  if(r.acquisition?.includes('trainer')) meta.knownRecipes.add(id);
  if(r.stationType){
    const st=stationsOfType(STATIONS,r.stationType)[0];
    expect(st).toBeTruthy();
    const ent=sim.entities.get(pid)!;
    ent.pos.x=st.pos.x;ent.pos.z=st.pos.z;ent.prevPos={...ent.pos};
  }
  for(const ing of r.reagents)sim.addItem(ing.itemId,ing.count,pid);
  return resolveCraft(sim.ctx,pid,r.id);
}
const career=(s:Sim)=>s.serializeCharacter(s.playerId)?.highflyProfessions;

describe('HIGHFLY PR-11: verified Leatherworking & Tailoring, zero bag/inventory duplication',()=>{
  it('all 12 authored pilot recipes exist with ORIGINAL craft/station/rung ownership',()=>{
    expect(highflyLeatherTextileCatalogValid()).toBe(true);
    expect(LEATHER_TEXTILE_PILOT).toHaveLength(12);
    const ids=LEATHER_TEXTILE_PILOT.map(x=>x.recipeId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LEATHER_TEXTILE_PILOT.filter(x=>x.profession==='leatherworking')).toHaveLength(5);
    expect(LEATHER_TEXTILE_PILOT.filter(x=>x.profession==='tailoring')).toHaveLength(7);
    expect(LEATHER_TEXTILE_PILOT.some(x=>x.minSkill===100)).toBe(true);
    expect(LEATHER_TEXTILE_PILOT.some(x=>x.minSkill===75)).toBe(true);
  });

  it('zero-state and legacy saves have no fake Knowledge, bags, monster drops or stats',()=>{
    const r=highflyLeatherTextileStatus(undefined);
    expect(r.leatherworking.completedPilotCrafts).toBe(0);
    expect(r.tailoring.completedPilotCrafts).toBe(0);
    expect(r.extraBagCapacityGranted).toBe(0);
    expect(r.newEquipmentVisualsGranted).toBe(false);
    const sim=make(1101);
    expect(sim.highflyLeatherTextilePilotStatus()).toEqual(r);
    expect(career(sim)).toBeUndefined();
    expect(recordHighflyLeatherTextileCraft(undefined,recipeById('recipe_homespun_hood')!))
      .toBeUndefined();
  });

  it('real tannery: boots + leggings learn basic leather technique, not cloth technique',()=>{
    const sim=make(1102),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    expect(craft(sim,'recipe_fenbridge_hide_boots').ok).toBe(true);
    expect(craft(sim,'recipe_fenbridge_hide_leggings').ok).toBe(true);
    const h=sim.highflyLeatherTextilePilotStatus();
    expect(h.leatherworking.completedPilotCrafts).toBe(2);
    expect(h.leatherworking.basicTechniqueKnown).toBe(true);
    expect(h.tailoring.basicTechniqueKnown).toBe(false);
    expect(h.materialsUsed.rough_hide).toBe(2);
    expect(h.materialsUsed.spider_silk).toBe(0);
    expect(meta.highflyProfessions?.knowledge).toContain('technique.basic_leatherworking');
    expect(sim.countItem('fenbridge_hide_boots',pid)).toBe(1);
    expect(sim.countItem('fenbridge_hide_leggings',pid)).toBe(1);
  });

  it('real loom: hood + mitts independently teach basic textile construction',()=>{
    const sim=make(1103),pid=sim.playerId;
    expect(craft(sim,'recipe_homespun_hood').ok).toBe(true);
    expect(sim.highflyLeatherTextilePilotStatus().tailoring.basicTechniqueKnown).toBe(false);
    expect(craft(sim,'recipe_homespun_mitts').ok).toBe(true);
    const after=sim.serializeCharacter(pid)!;
    expect(after.highflyProfessions?.knowledge).toContain('technique.basic_tailoring');
    expect(after.highflyProfessions?.knowledge).not.toContain('technique.basic_leatherworking');
    expect(after.highflyProfessions?.craftXp?.tailoring).toBeGreaterThan(0);
    expect(after.highflyProfessions?.craftXp?.leatherworking).toBeUndefined();
    expect(sim.highflyLeatherTextilePilotStatus().tailoring.completedPilotCrafts).toBe(2);
  });

  it('real silk satchel is minted by Claude bag authority, not PR-11 fake capacity',()=>{
    const sim=make(1104),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    sim.setPlayerLevel(20,pid);
    meta.craftSkills.tailoring=25;
    const before=sim.serializeCharacter(pid)!;
    expect(craft(sim,'recipe_silkspun_satchel').ok).toBe(true);
    expect(sim.countItem('silkspun_satchel',pid)).toBe(1);
    const after=sim.serializeCharacter(pid)!;
    expect(after.highflyProfessions?.evidence?.['tailoring.bag.silkspun']).toBe(1);
    expect(sim.highflyLeatherTextilePilotStatus().tailoring.bagsCrafted).toBe(1);
    expect(sim.highflyLeatherTextilePilotStatus().extraBagCapacityGranted).toBe(0);
    expect(after.bags).toEqual(before.bags); // no bag equipped/installed implicitly
    expect(after.craftSkills?.leatherworking).toBe(before.craftSkills?.leatherworking);
  });

  it('real high-quality bag recipes stay distinguishable from one another',()=>{
    const sim=make(1105),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    sim.setPlayerLevel(20,pid);
    meta.craftSkills.tailoring=50;
    expect(craft(sim,'recipe_silkspun_satchel').ok).toBe(true);
    expect(craft(sim,'recipe_duskweave_bag').ok).toBe(true);
    expect(career(sim)?.knowledge).toContain('technique.bag_construction');
    const before=sim.highflyLeatherTextilePilotStatus().tailoring.bagsCrafted;
    expect(craft(sim,'recipe_resonant_weave_bag').ok).toBe(true);
    expect(sim.highflyLeatherTextilePilotStatus().tailoring.bagsCrafted).toBe(before+1);
    expect(sim.countItem('resonant_weave_bag',pid)).toBe(1);
    expect(sim.highflyLeatherTextilePilotStatus().extraBagCapacityGranted).toBe(0);
  });

  it('marshstalker jerkin consumes real monster-silk and hide, no fictitious Harvest XP',()=>{
    const sim=make(1106),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    sim.setPlayerLevel(20,pid);
    meta.craftSkills.leatherworking=25;
    expect(craft(sim,'recipe_marshstalker_jerkin').ok).toBe(true);
    const s=sim.highflyLeatherTextilePilotStatus();
    expect(s.materialsUsed.spider_silk).toBe(1);
    expect(s.materialsUsed.rough_hide).toBe(1);
    expect(s.leatherworking.completedPilotCrafts).toBe(1);
    expect(s.materialsUsed.wyrmfall_core).toBe(0);
    expect(sim.countItem('marshstalker_jerkin',pid)).toBe(1);
    expect(career(sim)?.craftXp?.tailoring).toBeUndefined();
  });

  it('75-skill Wyrmhide and Sunspun preserve existing Quickening Catalyst bill',()=>{
    const a=recipeById('recipe_wyrmhide_cording')!,
      b=recipeById('recipe_sunspun_bolt')!;
    expect(a.professionId).toBe('leatherworking');
    expect(b.professionId).toBe('tailoring');
    expect(a.skillReq).toBe(75);
    expect(b.skillReq).toBe(75);
    expect(a.reagents.find(x=>x.itemId==='quickening_catalyst')?.count).toBe(1);
    expect(b.reagents.find(x=>x.itemId==='quickening_catalyst')?.count).toBe(1);
    const source={version:1 as const,craftXp:{alchemy:321},knowledge:['older.knowledge']};
    const after=recordHighflyLeatherTextileCraft(source,a)!;
    expect(after.evidence?.['leatherworking.material.wyrmhide_cording']).toBe(1);
    expect(after.knowledge).toContain('material.wyrmhide_cording');
    expect(after.craftXp).toEqual(source.craftXp);
    expect(source).toEqual({version:1,craftXp:{alchemy:321},knowledge:['older.knowledge']});
  });

  it('wrong profession, unknown recipe and failed craft never invent achievements',()=>{
    const sim=make(1107),pid=sim.playerId;
    expect(resolveCraft(sim.ctx,pid,'recipe_marshstalker_jerkin').ok).toBe(false);
    expect(career(sim)).toBeUndefined();
    const sample={version:1 as const,craftXp:{cooking:41}};
    expect(recordHighflyLeatherTextileCraft(sample,recipeById('recipe_eastbrook_arming_sword')!))
      .toBe(sample);
    expect(recordHighflyLeatherTextileCraft(sample,{id:'recipe_homespun_mitts',
      professionId:'weaponcrafting',reagents:[]})).toBe(sample);
  });

  it('real 2-profession work survives reload, retaining original equipment/bag metadata',()=>{
    const sim=make(1108),pid=sim.playerId;
    expect(craft(sim,'recipe_fenbridge_hide_boots').ok).toBe(true);
    expect(craft(sim,'recipe_homespun_hood').ok).toBe(true);
    const before=sim.serializeCharacter(pid)!;
    expect(before.highflyProfessions?.craftXp?.leatherworking).toBeGreaterThan(0);
    expect(before.highflyProfessions?.craftXp?.tailoring).toBeGreaterThan(0);
    const fresh=new Sim({seed:1109,playerClass:'warrior',noPlayer:true});
    const next=fresh.addPlayer('warrior','Weaver',{state:before});
    const after=fresh.serializeCharacter(next)!;
    expect(after.highflyProfessions).toEqual(before.highflyProfessions);
    expect(after.bags).toEqual(before.bags);
    expect(after.craftSkills).toEqual(before.craftSkills);
    expect(after.knownRecipes).toEqual(before.knownRecipes);
    expect(after.gatheringProficiency).toEqual(before.gatheringProficiency);
    expect(fresh.highflyLeatherTextilePilotStatus(next).leatherworking.completedPilotCrafts).toBe(1);
    expect(fresh.highflyLeatherTextilePilotStatus(next).tailoring.completedPilotCrafts).toBe(1);
  });
});
