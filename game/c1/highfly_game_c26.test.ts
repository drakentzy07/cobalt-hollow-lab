import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HIGHFLY GAME-C2.6 mobile HUD editor menu', () => {
  it('reuses the existing More tile as Ajustes and routes it through native Options', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    const mobile = readFileSync('src/game/mobile_controls.ts', 'utf8');
    const html = readFileSync('index.html', 'utf8');
    expect(runtime).toContain('const HIGHFLY_GAME_C22_BUILD =');
    expect(html).toContain('id="mobile-bar-editor" title="Ajustes" aria-label="Ajustes"');
    expect(html).toContain('<span class="mobile-label">Ajustes</span>');
    expect(mobile).toContain("this.bindButton('mobile-bar-editor', () => this.callbacks.onMenu());");
    expect(runtime).not.toContain('function syncHighflyMobileSettingsEntry(): void');
  });

  it('exports the exact persisted S23 HUD preset and labels save explicitly', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain('function highflyHudPresetPayload(): string');
    expect(runtime).toContain('navigator.clipboard.writeText(payload)');
    expect(runtime).toContain('EXPORTAR PRESET');
    expect(runtime).toContain('GUARDAR');
    expect(runtime).toContain("highfly:c23:hud:");
  });

  it('hard-stops native S11 from leaking into the HIGHFLY S1-S10 HUD', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toMatch(
      /#actionbar \.action-btn\[data-hotbar-slot="11"\] \{[\s\S]*?display:\s*none !important;[\s\S]*?visibility:\s*hidden !important;/,
    );
  });

  it('keeps the More modal above character windows and HUD', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.mobile-touch.mobile-more-open #mobile-extra-controls {');
    expect(css).toContain('z-index: 1000 !important;');
    expect(css).toContain('0 0 0 100vmax rgba(5, 4, 12, .58)');
    expect(css).toContain('body.mobile-touch.mobile-more-open #ui,');
    expect(css).toContain('pointer-events: none !important;');
  });

  it('still exposes the existing Interfaz entry for the HIGHFLY HUD editor', () => {
    const options = readFileSync('src/ui/options_window.ts', 'utf8');
    expect(options).toContain('EDITAR HUD MÓVIL');
    expect(options).toContain("window.dispatchEvent(new CustomEvent('highfly:mobile-hud-editor'))");
  });
});
