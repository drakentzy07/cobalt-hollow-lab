import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const file=(f:string)=>readFileSync(f,'utf8');
describe('HIGHFLY ORIGIN R36B — saved Draken truth and female/male scene',()=>{
  it('fresh ORIGIN chooses real entity gender; no mere CSS avatar swap',()=>{
    const s=file('src/main.ts');
    expect(s).toContain("originHunterChosenGender: 'male'|'female' = 'male'");
    expect(s).toContain('offlinePlayer.modularAppearance=normalizeAppearance({');
    expect(s).toContain('...modularAppearance,gender:originHunterChosenGender');
    expect(s).toContain("true,gender);");
    expect(s).toContain("originHunterTrial && !trialSave &&");
  });
  it('existing saved name NEVER overwrites its appearance or inventory',()=>{
    const s=file('src/main.ts');
    expect(s).toContain('if (originHunterTrial && trialSave?.appearance && offlinePlayer)');
    expect(s).toContain('offlinePlayer.modularAppearance = trialSave.appearance');
    expect(s).toContain('if (trialSave?.state.originHunter)');
    expect(s).toContain('state:trialSave.state');
    expect(s).toContain('appearance:trialSave.appearance');
    expect(s).toContain('new Sim({...cfg,noPlayer:true,compulsoryTutorial:false})');
  });
  it('only fresh R36B Hunter can skip compulsory bootcamp; same world, no teleport',()=>{
    const s=file('src/main.ts');
    expect(s).toContain("new URLSearchParams(location.search).get('hf_origin_r36b')==='1'");
    expect(s).toContain("...(r36b ? {compulsoryTutorial:false} : {})");
    expect(s).not.toContain('originHunterTeleportToUnverifiedLocation');
    const sim=file('src/sim/sim.ts');
    expect(sim).toContain('originHunterEnabled');
  });
  it('existing names transparently resume saved body and equipment',()=>{
    const s=file('src/highfly/highfly_origin_trial_runtime.ts');
    expect(s).toContain('void loadOriginTrialSave(name).then(existing=>');
    expect(s).toContain('Retomando a ');
    expect(s).toContain('onStart(name,gender)');
    expect(s).not.toContain('eraseOriginTrialSave(');
  });
});
