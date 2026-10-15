import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { newOriginHunterProfile } from '../src/sim/highfly_origin_hunter_profile';
import {
  ORIGIN_BASIC_STAMINA_COST,
  ORIGIN_MOTION_STAMINA_COST,
  originCanSpendStamina,
  originSpendBasicStamina,
  originSpendMotionStamina,
} from '../src/sim/highfly_origin_action_stamina';

describe('HIGHFLY ORIGIN R1-4D — real movement and manual attack stamina', () => {
  it('makes only Hunter manual accepted strikes cost stamina; ATK4 costs more', () => {
    const p=newOriginHunterProfile();
    expect(ORIGIN_BASIC_STAMINA_COST).toEqual([0,4,4,6,8]);
    expect(originSpendBasicStamina(p,1)).toBe(true);
    expect(p.resources.stamina).toBe(96);
    expect(originSpendBasicStamina(p,2)).toBe(true);
    expect(originSpendBasicStamina(p,3)).toBe(true);
    expect(originSpendBasicStamina(p,4)).toBe(true);
    expect(p.resources.stamina).toBe(78);
    expect(originSpendBasicStamina(undefined,4)).toBe(true);
  });
  it('bills first jump, second jump and directional Evade exactly once per admitted motion edge', () => {
    const p=newOriginHunterProfile();
    expect(ORIGIN_MOTION_STAMINA_COST).toEqual({groundJump:6,airJump:10,evade:14});
    expect(originSpendMotionStamina(p,'groundJump')).toBe(true);
    expect(originSpendMotionStamina(p,'airJump')).toBe(true);
    expect(originSpendMotionStamina(p,'evade')).toBe(true);
    expect(p.resources.stamina).toBe(70);
    expect(originSpendMotionStamina(undefined,'evade')).toBe(true);
  });
  it('refuses overdrafts with no partial debit or negative stamina', () => {
    const p=newOriginHunterProfile();
    p.resources.stamina=9;
    expect(originSpendMotionStamina(p,'airJump')).toBe(false);
    expect(originSpendMotionStamina(p,'evade')).toBe(false);
    expect(p.resources.stamina).toBe(9);
    expect(originSpendMotionStamina(p,'groundJump')).toBe(true);
    expect(p.resources.stamina).toBe(3);
    expect(originSpendBasicStamina(p,4)).toBe(false);
    expect(p.resources.stamina).toBe(3);
    expect(originCanSpendStamina(p.resources,4)).toBe(false);
  });
  it('patches authoritative Sim motion callback only; no client resource spending', () => {
    const sim=readFileSync('src/sim/sim.ts','utf8');
    const motion=readFileSync('src/sim/player_motion.ts','utf8');
    const online=readFileSync('src/net/online.ts','utf8');
    expect(sim).toContain('originSpendMotionStamina(this.players.get(p.id)?.originHunter, action)');
    expect(motion).toContain("deps.originSpendMotionStamina(p, 'groundJump')");
    expect(motion).toContain("deps.originSpendMotionStamina(p, 'airJump')");
    expect(motion).toContain("deps.originSpendMotionStamina(p, 'evade')");
    expect(motion).toContain('highflyFreshJumpPress');
    expect(motion).toContain('p.highflyEvadeDirX');
    expect(motion).toContain('p.highflyEvadeDirZ');
    expect(online).not.toContain('originSpendMotionStamina(');
  });
  it('gates basic attack stamina immediately BEFORE hit RNG, target reach still matters', () => {
    const attack=readFileSync('src/sim/combat/auto_attack.ts','utf8');
    const start=attack.indexOf('export function highflyBasicAttack(');
    const end=attack.indexOf('export function',start+20);
    const body=attack.slice(start,end>start?end:undefined);
    expect(body).toContain("if (!originSpendBasicStamina(r.meta.originHunter, step)) return false;");
    expect(body.split('originSpendBasicStamina(r.meta.originHunter, step)').length-1).toBe(2);
    expect(body.indexOf('if (!ctx.hasLineOfSight(p, t)) return false;')).toBeLessThan(body.indexOf('originSpendBasicStamina'));
    expect(body.indexOf('if (d > effectivePlayerAttackRange')).toBeLessThan(body.lastIndexOf('originSpendBasicStamina'));
    expect(body).toContain('meleeSwing(ctx, p, t');
    expect(body).toContain('rangedSwing(');
    expect(body).toContain('p.autoAttack = false');
  });
  it('does not create Hunter stamina or stats in any legacy class', () => {
    const old=new Sim({seed:850,playerClass:'warrior'});
    expect(old.player.originResources).toBeUndefined();
    expect(old.players.get(old.player.id)?.originHunter).toBeUndefined();
    const hunter=new Sim({seed:850,playerClass:'warrior',originHunterEnabled:true});
    expect(hunter.player.originResources?.stamina).toBe(100);
    const oldHp=old.player.maxHp;
    const hunterHp=hunter.player.maxHp;
    expect(oldHp).toBe(hunterHp);
  });
});
