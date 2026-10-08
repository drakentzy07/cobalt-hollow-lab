import {describe,expect,it} from 'vitest';
import {GATHER_NODES} from '../src/sim/content/gather_nodes';
import {farmBedById} from '../src/sim/content/farm_patches';
import {FARM_CROPS} from '../src/sim/content/farm_crops';
import {ITEMS} from '../src/sim/data';
import {completeFishing} from '../src/sim/professions/fishing';
import {harvestCrop,plantCrop} from '../src/sim/professions/farming';
import {queueGatheringGrant} from '../src/sim/professions/gathering';
import {placeAtHarvestSpot} from './helpers/harvest_spot';
import {terrainHeight} from '../src/sim/world';
import {
  HIGHFLY_GATHERING_CAREERS,highflyGatheringStatus,recordHighflyGatheringOutcome,
} from '../src/sim/professions/highfly_gathering_knowledge';
import {Sim,type PlayerMeta} from '../src/sim/sim';

const TOOLS={ore:'copper_mining_pick',wood:'handaxe',herb:'gathering_sickle'} as const;
function gatherNode(id:string){
  const sim=new Sim({seed:1313,playerClass:'warrior',noPlayer:true});
  const pid=sim.addPlayer('warrior','Gatherer');
  const node=GATHER_NODES.find(n=>n.id===id)!;
  expect(node).toBeTruthy();
  placeAtHarvestSpot(sim,pid,id);
  const meta=sim.players.get(pid) as PlayerMeta;
  sim.addItem(TOOLS[node.type as keyof typeof TOOLS],1,pid);
  expect(sim.harvestNode(id,undefined,pid)).toBe(true);
  const p=sim.entities.get(pid)!;
  p.castingAbility=null;p.castRemaining=0;
  sim.ctx.completeGatherCast(p,meta);
  const evt=sim.drainEvents().find(e=>e.type==='gatherResult');
  expect(evt?.type).toBe('gatherResult');
  const saved=sim.serializeCharacter(pid)!;
  return {sim,pid,meta,node,saved,evt};
}
function farm(seed=41){
  let now=1_700_000_000_000;
  const sim=new Sim({seed,playerClass:'warrior',autoEquip:false,
    lockoutNowMs:()=>now});
  const pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
  const bed=farmBedById('bed_eastbrook_1')!;
  expect(bed).toBeTruthy();
  const p=sim.player;
  p.pos.x=bed.x;p.pos.z=bed.z;
  p.pos.y=terrainHeight(bed.x,bed.z,sim.cfg.seed);
  p.prevPos={...p.pos};
  sim.addItem('garden_hoe',1,pid);
  sim.addItem('vale_wheat_seed',1,pid);
  plantCrop(sim.ctx,sim.player,meta,'bed_eastbrook_1','vale_wheat');
  const plot=meta.farmPlots.get('bed_eastbrook_1');
  expect(plot).toBeTruthy();
  const advance=()=>{now+=FARM_CROPS.vale_wheat.durationMs+1000;};
  return {sim,pid,meta,plot:plot!,advance};
}

describe('HIGHFLY PR-13 — actual 5 Gathering professions & earned source knowledge',()=>{
  it('five disciplines: no new loot, XP, monster links or fake initialized profile',()=>{
    expect(HIGHFLY_GATHERING_CAREERS).toEqual([
      'mining','logging','herbalism','farming','fishing']);
    const sim=new Sim({seed:1314,playerClass:'warrior',autoEquip:false});
    expect(sim.highflyGatheringPilotStatus()).toEqual(highflyGatheringStatus(undefined));
    const x=sim.highflyGatheringPilotStatus();
    expect(x.totalDistinctSources).toBe(0);
    expect(x.extraItemsGranted).toBe(0);
    expect(x.extraCharacterXpGranted).toBe(0);
    expect(x.monsterRewardContextConnected).toBe(false);
    expect(sim.serializeCharacter(sim.playerId)?.highflyProfessions).toBeUndefined();
  });

  it('rejects fabricated item id, unsafe source, zero yield and wrong family',()=>{
    const first={version:1 as const,craftXp:{alchemy:87}};
    const base={kind:'node' as const,professionId:'mining' as const,
      sourceId:'ore_eastbrook_1',itemId:'copper_ore',quantity:1};
    expect(recordHighflyGatheringOutcome(first,{...base,quantity:0})).toBe(first);
    expect(recordHighflyGatheringOutcome(first,{...base,itemId:'unregistered_fake_monster'})).toBe(first);
    expect(recordHighflyGatheringOutcome(first,{...base,sourceId:'__proto__'})).toBe(first);
    expect(recordHighflyGatheringOutcome(first,{...base,
      professionId:'farming'})).toBe(first);
    expect(recordHighflyGatheringOutcome(first,{...base,
      quantity:Number.POSITIVE_INFINITY})).toBe(first);
    expect(first.craftXp).toEqual({alchemy:87});
  });

  it('accepts future authored node identity without hard-coded node allowlist',()=>{
    expect(Object.hasOwn(ITEMS,'copper_ore')).toBe(true);
    const p=recordHighflyGatheringOutcome(undefined,{
      kind:'node',professionId:'mining',sourceId:'ore_new_expedition_2030',
      itemId:'copper_ore',quantity:2,
    })!;
    expect(p.discoveredSources).toEqual(['gather:mining:node:ore_new_expedition_2030']);
    expect(p.knowledge).toContain('source.mining');
    expect(p.evidence?.['gather.success.mining']).toBe(1);
    expect(p.craftXp).toBeUndefined();
    expect(p.practice).toBeUndefined();
  });

  it('repeated node credits action count, not duplicated source or technique',()=>{
    const a={version:1 as const};
    const one={kind:'node' as const,professionId:'mining' as const,
      sourceId:'ore_eastbrook_1',itemId:'copper_ore',quantity:1};
    const s1=recordHighflyGatheringOutcome(a,one)!;
    const s2=recordHighflyGatheringOutcome(s1,one)!;
    expect(s2.evidence?.['gather.success.mining']).toBe(2);
    expect(s2.discoveredSources).toHaveLength(1);
    expect(s2.knowledge).toEqual(['source.mining']);
    const s3=recordHighflyGatheringOutcome(s2,{...one,sourceId:'ore_eastbrook_2'})!;
    expect(s3.knowledge).toContain('technique.mining.source_diversity');
    expect(s3.discoveredSources).toHaveLength(2);
  });

  it.each([
    ['ore_eastbrook_1','mining'],
    ['wood_eastbrook_1','logging'],
    ['herb_eastbrook_1','herbalism'],
  ] as const)('REAL cast %s credits only authentic %s gathering', (id,professionId)=>{
    const {sim,pid,saved,evt}=gatherNode(id);
    expect(evt?.type).toBe('gatherResult');
    const read=sim.highflyGatheringPilotStatus(pid);
    expect(read.careers[professionId].provenHarvests).toBe(1);
    expect(read.careers[professionId].distinctSources).toBe(1);
    expect(read.careers[professionId].sourceKnowledge).toBe(true);
    expect(saved.highflyProfessions?.discoveredSources)
      .toContain(`gather:${professionId}:node:${id}`);
    expect(saved.highflyProfessions?.evidence?.[`gather.success.${professionId}`]).toBe(1);
    for(const other of HIGHFLY_GATHERING_CAREERS)if(other!==professionId)
      expect(read.careers[other].provenHarvests).toBe(0);
  });

  it('REAL node denial (unready repeat) adds no second proof',()=>{
    const {sim,pid,meta,node}=gatherNode('ore_eastbrook_1');
    const after=sim.serializeCharacter(pid)!;
    expect(sim.harvestNode(node.id,undefined,pid)).toBe(false);
    expect(sim.serializeCharacter(pid)?.highflyProfessions).toEqual(after.highflyProfessions);
    expect(meta.pendingGatherGrants.length).toBeGreaterThanOrEqual(0);
  });

  it('dev gathering proficiency queue alone NEVER creates source or Knowledge',()=>{
    const sim=new Sim({seed:1315,playerClass:'warrior',autoEquip:false});
    const meta=sim.players.get(sim.playerId) as PlayerMeta;
    queueGatheringGrant(meta,'mining',25);
    expect(meta.pendingGatherGrants).toHaveLength(1);
    expect(meta.highflyProfessions).toBeUndefined();
    expect(sim.highflyGatheringPilotStatus().careers.mining.provenHarvests).toBe(0);
  });

  it('REAL survived crop grants farm-source proof; seed refund is not another harvest',()=>{
    const h=farm(41);
    h.plot.survivalRoll=0;
    h.advance();
    harvestCrop(h.sim.ctx,h.sim.player,h.meta,'bed_eastbrook_1');
    expect(h.sim.events.some(e=>e.type==='farmHarvested')).toBe(true);
    const state=h.sim.serializeCharacter(h.pid)!.highflyProfessions;
    expect(state?.evidence?.['gather.success.farming']).toBe(1);
    expect(state?.discoveredSources).toContain('gather:farming:crop:vale_wheat');
    expect(h.sim.highflyGatheringPilotStatus().careers.farming.sourceKnowledge).toBe(true);
    expect(h.sim.highflyGatheringPilotStatus().extraItemsGranted).toBe(0);
  });

  it('REAL withered crop gives husks but no false successful Farming source',()=>{
    const h=farm(41);
    h.plot.survivalRoll=1;
    h.advance();
    harvestCrop(h.sim.ctx,h.sim.player,h.meta,'bed_eastbrook_1');
    expect(h.sim.events.some(e=>e.type==='farmWithered')).toBe(true);
    expect(h.sim.highflyGatheringPilotStatus().careers.farming.provenHarvests).toBe(0);
    expect(h.meta.highflyProfessions).toBeUndefined();
  });

  it('REAL landed fishing catch tracks water as source, no free character XP',()=>{
    const sim=new Sim({seed:467,playerClass:'warrior',autoEquip:true});
    const meta=sim.players.get(sim.playerId) as PlayerMeta;
    const before=sim.serializeCharacter(sim.playerId)!;
    let landed=false;
    for(let i=0;i<16;i++){
      const evtStart=sim.events.length;
      completeFishing(sim.ctx,sim.player,meta);
      const res=sim.events.slice(evtStart).find(e=>e.type==='fishingResult');
      if(res?.type!=='fishingResult')continue;
      if(!meta.highflyProfessions?.evidence?.['gather.success.fishing'])continue;
      landed=true;
      expect(meta.highflyProfessions.discoveredSources)
        .toContain(`gather:fishing:fishing:${res.zoneId}`);
      break;
    }
    expect(landed).toBe(true);
    expect(sim.highflyGatheringPilotStatus().careers.fishing.provenHarvests)
      .toBeGreaterThan(0);
    expect(sim.serializeCharacter(sim.playerId)!.xp).toBe(before.xp);
    expect(sim.highflyGatheringPilotStatus().extraCharacterXpGranted).toBe(0);
  });

  it('read-only save/load preserves five-career sparse source evidence',()=>{
    const w=gatherNode('ore_eastbrook_1');
    const old=w.sim.serializeCharacter(w.pid)!;
    const fresh=new Sim({seed:1320,playerClass:'warrior',noPlayer:true});
    const pid=fresh.addPlayer('warrior','Returning Gatherer',{state:old});
    const after=fresh.serializeCharacter(pid)!;
    expect(after.highflyProfessions).toEqual(old.highflyProfessions);
    expect(after.gatheringProficiency).toEqual(old.gatheringProficiency);
    expect(after.knownRecipes).toEqual(old.knownRecipes);
    expect(after.craftSkills).toEqual(old.craftSkills);
    expect(fresh.highflyGatheringPilotStatus(pid).careers.mining.provenHarvests).toBe(1);
    expect(fresh.highflyGatheringPilotStatus(pid).monsterRewardContextConnected).toBe(false);
  });
});
