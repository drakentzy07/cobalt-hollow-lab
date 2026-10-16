// @vitest-environment jsdom
import {describe,it,expect,afterEach,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import type {Sim} from '../src/sim/sim';
import {ABILITIES} from '../src/sim/content/classes';
import {
 LAB_SCHOOLS,originLabCatalog,originLabSummary,originLabAimFromDonors,
 mountOriginR25aSelector
} from '../src/highfly/highfly_origin_r25a_sf27_selector';
const mockSim=()=>({known:[]} as unknown as Sim);
afterEach(()=>{document.body.replaceChildren();vi.restoreAllMocks();});
describe('R25A SF27 63-fusion + 36-original safe A/B lab (NO GRANTS)',()=>{
 it('shows exactly 63 distinct archived fusion identifiers and 36 original picks',()=>{
  const rows=originLabCatalog();
  expect(LAB_SCHOOLS).toHaveLength(9);
  expect(originLabSummary(rows)).toMatchObject({original:36,fusion:63});
  expect(new Set(rows.map(r=>r.id)).size).toBe(99);
  for(const school of LAB_SCHOOLS){
   expect(rows.filter(x=>x.school===school&&x.mode==='fusion')).toHaveLength(7);
   expect(rows.filter(x=>x.school===school&&x.mode==='original')).toHaveLength(4);
  }
 });
 it('never confuses unregistered SF27 fusions with native executable skills',()=>{
  const rows=originLabCatalog(mockSim());
  for(const row of rows.filter(x=>x.mode==='fusion')){
    expect(row.registered).toBe(Boolean(ABILITIES[row.id]));
    expect(row.testable).toBe(false);
    expect(row.donors.length).toBeGreaterThan(1);
    expect(row.note).toMatch(/archivada|Registrada/);
  }
 });
 it('derives *visual* donor templates conservatively; actual collision unclaimed',()=>{
  expect(originLabAimFromDonors(['heroic_leap','faultline'])).toBe('dash');
  expect(originLabAimFromDonors(['blizzard','frozen_orb'])).toBe('circle');
  expect(originLabAimFromDonors(['fireball','frostbolt'])).toBe('line');
  expect(originLabAimFromDonors(['sinister_strike','eviscerate'])).toBe('target');
 });
 it('selector is genuinely mounted, filters schools and toggles A/B without touching Sim or save',()=>{
  const panel=document.createElement('div');document.body.append(panel);
  const sim=mockSim();
  const dispose=mountOriginR25aSelector(sim,panel);
  const host=panel.querySelector('#hf-origin-r25a-skill-lab')!;
  expect(host).not.toBeNull();
  expect(host.textContent).toContain('63 fusiones');
  const sel=host.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
  const cards=()=>host.querySelectorAll('button').length;
  expect(cards()).toBe(4);
  sel[1].value='fusion';sel[1].dispatchEvent(new Event('change'));
  expect(cards()).toBe(7);
  sel[0].value='rogue';sel[0].dispatchEvent(new Event('change'));
  expect(host.textContent).toContain('Estocada Cobarde');
  const search=host.querySelector('input')!;
  search.value='Estocada';search.dispatchEvent(new Event('input'));
  expect(cards()).toBe(1);
  dispose();expect(panel.querySelector('#hf-origin-r25a-skill-lab')).toBeNull();
 });
 it('visual preview only dispatches gallery event; never calls any casting or learning API',()=>{
  const panel=document.createElement('div');document.body.append(panel);
  const onPreview=vi.fn();document.addEventListener('hf-origin-aim-gallery',onPreview);
  mountOriginR25aSelector(mockSim(),panel);
  const first=panel.querySelector<HTMLButtonElement>('#hf-origin-r25a-skill-lab button')!;
  first.click();
  expect(panel.hidden).toBe(true);
  expect(onPreview).toHaveBeenCalledTimes(1);
  const event=onPreview.mock.calls[0][0] as CustomEvent;
  expect(event.detail).toMatchObject({shape:expect.any(String),abilityId:expect.any(String)});
  document.removeEventListener('hf-origin-aim-gallery',onPreview);
  const code=readFileSync('src/highfly/highfly_origin_r25a_sf27_selector.ts','utf8');
  expect(code).not.toContain('sim.learnOriginHunterSkillTrusted(');
  expect(code).not.toContain('sim.castAbility(');
  expect(code).not.toContain('h.setSlot(');
  expect(code).not.toContain('saveOriginTrial(');
 });
 it('the R22 gallery is RESTORED after R18 replaces the DOM; no inert buttons',()=>{
  const runtime=readFileSync('src/highfly/highfly_origin_trial_runtime.ts','utf8');
  const replace=runtime.indexOf('  mountOriginR18Editor(sim,panel,list,referencePanel,status,refresh);');
  const attach=runtime.indexOf('  panel.insertBefore(gallery,referencePanel);');
  const lab=runtime.indexOf('  mountOriginR25aSelector(sim,panel);');
  expect(replace).toBeGreaterThan(0);
  expect(attach).toBeGreaterThan(replace);
  expect(lab).toBeGreaterThan(attach);
  const aim=readFileSync('src/highfly/highfly_origin_r17_hud.ts','utf8');
  expect(aim).toContain('const requested=request?.abilityId;');
 });
});
