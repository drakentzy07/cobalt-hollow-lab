import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HIGHFLY GAME-C2.7 human-red repair', () => {
  it('does not call the HUD world-ready while creator or loading is visible', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain('const HIGHFLY_GAME_C22_BUILD =');
    expect(runtime).toContain("document.body.classList.contains('game-active')");
    for (const id of [
      'start-screen',
      'offline-select',
      'charselect-panel',
      'charcreate-panel',
      'mobile-preflight',
      'rotate-device',
      'loading-screen',
    ]) {
      expect(runtime).toContain("'" + id + "'");
    }
    expect(runtime).toContain('const blocked = HIGHFLY_WORLD_BLOCKERS.some');
    expect(runtime).toContain("document.body.classList.toggle('hf-c27-pregame', !ready)");
    expect(runtime).toContain('new MutationObserver(syncHighflyWorldReady)');
  });

  it('hard-hides every HIGHFLY combat surface in pregame/loading', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css).toContain('body.mobile-touch.hf-game-c25.hf-c27-pregame #actionbar');
    expect(css).toContain('body.mobile-touch.hf-game-c25.hf-c27-pregame #hf-c1-special-seats');
    expect(css).toContain('body.mobile-touch.hf-game-c25.hf-c27-pregame #hf-c1-utility-lane');
    expect(css).toContain('body.mobile-touch.hf-game-c25.hf-c27-pregame #mobile-move-zone');
    expect(css).toContain('visibility: hidden !important;');
  });

  it('uses native source authority for Ajustes instead of the action-bar editor', () => {
    const mobile = readFileSync('src/game/mobile_controls.ts', 'utf8');
    const index = readFileSync('index.html', 'utf8');
    const play = readFileSync('play.html', 'utf8');
    expect(mobile).not.toContain("this.bindButton('mobile-bar-editor', () => this.callbacks.onBarEditor());");
    for (const html of [index, play]) {
      expect(html).toContain('id="mobile-bar-editor" title="Ajustes" aria-label="Ajustes"');
      expect(html).toContain('<span class="mobile-label">Ajustes</span>');
    }
  });

  it('keeps the HUD editor reachable from native Options > Interfaz > Frames', () => {
    const options = readFileSync('src/ui/options_window.ts', 'utf8');
    expect(options).toContain("this.view = 'interface'");
    expect(options).toContain("'frames'");
    expect(options).toContain('EDITAR HUD MÓVIL');
    expect(options).toContain("window.dispatchEvent(new CustomEvent('highfly:mobile-hud-editor'))");
  });

  it('streams heavy creature/enemy GLBs after entry on constrained phone browsers', () => {
    const assets = readFileSync('src/render/characters/assets.ts', 'utf8');
    expect(assets).toContain(
      '(profile.iosMemoryProfile || profile.constrainedMemory) &&',
    );
    expect(assets).toContain("const STREAMED_URL_PREFIXES = ['models/creatures/', 'models/chars/enemies/'];");
    expect(assets).toContain('startStreamedCharacterPreloads');
  });

  it('preloads and always paints a loading-art fallback under the dynamic backdrop', () => {
    const index = readFileSync('index.html', 'utf8');
    const play = readFileSync('play.html', 'utf8');
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    for (const html of [index, play]) {
      expect(html).toContain('rel="preload" as="image"');
      expect(html).toContain('highfly/highfly-loading.avif');
      expect(html).toContain('fetchpriority="high"');
    }
    expect(css).toContain('var(--loading-backdrop-image, none),');
    expect(css).toContain('highfly/highfly-loading.avif');
  });
});
