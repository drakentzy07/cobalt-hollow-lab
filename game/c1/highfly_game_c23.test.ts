import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HIGHFLY GAME-C2.3 human mobile fix', () => {
  it('ships individual touch HUD editing from Menu > Interface', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    const options = readFileSync('src/ui/options_window.ts', 'utf8');
    expect(runtime).toContain("HIGHFLY_GAME_C22_BUILD = 'C2.3-human-fix'");
    expect(runtime).toContain("window.addEventListener('highfly:mobile-hud-editor'");
    expect(runtime).toContain("id: 's' + (index + 1)");
    expect(runtime).toContain("id: 'target'");
    expect(runtime).toContain("id: 'attack'");
    expect(runtime).toContain("id: 'buffs'");
    expect(runtime).toContain('highflyHudScale');
    expect(runtime).toContain('highflyHudResetAll');
    expect(options).toContain('EDITAR HUD MÓVIL');
    expect(options).toContain("new CustomEvent('highfly:mobile-hud-editor')");
  });

  it('uses native empty S1-S10 seats instead of duplicated ghost circles', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.mobile-touch.hf-game-c23 #hf-c22-ghost-skills');
    expect(css).toContain('display: none !important');
    expect(css).toContain('#actionbar .action-btn.empty::after');
    expect(css).toContain('content: "S" attr(data-hotbar-slot)');
  });

  it('makes Bags tutorial guidance actionable and persistent on the real Bags path', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain('syncHighflyBagsCoach');
    expect(runtime).toContain("'mobile-menu-bags'");
    expect(runtime).toContain("'mobile-bags'");
    expect(runtime).toContain("'highfly:c23:coach:bags'");
  });

  it('makes soft-target hysteresis competitive rather than sticky', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    expect(main).toContain('function highflySoftTargetAlignment');
    expect(main).toContain('const bestAlignment = highflySoftTargetAlignment(best)');
    expect(main).toContain('currentAlignment >= bestAlignment - 0.06');
    expect(main.indexOf('const best = bestSoftAutoTarget')).toBeLessThan(
      main.indexOf('const currentAlignment = highflySoftTargetAlignment'),
    );
  });

  it('keeps training logic intact while replacing browser-like mobile controls', () => {
    const shell = readFileSync('src/styles/shell.css', 'utf8');
    const ui = readFileSync('src/highfly/training/ui.ts', 'utf8');
    expect(ui).toContain('submitRmCalibration');
    expect(ui).toContain('restartCurrentCycle');
    expect(shell).toContain('HIGHFLY GAME-C2.3 — TRAINING MOBILE-NATIVE POLISH');
    expect(shell).toContain('#hf-cycle-reset-arm');
    expect(shell).toContain('button[data-hf-rm-submit]');
  });
});
