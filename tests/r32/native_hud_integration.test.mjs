import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runtime = readFileSync('game/c1/runtime.ts', 'utf8');
const css = readFileSync('game/c1/hud.css', 'utf8');
const overlay = readFileSync('overlays/highfly_game_c1.py', 'utf8');
const r32 = css.slice(css.indexOf('HIGHFLY R32 P1 NATIVE HUD'));
const r32Class = 'hf-origin-r32-combat';

test('R32 is isolated behind an explicit opt-in flag and Hunter profile', () => {
  assert.match(runtime, /VITE_HIGHFLY_ORIGIN_R32 === '1'/);
  assert.match(runtime, /originR32Mode && !!w\.__game\?\.sim\?\.player\?\.originResources/);
  assert.match(css, /\.hf-origin-r32-combat/);
});
test('Exactly four BASE editor targets instead of ten on R32', () => {
  assert.match(runtime, /length: originR32Mode \? 4 : 10/);
  assert.match(r32, /data-hotbar-slot="1"/);
  for (const n of [2,3,4]) assert.match(r32, new RegExp('data-hotbar-slot="' + n + '"'));
  assert.match(r32, /#actionbar \.action-btn\[data-hotbar-slot\][\s\S]*display: none !important/);
});
test('No visible or created secret placeholders in R32 mode', () => {
  assert.match(runtime, /if \(originR32Mode\) \{ document\.getElementById\('hf-c1-special-seats'\)\?\.remove\(\); return; \}/);
  assert.match(runtime, /if \(originR32Mode\) \{ document\.getElementById\('hf-c22-ghost-skills'\)\?\.remove\(\); return; \}/);
  assert.match(r32, /#hf-c1-special-seats/);
  assert.match(r32, /#hf-c22-ghost-skills/);
  assert.match(r32, /#hf-origin-utility-row/);
});
test('ATK stays native and contextual USE uses existing Claude callback', () => {
  assert.match(runtime, /w\.__game\?\.hud\?\.onMobileContextualUse\?\.\(\)/);
  assert.match(runtime, /const use = !originR32Mode &&/);
  assert.match(overlay, /!document\.body\.classList\.contains\('hf-origin-r32-combat'\) && deps\.contextualUse\(\)/);
  assert.match(r32, /#mobile-action-attack/);
  assert.match(r32, /#hf-r32-use/);
});
test('Old menu and customization stay wired; R32 storage never overwrites old preset', () => {
  assert.match(runtime, /'highfly:r32:hud:' : 'highfly:c282:hud:'/);
  assert.match(runtime, /window\.addEventListener\('highfly:mobile-settings', openHighflyMobileSettings\)/);
  assert.match(runtime, /\[data-hf-settings-customize\]/);
  assert.match(runtime, /\[data-hf-hud-reset-all\]/);
});
test('Native movement, utilities, fullscreen menu and C2.8 editor remain referenced', () => {
  for (const id of ['#mobile-jump','#mobile-evade','#mobile-action-attack','#hf-c1-utility-lane'])
    assert.ok(r32.includes(id), id);
  assert.match(r32, /mobile-more-open/);
  assert.match(r32, /mobile-window-open/);
  assert.ok(!r32.includes('touch-action: auto'), 'must preserve skill drag');
});
test('R32 retains its branch isolation and no deploy command', () => {
  assert.doesNotMatch(r32, /deploy|publish|savegame|reward/);
  assert.match(runtime, /Secret abilities must not exist as locked/);
});
