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
import {BUILTIN_WORLD,DUNGEONS,ITEMS,MOBS,STATIONS} from '../src/sim/data';
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
import {highflyNativeHuntDungeonId} from '../src/highfly/monsters/hunt_dungeon_registry';

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
/** Assassin PvM/PvP fixture: two independent authentic one-hand daggers, no stat gifts. */
function equipRogueDualDagger(sim:Sim,pid:number,cls:PlayerClass,weapon:string){
  if(cls!=='rogue')return;
  expect(ITEMS[weapon]?.weapon?.dagger).toBe(true);
  sim.addItem(weapon,1,pid); // second legal test-given, separately craftable dagger
  sim.equipItem(weapon,pid,'offhand');
  expect(sim.players.get(pid)?.equipment.offhand).toBe(weapon);
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
  equipRogueDualDagger(sim,pid,cls,weapon);
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

/** Original party instance claim across ALL 8 HIGHFLY stage dungeons,
 * including a rejected underlevel party guest, shared single mob population,
 * individual leave, no cloning, two character saves. 9 pairings x 8 stages.
 * Each player is a separate QA identity and own Hunter; levels are fixtures.
 * No public multiplayer, server deployment, boss balance or navigation claim.
 */
describe('HIGHFLY co-op native group dungeon instance: 9 classes x 8 stages',()=>{
  it('joins both Hunters to ONE original instance per stage and enforces each level gate',()=>{
    const rows:{guest:PlayerClass,stage:string,level:number,
      sameParty:boolean,oneInstance:boolean,mobPopulation:number,
      rejectedUnderlevel:boolean,eachExited:boolean,distinctHunters:boolean}[]=[];
    for(const [classIndex,cls] of CLASSES.entries()){
      const {sim,pid:leader,p:le,meta:lm}=simFor('warrior',812600+classIndex*101);
      const guest=sim.addPlayer(cls,'HF_COOP_DUNGEON_'+cls,
        {characterId:81000+classIndex,tutorialGreetingSent:true});
      const ge=sim.entities.get(guest)!;
      const gm=sim.players.get(guest)!;
      expect(lm).not.toBe(gm);
      sim.partyInvite(guest,leader);
      sim.partyAccept(guest);
      const party=sim.partyOf(leader);
      expect(party?.members).toEqual(expect.arrayContaining([leader,guest]));
      const groupKey='party:'+party!.id;
      for(const stage of HIGHFLY_HUNT_SCENARIOS){
        const dungeonId=highflyNativeHuntDungeonId(stage.id);
        expect(DUNGEONS[dungeonId],'NO_NATIVE_COOP_DUNGEON_'+stage.id).toBeDefined();
        sim.setPlayerLevel(stage.minLevel,leader); // test fixture only
        sim.setPlayerLevel(Math.max(1,stage.minLevel-1),guest);
        const rejectedUnderlevel=sim.enterDungeon(dungeonId,guest)===false;
        expect(rejectedUnderlevel,'PARTY_LEVEL_GATE_BYPASS_'+cls+'_'+stage.id).toBe(true);
        sim.setPlayerLevel(stage.minLevel,guest);
        const first=sim.enterDungeon(dungeonId,leader);
        expect(first,'LEADER_COOP_INSTANCE_ENTRY_FAILED_'+stage.id).toBe(true);
        const claimed=sim.instances.find(i=>i.dungeonId===dungeonId&&
          i.partyKey===groupKey&&i.enteredBy.has(leader));
        expect(claimed,'NO_SHARED_PARTY_INSTANCE_'+stage.id).toBeDefined();
        const ids=[...(claimed?.mobIds??[])];
        expect(ids,'INCORRECT_HIGHFLY_SHARED_MOB_POPULATION').toHaveLength(8);
        const second=sim.enterDungeon(dungeonId,guest);
        expect(second,'GUEST_COOP_INSTANCE_ENTRY_FAILED_'+cls+'_'+stage.id).toBe(true);
        const sameParty=sim.partyOf(guest)?.id===party!.id;
        const oneInstance=sim.instances.filter(i=>i.dungeonId===dungeonId&&
          i.partyKey===groupKey).length===1;
        expect(oneInstance,'DUPLICATE_PARTY_INSTANCE_'+cls+'_'+stage.id).toBe(true);
        expect(claimed?.enteredBy.has(guest)).toBe(true);
        expect(claimed?.mobIds).toEqual(ids); // joining cannot respawn pack
        const everyoneHere=[...claimed!.enteredBy].filter(pid=>pid===leader||pid===guest);
        expect(everyoneHere).toHaveLength(2);
        // Leaving individually must not teleport the other Hunter, and both
        // must keep their own equipment, character ID, class and save state.
        const guestBefore={...ge.pos};
        const firstExit=sim.leaveDungeon(leader);
        expect(firstExit).toBe(true);
        expect(ge.pos).toEqual(guestBefore);
        const secondExit=sim.leaveDungeon(guest);
        expect(secondExit).toBe(true);
        const distinctHunters=sim.players.get(leader)===lm&&
          sim.players.get(guest)===gm&&
          sim.entities.get(leader)===le&&sim.entities.get(guest)===ge&&
          gm.cls===cls&&lm.cls==='warrior';
        expect(distinctHunters).toBe(true);
        expect(sim.serializeCharacter(leader)?.level).toBe(stage.minLevel);
        expect(sim.serializeCharacter(guest)?.level).toBe(stage.minLevel);
        rows.push({guest:cls,stage:stage.id,level:stage.minLevel,
          sameParty,oneInstance,mobPopulation:ids.length,
          rejectedUnderlevel,eachExited:firstExit&&secondExit,distinctHunters});
      }
      expect([...sim.entities.values()].filter(e=>e.kind==='player')).toHaveLength(2);
    }
    console.info('HIGHFLY_COOP_SHARED_INSTANCES_72='+JSON.stringify({
      pairings:CLASSES.length,stages:HIGHFLY_HUNT_SCENARIOS.length,
      partyDungeonProofs:rows.length,passes:rows.filter(x=>
        x.sameParty&&x.oneInstance&&x.mobPopulation===8&&
        x.rejectedUnderlevel&&x.eachExited&&x.distinctHunters).length,
      nativePartyClaimUsed:true,noDuplicatedDungeonSpawns:true,
      eachCharacterPersisted:true,levelsFixtures:true,networkUnverified:true,
      failures:rows.filter(x=>!x.sameParty||!x.oneInstance||
        x.mobPopulation!==8||!x.rejectedUnderlevel||!x.eachExited||!x.distinctHunters)
    }));
    expect(rows).toHaveLength(72);
    expect(rows.every(x=>x.sameParty&&x.oneInstance&&x.mobPopulation===8&&
      x.rejectedUnderlevel&&x.eachExited&&x.distinctHunters)).toBe(true);
  },240000);
});

/** LV99 captain tactical role pairs. No player-stat/monster HP cheat.
 * All actual Sim AI turns and cooldowns run, with NORMAL native monster HP.
 * Legal level-90 equipment and three potions are declared QA fixtures.
 * No automated solo-balance success claim; each of nine classes gets an actual
 * combat role alongside a native Warrior, as requested for 2-person co-op.
 */
describe('HIGHFLY LV99 captain — 9 native class-pair tactical stress; no balancing shortcuts',()=>{
  it('measures full-HP final captain against warrior+each class, heals, legal armor, native AI',()=>{
    type Row={guest:PlayerClass,result:'WIN'|'LOSS'|'TIMEOUT',
      captainStartHp:number,captainEndHp:number,heroEndHp:number,
      allyEndHp:number,seconds:number,skillsAttempted:number,
      directHealAttempts:number,actualHealing:number,
      potionUses:number,soloVictoryNotAsserted:boolean};
    const rows:Row[]=[];
    const bossId=highflyEncounterId('captain',HIGHFLY_HUNT_SCENARIOS.at(-1)!.minLevel);
    const def=MOBS[bossId];
    expect(def?.boss).toBe(true);
    for(const [index,cls] of CLASSES.entries()){
      const {sim,pid:leader,p:tank,meta:leadMeta}=simFor('warrior',910001+index*99);
      const aid=sim.addPlayer(cls,'HF99_COOP_'+cls,
        {characterId:991001+index,tutorialGreetingSent:true});
      const ally=sim.entities.get(aid)!;
      const other=sim.players.get(aid)!;
      sim.setPlayerLevel(99,leader);
      sim.setPlayerLevel(99,aid);
      sim.partyInvite(aid,leader);sim.partyAccept(aid);
      expect(sim.partyOf(aid)?.members).toEqual(expect.arrayContaining([leader,aid]));
      // Arm every player under ORIGINAL level+class legal item rules.
      for(const [pid,klass,meta] of [[leader,'warrior',leadMeta],[aid,cls,other]] as const){
        const weapon=hfP13ItemId(90,WT[klass]);
        const chest=hfP16ArmorId(90,AT[klass]);
        sim.addItem(weapon,1,pid);
        sim.equipItem(weapon,pid,'mainhand');
        equipRogueDualDagger(sim,pid,klass,weapon);
        sim.addItem(chest,1,pid);
        sim.equipItem(chest,pid);
        expect(meta.equipment.mainhand).toBe(weapon);
        expect(meta.equipment.chest).toBe(chest);
        const legal=Object.values(ITEMS).filter(item=>
          item.kind==='armor'&&!!item.slot&&item.slot!=='chest'&&
          canEquipItem(klass,item)&&requiredLevelFor(item)<=99)
          .sort((a,b)=>requiredLevelFor(b)-requiredLevelFor(a)||
            (b.stats?.armor??0)-(a.stats?.armor??0));
        const slots=new Set<string>();
        for(const item of legal){
          if(!item.slot||slots.has(item.slot))continue;
          sim.addItem(item.id,1,pid);
          sim.equipItem(item.id,pid);
          if(Object.values(meta.equipment).includes(item.id))slots.add(item.slot);
          if(slots.size>=8)break;
        }
        expect(Object.values(meta.equipment).filter(Boolean).length).toBeGreaterThanOrEqual(3);
        sim.addItem('healing_potion',3,pid);
      }
      ally.pos={...tank.pos,x:tank.pos.x+0.75,z:tank.pos.z+0.5};
      ally.prevPos={...ally.pos};sim.rebucket(ally);
      const target=createMob(sim.nextId++,def,99,
        {x:tank.pos.x+2,y:tank.pos.y,z:tank.pos.z+2});
      const captainStartHp=target.hp;
      expect(captainStartHp).toBeGreaterThan(1);
      target.hostile=true;sim.addEntity(target);
      for(const pid of [leader,aid]){
        const e=sim.entities.get(pid)!;
        e.facing=Math.atan2(target.pos.x-e.pos.x,target.pos.z-e.pos.z);
        sim.targetEntity(target.id,pid);sim.startAutoAttack(pid);
      }
      const know=(meta:typeof leadMeta,order:string[])=>
        order.filter(x=>meta.known.some(a=>a.def.id===x));
      const leaderAtk=know(leadMeta,OFFENSE.warrior);
      const guestAtk=know(other,OFFENSE[cls]);
      const heals=know(other,HEALS[cls]??[]);
      expect(leaderAtk.length).toBeGreaterThan(0);
      expect(guestAtk.length).toBeGreaterThan(0);
      const capTicks=Math.ceil(105/DT);
      const tickEvery=Math.max(1,Math.round(1.65/DT));
      let attempted=0,directHealAttempts=0,actualHealing=0,potions=0,ticks=0;
      let lp=0,ap=0;
      for(;ticks<capTicks&&!target.dead&&( !tank.dead || !ally.dead);ticks++){
        for(const pid of [leader,aid]){
          const p=sim.entities.get(pid)!;
          if(p.dead||p.hp/p.maxHp>0.60||sim.countItem('healing_potion',pid)===0)continue;
          const before=sim.countItem('healing_potion',pid);
          sim.useItem('healing_potion',pid);
          if(sim.countItem('healing_potion',pid)<before)potions++;
        }
        if(ticks%tickEvery===0){
          if(!tank.dead){
            sim.castAbility(leaderAtk[lp++%leaderAtk.length],leader);
            attempted++;
          }
          if(!ally.dead){
            // Healer roles target the injured frontline with the genuine
            // native friendly-target cast path; offensive roles deal damage.
            if(heals.length&&tank.hp/tank.maxHp<0.65){
              const before=tank.hp;
              sim.castAbilityOn(heals[directHealAttempts%heals.length],leader,aid);
              directHealAttempts++;
              actualHealing+=Math.max(0,tank.hp-before);
            }else{
              sim.castAbility(guestAtk[ap++%guestAtk.length],aid);
              attempted++;
            }
          }
        }
        sim.tick();
      }
      rows.push({guest:cls,result:target.dead&&( !tank.dead||!ally.dead)?'WIN':
          tank.dead&&ally.dead?'LOSS':'TIMEOUT',
        captainStartHp,captainEndHp:Math.max(0,target.hp),
        heroEndHp:Math.max(0,tank.hp),allyEndHp:Math.max(0,ally.hp),
        seconds:Math.round(ticks*DT*100)/100,skillsAttempted:attempted,
        directHealAttempts,actualHealing,potionUses:potions,
        soloVictoryNotAsserted:true});
      expect(sim.players.get(aid)?.cls).toBe(cls);
      expect(sim.serializeCharacter(leader)?.level).toBe(99);
      expect(sim.serializeCharacter(aid)?.level).toBe(99);
      expect(target.maxHp).toBe(captainStartHp);
    }
    const result={
      scenario:'LV99_ROLE_AWARE_TWO_HUNTERS_VS_NATIVE_CAPTAIN_NOT_SOLO_BALANCE',
      total:rows.length,wins:rows.filter(x=>x.result==='WIN').length,
      losses:rows.filter(x=>x.result==='LOSS').length,
      timeouts:rows.filter(x=>x.result==='TIMEOUT').length,
      hpNeverOverridden:true,simTicksWithNativeAI:true,
      gearAndPotionsTestFixtures:true,trainingNotMinted:true,
      noPlayerMovementOrParryAutomation:true,
      classes:rows};
    console.info('HF_SUPREME_LV99_ROLE_PAIR_BOSS='+JSON.stringify(result));
    expect(rows).toHaveLength(9);
    expect(rows.every(r=>r.captainStartHp>1&&r.skillsAttempted>0)).toBe(true);
  },240000);
});

/** HIGHFLY SUPREME SOLO LV99 — CLASS-ROLE-SENSITIVE PLAYER-PILOT REPLAY.
 * Actual original native cast/movement/AI/HP/attack and potion cooldowns.
 * No out-of-range teleport, HP edits, free stat increases, class changes,
 * boss nerfs, fixed damage multipliers or invalid gear. Starting level,
 * inventory and craftable gear are QA preconditions, NOT a natural playthrough.
 * "GREEN" here only means fully measured; see win count separately.
 */
describe('HIGHFLY normal 99 single-Hunter captain: no-cheat tactical class pilots',()=>{
  const OPEN:Record<PlayerClass,string[]>={
    warrior:['battle_shout'],
    paladin:['blessing_of_might','seal_of_righteousness'],
    hunter:['aspect_of_the_hawk','rapid_fire','summon_pet'],
    rogue:['instant_poison'],
    priest:['power_word_fortitude','power_word_shield'],
    shaman:['lightning_shield','flametongue_weapon'],
    mage:['frost_armor','arcane_intellect'],
    warlock:['demon_skin','summon_voidwalker'],
    druid:['mark_of_the_wild','thorns'],
  };
  const GUARD:Record<PlayerClass,string[]>={
    warrior:['iron_resolve','raised_guard'],
    paladin:['divine_protection','holy_shield'],
    hunter:['shellskin','aspect_of_the_monkey'],
    rogue:['evasion'],
    priest:['power_word_shield'],
    shaman:[], // Lightning Shield is an opener, not a defensive reaction
    mage:['ice_barrier','blazing_barrier','ice_block'],
    warlock:['demon_skin','bone_armor'],
    druid:['barkskin'],
  };
  const SKILL:Record<PlayerClass,string[]>={
    warrior:['heroic_strike','slam','sunder_armor','rend'],
    paladin:['hammer_of_grace','crusader_strike','judgement'],
    hunter:['serpent_sting','arcane_shot','measured_shot','aimed_shot','concussive_shot'], 
    rogue:['sinister_strike','sinister_strike','sinister_strike','eviscerate'],
    priest:['shadow_word_pain','mind_blast','smite'],
    shaman:['flame_shock','earth_shock','lightning_bolt','lava_burst'],
    mage:['fireball','frostbolt','fire_blast','arcane_blast'],
    warlock:['corruption','immolate','shadow_bolt','drain_life'],
    druid:['moonfire','wrath','starfire','insect_swarm'],
  };
  it('benchmarks each of the NINE independent classes vs native captain with real movement and defenses',()=>{
    const rows:any[]=[];
    const def=MOBS[highflyEncounterId('captain',HIGHFLY_HUNT_SCENARIOS.at(-1)!.minLevel)];
    expect(def.boss).toBe(true);
    for(const [index,cls] of CLASSES.entries()){
      const {sim,pid,p,meta}=simFor(cls,947111+index*817);
      sim.setPlayerLevel(99,pid);
      const training=JSON.stringify((sim.serializeCharacter(pid) as any)?.trainingProfile);
      const weapon=hfP13ItemId(90,WT[cls]),armor=hfP16ArmorId(90,AT[cls]);
      sim.addItem(weapon,1,pid);sim.equipItem(weapon,pid,'mainhand');
      equipRogueDualDagger(sim,pid,cls,weapon);
      sim.addItem(armor,1,pid);sim.equipItem(armor,pid);
      expect(meta.equipment.mainhand).toBe(weapon);
      expect(meta.equipment.chest).toBe(armor);
      const candidates=Object.values(ITEMS).filter(item=>
        item.kind==='armor'&&!!item.slot&&item.slot!=='chest'&&
        canEquipItem(cls,item)&&requiredLevelFor(item)<=99)
        .sort((a,b)=>requiredLevelFor(b)-requiredLevelFor(a)||
          (b.stats?.armor??0)-(a.stats?.armor??0));
      const slots=new Set<string>();
      for(const item of candidates){
        if(!item.slot||slots.has(item.slot))continue;
        sim.addItem(item.id,1,pid);sim.equipItem(item.id,pid);
        if(Object.values(meta.equipment).includes(item.id))slots.add(item.slot);
        if(slots.size>=8)break;
      }
      expect(Object.values(meta.equipment).filter(Boolean).length).toBeGreaterThanOrEqual(3);
      sim.addItem('healing_potion',3,pid);
      const known=new Set(meta.known.map(x=>x.def.id));
      const attack=SKILL[cls].filter(x=>known.has(x));
      const healing=(HEALS[cls]??[]).filter(x=>known.has(x));
      const guard=GUARD[cls].filter(x=>known.has(x));
      expect(attack.length,'NO_NATIVE_SOLO_ATTACK_'+cls).toBeGreaterThan(0);
      const opened:string[]=[];
      // One genuine in-game cast per GCD while preparing, at full HP, before
      // the captain acquires the character. NO direct aura manipulation.
      for(const buff of OPEN[cls].filter(x=>known.has(x))){
        sim.castAbility(buff,pid);
        opened.push(buff);
        for(let t=0;t<Math.ceil(1.6/DT);t++)sim.tick();
      }
      const ranged=['hunter','priest','shaman','mage','warlock','druid'].includes(cls);
      // Use actual class attack distances; stationary bosses do not chase
      // casters into wand range. A 10m opener previously suppressed all
      // movement and most caster auto-attacks in the test bot.
      const spawnGap=ranged?(cls==='hunter'?12:4.5):2;
      const captain=createMob(sim.nextId++,def,99,
        {x:p.pos.x+spawnGap,y:p.pos.y,z:p.pos.z+spawnGap/4});
      captain.hostile=true;sim.addEntity(captain);
      const startHp=captain.hp;
      sim.targetEntity(captain.id,pid);
      sim.startAutoAttack(pid);
      const castPeriod=Math.max(1,Math.ceil(1.55/DT));
      const maxTicks=Math.ceil(130/DT);
      let turns=0,atk=0,defensive=0,heals=0,potions=0,relocations=0,executeAttempts=0;
      let attemptedAttacks=0,attemptedHeals=0,attemptedGuard=0;
      let maxRange=0,lastHeal=-500,lastDefend=-500,ticks=0;
      let effectiveHealing=0,healingEvents=0,actualDamageDone=0,actualDamageTaken=0;
      let outOfPreferredRangeTicks=0,minRange=Infinity;
      for(;ticks<maxTicks&&!p.dead&&!captain.dead;ticks++){
        const d=Math.hypot(p.pos.x-captain.pos.x,p.pos.z-captain.pos.z);
        maxRange=Math.max(maxRange,d);
        minRange=Math.min(minRange,d);
        if(cls==='hunter'&&(d<8||d>18))outOfPreferredRangeTicks++;
        p.facing=Math.atan2(captain.pos.x-p.pos.x,captain.pos.z-p.pos.z);
        // PLAYER-LEGAL MOVE INPUT via original stepPlayerMotion, no teleport.
        // Kite only while not hard casting; remain within attack range.
        meta.moveInput.back=ranged&&d<(cls==='hunter'?10:3)&&!p.castingAbility;
        meta.moveInput.forward=ranged&&d>(cls==='hunter'?14:5.5)&&!p.castingAbility;
        if(meta.moveInput.back||meta.moveInput.forward)relocations++;
        if(p.hp/p.maxHp<=0.52&&p.potionCooldownUntil<=sim.time&&
          sim.countItem('healing_potion',pid)>0){
          const before=sim.countItem('healing_potion',pid);
          sim.useItem('healing_potion',pid);
          if(sim.countItem('healing_potion',pid)<before)potions++;
        }
        if(ticks%castPeriod===0&&!p.castingAbility){
          const health=p.hp/p.maxHp;
          if(health<0.78&&guard.length&&ticks-lastDefend>Math.ceil(10/DT)){
            const id=guard[defensive++%guard.length];
            sim.castAbility(id,pid);
            attemptedGuard++;lastDefend=ticks;
          }else if(health<0.52&&healing.length&&ticks-lastHeal>Math.ceil(4.5/DT)){
            const heal=healing[heals++%healing.length];
            sim.castAbilityOn(heal,pid,pid);
            attemptedHeals++;lastHeal=ticks;
          }else{
            // Original Arms/Prot finishing move only below its native 20% HP gate.
            // No extra damage or resource: the Sim validates its genuine cast.
            const finishing=cls==='warrior'&&known.has('execute')&&
              captain.hp/captain.maxHp<0.2;
            const id=finishing?'execute':attack[atk++%attack.length];
            sim.castAbility(id,pid);
            if(finishing)executeAttempts++;
            attemptedAttacks++;
          }
          turns++;
        }
        const events=sim.tick();
        for(const ev of events){
          if(ev.type==='heal2'&&ev.targetId===pid&&ev.amount>0){
            effectiveHealing+=ev.amount;healingEvents++;
          }
          if(ev.type==='damage'&&ev.amount>0){
            if(ev.sourceId===pid&&ev.targetId===captain.id)actualDamageDone+=ev.amount;
            if(ev.sourceId===captain.id&&ev.targetId===pid)actualDamageTaken+=ev.amount;
          }
        }
      }
      // Motion bits MUST be released on leaving automated combat, just as
      // lifting one's thumbs releases both virtual joysticks.
      meta.moveInput.back=false;meta.moveInput.forward=false;
      const win=captain.dead&&!p.dead;
      const row={
        cls,result:win?'WIN':p.dead?'LOSS':'TIMEOUT',
        bossHpStart:startHp,bossHpEnd:Math.max(0,captain.hp),
        bossHpRemainingPct:Math.round(10000*Math.max(0,captain.hp)/startHp)/100,
        heroEndHp:Math.max(0,p.hp),heroMaxHp:p.maxHp,
        seconds:Math.round(ticks*DT*100)/100,gearSlots:Object.values(meta.equipment).filter(Boolean).length,
        opened,guardsAvailable:guard,healsAvailable:healing,executeAttempts,
        attemptedAttacks,attemptedHeals,attemptedGuard,botTurns:turns,
        potionUses:potions,nativeInputSteps:relocations,
        maxRange:Math.round(maxRange*10)/10,
        minRange:Math.round(minRange*10)/10,
        hunterSecondsOutsideEffectiveRange:cls==='hunter'?Math.round(outOfPreferredRangeTicks*DT*100)/100:0,
        effectiveHealing,healingEvents,
        actualDamageDone:Math.round(actualDamageDone),actualDamageTaken:Math.round(actualDamageTaken),
        trainingUnchanged:JSON.stringify((sim.serializeCharacter(pid) as any)?.trainingProfile)===training,
        level99Preserved:sim.serializeCharacter(pid)?.level===99,
        noEnemyHpOverride:captain.maxHp===startHp};
      rows.push(row);
      console.info('HF_SUPREME_SOLO99_TACTICAL_CLASS='+JSON.stringify(row));
    }
    const summary={classes:9,wins:rows.filter(x=>x.result==='WIN').length,
      losses:rows.filter(x=>x.result==='LOSS').length,
      timeouts:rows.filter(x=>x.result==='TIMEOUT').length,
      noBossNerf:true,noTrainingStatBoost:true,
      roleAppropriateOffenseHealingDefensesAndNativeInput:true,
      gearAndLevelsAreExplicitFixtures:true,
      playtestOnPhysicalS23Needed:true,
      rows:rows.map(x=>({cls:x.cls,result:x.result,
        bossHpRemainingPct:x.bossHpRemainingPct,heroEndHp:x.heroEndHp,
        seconds:x.seconds,executeAttempts:x.executeAttempts,guardAttempts:x.attemptedGuard,
        healingAttempts:x.attemptedHeals,effectiveHealing:x.effectiveHealing,
        healingEvents:x.healingEvents,damageDone:x.actualDamageDone,
        hunterRangeOutSeconds:x.hunterSecondsOutsideEffectiveRange,
        potions:x.potionUses}))};
    console.info('HF_SUPREME_SOLO99_TACTICAL_9='+JSON.stringify(summary));
    expect(rows).toHaveLength(9);
    expect(rows.every(x=>x.trainingUnchanged&&x.level99Preserved&&
      x.noEnemyHpOverride&&x.attemptedAttacks>0)).toBe(true);
  },240000);
});

/** NORMAL LV99 solo acceptance separate from OPTIONAL 90-99 elite captain.
 * A support/healer class must be able to clear ordinary native content
 * without a Warrior partner. Level + legal equipment is an explicit
 * precondition; no training stats or enemy HP ever injected/modified.
 */
describe('HIGHFLY LV99 normal open-world combat — ALL nine classes viable solo',()=>{
  it('every class wins a genuine full-HP/AI LV99 wolf encounter with its own legal loadout',()=>{
    const rows:any[]=[];
    const def=MOBS.hf_hunt_wolf_90;
    expect(def).toBeDefined();
    expect(def.boss).not.toBe(true);
    expect(def.elite).not.toBe(true);
    for(const [i,cls] of CLASSES.entries()){
      const {sim,pid,p,meta}=simFor(cls,936100+i*311);
      sim.setPlayerLevel(99,pid);
      const startTraining=JSON.stringify((sim.serializeCharacter(pid) as any)?.trainingProfile);
      const weapon=hfP13ItemId(90,WT[cls]),chest=hfP16ArmorId(90,AT[cls]);
      sim.addItem(weapon,1,pid);sim.equipItem(weapon,pid,'mainhand');
      equipRogueDualDagger(sim,pid,cls,weapon);
      sim.addItem(chest,1,pid);sim.equipItem(chest,pid);
      expect(meta.equipment.mainhand).toBe(weapon);
      expect(meta.equipment.chest).toBe(chest);
      const extra=Object.values(ITEMS).filter(item=>item.kind==='armor'&&
        !!item.slot&&item.slot!=='chest'&&canEquipItem(cls,item)&&
        requiredLevelFor(item)<=99)
        .sort((a,b)=>requiredLevelFor(b)-requiredLevelFor(a)||
          (b.stats?.armor??0)-(a.stats?.armor??0));
      const slots=new Set<string>();
      for(const it of extra){
        if(!it.slot||slots.has(it.slot))continue;
        sim.addItem(it.id,1,pid);sim.equipItem(it.id,pid);
        if(Object.values(meta.equipment).includes(it.id))slots.add(it.slot);
        if(slots.size>=8)break;
      }
      sim.addItem('healing_potion',3,pid);
      const known=new Set(meta.known.map(x=>x.def.id));
      const atk=OFFENSE[cls].filter(x=>known.has(x));
      const heal=(HEALS[cls]??[]).filter(x=>known.has(x));
      expect(atk.length).toBeGreaterThan(0);
      const target=createMob(sim.nextId++,def,99,{
        x:p.pos.x+2,y:p.pos.y,z:p.pos.z+1});
      target.hostile=true;sim.addEntity(target);
      const nativeMonsterHp=target.hp;
      expect(nativeMonsterHp).toBeGreaterThan(1);
      p.facing=Math.atan2(target.pos.x-p.pos.x,target.pos.z-p.pos.z);
      sim.targetEntity(target.id,pid);sim.startAutoAttack(pid);
      let ticks=0,actions=0,heals=0,potions=0,lastHeal=-500;
      const n=Math.ceil(115/DT),every=Math.ceil(1.8/DT);
      for(;ticks<n&&!p.dead&&!target.dead;ticks++){
        if(p.hp/p.maxHp<0.58&&sim.countItem('healing_potion',pid)>0&&
          p.potionCooldownUntil<=sim.time){
          const before=sim.countItem('healing_potion',pid);
          sim.useItem('healing_potion',pid);
          if(sim.countItem('healing_potion',pid)<before)potions++;
        }
        if(ticks%every===0&&!p.castingAbility){
          if(p.hp/p.maxHp<0.48&&heal.length&&ticks-lastHeal>Math.ceil(5/DT)){
            sim.castAbilityOn(heal[heals++%heal.length],pid,pid);
            lastHeal=ticks;
          }else sim.castAbility(atk[actions++%atk.length],pid);
        }
        sim.tick();
      }
      const result=target.dead&&!p.dead?'WIN':p.dead?'LOSS':'TIMEOUT';
      const row={cls,result,seconds:Math.round(ticks*DT*100)/100,
        nativeMobHp:nativeMonsterHp,
        mobEndHp:Math.max(0,target.hp),heroEndHp:Math.max(0,p.hp),
        gearSlots:Object.values(meta.equipment).filter(Boolean).length,
        attemptedActions:actions,attemptedHeals:heals,potionsUsed:potions,
        noMonsterHpOverride:target.maxHp===nativeMonsterHp,
        levelCapPreserved:sim.serializeCharacter(pid)?.level===99,
        trainingUnchanged:JSON.stringify((sim.serializeCharacter(pid) as any)?.trainingProfile)===startTraining};
      console.info('HF_SUPREME_LV99_NORMAL_SOLO_CLASS='+JSON.stringify(row));
      rows.push(row);
    }
    const summary={classes:9,wins:rows.filter(x=>x.result==='WIN').length,
      losses:rows.filter(x=>x.result==='LOSS').length,
      timeouts:rows.filter(x=>x.result==='TIMEOUT').length,
      nativeFullHpAI:true,soloWithoutParty:true,
      legalEquipmentAndConsumablesFixture:true,
      noTrainingIncrease:true,bossCaptainIsSeparateOptionalDifficulty:true,
      rows:rows.map(x=>({cls:x.cls,result:x.result,seconds:x.seconds,
        heroEndHp:x.heroEndHp,mobEndHp:x.mobEndHp}))};
    console.info('HF_SUPREME_SOLO99_NORMAL_WOLF_9='+JSON.stringify(summary));
    expect(rows).toHaveLength(9);
    expect(rows.every(x=>x.noMonsterHpOverride&&x.levelCapPreserved&&
      x.trainingUnchanged)).toBe(true);
    expect(summary.wins,'ALL_NINE_CLASSES_MUST_CLEAR_NATIVE_NORMAL_99').toBe(9);
  },240000);
});

/** PvP is separate from PvM and cannot be declared balanced by a PvM run.
 * Real ORIGINAL duel handshake, non-lethal HP-clamped finish, 9 class vs
 * warrior matchups at level 99 + 9 mirrored class duels (18 matches).
 * Full legal gear and LV99 are QA preconditions, not earned equipment/XP.
 * This is a diagnostic across classes: match win rates require symmetric
 * player control, latency tests and repeated seeds before balancing changes.
 */
describe('HIGHFLY PvP — real class duels level99, 9 matchups plus nine mirrors',()=>{
  it('covers all nine classes in 18 nonlethal native 1v1s without touching Training stats',()=>{
    type Row={a:PlayerClass,b:PlayerClass,winner:string,seconds:number,
      startHpA:number,startHpB:number,minHpA:number,minHpB:number,
      aOffensiveCasts:number,bOffensiveCasts:number,
      aHealCasts:number,bHealCasts:number,zeroRealDeaths:boolean,
      bothLevel99:boolean,statsUnchanged:boolean};
    const rows:Row[]=[];
    const pairings=[...CLASSES.map(c=>[c,'warrior'] as const),
      ...CLASSES.map(c=>[c,c] as const)];
    for(const [i,[aClass,bClass]] of pairings.entries()){
      const sim=new Sim({seed:1001887+i*37,playerClass:aClass,noPlayer:true,
        autoEquip:false,world:WORLD,compulsoryTutorial:false,riftPortals:false});
      const a=sim.addPlayer(aClass,'HF99_PVP_A_'+aClass,
        {characterId:91001+i*2,tutorialGreetingSent:true});
      const b=sim.addPlayer(bClass,'HF99_PVP_B_'+bClass,
        {characterId:91002+i*2,tutorialGreetingSent:true});
      sim.setPlayerLevel(99,a);sim.setPlayerLevel(99,b);
      const aE=sim.entities.get(a)!,bE=sim.entities.get(b)!;
      const aMeta=sim.players.get(a)!,bMeta=sim.players.get(b)!;
      for(const [pid,cl,meta] of [[a,aClass,aMeta],[b,bClass,bMeta]] as const){
        const weapon=hfP13ItemId(90,WT[cl]),chest=hfP16ArmorId(90,AT[cl]);
        sim.addItem(weapon,1,pid);sim.equipItem(weapon,pid,'mainhand');
        equipRogueDualDagger(sim,pid,cl,weapon);
        sim.addItem(chest,1,pid);sim.equipItem(chest,pid);
        expect(meta.equipment.mainhand).toBe(weapon);
        expect(meta.equipment.chest).toBe(chest);
        const legal=Object.values(ITEMS).filter(it=>it.kind==='armor'&&
          !!it.slot&&it.slot!=='chest'&&canEquipItem(cl,it)&&
          requiredLevelFor(it)<=99)
          .sort((x,y)=>requiredLevelFor(y)-requiredLevelFor(x)||
            (y.stats?.armor??0)-(x.stats?.armor??0));
        const slots=new Set<string>();
        for(const it of legal){
          if(!it.slot||slots.has(it.slot))continue;
          sim.addItem(it.id,1,pid);sim.equipItem(it.id,pid);
          if(Object.values(meta.equipment).includes(it.id))slots.add(it.slot);
          if(slots.size>=8)break;
        }
        // Duel consumables are NOT gifted. Native PvP tests the class kit only.
      }
      aE.pos=sim.groundPos(0,-40);
      bE.pos=sim.groundPos(4,-40);
      aE.prevPos={...aE.pos};bE.prevPos={...bE.pos};
      sim.rebucket(aE);sim.rebucket(bE);
      const trainingA=JSON.stringify((sim.serializeCharacter(a) as any).trainingProfile);
      const trainingB=JSON.stringify((sim.serializeCharacter(b) as any).trainingProfile);
      const hpA=aE.hp,hpB=bE.hp;
      sim.duelRequest(b,a);sim.duelAccept(b);
      for(let k=0;k<80&&sim.duelFor(a)?.state!=='active';k++)sim.tick();
      expect(sim.duelFor(a)?.state,'PVP_NATIVE_DUEL_NOT_STARTED_'+aClass+'_'+bClass).toBe('active');
      sim.targetEntity(b,a);sim.targetEntity(a,b);
      sim.startAutoAttack(a);sim.startAutoAttack(b);
      const attacksA=OFFENSE[aClass].filter(x=>aMeta.known.some(k=>k.def.id===x));
      const attacksB=OFFENSE[bClass].filter(x=>bMeta.known.some(k=>k.def.id===x));
      const healsA=(HEALS[aClass]??[]).filter(x=>aMeta.known.some(k=>k.def.id===x));
      const healsB=(HEALS[bClass]??[]).filter(x=>bMeta.known.some(k=>k.def.id===x));
      expect(attacksA.length).toBeGreaterThan(0);
      expect(attacksB.length).toBeGreaterThan(0);
      let ticks=0,aOffense=0,bOffense=0,aHeal=0,bHeal=0,minA=aE.hp,minB=bE.hp;
      const maxTicks=Math.ceil(55/DT),cadence=Math.ceil(1.8/DT);
      for(;ticks<maxTicks&&sim.duelFor(a);ticks++){
        aE.facing=Math.atan2(bE.pos.x-aE.pos.x,bE.pos.z-aE.pos.z);
        bE.facing=Math.atan2(aE.pos.x-bE.pos.x,aE.pos.z-bE.pos.z);
        if(ticks%cadence===0){
          if(!aE.castingAbility){
            if(aE.hp/aE.maxHp<0.48&&healsA.length){
              sim.castAbilityOn(healsA[aHeal++%healsA.length],a,a);
            }else sim.castAbility(attacksA[aOffense++%attacksA.length],a);
          }
          if(!bE.castingAbility){
            if(bE.hp/bE.maxHp<0.48&&healsB.length){
              sim.castAbilityOn(healsB[bHeal++%healsB.length],b,b);
            }else sim.castAbility(attacksB[bOffense++%attacksB.length],b);
          }
        }
        // Skill-expression fixture: keep melee in weapon range, let ranged
        // classes kite using only the ORIGINAL authoritative MoveInput.
        // The pursuer's forward press and the defender's backward press are
        // competing player inputs, not teleports or AI stat buffs.
        const gap=Math.hypot(aE.pos.x-bE.pos.x,aE.pos.z-bE.pos.z);
        for(const [p,m,klass] of [[aE,aMeta,aClass],[bE,bMeta,bClass]] as const){
          const ranged=klass==='hunter'||['priest','shaman','mage','warlock','druid'].includes(klass);
          const preferred=klass==='hunter'?10:ranged?5:1.6;
          m.moveInput.forward=gap>preferred+0.9&&!p.castingAbility;
          m.moveInput.back=ranged&&gap<preferred-0.9&&!p.castingAbility;
        }
        sim.tick();
        minA=Math.min(minA,aE.hp);minB=Math.min(minB,bE.hp);
      }
      aMeta.moveInput.forward=false;aMeta.moveInput.back=false;
      bMeta.moveInput.forward=false;bMeta.moveInput.back=false;
      const aWon=(aMeta.deedStats.counters.duelsWon??0)>0;
      const bWon=(bMeta.deedStats.counters.duelsWon??0)>0;
      const statsUnchanged=
        JSON.stringify((sim.serializeCharacter(a) as any).trainingProfile)===trainingA&&
        JSON.stringify((sim.serializeCharacter(b) as any).trainingProfile)===trainingB;
      const bothLevel99=sim.serializeCharacter(a)?.level===99&&
        sim.serializeCharacter(b)?.level===99;
      const row:Row={a:aClass,b:bClass,
        winner:aWon&&!bWon?'A':bWon&&!aWon?'B':'UNRESOLVED',
        seconds:Math.round(ticks*DT*100)/100,
        startHpA:hpA,startHpB:hpB,minHpA:minA,minHpB:minB,
        aOffensiveCasts:aOffense,bOffensiveCasts:bOffense,
        aHealCasts:aHeal,bHealCasts:bHeal,
        zeroRealDeaths:!aE.dead&&!bE.dead,bothLevel99,statsUnchanged};
      expect(row.zeroRealDeaths,'PVP_DUEL_KILLED_REAL_HUNTER').toBe(true);
      expect(row.bothLevel99&&row.statsUnchanged,'PVP_MUTATED_LEVEL_OR_TRAINING').toBe(true);
      rows.push(row);
    }
    console.info('HF_SUPREME_PVP_LV99_DUELS_9='+JSON.stringify({
      classCoverage:CLASSES.length,duels:rows.length,
      resolved:rows.filter(x=>x.winner!=='UNRESOLVED').length,
      unresolved:rows.filter(x=>x.winner==='UNRESOLVED').length,
      realPvPHandshake:true,realDuelAiAndDamage:true,
      nonlethalPvPGuaranteed:true,
      classGearAndLv99AreTestFixtures:true,
      noPvPBalanceChanges:true,duelOutcomeNotCompetitiveWinrate:true,
      classes:rows.map(x=>({a:x.a,b:x.b,winner:x.winner,
        seconds:x.seconds,aCasts:x.aOffensiveCasts,bCasts:x.bOffensiveCasts,
        aHeals:x.aHealCasts,bHeals:x.bHealCasts}))
    }));
    expect(rows).toHaveLength(18);
    expect(rows.every(x=>x.zeroRealDeaths&&x.bothLevel99&&x.statsUnchanged)).toBe(true);
  },240000);
});

/** Rogue's CLASS FOUNDATION is dual rusty_daggers. The P13 LV90 Night Dirk
 * stays a genuine native ONEHAND dagger, and the ORIGINAL equipment rules
 * permit two separately made copies in both sockets. This regression is
 * needed because "mainhand upgraded, rusty offhand" silently understates the
 * Rogue's LV99 DPS and made the owner question its identity.
 */
describe('HIGHFLY Rogue Lv99 — native Assassin DOUBLE DAGGER not single dagger',()=>{
  it('equips TWO independently crafted level-90 Night Dirks and saves both without Training change',()=>{
    const {sim,pid,meta}=simFor('rogue',198702);
    sim.setPlayerLevel(99,pid);
    const before=JSON.stringify((sim.serializeCharacter(pid) as any)?.trainingProfile);
    const dagger=hfP13ItemId(90,'scout');
    expect(ITEMS[dagger].kind).toBe('weapon');
    expect(ITEMS[dagger].weapon?.dagger).toBe(true);
    expect(meta.equipment.mainhand).toBe('rusty_dagger');
    expect(meta.equipment.offhand).toBe('rusty_dagger');
    sim.addItem(dagger,2,pid);
    sim.equipItem(dagger,pid,'mainhand');
    expect(meta.equipment.mainhand).toBe(dagger);
    sim.equipItem(dagger,pid,'offhand');
    expect(meta.equipment.offhand).toBe(dagger);
    expect(sim.countItem(dagger,pid)).toBe(0);
    expect(JSON.stringify((sim.serializeCharacter(pid) as any)?.trainingProfile)).toBe(before);
    const snapshot=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    const load=new Sim({seed:198703,playerClass:'rogue',noPlayer:true,
      autoEquip:false,world:WORLD,compulsoryTutorial:false,riftPortals:false});
    const rid=load.addPlayer('rogue','AssassinTwoDaggers',
      {state:snapshot,tutorialGreetingSent:true});
    expect(load.players.get(rid)?.equipment.mainhand).toBe(dagger);
    expect(load.players.get(rid)?.equipment.offhand).toBe(dagger);
    console.info('HF99_ROGUE_DUAL_NIGHT_DIRK_NATIVE_GEAR='+JSON.stringify({
      class:'rogue',style:'DUAL_DAGGER',originalRig:true,
      mainhand:dagger,offhand:dagger,craftCopiesNeeded:2,
      originalEquipmentRules:true,unchangedTraining:true,persistent:true,
      marketEligible:ITEMS[dagger].noMarketList===false
    }));
  });
});
