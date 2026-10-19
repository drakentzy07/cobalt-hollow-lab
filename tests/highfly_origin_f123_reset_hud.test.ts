import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

describe('HIGHFLY ORIGIN F1.2.3 device reset and mobile HUD',()=>{
  it('provides a deliberate confirmed reset without clearing donor project saves',()=>{
    const saved=readFileSync('src/game/highfly_offline_save.ts','utf8');
    const main=readFileSync('src/main.ts','utf8');
    const html=readFileSync('index.html','utf8');
    expect(saved).toContain('export async function resetOriginHunterSave()');
    expect(saved).toContain("key.startsWith('origin-f1:')");
    expect(saved).toContain('hasOriginIdentity(data)');
    expect(saved).not.toContain('indexedDB.deleteDatabase(DB_NAME)');
    expect(saved).not.toContain('localStorage.clear()');
    expect(main).toContain("window.confirm(");
    expect(main).toContain('resetOriginHunterSave().then(');
    // An ORIGIN birth must NEVER hide the native touch HUD behind ClaudeCraft's
    // first-spawn fly-in cinematic; other modes keep that original intro.
    expect(main).toContain("requested: playIntro && !document.body.classList.contains('hf-origin-f1')");
    expect(html).toContain('id="hf-origin-reset-hunter" hidden');
  });
  it('integrates MP and stamina under the real HP frame without duplicate HP',()=>{
    const world=readFileSync('src/highfly/origin/f1_world_ui.ts','utf8');
    const css=readFileSync('src/styles/hud.mobile.css','utf8');
    expect(world).toContain("document.getElementById('player-frame')");
    expect(world).toContain("['mana','MP'");
    expect(world).toContain("['stamina','ST'");
    expect(world).not.toContain("['hp','HP'");
    expect(css).toContain('#player-frame #pf-resource');
    expect(css).toContain('#player-frame #hf-origin-f1-resource-meter');
  });
  it('pins four REAL mobile skill buttons; places native USAR below ATK; hides legacy slots',()=>{
    const css=readFileSync('src/styles/hud.mobile.css','utf8');
    const html=readFileSync('index.html','utf8');
    expect(css).toContain('body.hf-origin-f1.mobile-touch.game-active #actionbar-group');
    expect(css).toContain('body.hf-origin-f1.mobile-touch.game-active #mobile-action-page-toggle');
    expect(css).toContain('#mobile-action-ring #mobile-interact');
    expect(css).toContain('#mobile-action-ring #mobile-action-attack');
    for(let i=0;i<4;i++) expect(css).toContain(`#mobile-action-ring .mobile-action-slot[data-mobile-index="${i}"]`);
    expect(html).toContain('id="mobile-action-attack"');
    expect(html).toContain('id="mobile-interact"');
    expect(html).toContain('id="mobile-target-cycle"');
    expect(html).not.toContain('id="mobile-unique-locked');
  });
});
