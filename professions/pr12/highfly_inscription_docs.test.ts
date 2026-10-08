import {describe,expect,it} from 'vitest';
import {recipeById} from '../src/sim/content/recipes';
import {ITEMS,STATIONS} from '../src/sim/data';
import {resolveCraft} from '../src/sim/professions/crafting';
import {stationsOfType} from '../src/sim/professions/stations';
import {
  INSCRIPTION_REAL_DOCUMENTS,highflyInscriptionCatalogValid,
  highflyInscriptionStatus,recordHighflyInscriptionCraft,
} from '../src/sim/professions/highfly_inscription_docs';
import {Sim,type PlayerMeta} from '../src/sim/sim';

const game=(seed:number)=>new Sim({seed,playerClass:'warrior',autoEquip:false});
function craft(sim:Sim,id:string,pid=sim.playerId) {
  const recipe=recipeById(id)!;
  expect(recipe).toBeTruthy();
  const meta=sim.players.get(pid) as PlayerMeta;
  if(recipe.acquisition?.includes('trainer'))meta.knownRecipes.add(id);
  if(recipe.stationType){
    const st=stationsOfType(STATIONS,recipe.stationType)[0];
    expect(st).toBeTruthy();
    const p=sim.entities.get(pid)!;
    p.pos.x=st.pos.x;p.pos.z=st.pos.z;p.prevPos={...p.pos};
  }
  for(const ing of recipe.reagents)sim.addItem(ing.itemId,ing.count,pid);
  return resolveCraft(sim.ctx,pid,id);
}
const profession=(sim:Sim)=>sim.serializeCharacter(sim.playerId)?.highflyProfessions;

describe('HIGHFLY PR-12 — verified Inscription items, Deed authority, Knowledge NOT transferable yet',()=>{
  it('all nine real recipes remain bound to original apothecary and skill ladder',()=>{
    expect(highflyInscriptionCatalogValid()).toBe(true);
    expect(INSCRIPTION_REAL_DOCUMENTS).toHaveLength(9);
    expect(INSCRIPTION_REAL_DOCUMENTS.map(x=>x.skillRequirement)).toEqual([
      0,0,25,25,50,50,75,100,125,
    ]);
    expect(INSCRIPTION_REAL_DOCUMENTS.filter(x=>x.role==='buff_scroll')).toHaveLength(3);
    expect(INSCRIPTION_REAL_DOCUMENTS.filter(x=>x.role==='equipment_tome')).toHaveLength(4);
    expect(INSCRIPTION_REAL_DOCUMENTS.filter(x=>x.role==='promotion_deed')).toHaveLength(1);
  });

  it('the original scroll is temporary buff, tome is item gear, deed is not XP or transfer',()=>{
    expect(ITEMS.silverleaf_scroll.kind).toBe('scroll');
    expect(ITEMS.silverleaf_scroll.elixir?.duration).toBeGreaterThan(0);
    expect(ITEMS.silverleaf_primer.kind).toBe('held_offhand');
    expect(ITEMS.silverleaf_primer.slot).toBe('offhand');
    expect(ITEMS.sablewax_vellum.kind).toBe('junk');
    expect(ITEMS.deed_of_making.kind).toBe('junk');
    expect(recipeById('recipe_deed_of_making')?.resultItemId).toBe('deed_of_making');
    expect(recipeById('recipe_voidbound_grimoire')?.acquisition).toContain('drop');
  });

  it('legacy saves create neither transfer capability nor promotion',()=>{
    const read=highflyInscriptionStatus(undefined);
    expect(read.tomesMade).toBe(0);
    expect(read.buffScrollsMade).toBe(0);
    expect(read.deedsMade).toBe(0);
    expect(read.knowledgeTransferImplemented).toBe(false);
    expect(read.newPromotionGranted).toBe(false);
    const sim=game(1201);
    expect(sim.highflyInscriptionPilotStatus()).toEqual(read);
    expect(profession(sim)).toBeUndefined();
  });

  it('real introductory Tome + Scroll crafts unlock only earned inscription knowledge',()=>{
    const sim=game(1202),pid=sim.playerId;
    const start=sim.serializeCharacter(pid)!;
    expect(craft(sim,'recipe_silverleaf_primer').ok).toBe(true);
    expect(sim.countItem('silverleaf_primer',pid)).toBe(1);
    expect(profession(sim)?.knowledge??[]).not.toContain('technique.basic_inscription');
    expect(craft(sim,'recipe_silverleaf_scroll').ok).toBe(true);
    expect(sim.countItem('silverleaf_scroll',pid)).toBe(1);
    const state=sim.serializeCharacter(pid)!;
    expect(state.highflyProfessions?.knowledge).toContain('technique.basic_inscription');
    expect(state.highflyProfessions?.craftXp?.inscription).toBeGreaterThan(0);
    expect(state.craftSkills?.inscription).toBeGreaterThan(start.craftSkills?.inscription??0);
    expect(sim.highflyInscriptionPilotStatus().buffScrollsMade).toBe(1);
    expect(sim.highflyInscriptionPilotStatus().tomesMade).toBe(1);
    expect(sim.highflyInscriptionPilotStatus().knowledgeTransferImplemented).toBe(false);
  });

  it('real goldleaf pair at original skill 25 earns Goldleaf transcription knowledge',()=>{
    const sim=game(1203),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    sim.setPlayerLevel(20,pid);
    meta.craftSkills.inscription=25;
    expect(craft(sim,'recipe_goldleaf_folio').ok).toBe(true);
    expect(craft(sim,'recipe_goldleaf_scroll').ok).toBe(true);
    expect(profession(sim)?.knowledge).toContain('technique.goldleaf_transcription');
    expect(profession(sim)?.knowledge??[]).not.toContain('technique.basic_inscription');
    expect(sim.countItem('goldleaf_folio',pid)).toBe(1);
    expect(sim.countItem('goldleaf_scroll',pid)).toBe(1);
  });

  it('failed and unrelated crafts never invent a document or unrelated Knowledge',()=>{
    const sim=game(1204),pid=sim.playerId;
    const before=sim.serializeCharacter(pid)!;
    expect(resolveCraft(sim.ctx,pid,'recipe_silverleaf_primer').ok).toBe(false);
    expect(profession(sim)).toBeUndefined();
    expect(sim.serializeCharacter(pid)!.xp).toBe(before.xp);
    expect(recordHighflyInscriptionCraft(undefined,recipeById('recipe_silverleaf_primer')!))
      .toBeUndefined();
    const state={version:1 as const,knowledge:['older.knowledge']};
    expect(recordHighflyInscriptionCraft(state,recipeById('recipe_eastbrook_arming_sword')!))
      .toBe(state);
  });

  it('original Sablewax stage needs Catalyst; cannot conjure it through Knowledge',()=>{
    const r=recipeById('recipe_sablewax_vellum')!;
    expect(r.professionId).toBe('inscription');
    expect(r.skillReq).toBe(75);
    expect(r.reagents.find(x=>x.itemId==='quickening_catalyst')?.count).toBe(1);
    const existing={version:1 as const,craftXp:{alchemy:55},knowledge:['older.knowledge']};
    const next=recordHighflyInscriptionCraft(existing,r)!;
    expect(next.evidence?.['inscription.reagent.sablewax']).toBe(1);
    expect(next.knowledge).toContain('material.sablewax_vellum');
    expect(next.craftXp).toEqual(existing.craftXp);
    expect(existing).toEqual({version:1,craftXp:{alchemy:55},knowledge:['older.knowledge']});
  });

  it('advanced original Voidbound Grimoire stays a DROP recipe requiring vellum',()=>{
    const r=recipeById('recipe_voidbound_grimoire')!;
    expect(r.skillReq).toBe(100);
    expect(r.acquisition).toEqual(['drop']);
    expect(r.reagents.find(x=>x.itemId==='sablewax_vellum')?.count).toBe(3);
    const first={version:1 as const,evidence:{'inscription.reagent.sablewax':1}};
    const next=recordHighflyInscriptionCraft(first,r)!;
    expect(next.knowledge).toContain('technique.voidbound_binding');
    expect(next.evidence?.['inscription.tome.voidbound']).toBe(1);
    expect(next.craftXp?.inscription).toBeUndefined();
  });

  it('original 125 Deed is NOT free legendary ascension or generic Knowledge transfer',()=>{
    const deed=recipeById('recipe_deed_of_making')!;
    expect(deed.skillReq).toBe(125);
    expect(deed.resultItemId).toBe('deed_of_making');
    expect(deed.reagents.find(x=>x.itemId==='sablewax_vellum')?.count).toBe(3);
    const old={version:1 as const,legendaryProfessions:['legacy.one'],craftXp:{inscription:10}};
    const next=recordHighflyInscriptionCraft(old,deed)!;
    expect(next.evidence?.['inscription.deed.making']).toBe(1);
    expect(next.knowledge).toContain('technique.deed_of_making');
    expect(next.legendaryProfessions).toEqual(old.legendaryProfessions);
    expect(next.craftXp).toEqual(old.craftXp);
    expect(highflyInscriptionStatus(next).newPromotionGranted).toBe(false);
    expect(highflyInscriptionStatus(next).knowledgeTransferImplemented).toBe(false);
  });

  it('no repeated unlocking, no inventory transfer, no extra XP through second proof',()=>{
    const r=recipeById('recipe_silverleaf_primer')!;
    const a={version:1 as const,craftXp:{inscription:198}};
    const first=recordHighflyInscriptionCraft(a,r)!;
    const next=recordHighflyInscriptionCraft(first,r)!;
    expect(next.evidence?.['inscription.tome.silverleaf']).toBe(2);
    expect(next.craftXp).toEqual({inscription:198});
    expect(next.knowledge??[]).not.toContain('technique.basic_inscription');
    expect(Object.keys(a)).not.toContain('evidence');
  });

  it('real save/load keeps two document histories without mutating equipped or known Recipes',()=>{
    const sim=game(1205),pid=sim.playerId;
    expect(craft(sim,'recipe_silverleaf_primer').ok).toBe(true);
    expect(craft(sim,'recipe_silverleaf_scroll').ok).toBe(true);
    const before=sim.serializeCharacter(pid)!;
    const newSim=new Sim({seed:1206,playerClass:'warrior',noPlayer:true});
    const npid=newSim.addPlayer('warrior','Returning Scribe',{state:before});
    const after=newSim.serializeCharacter(npid)!;
    expect(after.highflyProfessions).toEqual(before.highflyProfessions);
    expect(after.craftSkills).toEqual(before.craftSkills);
    expect(after.knownRecipes).toEqual(before.knownRecipes);
    expect(after.bags).toEqual(before.bags);
    expect(after.gatheringProficiency).toEqual(before.gatheringProficiency);
    expect(newSim.highflyInscriptionPilotStatus(npid).tomesMade).toBe(1);
    expect(newSim.highflyInscriptionPilotStatus(npid).buffScrollsMade).toBe(1);
  });
});
