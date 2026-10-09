import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { characterPreloadUrls } from '../src/render/characters/manifest';
describe('V3-01 preview selective critical GLB dependency', () => {
  it('preloads all real player bodies and starter weapons without waiting for scenario mobs', () => {
    const src = readFileSync('src/render/characters/assets.ts', 'utf8');
    const main = readFileSync('src/main.ts', 'utf8');
    expect(main).toContain('  charactersReadyForPreview()');
    expect(main).not.toContain('  charactersReady()\n    .then');
    expect(src).toContain('export async function charactersReadyForPreview');
    expect(src).toContain('export async function charactersReady(maxAttempts = 3)');
    expect(src).toContain('registerPreload(prepareCharacterUrl(url));');
    const urls = characterPreloadUrls(false);
    expect(urls.some(u => u.includes('models/chars/modular/warrior_modular.glb'))).toBe(true);
    expect(urls.some(u => u.startsWith('models/chars/players/'))).toBe(true);
    expect(urls.some(u => u.startsWith('models/weapons/'))).toBe(true);
    expect(urls.some(u => u.startsWith('models/creatures/'))).toBe(true);
    // The targeted gate must not include creatures. Retain their original
    // preload registrations and verify the actual rendered preview in Playwright.
    const gate = src.split('export async function charactersReadyForPreview')[1]
      ?.split('export async function charactersReady(')[0] ?? '';
    expect(gate).toContain('highflyPreviewCriticalUrls.filter');
    expect(gate).not.toContain('preloadUrls.filter');
    expect(gate).not.toContain('models/creatures/');
  });
});
