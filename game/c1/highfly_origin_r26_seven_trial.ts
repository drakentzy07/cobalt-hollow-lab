/**
 * R26: disposable seven-skill NATIVE Sim trial. Never persist abilities,
 * bypass Sim for damage, or mutate original ABILITIES.
 */
import { ABILITIES } from './content/classes';
import { originCostDecision } from './highfly_origin_universal_resources';
import type { Sim } from './sim';
import type { ResolvedAbility } from './resolved_ability';

export const ORIGIN_R26_SEVEN_IDS = [
  'shadow_bolt', 'meteor', 'dragons_breath', 'sinister_strike',
  'heroic_leap', 'bladestorm', 'fear',
] as const;

export function originR26SessionOnly(sim: Sim): void {
  const meta = sim.players.get(sim.playerId);
  if (!meta?.originHunter || !sim.player.originResources)
    throw new Error('HIGHFLY_R26_NOT_ISOLATED_HUNTER');
  const resolved: ResolvedAbility[] = ORIGIN_R26_SEVEN_IDS.map((id) => {
    const def = ABILITIES[id];
    if (!def || def.passive || def.hiddenFromPlayer || !originCostDecision(def).ok)
      throw new Error('HIGHFLY_R26_INVALID_NATIVE_SKILL_' + id);
    const result: ResolvedAbility = {
      def,rank:1,cost:def.cost,castTime:def.castTime,cooldown:def.cooldown,
      effects:[...def.effects],threatFlat:def.threat?.flat ?? 0,
      threatMult:def.threat?.mult ?? 1,
      bonusCharges:Math.max(0,(def.maxCharges ?? 1)-1),
    };
    if (def.maxCharges!==undefined) result.charges=def.maxCharges;
    return result;
  });
  // This Sim is never serialized in R26. No learned IDs or mastery are added.
  meta.known = resolved;
  // Generous LAB-ONLY reserves, native ability costs/regen remain untouched.
  meta.originHunter.resources.maxMana=400;
  meta.originHunter.resources.mana=400;
  meta.originHunter.resources.maxStamina=250;
  meta.originHunter.resources.stamina=250;
}
