import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { ABILITIES } from '../src/sim/content/classes';
import { originCostDecision } from '../src/sim/highfly_origin_universal_resources';
import { r28StartSession, r28Reapply, r32StartSession, R32_P2_BASE_IDS } from '../src/sim/highfly_origin_r28_session';

/** The R32 Hunter boot path used to throw while displaying CARGANDO MUNDO:
 * the donor Charge effect is rejected by server-side Origin resources.
 * Exercise the REAL session entry, not merely tsc and an offline Warrior smoke.
 */
describe('R32 P2 native Hunter startup must not remain loading', () => {
  it('rejects donor Charge without weakening authoritative Sim resource guard', () => {
    expect(originCostDecision(ABILITIES.charge).ok).toBe(false);
    expect(R32_P2_BASE_IDS).not.toContain('charge');
  });
  it('preflights the four actual native abilities before a Hunter starts', () => {
    expect(R32_P2_BASE_IDS).toEqual(['fireball', 'heroic_leap', 'blink', 'flamestrike']);
    for (const id of R32_P2_BASE_IDS) {
      expect(ABILITIES[id], id).toBeDefined();
      expect(ABILITIES[id].hiddenFromPlayer, id).not.toBe(true);
      expect(ABILITIES[id].passive, id).not.toBe(true);
      expect(originCostDecision(ABILITIES[id]), id).toMatchObject({ ok: true });
    }
  });
  it('enters the Hunter R28-to-R32 session, has 4 native casts, survives reapply without unlocking them', () => {
    const sim = new Sim({ seed: 8232, playerClass: 'warrior', originHunterEnabled: true });
    const meta = sim.players.get(sim.playerId)!;
    expect(meta.originHunter).toBeDefined();
    const savedLearned = [...meta.originHunter!.learnedSkillIds];
    expect(() => r28StartSession(sim)).not.toThrow();
    expect(() => r32StartSession(sim)).not.toThrow();
    expect(meta.known.map(x => x.def.id)).toEqual([...R32_P2_BASE_IDS]);
    expect(() => r28Reapply(meta, sim.player.level)).not.toThrow();
    expect(meta.known.map(x => x.def.id)).toEqual([...R32_P2_BASE_IDS]);
    expect(meta.originHunter!.learnedSkillIds).toEqual(savedLearned);
    expect(sim.serializeCharacter(sim.playerId)?.originHunter?.learnedSkillIds).toEqual(savedLearned);
  });
});
