/** HIGHFLY F2.7: Blade Rush shares the native charge route and its arrival event.
 * One authoritative weapon hit happens only after physically reaching the mob.
 * A timeout, obstruction or killed target spends the committed stamina but
 * NEVER grants free ranged damage. No extra movement motor or autoattack. */
import type {SimContext} from '../../sim/sim_context';
import type {Entity} from '../../sim/types';
import {meleeSwing} from '../../sim/combat/auto_attack';

export const HIGHFLY_BLADE_RUSH_ID='highfly_blade_rush' as const;
export function finishHighflyBladeRush(
  ctx:SimContext, runner:Entity, target:Entity|null, arrived:boolean,
):void {
  if(runner.highflyBladeRushPending!==true)return;
  delete runner.highflyBladeRushPending;
  if(!arrived||!target||target.dead||runner.dead||!ctx.isHostileTo(runner,target))return;
  // Native shared hit table: misses, dodges, parries, armor, on-hit procs,
  // damage history and XP all match every other Hunter melee skill.
  meleeSwing(ctx,runner,target,4,'Blade Rush',{
    abilityId:HIGHFLY_BLADE_RUSH_ID,
    weaponMult:1.1,
    autoAttack:false,
  });
}
