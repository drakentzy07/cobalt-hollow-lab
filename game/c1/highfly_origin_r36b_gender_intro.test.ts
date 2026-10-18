import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const source=(path:string)=>readFileSync(path,'utf8');

describe('HIGHFLY R36B — REUSE ORIGINAL ClaudeCraft creator and real rig',()=>{
  it('full AppearanceCustomizer from original World of ClaudeCraft, no parallel picker',()=>{
    const ui=source('src/highfly/highfly_origin_trial_runtime.ts');
    expect(ui).toContain("import {mountAppearanceCustomizer} from '../ui/appearance_customizer'");
    expect(ui).toContain("import {type ModularAppearance, normalizeAppearance} from '../render/characters/modular'");
    expect(ui).toContain("appearanceHost.id='hf-origin-native-appearance'");
    expect(ui).toContain('mountAppearanceCustomizer(appearanceHost,');
    expect(ui).toContain('normalizeAppearance(originalCustomizer.value)');
    expect(ui).not.toContain('hf-clean-gender-picker');
    expect(ui).not.toContain('genderBtns');
  });
  it('passes full edited look to player Entity, not a cosmetic DOM field',()=>{
    const s=source('src/main.ts');
    expect(s).toContain('originHunterChosenLook: ModularAppearance | null = null');
    expect(s).toContain('r36bFresh ? normalizeAppearance(originHunterChosenLook??modularAppearance)');
    expect(s).toContain('offlinePlayer.modularAppearance = (');
    expect(s).toContain('installOriginTrialEntrance((name,chosenLook)=>');
    expect(s).toContain("startOffline('warrior',name,0,undefined,undefined,undefined,true,");
    expect(s).toContain('characterPreview?.setModular(modularAppearance,creationLoadout');
  });
  it('old Hunter save wins over temporary creator draft, no Draken loss',()=>{
    const s=source('src/main.ts');
    expect(s).toContain('if (originHunterTrial && trialSave?.appearance && offlinePlayer)');
    expect(s).toContain('offlinePlayer.modularAppearance = trialSave.appearance');
    expect(s).toContain('if (trialSave?.state.originHunter)');
    expect(s).toContain('state:trialSave.state');
    expect(s).toContain('appearance:trialSave.appearance');
    expect(s).toContain('new Sim({...cfg,noPlayer:true,compulsoryTutorial:false})');
    expect(s).toContain('r36bFresh=originHunterTrial && !trialSave');
  });
  it('existing P2 new Hunter tutorial skip remains unchanged, no random spawn coordinate',()=>{
    const s=source('src/main.ts');
    expect(s).toContain('const androidP2Hunter = new URLSearchParams(location.search)');
    expect(s).toContain('compulsoryTutorial: androidP2Hunter ? false : cfg.compulsoryTutorial');
    expect(s).not.toContain('originHunterTeleportToUnverifiedLocation');
    expect(s).toContain('if (trialSave?.state.originHunter)');
  });
  it('native editor already supports original male and female morph & detailed features',()=>{
    const orig=source('src/ui/appearance_customizer.ts');
    expect(orig).toContain("['male', 'female']");
    expect(orig).toContain('value = { ...value, gender: g, lashes: defaultLashes(g) }');
    expect(orig).toContain("const pHair = tabPage('auth.hair')");
    expect(orig).toContain("const pFace = tabPage('auth.face')");
  });
});
