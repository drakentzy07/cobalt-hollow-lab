import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const code=readFileSync('src/highfly/highfly_origin_trial_runtime.ts','utf8');
const entry=code.slice(code.indexOf('export function installOriginTrialEntrance('),code.indexOf('export function mountOriginTrialTrainer('));
describe('HIGHFLY R38 one clean entry / male-female / saved Hunter',()=>{
 it('one clear landing entrance, no oversized customizer on main cover',()=>{
  expect(entry).toContain("open.id='hf-origin-open-world'");
  expect(entry).toContain("button('ENTRAR AL MUNDO →')");
  expect(entry).toContain("child.style.display='none'");
  expect(entry).not.toContain('mountAppearanceCustomizer');
  expect(code).not.toContain('mountAppearanceCustomizer(');
  expect(entry).toContain("form.hidden=true");
  expect(entry).toContain("form.style.display='none'");
 });
 it('after tapping entry just name + male/female, no hair or face editor',()=>{
  expect(entry).toContain("genders.id='hf-origin-gender-only'");
  expect(entry).toContain("male.dataset.originGender='male'");
  expect(entry).toContain("female.dataset.originGender='female'");
  expect(entry).toContain("selectGender(");
  expect(entry).not.toContain('appearanceHost');
  expect(entry).not.toContain('hf-origin-native-appearance');
 });
 it('saved Hunter restores appearance and progression rather than overwriting it',()=>{
  expect(entry).toContain('const saved=await loadOriginTrialSave(name)');
  expect(entry).toContain('saved?.state.originHunter');
  expect(entry).toContain("genders.style.display=restored?'none':'grid'");
  expect(entry).toContain("start.textContent=restored?'CONTINUAR HUNTER':'CREAR HUNTER'");
  expect(entry).toContain('normalizeAppearance(saved.appearance as Partial<ModularAppearance>)');
  expect(entry).toContain('if(!saved?.state.originHunter)onAppearanceChange(chosen)');
  expect(entry).toContain('onStart(name,chosen)');
  expect(entry).not.toContain('localStorage.removeItem(');
 });
 it('does not modify combat systems or donor customization source',()=>{
  const overlay=readFileSync('../v9-corrections/overlays/highfly_origin_r38_simple_entry.py','utf8');
  expect(overlay).toContain("src/highfly/highfly_origin_trial_runtime.ts");
  expect(overlay).not.toContain("src/render/characters/visual.ts");
  expect(overlay).not.toContain("src/sim/combat/");
  expect(overlay).not.toContain("src/ui/appearance_customizer.ts");
 });
});
