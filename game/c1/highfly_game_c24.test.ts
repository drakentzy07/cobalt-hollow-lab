import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bestSoftAutoTarget } from '../src/game/auto_target';

describe('HIGHFLY GAME-C2.4 human closure', () => {
  it('prioritizes a close frontal enemy over a farther perfectly-centred enemy', () => {
    const a = (15 * Math.PI) / 180;
    const near = { id: 1, pos: { x: Math.sin(a) * 3, z: Math.cos(a) * 3 } };
    const far = { id: 2, pos: { x: 0, z: 10 } };
    expect(
      bestSoftAutoTarget([far, near], { x: 0, z: 0 }, 0, () => true),
    ).toBe(1);
  });

  it('keeps the explicit close/front tier bounded and camera-forward', () => {
    const source = readFileSync('src/game/auto_target.ts', 'utf8');
    expect(source).toContain('const priorityRange = Math.min(range, 12)');
    expect(source).toContain('Math.cos((32 * Math.PI) / 180)');
    expect(source).toContain('return priorityBest ?? fallbackBest');
  });

  it('makes the native Summon use-coach tappable on touch via native Bags', () => {
    const bootcamp = readFileSync('src/ui/bootcamp.ts', 'utf8');
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(bootcamp).toContain("prompt.dataset.hfAction !== 'bags'");
    expect(bootcamp).toContain("mode === 'touch' && plan.kind === 'use'");
    expect(bootcamp).toContain("'mobile-menu-bags'");
    expect(bootcamp).toContain("'mobile-bags'");
    expect(css).toContain('.tut-prompt[data-hf-action="bags"]');
    expect(css).toContain('pointer-events: auto !important');
  });

  it('ships a usable first-boot HUD while retaining optional individual editing', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(runtime).toContain("C2.4-human-closure");
    expect(runtime).toContain("'hf-game-c24'");
    expect(runtime).toContain("id: 's' + (index + 1)");
    expect(css).toContain('[data-hotbar-slot="1"]  { right: 110px !important; bottom: 38px !important; }');
    expect(css).toContain('[data-hotbar-slot="7"]  { bottom: 100px !important; }');
    expect(css).toContain('#mobile-jump { right: 218px !important; }');
    expect(css).toContain('#mobile-evade { right: 278px !important; }');
    expect(css).toContain('opacity: .20 !important;');
  });
});
