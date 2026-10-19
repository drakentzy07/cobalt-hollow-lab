import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HIGHFLY GAME-C2.5.1 visual closure', () => {
  it('keeps combat HUD hidden until the Hunter is really in-world', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(runtime).toContain('function syncHighflyWorldReady(): void');
    expect(runtime).toContain("document.body.classList.toggle('hf-c25-world-ready', ready)");
    expect(css).toContain('hf-game-c25:not(.hf-c25-world-ready) #actionbar');
    expect(css).not.toContain('hf-game-c25:not(.game-active) #actionbar');
  });

  it('clips every active skill artwork to the circular seat', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toMatch(
      /#actionbar \.action-btn\[data-hotbar-slot\] \{[\s\S]*?border-radius:\s*50% !important;[\s\S]*?overflow:\s*hidden !important;/,
    );
    expect(css).toMatch(
      /#actionbar \.action-btn\[data-hotbar-slot\] \.icon-label \{[\s\S]*?inset:\s*2px !important;[\s\S]*?border-radius:\s*50% !important;[\s\S]*?background-size:\s*cover !important;[\s\S]*?clip-path:\s*circle\(50% at 50% 50%\) !important;/,
    );
  });

  it('uses one identical rounded-square family for the three lower utility/passive seats', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.mobile-touch.hf-game-c25 #hf-c1-gem-seat,');
    expect(css).toContain('body.mobile-touch.hf-game-c25 #mobile-consumable-seat,');
    expect(css).toContain('body.mobile-touch.hf-game-c25 #mobile-stance-anchor {');
    expect(css).toContain('width: 36px !important;');
    expect(css).toContain('height: 36px !important;');
    expect(css).toContain('border-radius: 8px !important;');
    expect(css).toContain('background: rgba(9, 7, 16, .70) !important;');
    expect(css).toContain('#mobile-consumable-seat .icon-label,');
    expect(css).toContain('#mobile-stance-anchor .icon-label {');
    expect(css).toContain('border-radius: 6px !important;');
  });
});
