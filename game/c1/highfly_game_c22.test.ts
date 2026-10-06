import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bestSoftAutoTarget } from '../src/game/auto_target';

function mob(id: number, angleDeg: number, distance: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { id, pos: { x: Math.sin(a) * distance, z: Math.cos(a) * distance } };
}

describe('HIGHFLY GAME-C2.2 mobile combat polish', () => {
  it('uses a tighter camera-forward cone and rejects a closer off-axis target', () => {
    const entities = [
      mob(1, 50, 2),
      mob(2, 10, 8),
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

  it('keeps soft-target hysteresis and silent targetless basic attack', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    expect(main).toContain('function highflySoftTargetStillAligned');
    expect(main).toContain('coneDegrees = 30');
    expect(main).toContain('Targetless ATK is intentionally silent');
    expect(main).not.toContain("hud.showError(t('errors.noEnemyNearby'))");
  });

  it('declutters mobile nameplates while always exempting the selected target', () => {
    const painter = readFileSync('src/render/nameplate_painter.ts', 'utf8');
    expect(painter).toContain('const highflyCompactMobile = width <= 960 && height <= 540');
    expect(painter).toContain('id !== player.targetId');
    expect(painter).toContain("entity.kind === 'mob' ? 18");
    expect(painter).toContain('this.anchorCount >= 10');
  });

  it('keeps the full S1-S10 geometry visible from level 1 and yields to menus', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain('ensureGhostSkillSeats');
    expect(runtime).toContain("'S' + slot");
    expect(css).toContain('#hf-c22-ghost-skills');
    for (let slot = 1; slot <= 10; slot++) {
      expect(css).toContain('data-slot="' + slot + '"');
    }
    expect(css).toContain('mobile-more-open .mobile-joystick');
    expect(css).toContain('mobile-window-open .mobile-joystick');
    expect(css).toContain('mobile-window-open #mobile-action-attack');
  });

  it('shows immediate creator loading feedback and a build identity marker', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain("HIGHFLY_GAME_C22_BUILD = 'C2.2-mobile-polish'");
    expect(runtime).toContain('syncCreatorPreviewState');
    expect(runtime).toContain('hf-preview-loading');
    expect(css).toContain('PREPARANDO HUNTER…');
    expect(css).toContain('#hf-c22-build-stamp');
  });

  it('suppresses legacy coach chrome after the guided control is actually touched', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain('installCoachmarkRelease');
    expect(runtime).toContain("closest('.qd-coach, .tut-prompt')");
    expect(css).toContain('hf-c22-coach-actioned .tut-prompt');
  });
});
