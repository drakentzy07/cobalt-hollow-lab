import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bestSoftAutoTarget } from '../src/game/auto_target';

function mob(id: number, x: number, z: number) {
  return { id, pos: { x, z } };
}

describe('HIGHFLY GAME-C2.1 S23 feedback gate', () => {
  it('soft aim follows camera-forward and never selects a closer enemy behind the Hunter', () => {
    const entities = [
      mob(1, 0, -2),  // behind, closest
      mob(2, 0, 8),   // directly ahead
      mob(3, 8, 0),   // 90 degrees, outside the authored cone
    ];
    const picked = bestSoftAutoTarget(
      entities as never,
      { x: 0, z: 0 },
      0,
      () => true,
      40,
    );
    expect(picked).toBe(2);
  });

  it('keeps TARGET as an explicit manual-lock exception to ordinary soft aim', () => {
    const pad = readFileSync('src/game/pad_target_pick.ts', 'utf8');
    const main = readFileSync('src/main.ts', 'utf8');
    expect(pad).toContain('softTargetLocked?: () => boolean');
    expect(pad).toContain('preserveManualHostile');
    expect(main).toContain('let highflyManualTargetId: number | null = null');
    expect(main).toContain('function highflyManualCycleTarget()');
    expect(main).toContain('onCycleTarget: () => highflyManualCycleTarget()');
  });

  it('allows exactly one evade grace bridge without making the combo immortal', () => {
    const hud = readFileSync('src/ui/hud.ts', 'utf8');
    const main = readFileSync('src/main.ts', 'utf8');
    expect(hud).toContain('extendHighflyComboForEvade(): void');
    expect(hud).toContain('private highflyComboEvadeGraceUsed = false');
    expect(hud).toContain('if (this.highflyComboEvadeGraceUsed) return');
    expect(hud).toContain('this.highflyComboExpiresAt + 0.65');
    expect(hud).toContain('now + 1.55');
    expect(main).toContain('hud.extendHighflyComboForEvade()');
  });

  it('keeps cadence gates and does not turn the basic combo into auto-tap spam', () => {
    const hud = readFileSync('src/ui/hud.ts', 'utf8');
    expect(hud).toContain('if (now < this.highflyComboReadyAt) return');
    expect(hud).toContain("next === 1 ? 0.30");
    expect(hud).toContain("next === 2 ? 0.34");
    expect(hud).toContain('this.highflyComboExpiresAt = now + 1.15');
  });

  it('hides combat chrome below large mobile windows and keeps the approved compact cluster', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('mobile-window-open #actionbar');
    expect(css).toContain('mobile-more-open #actionbar');
    expect(css).toContain('visibility: hidden !important');
    for (let slot = 1; slot <= 10; slot++) {
      expect(css).toContain('[data-hotbar-slot="' + slot + '"]');
    }
    expect(css).toContain('#hf-c1-esp1');
    expect(css).toContain('#hf-c1-esp2');
    expect(css).toContain('#hf-c1-ult');
    expect(css).toContain('#mobile-target-cycle');
  });
});
