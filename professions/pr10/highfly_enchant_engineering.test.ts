import {describe,expect,it} from 'vitest';
import {recipeById} from '../src/sim/content/recipes';
import {ENCHANTS} from '../src/sim/content/enchants';
import {STATIONS} from '../src/sim/data';
import {resolveCraft} from '../src/sim/professions/crafting';
import {resolveDisenchant,resolveApplyEnchant} from '../src/sim/professions/enchanting';
import {stationsOfType} from '../src/sim/professions/stations';
import {
 ENGINEERING_REAL_CHAIN,highflyEngineeringChainValid,highflyEnchantEngineeringStatus,
 recordHighflyEngineeringCraft,recordHighflyEnchantAction,
} from '../src/sim/professions/highfly_enchant_engineering';
import {Sim,type PlayerMeta} from '../src/sim/sim';

function make(seed:number){return new Sim({seed,playerClass:'warrior',autoEquip:false});}
function makeCraft(sim:Sim,id:string,pid=sim.playerId,retain:readonly string[]=[]){
 const recipe=recipeById(id)!;
 expect(recipe).toBeTruthy();
 const meta=sim.players.get(pid) as PlayerMeta;
 if(recipe.acquisition?.includes('trainer'))meta.knownRecipes.add(id);
 if(recipe.stationType){
  const station=stationsOfType(STATIONS,recipe.stationType)[0];
  expect(station).toBeTruthy();
  const e=sim.entities.get(pid)!;e.pos.x=station.pos.x;e.pos.z=station.pos.z;e.prevPos={...e.pos};
 }
 for(const r of recipe.reagents)if(!retain.includes(r.itemId))
  sim.addItem(r.itemId,r.count,pid);
 return resolveCraft(sim.ctx,pid,recipe.id);
}
const xp=(s:Sim)=>s.serializeCharacter(s.playerId)?.highflyProfessions?.craftXp?.enchanting??0;

describe('HIGHFLY PR-10 — authentic Enchant actions and Engineering tool chain',()=>{
 it('audits catalog: real Engineering tier 0→25→75 and Catalyst consumer',()=>{
  expect(highflyEngineeringChainValid()).toBe(true);
  expect(recipeById(ENGINEERING_REAL_CHAIN.cogwheel)?.resultItemId).toBe('cogwheel_blank');
  expect(recipeById(ENGINEERING_REAL_CHAIN.ocular)?.skillReq).toBe(25);
  expect(recipeById(ENGINEERING_REAL_CHAIN.chassis)?.skillReq).toBe(75);
  expect(recipeById('recipe_lucent_reagent')?.professionId).toBe('enchanting');
  expect(recipeById('recipe_lucent_reagent')?.reagents.some(r=>
   r.itemId==='quickening_catalyst')).toBe(true);
 });
 it('never creates a career, sockets or stats from read-only inspection',()=>{
  const sim=make(1001),pid=sim.playerId;
  const snapshot=sim.highflyEnchantEngineeringPilotStatus();
  expect(snapshot.extraEnchantStatsGranted).toBe(false);
  expect(snapshot.newGemSocketsGranted).toBe(false);
  expect(snapshot.enchanting.disenchants).toBe(0);
  expect(snapshot.engineering.cogwheels).toBe(0);
  expect(sim.serializeCharacter(pid)?.highflyProfessions).toBeUndefined();
 });
 it('legitimate real disenchant adds only donor-scaled enchanting career XP and action Practice',()=>{
  const sim=make(1002),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
  const before=sim.serializeCharacter(pid)!,stats=sim.player.stats.str;
  const skill=meta.craftSkills.enchanting??0;
  sim.addItem('eastbrook_arming_sword',1,pid);
  const res=resolveDisenchant(sim.ctx,pid,'eastbrook_arming_sword');
  expect(res.ok).toBe(true);
  expect(sim.countItem('eastbrook_arming_sword',pid)).toBe(0);
  expect(res.materialItemId).toBe('arcane_dust');
  const delta=(meta.craftSkills.enchanting??0)-skill;
  const after=sim.serializeCharacter(pid)!;
  expect(after.highflyProfessions?.craftXp?.enchanting??0)
    .toBe(Math.round(1500*Math.min(1,Math.max(0,delta))));
  expect(after.highflyProfessions?.practice?.['action:disenchant:tier:0']).toBe(1);
  expect(after.highflyProfessions?.evidence?.['enchanting.action.disenchant']).toBe(1);
  expect(after.highflyProfessions?.knowledge).toContain('technique.arcane_salvage');
  expect(after.xp).toBe(before.xp);
  expect(sim.player.stats.str).toBe(stats);
 });
 it('self-crafted signed disenchant keeps donor anti-farm: no skill, XP or evidence',()=>{
  const sim=make(1003),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
  const before=meta.craftSkills.enchanting;
  sim.ctx.addItemInstance('eastbrook_arming_sword',{signer:'SELF'},pid,1);
  expect(resolveDisenchant(sim.ctx,pid,'eastbrook_arming_sword').ok).toBe(true);
  expect(meta.craftSkills.enchanting).toBe(before);
  expect(sim.serializeCharacter(pid)?.highflyProfessions).toBeUndefined();
 });
 it('failed disenchant and failed apply have ZERO profession side effects',()=>{
  const sim=make(1004),pid=sim.playerId;
  expect(resolveDisenchant(sim.ctx,pid,'eastbrook_arming_sword').ok).toBe(false);
  sim.addItem('eastbrook_arming_sword',1,pid);
  expect(resolveApplyEnchant(sim.ctx,pid,'eastbrook_arming_sword','enchant_weapon_might').ok)
   .toBe(false);
  expect(sim.serializeCharacter(pid)?.highflyProfessions).toBeUndefined();
 });
 it('REAL apply enchant on a gear COPY teaches apply Knowledge, not permanent Hunter STR',()=>{
  const sim=make(1005),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
  sim.addItem('eastbrook_arming_sword',1,pid);
  sim.addItem('arcane_dust',5,pid);
  const oldStr=sim.player.stats.str,oldSkill=meta.craftSkills.enchanting??0;
  expect(resolveApplyEnchant(sim.ctx,pid,'eastbrook_arming_sword','enchant_weapon_might').ok)
   .toBe(true);
  const delta=(meta.craftSkills.enchanting??0)-oldSkill;
  expect(xp(sim)).toBe(Math.round(1500*Math.max(0,Math.min(1,delta))));
  expect(meta.highflyProfessions?.practice?.['action:apply:tier:0']).toBe(1);
  expect(meta.highflyProfessions?.evidence?.['enchanting.action.apply']).toBe(1);
  expect(meta.highflyProfessions?.knowledge??[]).not.toContain('technique.basic_enchanting');
  expect(sim.player.stats.str).toBe(oldStr);
  const copy=meta.inventory.find(i=>i.itemId==='eastbrook_arming_sword');
  expect(copy?.instance?.enchant).toBe('enchant_weapon_might');
  expect(ENCHANTS.enchant_weapon_might.statBonus.str).toBeGreaterThan(0);
 });
 it('REAL disenchant followed by apply learns two-action knowledge exactly once',()=>{
  const sim=make(1006),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
  sim.addItem('eastbrook_arming_sword',1,pid);
  expect(resolveDisenchant(sim.ctx,pid,'eastbrook_arming_sword').ok).toBe(true);
  sim.addItem('eastbrook_arming_sword',1,pid);
  sim.addItem('arcane_dust',5,pid);
  expect(resolveApplyEnchant(sim.ctx,pid,'eastbrook_arming_sword','enchant_weapon_might').ok)
   .toBe(true);
  expect(meta.highflyProfessions?.knowledge).toContain('technique.basic_enchanting');
  expect(meta.highflyProfessions?.evidence?.['enchanting.action.disenchant']).toBe(1);
  expect(meta.highflyProfessions?.evidence?.['enchanting.action.apply']).toBe(1);
  const saved=sim.serializeCharacter(pid)!;
  const copy=meta.inventory.find(i=>i.itemId==='eastbrook_arming_sword');
  expect(copy?.instance?.enchant).toBe('enchant_weapon_might');
  const resumed=new Sim({seed:1016,playerClass:'warrior',noPlayer:true});
  const next=resumed.addPlayer('warrior','Enchanter',{state:saved});
  expect(resumed.serializeCharacter(next)?.highflyProfessions)
   .toEqual(saved.highflyProfessions);
  expect(resumed.serializeCharacter(next)?.craftSkills).toEqual(saved.craftSkills);
  expect(resumed.serializeCharacter(next)?.knownRecipes).toEqual(saved.knownRecipes);
 });
 it('at gray skill 125, successful action counts but adds NO invented XP',()=>{
  const sim=make(1007),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
  meta.craftSkills.enchanting=125;
  sim.addItem('eastbrook_arming_sword',1,pid);
  expect(resolveDisenchant(sim.ctx,pid,'eastbrook_arming_sword').ok).toBe(true);
  expect(meta.craftSkills.enchanting).toBe(125);
  expect(xp(sim)).toBe(0);
  expect(meta.highflyProfessions?.practice?.['action:disenchant:tier:0']).toBe(1);
 });
 it('engineering success proves real first cogwheel and zero new enchant skill',()=>{
  const sim=make(1008),pid=sim.playerId;
  const before=sim.serializeCharacter(pid)!;
  expect(makeCraft(sim,ENGINEERING_REAL_CHAIN.cogwheel).ok).toBe(true);
  expect(sim.countItem('cogwheel_blank',pid)).toBe(1);
  const state=sim.serializeCharacter(pid)!;
  expect(state.highflyProfessions?.evidence?.['engineering.mechanism.cogwheel']).toBe(1);
  expect(state.highflyProfessions?.craftXp?.engineering).toBeGreaterThan(0);
  expect(state.craftSkills?.enchanting).toBe(before.craftSkills?.enchanting);
 });
 it('real ocular consumes previously crafted cogwheel and teaches mechanical assembly',()=>{
  const sim=make(1009),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
  sim.setPlayerLevel(20,pid);
  meta.craftSkills.engineering=25;
  expect(makeCraft(sim,ENGINEERING_REAL_CHAIN.cogwheel).ok).toBe(true);
  expect(sim.countItem('cogwheel_blank',pid)).toBe(1);
  expect(makeCraft(sim,ENGINEERING_REAL_CHAIN.ocular,pid,['cogwheel_blank']).ok).toBe(true);
  expect(sim.countItem('cogwheel_blank',pid)).toBe(0);
  expect(sim.countItem('copperlens_ocular',pid)).toBe(1);
  expect(meta.highflyProfessions?.knowledge).toContain('technique.mechanical_assembly');
  expect(meta.highflyProfessions?.evidence?.['engineering.mechanism.ocular']).toBe(1);
  expect(meta.highflyProfessions?.craftXp?.enchanting).toBeUndefined();
 });
 it('precision chassis requires Catalyst and cogwheel; no free infrastructure shortcut',()=>{
  const sim=make(1010),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
  sim.setPlayerLevel(20,pid);
  meta.craftSkills.engineering=75;
  expect(makeCraft(sim,ENGINEERING_REAL_CHAIN.cogwheel).ok).toBe(true);
  sim.addItem('quickening_catalyst',1,pid); // fixture: PR-9 certifies actual production
  expect(makeCraft(sim,ENGINEERING_REAL_CHAIN.chassis,pid,
   ['quickening_catalyst','cogwheel_blank']).ok).toBe(true);
  expect(sim.countItem('quickening_catalyst',pid)).toBe(0);
  expect(sim.countItem('cogwheel_blank',pid)).toBe(0);
  expect(sim.countItem('precision_chassis',pid)).toBe(1);
  expect(meta.highflyProfessions?.knowledge).toContain('technique.precision_chassis');
  expect(sim.highflyEnchantEngineeringPilotStatus().engineering.precisionChassis).toBe(1);
  expect(sim.highflyEnchantEngineeringPilotStatus().newGemSocketsGranted).toBe(false);
 });
 it('failed engineering craft never writes proof or increments Profession XP',()=>{
  const sim=make(1011),pid=sim.playerId;
  expect(resolveCraft(sim.ctx,pid,'recipe_precision_chassis').ok).toBe(false);
  expect(sim.serializeCharacter(pid)?.highflyProfessions).toBeUndefined();
 });
 it('bounded independent action progression is deterministic without RNG or double-credit',()=>{
  const base={version:1 as const,craftXp:{engineering:77},knowledge:['old.knowledge']};
  const first=recordHighflyEnchantAction(base,'apply',0,0)!;
  expect(first.craftXp).toEqual({engineering:77});
  expect(first.practice?.['action:apply:tier:0']).toBe(1);
  expect(first.knowledge).toContain('old.knowledge');
  const second=recordHighflyEnchantAction(first,'apply',1,0)!;
  expect(second.craftXp?.enchanting).toBe(1000);
  expect(second.practice?.['action:apply:tier:0']).toBe(2);
  expect(recordHighflyEnchantAction(second,'apply',1,8)).toBe(second);
  const wrong=recordHighflyEngineeringCraft(second,{id:'recipe_cogwheel_blank',
   professionId:'cooking'});
  expect(wrong).toBe(second);
  expect(highflyEnchantEngineeringStatus(second).newGemSocketsGranted).toBe(false);
 });
});
