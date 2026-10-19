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
    // This is a deliberate ORIGIN-only layout override; it must preserve
    // the real native buttons even when the donor pager paints empty slots.
    expect(css).toContain('#mobile-action-ring > .mobile-action-slot,');
    expect(css).toContain('display: flex !important;');
    // Visual AND touch ownership: GPU diagnostics must not cover real skills;
    // its own close button remains usable in the live Android layout.
    expect(css).toContain('body.hf-origin-f1.mobile-touch.game-active #gpu-notice {');
    expect(css).toContain('#gpu-notice .gpu-notice-dismiss {');
    expect(css).toContain('pointer-events: none;');
    expect(css).toContain('pointer-events: auto;');
    const browser=readFileSync('scripts/highfly_origin_f1_browser.mjs','utf8');
    expect(browser).toContain('!s.visible||!s.width||!s.hit');
    expect(css).toContain('#mobile-action-ring #mobile-action-attack');
    const c1Css=readFileSync('src/styles/hf_game_c1.css','utf8');
    expect(css).not.toContain('#mobile-action-ring #mobile-consumable-seat {');
    expect(c1Css).toContain('#hf-c1-utility-lane > #mobile-consumable-seat {');
    expect(c1Css).toContain('width: 44px !important;');
    expect(c1Css).toContain('max-width: 44px !important;');
    expect(c1Css).toContain('body.hf-origin-f1.mobile-touch.game-active #hf-c22-ghost-skills');
    expect(browser).toContain('!hud.consumableHit');
    expect(css).not.toContain('#mobile-action-page-toggle,\\n  body.hf-origin-f1.mobile-touch.game-active #mobile-consumable-seat,');
    const ring=readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts','utf8');
    expect(ring).toContain("if (document.body.classList.contains('hf-origin-f1')) {");
    expect(ring).toContain('deps.attackNearest?.();');
    expect(ring).toContain('deps.activateFixedAttackSlot();');
    const ferry=readFileSync('src/ui/hud/transport/ferry_hud_painter.ts','utf8');
    expect(ferry).toContain("close.className = 'ferry-hud-dismiss'");
    const guide=readFileSync('src/highfly/origin/f1_world_ui.ts','utf8');
    expect(guide).toContain("guide.style.display = nearby?'block':'none'");
    expect(guide).toContain("swapOriginStarter(current,item.id)");
    expect(guide).toContain("sim.removeItem(oldId,1,sim.playerId)");
    const ferryCss=readFileSync('src/styles/hud.css','utf8');
    expect(ferryCss).toContain('left: max(8px, env(safe-area-inset-left, 0px));');
    for(let i=0;i<4;i++) expect(css).toContain(`#mobile-action-ring .mobile-action-slot[data-mobile-index="${i}"]`);
    expect(html).toContain('id="mobile-action-attack"');
    expect(html).toContain('id="mobile-interact"');
    expect(html).toContain('id="mobile-target-cycle"');
    expect(html).not.toContain('id="mobile-unique-locked');
  });
});
