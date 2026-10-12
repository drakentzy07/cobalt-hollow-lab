/** HIGHFLY GOLDEN DEV3 — read-only native gold-faucet/gold-sink balance
 * audit. Original donor Sim/looting/formatting/Vendor/Trainer are authorities.
 * No fictitious gold payouts, NPCs, party net code, shop grants or reset stats.
 * All estimates are content-table diagnostics, not proof of real progression.
 */
import {describe,it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {ITEMS,MOBS} from '../src/sim/data';
import {trainingFeeFor,TRAINING_FEE_BY_TIER} from '../src/sim/professions/training';
import {CRAFT_GOLD_SINK_COPPER_PER_BUDGET} from '../src/sim/content/professions';
import {formatMoney} from '../src/sim/format_money';
import {recipeById} from '../src/sim/content/recipes';
import {HF_P13_WEAPON_LEVELS,hfP13RecipeId} from
  '../src/sim/content/highfly_lv99_native_equipment';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';

const TRACKS=['warrior','scout','caster'] as const;
const BANDS:[[number,number],...[number,number][]]=[
  [1,9],[10,19],[20,20],[21,29],[30,39],[40,49],
  [50,59],[60,69],[70,79],[80,89],[90,99],
];
describe('HIGHFLY DEV3 original ClaudeCraft money inflow and late forge sink',()=>{
  it('keeps native currency denomination and vendor staples, never new currencies',()=>{
    expect(formatMoney(1)).toBe('1c');
    expect(formatMoney(100)).toBe('1s');
    expect(formatMoney(10_000)).toBe('1g');
    expect(formatMoney(23_405)).toBe('2g 34s 5c');
    const flux=ITEMS.smithing_flux;
    expect(flux).toBeDefined();
    expect(flux.buyValue).toBeGreaterThan(0);
    expect(flux.sellValue).toBeGreaterThanOrEqual(0);
    expect(flux.buyValue).toBeGreaterThan(flux.sellValue);
    expect(TRAINING_FEE_BY_TIER.length).toBeGreaterThan(0);
    expect(CRAFT_GOLD_SINK_COPPER_PER_BUDGET).toBeGreaterThan(0);
  });
  it('exports 11-band / 15-recipe copper faucet-versus-sink ledger and flags level-99 proof gaps',()=>{
    const mobs=Object.values(MOBS).filter(m=>!m.dummy&&!m.ambient);
    const nativeCopper=(mob:typeof mobs[number])=>mob.loot
      .filter(l=>l.copper!==undefined&&l.chance===1)
      .reduce((s,l)=>s+(l.copper??0),0);
    const bands=BANDS.map(([from,to])=>{
      const matching=mobs.filter(m=>m.minLevel<=to&&m.maxLevel>=from);
      const hf=matching.filter(m=>m.id.startsWith('hf_hunt_'));
      const baseCoins=hf.map(nativeCopper).filter(n=>n>0).sort((a,b)=>a-b);
      return {from,to,
        mobCount:matching.length,
        highflyOrdinaryCount:hf.length,
        highflyGuaranteedCopperBaseMin:baseCoins[0]??null,
        highflyGuaranteedCopperBaseMax:baseCoins.at(-1)??null,
        originalWorldQuestGoldAtHighLevelCertified:false,
        incomeSourcesCertifiedAtBand:['native_loot_table'],
        notes:from<=20?
          'Donor quest and vendor money exists; this audit does NOT prove all vendor/quest access.':
          'HIGHFLY native corpse copper exists; quests/vendor/world access and farming time not certified.',
      };
    });
    for(const band of bands){
      expect(band.mobCount).toBeGreaterThan(0);
      if(band.from>=21){
        expect(band.highflyOrdinaryCount).toBeGreaterThan(0);
        expect(band.highflyGuaranteedCopperBaseMin).toBeGreaterThan(0);
      }
    }
    const flux=ITEMS.smithing_flux;
    const rows=HF_P13_WEAPON_LEVELS.flatMap(level=>
      TRACKS.map(track=>{
        const recipe=recipeById(hfP13RecipeId(level,track));
        expect(recipe).toBeDefined();
        expect(recipe!.acquisition).toContain('trainer');
        const sameLevel=mobs.filter(m=>m.id.startsWith('hf_hunt_')&&
          m.minLevel<=level&&m.maxLevel>=level);
        const bestNativeCopper=Math.max(0,...sameLevel.map(nativeCopper));
        expect(bestNativeCopper,'NO MONEY FROM P13 BAND LV'+level).toBeGreaterThan(0);
        const trainerCopper=trainingFeeFor(recipe!);
        const fluxUnits=recipe!.reagents.find(r=>r.itemId==='smithing_flux')?.count??0;
        expect(fluxUnits).toBeGreaterThan(0);
        const vendorFluxCopper=fluxUnits*(flux.buyValue??0);
        const forgeNominalCopper=recipe!.itemLevelBudget*
          CRAFT_GOLD_SINK_COPPER_PER_BUDGET;
        const plannedTotalCopper=trainerCopper+vendorFluxCopper+forgeNominalCopper;
        return {
          level,track,recipeId:recipe!.id,
          bestSourceNativeGuaranteedCopperBase:bestNativeCopper,
          trainingCopper:trainerCopper,trainingMoney:formatMoney(trainerCopper),
          oneTimeTrainer:true,
          vendorFluxCopper,forgeNominalCopper,
          // Native crafting charges up to the budget fee but never denies
          // crafting for lack of gold. This figure is PLANNED sink, not a hard gate.
          forgeFeeIsHardRequirement:false,
          plannedTotalCopper,
          money:formatMoney(plannedTotalCopper),
          optimisticKillsForCurrencyOnly:Math.ceil(plannedTotalCopper/bestNativeCopper),
          possibleOtherIncomeSourcesUnquantified:true,
        };
      }));
    const report={
      status:'DEV3_NATIVE_COPPER_LEDGER_NOT_REAL_PLAYTIME_CERTIFIED',
      normalLevelMax:99,extended100PlusEnabled:false,
      copperPerSilver:100,copperPerGold:10_000,
      originalDonorSimUnchanged:true,
      monetaryInputs:[
        'native corpse copper per LootEntry via loot_roll.ts',
        'selling items to native vendors via items.ts',
        'donor world-quest rewards, originally balanced around LV20 (NOT verified LV21-99)',
        'market proceeds if market actually operates for the active mode (NOT co-op guarantee)',
      ],
      monetarySinks:[
        'native vendor buyValue and stack quantities',
        'one-time trainer fee for each learned recipe',
        'native craft itemLevelBudget fee, only up to available copper',
        'market commission and other native services where enabled',
      ],
      caveats:[
        'Optimistic money kills use the richest at-level normal mob, do not prove it shares ingredient source.',
        'Corpse copper rolls 60–140 percent of base when the chance row succeeds.',
        'The trainer fee may dominate the material grind, and currency-only estimate excludes rest, deaths, time and vendor location.',
        'Never mint Training stats, automatic reset prestige, 100+ Extended access or a replacement economy.',
      ],
      bands,recipes:rows,
      maximumOptimisticCurrencyOnlyKills:Math.max(...rows.map(r=>r.optimisticKillsForCurrencyOnly)),
    };
    writeFileSync('../highfly_golden_dev3_lv1_99_gold_faucets_sinks.json',
      JSON.stringify(report,null,2)+'\n','utf8');
    console.info('HF_GOLDEN_DEV3_NATIVE_GOLD_LEDGER='+JSON.stringify({
      bands:bands.length,recipes:rows.length,
      moneyKillsByRung:Object.fromEntries(HF_P13_WEAPON_LEVELS.map(level=>[
        level,rows.find(r=>r.level===level)!.optimisticKillsForCurrencyOnly])),
      trainerFees:Object.fromEntries(HF_P13_WEAPON_LEVELS.map(level=>[
        level,rows.find(r=>r.level===level)!.trainingMoney])),
      maxMoneyKills:report.maximumOptimisticCurrencyOnlyKills,
    }));
    expect(rows).toHaveLength(15);
    expect(bands).toHaveLength(11);
    expect(rows.every(r=>r.oneTimeTrainer&&r.trainingCopper>0)).toBe(true);
  });
});
