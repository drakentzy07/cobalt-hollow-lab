import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bestSoftAutoTarget } from '../src/game/auto_target';

function mob(id: number, angleDeg: number, distance: number, hp = 100, maxHp = 100) {
  const a = (angleDeg * Math.PI) / 180;
  return {
    id,
    pos: { x: Math.sin(a) * distance, z: Math.cos(a) * distance },
    hp,
    maxHp,
  };
}

describe('HIGHFLY GAME-C2.5 HUD + target polish', () => {
  it('uses low HP only as a soft finisher tie-break inside player intent', () => {
    const healthy = mob(1, 8, 5, 100, 100);
    const finisher = mob(2, 8, 5, 12, 100);
    expect(
      bestSoftAutoTarget([healthy, finisher], { x: 0, z: 0 }, 0, () => true),
    ).toBe(2);
  });

  it('never lets a low-HP farther enemy steal the hard close/front tier', () => {
    const near = mob(1, 18, 3, 100, 100);
    const farFinisher = mob(2, 0, 10, 1, 100);
    expect(
      bestSoftAutoTarget([farFinisher, near], { x: 0, z: 0 }, 0, () => true),
    ).toBe(1);
  });

  it('never lets low HP pull soft aim outside the authored 42 degree cone', () => {
    const offAxisFinisher = mob(1, 50, 2, 1, 100);
    const front = mob(2, 10, 8, 100, 100);
    expect(
      bestSoftAutoTarget([offAxisFinisher, front], { x: 0, z: 0 }, 0, () => true),
    ).toBe(2);
  });

  it('ships one clean crescent HUD and hides combat chrome until real world-ready', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');

    expect(runtime).toContain('const HIGHFLY_GAME_C22_BUILD =');
    expect(runtime).toContain("'hf-game-c25'");
    expect(css).toContain('hf-game-c25:not(.hf-c25-world-ready) #actionbar');
    expect(runtime).toContain("document.body.classList.toggle('hf-c25-world-ready', ready)");
    expect(css).toContain('[data-hotbar-slot="1"]  { right:112px !important; bottom:46px !important; }');
    expect(css).toContain('[data-hotbar-slot="10"] { right:204px !important; bottom:246px !important; }');
    expect(css).toContain('#hf-c1-esp1 { right:286px !important; bottom:146px !important; }');
    expect(css).toContain('border-radius: 50% !important;');
  });

  it('uses one uniform passive/buff/debuff visual family and subdued empty seats', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.mobile-touch.hf-game-c25 #buff-bar .buff');
    expect(css).toContain('body.mobile-touch.hf-game-c25 #debuff-bar .ui-aura');
    expect(css).toContain('border-radius:7px !important;');
    expect(css).toContain('background:rgba(9, 7, 16, .70) !important;');
    expect(css).toContain('body.mobile-touch.hf-game-c25 #actionbar .action-btn.empty');
    expect(css).toContain('opacity: .34 !important;');
  });

  it('keeps the HUD editor available as optional personalization', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    const options = readFileSync('src/ui/options_window.ts', 'utf8');
    expect(runtime).toContain("highfly:mobile-hud-editor");
    expect(runtime).toContain("highfly:c281:hud:");
    expect(options).toContain('EDITAR HUD MÓVIL');
  });
});
