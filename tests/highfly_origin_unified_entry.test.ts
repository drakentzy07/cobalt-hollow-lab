import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {highflyMeetsContentLevelGate} from '../src/highfly/origin/unified_mode';
const source=(name:string)=>readFileSync(name,'utf8');
describe('HIGHFLY ORIGIN UNIFIED 01 — native World/LAB wiring',()=>{
  it('launches both modes via the same creator, without duplicating the world',()=>{
    const html=source('index.html');
    expect(html).toContain('hf-origin-mode-world');
    expect(html).toContain('hf-origin-mode-lab');
    const main=source('src/main.ts');
    expect(main).toContain("selectOriginMode('lab')");
    expect(main).toContain("selectOriginMode('world')");
    expect(main).toContain("setActiveHighflyOriginMode(mode)");
    expect(main).toContain("document.body.classList.toggle('hf-origin-lab', mode === 'lab')");
    expect(main).toContain("world: world ?? { ...BUILTIN_WORLD, playerStart: ORIGIN_HUNTER_START,");
    expect(main).toContain("camps:[...BUILTIN_WORLD.camps,...HIGHFLY_F72_HUNT_CAMPS]");
  });
  it('routes all origin progress through mode-scoped load, write, autosave and reset',()=>{
    const main=source('src/main.ts'),save=source('src/game/highfly_offline_save.ts');
    expect(main).toContain('loadOriginHunterSave(playerClass, name, mode)');
    expect(main).toContain('loadHighflyTrainingProfile(playerClass, name, mode)');
    expect(main).toContain('}, 2500, mode)');
    expect(main).toContain('}, mode);');
    expect(main).toContain('resetOriginHunterSave(selectedOriginMode)');
    expect(save).toContain("const db = await openDb(originDbName(mode));");
    expect(save).toContain("const ownPrimary = newest(readLocal(originLocalKey(mode)), await readIdbKey(originPrimarySlot(mode), dbName))");
    expect(save).toContain("if (mode === 'lab' || UNIFIED_CANDIDATE_PREVIEW) return null");
    expect(save).toContain("mode === 'lab' || F2_PAGES_LAB ? null");
    expect(save).toContain("UNIFIED_CANDIDATE_PREVIEW || mode === 'lab'");
  });
  it('enables one common four-skill runtime but only LAB receives free trials',()=>{
    const world=source('src/highfly/origin/f1_world_ui.ts');
    expect(world).toContain("const f27Preview=(isUnifiedOriginRuntime()");
    expect(world).toContain("getActiveHighflyOriginMode()==='world') trial.length=0");
    expect(world).toContain('!previewBypass && def.learnLevel>sim.player.level');
    const hud=source('src/ui/hud.ts');
    expect(hud).toContain("document.body.classList.contains('hf-origin-lab')");
    expect(hud).toContain("const skills=['fireball','sinister_strike','highfly_blade_rush','meteor']");
    expect(highflyMeetsContentLevelGate('lab',1,99)).toBe(true);
    expect(highflyMeetsContentLevelGate('world',1,99)).toBe(false);
  });
});
