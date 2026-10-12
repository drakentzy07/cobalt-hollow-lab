/** HIGHFLY SUPREME — internal native economy + actual-HP tactical QA.
 * No second app, no new item/drop tables, NO production rules changed.
 * Economy: level 1 native XP, level-50 FULL-HP mobs, genuine RNG corpse
 * material+copper, authentic vendor purchase, trainer, forge, equip/relog.
 * LV50 is an explicit precondition; profession mastery still fixture.
 * Farming melee is CI time compression (mobs do NOT take AI turns), so
 * economy accessibility != natural real-time balance.
 * Combat: FULL enemy HP/AI/real Sim ticks, nine native class actions,
 * P13/P16 plus other legally equipped native slot pieces, potion skill AI.
 * LEGAL GEAR and potions are explicit QA fixtures, NOT earned rewards.
 */
import {describe,expect,it} from 'vitest';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {meleeSwing} from '../src/sim/combat/auto_attack';
import {BUILTIN_WORLD,ITEMS,MOBS,STATIONS} from '../src/sim/data';
import {DT,MAX_LEVEL,type PlayerClass} from '../src/sim/types';
import {canEquipItem} from '../src/sim/equipment_rules';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft} from '../src/sim/professions/crafting';
import {trainingFeeFor} from '../src/sim/professions/training';
import {hfP13ItemId,hfP13RecipeId} from '../src/sim/content/highfly_lv99_native_equipment';
import {hfP16ArmorId,hfP16ArmorRecipeId} from '../src/sim/content/highfly_p16_native_chest_armor';
import {highflyEncounterId} from '../src/highfly/monsters/hunt_encounters';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';

const CLASSES:PlayerClass[]=['warrior','paladin','hunter','rogue','priest',
  'shaman','mage','warlock','druid'];
const WT:Record<PlayerClass,'warrior'|'scout'|'caster'>={
  warrior:'warrior',paladin:'warrior',hunter:'scout',rogue:'scout',
  priest:'caster',shaman:'warrior',mage:'caster',warlock:'caster',druid:'caster'};
const AT:Record<PlayerClass,'mail'|'leather'|'cloth'>={
  warrior:'mail',paladin:'mail',hunter:'leather',rogue:'leather',
  priest:'cloth',shaman:'mail',mage:'cloth',warlock:'cloth',druid:'leather'};
const OFFENSE:Record<PlayerClass,string[]>={
  warrior:['mortal_strike','slam','heroic_strike','rend'],
  paladin:['hammer_of_grace','crusader_strike','judgement','holy_strike'],
  hunter:['arcane_shot','steady_shot','serpent_sting'],
  rogue:['sinister_strike','eviscerate','backstab'],
  priest:['smite','mind_blast','shadow_word_pain'],
  shaman:['lightning_bolt','earth_shock','stormstrike'],
  mage:['fireball','frostbolt','arcane_blast'],
  warlock:['shadow_bolt','corruption','immolate'],
  druid:['wrath','moonfire','claw'],
};
const HEALS:Partial<Record<PlayerClass,string[]>>={
  paladin:['holy_light','flash_of_light'],priest:['flash_heal','heal'],
  shaman:['healing_wave','lesser_healing_wave'],druid:['healing_touch','rejuvenation']};
const WORLD={...BUILTIN_WORLD,camps:[]};
function simFor(cls:PlayerClass,seed:number){
  const sim=new Sim({seed,playerClass:cls,noPlayer:true,autoEquip:false,
    world:WORLD,compulsoryTutorial:false,riftPortals:false});
  const pid=sim.addPlayer(cls,'HF_SUPREME_NATIVE_QA_'+cls,{tutorialGreetingSent:true});
  return {sim,pid,p:sim.entities.get(pid)!,meta:sim.players.get(pid)!};
}
function fullHpNativeKill(sim:Sim,pid:number,mobId:string,level:number):boolean{
  const actor=sim.entities.get(pid)!,def=MOBS[mobId];
  expect(def,'UNREGISTERED_MONSTER_'+mobId).toBeDefined();
  const target=createMob(sim.nextId++,def,level,
    {x:actor.pos.x+1,y:actor.pos.y,z:actor.pos.z+1});
  target.hostile=true;
  const nativeHp=target.hp;
  expect(nativeHp).toBeGreaterThan(1);
  sim.addEntity(target);
  actor.facing=Math.atan2(target.pos.x-actor.pos.x,target.pos.z-actor.pos.z);
  for(let i=0;i<4000&&!target.dead;i++)meleeSwing(sim.ctx,actor,target,0,null,{});
  expect(target.dead,'FULL_HP_NATIVE_MELEE_FAILED_'+mobId).toBe(true);
  return target.lootable&&sim.lootCorpse(target.id,pid);
}

describe('HIGHFLY internal native XP, copper, material, vendor/forge accessibility',()=>{
  it('raises starter LV1 through kills and native XP, no manual XP awards or level grant',()=>{
    const {sim,pid,p,meta}=simFor('warrior',50442);
    const start=meta.counters.xpGained;
    expect(p.level).toBe(1);
    let kills=0;
    for(;p.level===1&&kills<80;kills++)fullHpNativeKill(sim,pid,'forest_wolf',1);
    const status={startLevel:1,endLevel:p.level,kills,
      earnedXp:meta.counters.xpGained-start,grantedLevels:false,
      nativeMobFullHp:true,noEnemyAiTurns:true};
    console.info('HF_SUPREME_NATIVE_LV1_XP='+JSON.stringify(status));
    expect(status.earnedXp).toBeGreaterThan(0);
    expect(status.endLevel).toBeGreaterThan(1);
    expect(p.level).toBeLessThanOrEqual(MAX_LEVEL);
  },120000);
  it('funds LV50 warrior trainer and vendor using ONLY original full-HP corpse rewards',()=>{
    const {sim,pid,p,meta}=simFor('warrior',20261013);
    sim.setPlayerLevel(50,pid); // tier precondition ONLY; no free copper/mats
    const recipe=recipeById(hfP13RecipeId(50,'warrior'))!;
    const output=hfP13ItemId(50,'warrior');
    const fee=trainingFeeFor(recipe);
    const fluxQty=recipe.reagents.find(r=>r.itemId==='smithing_flux')?.count??0;
    const cost=fee+fluxQty*(ITEMS.smithing_flux.buyValue??0);
    expect(fluxQty).toBeGreaterThan(0);
    const materials=['rough_hide','arcane_essence'] as const;
    const sources={rough_hide:'hf_hunt_wolf_50',
      arcane_essence:'hf_hunt_revenant_50'} as const;
    const startingCopper=meta.copper;
    const kills:Record<string,number>={rough_hide:0,arcane_essence:0};
    let total=0;
    for(;total<1300;total++){
      const lacking=materials.find(m=>
        sim.countItem(m,pid)<(recipe.reagents.find(r=>r.itemId===m)?.count??0));
      if(!lacking&&meta.copper>=cost)break;
      // Never use an elite/captain's inflated rewards; original normal band mobs.
      const source=lacking??materials[total%materials.length];
      expect(MOBS[sources[source]].boss).not.toBe(true);
      expect(MOBS[sources[source]].elite).not.toBe(true);
      fullHpNativeKill(sim,pid,sources[source],50);
      kills[source]++;
    }
    const gotMats=materials.every(m=>sim.countItem(m,pid)>=
      (recipe.reagents.find(r=>r.itemId===m)?.count??0));
    console.info('HF_SUPREME_NATIVE_FARM='+JSON.stringify({
      level:50,initialCopper:startingCopper,earnedCopper:meta.copper-startingCopper,
      targetCopper:cost,kills,gotMats,professionMasteryFixture:true,
      normalMobHpPreserved:true,enemyAiTimeCompressed:true}));
    expect(gotMats,'ACTUAL_CORPSE_MATERIALS_UNAFFORDABLE').toBe(true);
    expect(meta.copper,'NATIVE_MOB_COPPER_SHORTFALL').toBeGreaterThanOrEqual(cost);
    expect(meta.copper).toBeGreaterThan(startingCopper);
    const vendor=[...sim.entities.values()].find(e=>
      e.kind==='npc'&&e.vendorItems.includes('smithing_flux'));
    expect(vendor,'NO_REAL_FORGE_NPC_VENDOR').toBeDefined();
    p.pos=sim.groundPos(vendor!.pos.x,vendor!.pos.z);
    p.prevPos={...p.pos};sim.rebucket(p);
    for(let i=0;i<fluxQty;i++)sim.buyItem(vendor!.id,'smithing_flux',undefined,pid);
    expect(sim.countItem('smithing_flux',pid)).toBeGreaterThanOrEqual(fluxQty);
    const forge=STATIONS.find(s=>s.id==='station_eastbrook_forge')!;
    p.pos=sim.groundPos(forge.pos.x,forge.pos.z);
    p.prevPos={...p.pos};sim.rebucket(p);
    meta.craftSkills.weaponcrafting=75; // explicit mastery fixture; natural skill grind untested
    sim.trainRecipe(recipe.id,pid);
    expect(meta.lastTrainResult).toMatchObject({ok:true,recipeId:recipe.id});
    const forged=resolveCraft(sim.ctx,pid,recipe.id);
    expect(forged.ok,JSON.stringify(forged)).toBe(true);
    expect(sim.countItem(output,pid)).toBe(1);
    sim.equipItem(output,pid,'mainhand');
    expect(meta.equipment.mainhand).toBe(output);
    const save=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    // Rehydration creates exactly one persisted Hunter in a fresh Sim.
    const load=new Sim({seed:20261014,playerClass:'warrior',noPlayer:true,
      autoEquip:false,world:WORLD,compulsoryTutorial:false,riftPortals:false});
    const rid=load.addPlayer('warrior','HF_SUPREME_ECONOMY',
      {state:save,tutorialGreetingSent:true});
    expect(load.players.get(rid)?.equipment.mainhand).toBe(output);
    expect(load.players.get(rid)?.knownRecipes.has(recipe.id)).toBe(true);
    console.info('HF_SUPREME_NATIVE_ECONOMY_CRAFT_GREEN='+JSON.stringify({
      generatedGoldFromMobs:true,gatheredOriginalLoot:true,realVendorBuy:true,
      realTrainerFee:true,realCraft:true,saveAndEquipment:true,
      masterSkillFixture:true,level50Fixture:true,totalKills:total}));
  },240000);
});

type Fight={cls:PlayerClass,enemy:string,level:number,enemyNativeHp:number,
  extraGear:string[],gearSlots:number,skills:string[],healCasts:number,
  potionUses:number,result:'WIN'|'LOSS'|'TIMEOUT',
  enemyRemainingPct:number,hunterRemainingPct:number,actualSeconds:number};
function battle(cls:PlayerClass,level:50|99,seed:number):Fight{
  const {sim,pid,p,meta}=simFor(cls,seed);
  sim.setPlayerLevel(level,pid); // level precondition; combat stats native
  const tier=level===50?50:90;
  const weapon=hfP13ItemId(tier,WT[cls]);
  const armor=hfP16ArmorId(level===50?50:90,AT[cls]);
  sim.addItem(weapon,1,pid);
  sim.equipItem(weapon,pid,'mainhand');
  sim.addItem(armor,1,pid);
  sim.equipItem(armor,pid);
  expect(meta.equipment.mainhand).toBe(weapon);
  expect(meta.equipment.chest).toBe(armor);
  // Equip remaining legal donor armors by slot; original constraints are authoritative.
  const extraGear:string[]=[];
  const candidates=Object.values(ITEMS).filter(item=>
    item.kind==='armor'&&!!item.slot&&item.slot!=='chest'&&
    canEquipItem(cls,item)&&requiredLevelFor(item)<=level).sort((a,b)=>
      requiredLevelFor(b)-requiredLevelFor(a)||
      (b.stats?.armor??0)-(a.stats?.armor??0));
  const slots=new Set<string>();
  for(const item of candidates){
    if(!item.slot||slots.has(item.slot))continue;
    sim.addItem(item.id,1,pid);
    sim.equipItem(item.id,pid);
    if(Object.values(meta.equipment).includes(item.id)){
      slots.add(item.slot);extraGear.push(item.id);
    }
    if(slots.size>=8)break;
  }
  expect(extraGear.length).toBeGreaterThan(0);
  const potion='healing_potion';
  sim.addItem(potion,3,pid); // explicit consumable QA fixture
  const def=MOBS[level===50?'hf_hunt_wolf_50':
    highflyEncounterId('captain',HIGHFLY_HUNT_SCENARIOS.at(-1)!.minLevel)];
  expect(def).toBeDefined();
  const mob=createMob(sim.nextId++,def,level,
    {x:p.pos.x+2,y:p.pos.y,z:p.pos.z+2});
  mob.hostile=true;sim.addEntity(mob);
  sim.targetEntity(mob.id,pid);
  p.facing=Math.atan2(mob.pos.x-p.pos.x,mob.pos.z-p.pos.z);
  mob.facing=Math.atan2(p.pos.x-mob.pos.x,p.pos.z-mob.pos.z);
  sim.startAutoAttack(pid);
  const attacks=OFFENSE[cls].filter(id=>meta.known.some(x=>x.def.id===id));
  const heals=(HEALS[cls]??[]).filter(id=>meta.known.some(x=>x.def.id===id));
  expect(attacks.length).toBeGreaterThan(0);
  const skills=new Set<string>(),castEvery=Math.max(1,Math.floor(2/DT));
  const limit=Math.ceil((level===50?38:60)/DT);
  let ticks=0,potionUses=0,healCasts=0,casts=0;
  for(;ticks<limit&&!p.dead&&!mob.dead;ticks++){
    if(p.hp/p.maxHp<0.65&&p.potionCooldownUntil<=sim.time&&
      sim.countItem(potion,pid)>0){
      const before=sim.countItem(potion,pid);
      sim.useItem(potion,pid);
      if(sim.countItem(potion,pid)<before)potionUses++;
    }
    if(ticks%castEvery===0){
      const choice=p.hp/p.maxHp<0.55&&heals.length?
        heals[healCasts++%heals.length]:attacks[casts++%attacks.length];
      sim.castAbility(choice,pid);skills.add(choice);
    }
    sim.tick(); // unmodified native AI, damage, threat, cooldowns, CC
  }
  return {cls,enemy:def.id,level,enemyNativeHp:mob.maxHp,
    extraGear,gearSlots:Object.values(meta.equipment).filter(Boolean).length,
    skills:[...skills],healCasts,potionUses,
    result:mob.dead&&!p.dead?'WIN':p.dead?'LOSS':'TIMEOUT',
    enemyRemainingPct:Math.round(10000*Math.max(0,mob.hp)/mob.maxHp)/100,
    hunterRemainingPct:Math.round(10000*Math.max(0,p.hp)/p.maxHp)/100,
    actualSeconds:Math.round(100*ticks*DT)/100};
}
describe('HIGHFLY internal 9 classes full monster HP + native tactical AI/extra gear',()=>{
  it('measures 9x2 class-tier encounters with real damage; reports losses, never cheats wins',()=>{
    const rows:Fight[]=[];
    for(const [i,cls] of CLASSES.entries()){
      rows.push(battle(cls,50,770500+i*101));
      rows.push(battle(cls,99,779900+i*101));
    }
    const result={
      status:'REAL_HP_AI_WITH_LEGAL_TEST_GEAR__BALANCE_NOT_YET_CERTIFIED',
      classes:9,fights:18,enemyHpNeverReduced:true,
      noProductionBalanceChanges:true,initialLevelAndGearTestFixtures:true,
      noManualParryDashPositioning:true,
      fightsByOutcome:Object.fromEntries(['WIN','LOSS','TIMEOUT'].map(x=>[
        x,rows.filter(r=>r.result===x).length])),
      byLevel:Object.fromEntries([50,99].map(level=>[level,
        Object.fromEntries(['WIN','LOSS','TIMEOUT'].map(x=>[
          x,rows.filter(r=>r.level===level&&r.result===x).length]))])),
      rows:rows.map(({extraGear,...rest})=>({...rest,extraGearCount:extraGear.length})),
    };
    console.info('HF_SUPREME_NATIVE_TACTICAL_HP_AI='+JSON.stringify(result));
    expect(rows).toHaveLength(18);
    expect(rows.every(r=>r.enemyNativeHp>1&&r.gearSlots>=3)).toBe(true);
    expect(rows.every(r=>r.skills.length>0)).toBe(true);
  },240000);
});

/** HIGHFLY SUPREME LATE ECONOMY MATRIX
 * Replicate the authentic corpse+vendor+trainer+forge loop at every
 * P13 rung and every P16 armor rung. No copper or loot injected; only
 * starting player level and craft mastery are declared CI preconditions.
 * No enemy AI turns during farming => measures drop/economy *accessibility*,
 * not live combat grinding time. No new reports or laboratory artifacts.
 */
type EconomyCase={level:50|60|70|80|90;cls:PlayerClass;
  recipeId:string;outputId:string;kind:'weapon'|'chest'};
const ECONOMY_CASES:EconomyCase[]=[
  ...([50,60,70,80,90] as const).map((level,i)=>({
    level,cls:(['warrior','hunter','mage','paladin','rogue'] as const)[i],
    recipeId:hfP13RecipeId(level,(['warrior','scout','caster','warrior','scout'] as const)[i]),
    outputId:hfP13ItemId(level,(['warrior','scout','caster','warrior','scout'] as const)[i]),
    kind:'weapon' as const,
  })),
  {level:50,cls:'paladin',recipeId:hfP16ArmorRecipeId(50,'mail'),
    outputId:hfP16ArmorId(50,'mail'),kind:'chest'},
  {level:70,cls:'druid',recipeId:hfP16ArmorRecipeId(70,'leather'),
    outputId:hfP16ArmorId(70,'leather'),kind:'chest'},
  {level:90,cls:'priest',recipeId:hfP16ArmorRecipeId(90,'cloth'),
    outputId:hfP16ArmorId(90,'cloth'),kind:'chest'},
];
describe('HIGHFLY SUPREME late-economy authentic RNG five rungs and armor',()=>{
  it('pays trainer and vendor from native full-HP monster copper; farms materials; crafts and saves',()=>{
    const records:unknown[]=[];
    for(const [index,c] of ECONOMY_CASES.entries()){
      const {sim,pid,p,meta}=simFor(c.cls,909900+index*201);
      sim.setPlayerLevel(c.level,pid);
      const recipe=recipeById(c.recipeId)!;
      expect(recipe,'NO_REAL_NATIVE_RECIPE_'+c.recipeId).toBeDefined();
      expect(recipe.reagents.length).toBeGreaterThan(1);
      const required=recipe.reagents.filter(x=>x.itemId!=='smithing_flux');
      const flux=recipe.reagents.find(x=>x.itemId==='smithing_flux')?.count??0;
      const fee=trainingFeeFor(recipe);
      const copperNeed=fee+flux*(ITEMS.smithing_flux.buyValue??0);
      expect(flux).toBeGreaterThan(0);
      // A source must have an unquested natural drop at this exact rung.
      const normals=Object.values(MOBS).filter(x=>x.id.startsWith('hf_hunt_')&&
        !x.elite&&!x.boss&&!x.worldBoss&&!x.dummy&&!x.ambient&&
        x.minLevel<=c.level&&x.maxLevel>=c.level);
      expect(normals.length,'NO_NATIVE_NORMALS_LEVEL_'+c.level).toBeGreaterThan(0);
      const bestFor=(itemId:string)=>normals
        .map(m=>({m,drop:m.loot.find(x=>x.itemId===itemId&&!x.questId&&x.chance>0)}))
        .filter(x=>!!x.drop).sort((a,b)=>(b.drop?.chance??0)-(a.drop?.chance??0))[0]?.m;
      for(const reagent of required)
        expect(bestFor(reagent.itemId),
          'NO_NORMAL_RNG_MATERIAL_SOURCE_'+c.level+'_'+reagent.itemId).toBeDefined();
      const cashMob=normals.slice().sort((a,b)=>{
        const base=(m:typeof a)=>m.loot.filter(x=>x.copper!==undefined&&x.chance===1)
          .reduce((n,x)=>n+(x.copper??0),0);
        return base(b)-base(a);
      })[0];
      const killCounts:Record<string,number>={};
      let kills=0;
      for(;kills<2400;kills++){
        const lacking=required.find(r=>sim.countItem(r.itemId,pid)<r.count);
        if(!lacking&&meta.copper>=copperNeed)break;
        const source=lacking?bestFor(lacking.itemId)!:cashMob;
        fullHpNativeKill(sim,pid,source.id,c.level);
        killCounts[source.id]=(killCounts[source.id]??0)+1;
      }
      const haveMaterials=required.every(r=>sim.countItem(r.itemId,pid)>=r.count);
      const haveMoney=meta.copper>=copperNeed;
      const row:any={level:c.level,cls:c.cls,kind:c.kind,recipe:c.recipeId,
        nativeFullHpKills:kills,mobSources:killCounts,
        earnedCopper:meta.copper,trainerAndVendorCopper:copperNeed,
        haveMaterials,haveMoney,starterLevelFixture:true,
        professionSkillFixture:true,
        enemyAiCompressed:true,noRebalancedEconomy:true};
      if(haveMaterials&&haveMoney){
        const npc=[...sim.entities.values()].find(e=>e.kind==='npc'&&
          e.vendorItems.includes('smithing_flux'));
        expect(npc,'NO_ORIGINAL_NPC_FOR_FLUX').toBeDefined();
        p.pos=sim.groundPos(npc!.pos.x,npc!.pos.z);
        p.prevPos={...p.pos};sim.rebucket(p);
        // The last rung's naturally earned loot may fill a beginner's bag.
        // Sell surplus drops to the ORIGINAL NPC; discard non-sellable
        // non-reagents through the ORIGINAL player inventory command.
        // Never grant free bag slots, copper, loot or vendor stock.
        const keep=new Set(recipe.reagents.map(x=>x.itemId));
        const preSaleSlots=meta.inventory.length;
        let soldStacks=0,discardedStacks=0;
        for(const slot of [...meta.inventory]){
          if(keep.has(slot.itemId))continue;
          const before=sim.countItem(slot.itemId,pid);
          if(before<=0)continue;
          sim.sellItem(slot.itemId,before,pid);
          const afterSale=sim.countItem(slot.itemId,pid);
          if(afterSale<before)soldStacks++;
          if(afterSale>0){
            sim.discardItem(slot.itemId,afterSale,pid);
            if(sim.countItem(slot.itemId,pid)<afterSale)discardedStacks++;
          }
        }
        row.inventoryBeforeVendor=preSaleSlots;
        row.inventoryAfterLiquidation=meta.inventory.length;
        row.soldSurplusStacks=soldStacks;
        row.discardedUnsellableStacks=discardedStacks;
        const copperBeforeVendor=meta.copper;
        for(let n=0;n<flux;n++)sim.buyItem(npc!.id,'smithing_flux',undefined,pid);
        row.copperAfterVendor=meta.copper;
        row.vendorFluxOwned=sim.countItem('smithing_flux',pid);
        row.shopConsumedCopper=copperBeforeVendor-meta.copper;
        console.info('HF_SUPREME_LATE_VENDOR='+JSON.stringify({
          level:c.level,cls:c.cls,kind:c.kind,
          inventoryBeforeVendor:row.inventoryBeforeVendor,
          inventoryAfterLiquidation:row.inventoryAfterLiquidation,
          soldSurplusStacks:soldStacks,
          discardedUnsellableStacks:discardedStacks,
          vendorFluxOwned:row.vendorFluxOwned,
          shopConsumedCopper:row.shopConsumedCopper
        }));
        expect(sim.countItem('smithing_flux',pid)).toBeGreaterThanOrEqual(flux);
        const forge=STATIONS.find(s=>s.id==='station_eastbrook_forge')!;
        p.pos=sim.groundPos(forge.pos.x,forge.pos.z);
        p.prevPos={...p.pos};sim.rebucket(p);
        meta.craftSkills[recipe.professionId]=recipe.skillReq;
        sim.trainRecipe(recipe.id,pid);
        row.trainerResult=meta.lastTrainResult;
        if(meta.lastTrainResult?.ok){
          const result=resolveCraft(sim.ctx,pid,recipe.id);
          row.craftResult=result.ok;
          row.owned=sim.countItem(c.outputId,pid);
          if(result.ok){
            sim.equipItem(c.outputId,pid);
            row.equipped=Object.values(meta.equipment).includes(c.outputId);
            const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
            const restored=new Sim({seed:991100+index,noPlayer:true,
              autoEquip:false,playerClass:c.cls,world:WORLD,
              compulsoryTutorial:false,riftPortals:false});
            const rid=restored.addPlayer(c.cls,'HF_NATIVE_LATE_ECONOMY',
              {state:saved,tutorialGreetingSent:true});
            row.savedGear=Object.values(restored.players.get(rid)!.equipment).includes(c.outputId);
          }
        }
      }
      records.push(row);
      console.info('HF_SUPREME_5RUNG_ECONOMY='+JSON.stringify(row));
    }
    const failures=(records as any[]).filter(r=>!r.haveMaterials||!r.haveMoney||
      !r.craftResult||!r.equipped||!r.savedGear);
    console.info('HF_SUPREME_ECONOMY_MATRIX_SUMMARY='+JSON.stringify({
      routes:records.length,passes:records.length-failures.length,
      failures:failures.map(x=>({level:x.level,cls:x.cls,recipe:x.recipe,
        kills:x.nativeFullHpKills,haveMaterials:x.haveMaterials,
        haveMoney:x.haveMoney,trainer:x.trainerResult?.reason,craft:x.craftResult})),
      allGoldAndMaterialsFromOriginalCorpses:true,
      notProofOfNaturalProfessionMasteryOrPlayerTime:true
    }));
    expect(records).toHaveLength(8);
    expect(failures,'REAL_NATIVE_ECONOMY_GAPS').toEqual([]);
  },240000);
});

/** HIGHFLY SUPREME ECONOMY PLAYER MARKET
 * Multiplayer proof uses TWO DISTINCT players within ONE original Sim (one
 * hunter per account). Not a second game, and not an online Pages backend.
 * The 8-rung suite already verifies honest raw-material/copper acquisition;
 * this verifies actual crafted provenance, broker sale/escrow/cut, buyer equip
 * and SAVE. Starting materials and funds here are explicit QA fixtures. */
describe('HIGHFLY player-made equipment: original NPC + market economy',()=>{
  it('forges a normal P13 sword and sells it between two distinct Hunters through the native Merchant',()=>{
    const sim=new Sim({seed:551122,playerClass:'warrior',noPlayer:true,
      autoEquip:false,world:WORLD,compulsoryTutorial:false,riftPortals:false});
    const seller=sim.addPlayer('warrior','MasterBlacksmith',{characterId:701,tutorialGreetingSent:true});
    const buyer=sim.addPlayer('warrior','BuyerHunter',{characterId:702,tutorialGreetingSent:true});
    sim.setPlayerLevel(50,seller);
    sim.setPlayerLevel(50,buyer);
    const sm=sim.players.get(seller)!,bm=sim.players.get(buyer)!;
    const recipe=recipeById(hfP13RecipeId(50,'warrior'))!;
    const id=hfP13ItemId(50,'warrior');
    expect(ITEMS[id].soulbound).toBe(false);
    expect(ITEMS[id].noMarketList).toBe(false);
    expect(ITEMS[id].sellValue).toBeGreaterThan(0);
    // QA-prepared smith inputs, production forge and trainer are ORIGINAL.
    sm.copper=trainingFeeFor(recipe)+1000;
    sm.craftSkills.weaponcrafting=recipe.skillReq;
    for(const m of recipe.reagents)sim.addItem(m.itemId,m.count,seller);
    const sp=sim.entities.get(seller)!;
    const forge=STATIONS.find(x=>x.id==='station_eastbrook_forge')!;
    sp.pos=sim.groundPos(forge.pos.x,forge.pos.z);
    sp.prevPos={...sp.pos};sim.rebucket(sp);
    sim.trainRecipe(recipe.id,seller);
    expect(sm.lastTrainResult?.ok).toBe(true);
    const result=resolveCraft(sim.ctx,seller,recipe.id);
    expect(result.ok).toBe(true);
    expect(sim.countItem(id,seller)).toBe(1);
    const crafted=sm.inventory.find(s=>s.itemId===id)!;
    expect(crafted.craftedRecipeId).toBe(recipe.id);
    const merchant=[...sim.entities.values()].find(x=>x.templateId==='the_merchant')!;
    expect(merchant).toBeDefined();
    for(const pid of [seller,buyer]){
      const e=sim.entities.get(pid)!;
      e.pos=sim.groundPos(merchant.pos.x,merchant.pos.z);
      e.prevPos={...e.pos};sim.rebucket(e);
    }
    const ask=15000;
    const sellerCopper=sm.copper;
    if(crafted.instance)sim.marketListInstance(id,ask,crafted.instance,seller);
    else sim.marketList(id,1,ask,seller);
    const listing=sim.marketListings.find(x=>x.itemId===id&&!x.house);
    expect(listing,'SELLER_MARKET_LISTING_FAILED').toBeDefined();
    expect(listing!.craftedRecipeId).toBe(recipe.id);
    expect(sim.countItem(id,seller)).toBe(0);
    bm.copper=ask+250;
    sim.marketBuy(listing!.id,1,buyer);
    expect(sim.countItem(id,buyer)).toBe(1);
    expect(bm.copper).toBe(250);
    expect(sim.marketListings.find(x=>x.id===listing!.id)).toBeUndefined();
    const due=sim.marketInfoFor(seller)?.collectionCopper;
    expect(due).toBe(Math.floor(ask*.95));
    expect(sm.copper).toBe(sellerCopper);
    sim.marketCollect(seller);
    expect(sm.copper).toBe(sellerCopper+due!);
    expect(bm.inventory.find(x=>x.itemId===id)?.craftedRecipeId).toBe(recipe.id);
    sim.equipItem(id,buyer);
    expect(bm.equipment.mainhand).toBe(id);
    const snapshot=JSON.parse(JSON.stringify(sim.serializeCharacter(buyer)));
    const restored=new Sim({seed:771122,playerClass:'warrior',noPlayer:true,
      autoEquip:false,world:WORLD,compulsoryTutorial:false,riftPortals:false});
    const pid=restored.addPlayer('warrior','BuyerHunter',
      {state:snapshot,characterId:702,tutorialGreetingSent:true});
    expect(restored.players.get(pid)?.equipment.mainhand).toBe(id);
    console.info('HF_SUPREME_PLAYER_MARKET='+JSON.stringify({
      seller:'MasterBlacksmith',buyer:'BuyerHunter',item:id,ask,
      sellerNet:due,merchantCut:ask-due!,provenancePreserved:true,
      classReqPreserved:true,realTwoPartySameSim:true,notLiveInternetCertified:true}));
  },120000);
  it('makes normal crafted P16 armor commission-eligible without granting Training stats',()=>{
    const armor=ITEMS[hfP16ArmorId(90,'cloth')];
    expect(armor).toBeDefined();
    expect(armor.soulbound).toBe(false);
    expect(armor.noMarketList).toBe(false);
    expect(armor.sellValue).toBeGreaterThan(0);
    expect(armor.requiredClass).toContain('priest');
    expect(armor.requiredClass).not.toContain('warrior');
    expect(Object.keys(armor.stats??{})).toEqual(['armor']);
    expect(ITEMS[hfP13ItemId(90,'warrior')].requiredClass).not.toContain('mage');
  });
});

/** ORIGINAL CO-OP + COMMERCE. Two distinct player identities in one Sim.
 * P2P WebSocket deployment/browser networking is explicitly NOT certified here.
 * A single Hunter still belongs to each real user; never party-swap Hunters.
 */
describe('HIGHFLY native cooperative party+XP+loot+direct player trade compatibility',()=>{
  it('tests warrior+each of 9 original classes in a real two-Hunter party, shared native XP and trade',()=>{
    const rows:{
      guest:PlayerClass,partySize:number,killXpLead:number,killXpGuest:number,
      lootCandidates:number,goodsTransferred:boolean,paymentTransferred:boolean,
      persistentHunterProfiles:boolean
    }[]=[];
    for(const [idx,cls] of CLASSES.entries()){
      const {sim,pid:leader,p:front,meta:lm}=simFor('warrior',199911+idx*101);
      const guest=sim.addPlayer(cls,'HF_COOP_GUEST_'+cls,
        {characterId:1701+idx,tutorialGreetingSent:true});
      const gm=sim.players.get(guest)!;
      const e=sim.entities.get(guest)!;
      e.pos={...front.pos};e.prevPos={...e.pos};sim.rebucket(e);
      sim.partyInvite(guest,leader);
      sim.partyAccept(guest);
      const party=sim.partyOf(leader);
      expect(party,'COOP_PARTY_NOT_CREATED_'+cls).not.toBeNull();
      expect(party!.members).toEqual(expect.arrayContaining([leader,guest]));
      expect(sim.partyOf(guest)?.id).toBe(party!.id);
      const xp0=[lm.lifetimeXp,gm.lifetimeXp];
      const mob=createMob(sim.nextId++,MOBS.forest_wolf,1,
        {x:front.pos.x+1,y:front.pos.y,z:front.pos.z+1});
      mob.hostile=true;mob.tappedById=leader;
      expect(mob.hp,'FULL_HP_REQUIRED').toBeGreaterThan(1);
      sim.addEntity(mob);
      front.facing=Math.atan2(mob.pos.x-front.pos.x,mob.pos.z-front.pos.z);
      for(let i=0;i<2000&&!mob.dead;i++)meleeSwing(sim.ctx,front,mob,0,null,{});
      expect(mob.dead,'COOP_KILL_NOT_SETTLED_'+cls).toBe(true);
      const shared=[lm.lifetimeXp-xp0[0],gm.lifetimeXp-xp0[1]];
      expect(shared[0],'LEADER_NO_KILL_XP_'+cls).toBeGreaterThan(0);
      expect(shared[1],'GUEST_NO_SHARED_XP_'+cls).toBeGreaterThan(0);
      const eligible=sim.partyLootCandidatesForMob(mob).map(x=>x.entityId);
      expect(eligible,'PARTY_LOOT_RIGHTS_MISSING_'+cls)
        .toEqual(expect.arrayContaining([leader,guest]));
      // Trade items and funds are declared INPUT fixtures, NOT dropped by this
      // one sampled wolf. All transfer/atomicity rules remain native.
      sim.addItem('wolf_fang',1,leader);
      gm.copper=100;
      const leadCash=lm.copper,guestCash=gm.copper;
      sim.tradeRequest(guest,leader);
      sim.tradeAccept(guest);
      sim.tradeSetOffer([{itemId:'wolf_fang',count:1}],0,leader);
      sim.tradeSetOffer([],50,guest);
      sim.tradeConfirm(leader);
      sim.tradeConfirm(guest);
      const goodsTransferred=sim.countItem('wolf_fang',guest)===1&&
        sim.countItem('wolf_fang',leader)===0;
      const paymentTransferred=lm.copper===leadCash+50&&
        gm.copper===guestCash-50;
      expect(goodsTransferred,'COOP_DIRECT_ITEM_TRADE_FAILED_'+cls).toBe(true);
      expect(paymentTransferred,'COOP_DIRECT_COPPER_TRADE_FAILED_'+cls).toBe(true);
      const ls=sim.serializeCharacter(leader),gs=sim.serializeCharacter(guest);
      expect(lm.name).not.toBe(gm.name);
      const persistentHunterProfiles=ls?.level===front.level&&gs?.level===e.level&&
        ls?.copper===lm.copper&&gs?.copper===gm.copper;
      expect(persistentHunterProfiles).toBe(true);
      rows.push({guest:cls,partySize:party!.members.length,
        killXpLead:shared[0],killXpGuest:shared[1],
        lootCandidates:eligible.length,goodsTransferred,paymentTransferred,
        persistentHunterProfiles});
    }
    console.info('HIGHFLY_COOP_PARTY_TRADE='+JSON.stringify({
      scenarios:rows.length,pass:rows.length,partyMaxNative:5,
      twoDistinctHuntersFromDistinctTestPlayerIdentities:true,
      nativeSharedXp:true,nativePartyLootRights:true,nativeDirectCopperItemTrade:true,
      frontendPagesOnline:false,physicalTwoDeviceTest:false,
      rows
    }));
    expect(rows).toHaveLength(9);
  },180000);
});
