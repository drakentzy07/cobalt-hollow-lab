import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { f1StartState, consumeF1Resource } from '../src/highfly/origin/f1_core';
import { getOriginResourceController, registerOriginResourceController } from '../src/highfly/origin/f1_resource_bridge';

const read=(p:string)=>readFileSync(p,'utf8');

describe('HIGHFLY ORIGIN F2.1 — reuse audited native systems, never replace donor',()=>{
  it('does not replace native Sim/camera, opts into aerial evade only from Origin',()=>{
    const main=read('src/main.ts'), sim=read('src/sim/player_motion.ts');
    expect(main).toContain('resolveFreedom360(input.highflyTouchVector(), input.camYaw)');
    expect(main).toContain("mi.highflyAirDashEnabled = document.body.classList.contains('hf-origin-f1')");
    expect(sim).toContain('inp.highflyAirDashEnabled === true && p.jumping');
    expect(sim).toContain('!p.highflyAirJumpUsed');
    expect(sim).toContain('p.vx = wishX * wishSpeed');
    expect(main).not.toContain('new FreedomWorld(');
  });
  it('keeps equipped weapon sockets even at bare birth, not fallback Sword',()=>{
    const visual=read('src/render/characters/visual.ts'), assets=read('src/render/characters/assets.ts');
    expect(visual).toContain('originHunter');
    expect(visual).toContain('{ ...slot, swapOnly: true }');
    expect(visual).not.toContain('attach: [], weaponSlots: []');
    expect(assets).toContain('(base.swapOnly ? null : base)');
    expect(assets).toContain('if (!att) continue;');
    expect(visual).toContain('return this.reattachHeldWeapon()');
  });
  it('reuses existing C28 HUD editor but points to four REAL Origin seats',()=>{
    const runtime=read('src/highfly/game_c1_runtime.ts'),css=read('src/styles/hud.mobile.css');
    expect(runtime).toContain('const ORIGIN_HUD_TARGETS: HighflyHudTarget[]');
    expect(runtime).toContain('mobile-action-slot[data-mobile-index=');
    expect(runtime).toContain("id:'use',label:'USAR'");
    expect(runtime).toContain("'highfly:origin:f21:hud:'");
    expect(runtime).toContain("const use = !document.body.classList.contains('hf-origin-f1')");
    expect(runtime).toContain('const HIGHFLY_HUD_STORE_PREFIX');
    expect(css).toContain('right:122px !important;top:auto !important;bottom:41px');
    expect(css).toContain('right:244px !important;top:auto !important;bottom:24px');
    expect(css).toContain('right:184px !important;top:auto !important;bottom:24px');
  });
  it('reuses existing Spellbook as catalogue; undiscovered != learned/castable',()=>{
    const book=read('src/ui/spellbook_window.ts'),view=read('src/ui/spellbook_view.ts');
    expect(book).toContain('Object.values(CLASSES).flatMap(school => school.abilities)');
    expect(book).toContain('showUndiscovered: universalHunter');
    expect(book).toContain('Por descubrir');
    expect(view).toContain('input.showUndiscovered === true');
    expect(view).toContain('const onBar = known !== null && barIds.has(abilityId)');
    expect(book).toContain('if (known && isAbilityActionBarEligible(def))');
  });
  it('reuses F1 mana / stamina math for physical strikes and future skills',()=>{
    const state=f1StartState().resources;
    const spent=consumeF1Resource(state,'stamina',4);
    expect(spent?.stamina).toBe(state.stamina-4);
    expect(spent?.mana).toBe(state.mana);
    expect(consumeF1Resource(state,'mana',state.mana+1)).toBeNull();
    let value=state;
    registerOriginResourceController({
      canSpend: (kind,cost)=>consumeF1Resource(value,kind,cost)!==null,
      spend:(kind,cost)=>{
        const next=consumeF1Resource(value,kind,cost);
        if(!next)return false;
        value=next;
        return true;
      }
    });
    try {
      expect(getOriginResourceController()?.canSpend('stamina',2)).toBe(true);
      expect(getOriginResourceController()?.spend('stamina',2)).toBe(true);
      expect(value.stamina).toBe(state.stamina-2);
      expect(getOriginResourceController()?.spend('mana',999)).toBe(false);
    } finally {
      registerOriginResourceController(null);
    }
    expect(read('src/main.ts')).toContain('if (success) resource?.spend(kind,cost)');
  });
  it('one-time starter, layered combat HUD and MP blue/ST yellow',()=>{
    const ui=read('src/highfly/origin/f1_world_ui.ts');
    const css=read('src/styles/hf_game_c1.css');
    expect(ui).toContain("!current.starterClaimed ? 'block':'none'");
    expect(ui).toContain("['stamina','ST','#e5b73a']");
    expect(css).toContain('.mobile-window-open');
    expect(css).toContain('hf-origin-f21-window-open');
    expect(ui).toContain("document.body.append(root,backdrop)");
  });
});
