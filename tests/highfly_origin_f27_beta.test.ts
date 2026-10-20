import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {f1StartState,normalizeOriginF1Save} from '../src/highfly/origin/f1_core';
const source=(p:string)=>readFileSync(p,'utf8');
describe('F2.7 isolated Samsung playtest route, non-persistent 4 skill kit',()=>{
  it('keeps the F263 route working alongside the F27 route without changing donor',()=>{
    const main=source('src/main.ts');
    expect(main).toContain("/cobalt-hollow-lab/lab/f263-combat-beta/");
    expect(main).toContain("/cobalt-hollow-lab/lab/f27-combat-beta/");
    const ui=source('src/highfly/origin/f1_world_ui.ts');
    expect(ui).toContain("const f263=f27Preview||");
    expect(ui).toContain("const trial=f27Preview?['fireball','sinister_strike','highfly_blade_rush','meteor']:[]");
  });
  it('the four preview spells are transient, separate from the persistent learned array',()=>{
    const defaultSave=f1StartState();
    expect(defaultSave.learnedAbilityIds).toBeUndefined();
    const oldSave=normalizeOriginF1Save({...defaultSave,learnedAbilityIds:['fireball']});
    expect(oldSave?.learnedAbilityIds).toEqual(['fireball']);
    const ui=source('src/highfly/origin/f1_world_ui.ts');
    expect(ui).toContain('hunter.known=available.flatMap');
    expect(ui).toContain('const trialDef=f27Preview&&trial.includes(id)?{...useDef,learnLevel:1}:useDef');
    expect(ui).not.toContain("current={...current,learnedAbilityIds:available}");
  });
  it('keeps F27 save and mobile-HUD namespaces distinct from F263 and public saves',()=>{
    const save=source('src/game/highfly_offline_save.ts');
    expect(save).toContain("'highfly-offline-f27-combat-beta'");
    expect(save).toContain("'highfly.origin.f27-combat-beta.primary.v1'");
    expect(save).toContain("'highfly.origin.f263-combat-beta.primary.v1'");
    expect(save).toContain("readLocal(F27_PAGES_LAB?'highfly.origin.f263-combat-beta.primary.v1'");
    const hud=source('src/highfly/game_c1_runtime.ts');
    expect(hud).toContain("'highfly:origin:f27:hud:'");
    expect(hud).toContain("'highfly:origin:f263:hud:'");
  });
  it('has exactly 4 ordinary mobile buttons and no 3 locked secret placeholders',()=>{
    const hud=source('src/ui/hud.ts');
    expect(hud).toContain("skills=['fireball','sinister_strike','highfly_blade_rush','meteor']");
    expect(hud).toContain('this.applyHighflyF27PreviewLoadout();');
    expect(hud).toContain("highfly.origin.f27.preview.loadout.v1");
    const ui=source('src/highfly/game_c1_runtime.ts');
    expect(ui).toContain("Array.from({length:4}");
    const ring=source('src/ui/hud/action_bar/mobile_action_ring_controller.ts');
    expect(ring).toContain("location.pathname.startsWith('/cobalt-hollow-lab/lab/f27-combat-beta/')");
    expect(ring).toContain("f26Cancel.id='highfly-f26-aim-cancel'");
  });
});
