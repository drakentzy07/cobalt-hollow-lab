import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HIGHFLY GAME-C2.2 video QA contract', () => {
  it('self-heals HIGHFLY HUD ownership after donor root-state transitions', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain('function ensureHighflyHudAuthority(): void');
    expect(runtime).toContain("document.body.classList.add('hf-game-c1')");
    expect(runtime).toContain("document.body.dataset.highflyHudBuild = 'C2.2_VIDEO_QA'");
    expect(runtime.match(/ensureHighflyHudAuthority\(\);/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('retires donor Use/page/radial chrome even if the marker class is temporarily absent', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.mobile-touch #mobile-action-ring .mobile-action-slot');
    expect(css).toContain('body.mobile-touch #mobile-action-page-toggle');
    expect(css).toContain('body.mobile-touch #mobile-action-radial');
    expect(css).toContain('body.mobile-touch #mobile-interact');
    expect(css).toContain('display: none !important');
  });

  it('gives large mobile windows exclusive touch-HUD ownership', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.mobile-touch.mobile-more-open #mobile-controls');
    expect(css).toContain('body.mobile-touch.mobile-window-open #mobile-controls');
    expect(css).toContain('body.mobile-touch.mobile-more-open #actionbar');
    expect(css).toContain('body.mobile-touch.mobile-window-open #actionbar');
    expect(css).toContain('visibility: hidden !important');
    expect(css).toContain('pointer-events: none !important');
  });

  it('keeps the canonical permanent-Core Training copy', () => {
    const ui = readFileSync('src/highfly/training/ui.ts', 'utf8');
    expect(ui).toContain('HUNTER CORE · PERMANENTE');
    expect(ui).toContain('BASE DE CLASE + NIVEL + TRAINING · sólo TRAINING se asigna libremente');
  });
});
