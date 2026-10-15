import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { highflyOriginBufferedStrikeAllowed } from '../src/ui/hud/action_bar/highfly_origin_buffer_guard';

const valid = () => ({
  queuedEpoch: 4,
  currentEpoch: 4,
  queuedTargetId: 72 as number | null,
  currentTargetId: 72 as number | null,
  nowMs: 1010,
  deadlineMs: 1100,
  blocked: false,
});

describe('HIGHFLY ORIGIN OR-1 — real explicit buffered basic attack guard', () => {
  it('permits the SAME single valid tap after brief recovery (no repeat engine)', () => {
    expect(highflyOriginBufferedStrikeAllowed(valid())).toBe(true);
  });
  it('skill press, dash or evasion invalidates an earlier queued ATK', () => {
    expect(highflyOriginBufferedStrikeAllowed({...valid(), currentEpoch: 5})).toBe(false);
    expect(highflyOriginBufferedStrikeAllowed({...valid(), currentEpoch: 6})).toBe(false);
  });
  it('a switched, lost or dead target never inherits a buffered swing', () => {
    expect(highflyOriginBufferedStrikeAllowed({...valid(), currentTargetId: 99})).toBe(false);
    expect(highflyOriginBufferedStrikeAllowed({...valid(), currentTargetId: null})).toBe(false);
    expect(highflyOriginBufferedStrikeAllowed({...valid(), queuedTargetId: null})).toBe(false);
  });
  it('expired UI timers cannot attack after frame stalls or background sleep', () => {
    expect(highflyOriginBufferedStrikeAllowed({...valid(), nowMs: 1101})).toBe(false);
    expect(highflyOriginBufferedStrikeAllowed({...valid(), nowMs: Infinity})).toBe(false);
  });
  it('UI overlays, dead state or native cast lock reject buffered strikes', () => {
    expect(highflyOriginBufferedStrikeAllowed({...valid(), blocked: true})).toBe(false);
  });
  it('integrates with the V9.1 timer, native cast and mobile controls without altering original Sim', () => {
    const hud = readFileSync('src/ui/hud.ts', 'utf8');
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(hud).toContain('highflyOriginBufferedStrikeAllowed({');
    expect(hud).toContain('highflyOriginReadCombatInterruptEpoch()');
    expect(hud).toContain('highflyOriginBumpCombatInterruptEpoch();');
    expect(hud).toContain('this.sim.player.castingAbility');
    expect(hud).toContain('this.highflyV91QueuedAttack = setTimeout(() => {');
    expect(runtime).toContain("target.closest('#mobile-evade, #mobile-jump");
    expect(runtime).toContain('installHighflyOriginCombatInterrupts();');
    expect(runtime).toContain('highflyOriginBumpCombatInterruptEpoch();');
    expect(hud).toContain('this.onHighflyBasicAttack?.(next)');
    expect(readFileSync('src/sim/combat/auto_attack.ts', 'utf8')).toContain('export function highflyBasicAttack(');
  });
});
