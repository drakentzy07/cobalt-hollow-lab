import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HIGHFLY GAME-C2.8 mobile HUD editor', () => {
  it('routes mobile Ajustes into the dedicated HIGHFLY settings surface', () => {
    const mobile = readFileSync('src/game/mobile_controls.ts', 'utf8');
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(mobile).toContain("window.dispatchEvent(new CustomEvent('highfly:mobile-settings'))");
    expect(mobile).toContain('this.closeMoreModal();');
    expect(runtime).toContain("window.addEventListener('highfly:mobile-settings', openHighflyMobileSettings)");
    expect(runtime).toContain('PERSONALIZAR HUD');
    expect(runtime).toContain('INTERFAZ');
  });

  it('edits the real Android HUD rather than the desktop Options layout', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain("C2.8.2-s23-camera-clear");
    expect(runtime).toContain("id: 'move', label: 'JOYSTICK'");
    expect(runtime).toContain("id: 'menu', label: 'MENÚ'");
    expect(runtime).toContain('HABILIDAD S');
    expect(runtime).toContain('ATK / USAR');
    expect(runtime).toContain('BUFFS / PASIVAS');
    expect(runtime).toContain("document.body.classList.add('hf-c23-hud-editing', 'hf-c28-hud-editing')");
    expect(runtime).toContain('event.stopImmediatePropagation();');
  });

  it('persists drag position, size and transparency and exports preset v4', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain('type HighflyHudTransform = { x: number; y: number; scale: number; opacity: number }');
    expect(runtime).toContain('data-hf-hud-scale');
    expect(runtime).toContain('data-hf-hud-opacity');
    expect(runtime).toContain('data-hf-hud-x');
    expect(runtime).toContain('data-hf-hud-y');
    expect(runtime).toContain("localStorage.setItem(HIGHFLY_HUD_STORE_PREFIX + targetId");
    expect(runtime).toContain('version: 4');
    expect(runtime).toContain('EXPORTAR PRESET');
    expect(runtime).toContain('RESTABLECER ELEMENTO');
    expect(runtime).toContain('RESTABLECER TODO');
  });


  it('bakes the S23 HUMAN layout as the official reset/default preset', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain("const HIGHFLY_HUD_STORE_PREFIX = 'highfly:c282:hud:'");
    expect(runtime).toContain('s1: { x: 17, y: 15, scale: 1, opacity: 1 }');
    expect(runtime).toContain('s5: { x: 55, y: -11, scale: 1, opacity: 1 }');
    expect(runtime).toContain('s10: { x: 57, y: -24, scale: 1, opacity: 1 }');
    expect(runtime).toContain('ult: { x: 56, y: -7, scale: 1, opacity: 1 }');
    expect(runtime).toContain('attack: { x: 9, y: 8, scale: 1.08, opacity: 1 }');
    expect(runtime).toContain('jump: { x: -78, y: 18, scale: 1, opacity: 1 }');
    expect(runtime).toContain('function highflyHudDefault(targetId: string)');
  });

  it('keeps the editor panel left of the upper skill rows on S23 landscape', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('left: max(8px, env(safe-area-inset-left));');
    expect(css).toContain('width: min(390px, 47vw);');
    expect(css).toContain('transform: none;');
  });

  it('keeps the world visible but blocks camera interaction while customizing', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.hf-c28-hud-editing #game-canvas {');
    expect(css).toContain('pointer-events: none !important;');
    expect(css).toContain('body.hf-c28-hud-editing [data-hf-hud-target] {');
    expect(css).toContain('body.hf-c28-hud-editing .hf-c28-hud-selected {');
  });

  it('brands every rotating loading backdrop with a persistent HIGHFLY logo layer', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.mobile-touch.hf-game-c1 #loading-screen::after {');
    expect(css).toContain('highfly-logo-full.webp") center / contain no-repeat !important;');
    expect(css).toContain('z-index: 4 !important;');
  });
});
