#!/usr/bin/env python3
"""R38: one entrance -> name + male/female -> world.
No second oversized customizer on the cover. Donor creator remains intact
for a future stylist; original Hunter saves and world/combat stay unchanged.
Runs AFTER certified R36B + R37 overlays, independently isolated.
"""
from pathlib import Path
p=Path('src/highfly/highfly_origin_trial_runtime.ts')
s=p.read_text(encoding='utf8')
old_import="import {mountAppearanceCustomizer} from '../ui/appearance_customizer';\n"
if s.count(old_import)!=1:
    raise SystemExit('R38_NATIVE_CUSTOMIZER_IMPORT_DRIFT')
s=s.replace(old_import,'',1)
start=s.find('export function installOriginTrialEntrance(')
end=s.find('export function mountOriginTrialTrainer(',start)
if start<0 or end<=start or s.count('export function installOriginTrialEntrance(')!=1:
    raise SystemExit('R38_ENTRANCE_FUNCTION_BOUNDARY_DRIFT')
existing=s[start:end]
for invariant in ("mountAppearanceCustomizer(", "hf-origin-native-appearance", "loadOriginTrialSave(name)", "onStart(name,appearance)"):
    if invariant not in existing: raise SystemExit('R38_R36B_SOURCE_DRIFT_'+invariant)

new = """export function installOriginTrialEntrance(
  onStart:(name:string,appearance:ModularAppearance)=>void,
  initialAppearance:ModularAppearance,
  onAppearanceChange:(appearance:ModularAppearance)=>void,
):void{
  if(!ORIGIN_TRIAL_ONLY)return;
  const host=document.querySelector<HTMLElement>('#mode-select');
  if(!host||document.getElementById('hf-origin-entry'))return;
  // R38 preview ONLY: native site buttons remain in DOM with listeners,
  // but just ONE visible entry is shown. Legacy online mode stays untouched.
  for(const child of Array.from(host.children)){
    if(child instanceof HTMLElement)child.style.display='none';
  }
  host.style.width='min(88vw,470px)';
  host.style.maxWidth='min(88vw,470px)';
  host.style.minWidth='0';
  host.style.boxSizing='border-box';
  host.style.margin='12px auto';
  host.style.padding='12px';
  const section=document.createElement('section');
  section.id='hf-origin-entry';
  section.style.cssText='display:grid;gap:12px;min-width:0;color:#f8f1dc;text-align:center;';
  const open=button('ENTRAR AL MUNDO →');
  open.id='hf-origin-open-world';
  open.style.cssText='display:block;width:100%;min-height:64px;touch-action:manipulation;background:#281644eb;color:#fff1c9;border:1px solid #e1c078;border-radius:12px;padding:12px;font:700 clamp(17px,2.6vw,24px) Georgia,serif;letter-spacing:.09em;cursor:pointer;';
  const form=document.createElement('div');
  form.id='hf-origin-simple-creator';
  form.hidden=true;
  form.style.cssText='display:none;gap:10px;min-width:0;text-align:left;background:#10192ceb;padding:14px;border:1px solid #5374a3;border-radius:12px;';
  const title=document.createElement('strong');
  title.textContent='⚔ HIGHFLY ORIGIN · TU HUNTER';
  title.style.cssText='font:700 18px system-ui,sans-serif;color:#f6e4b2';
  const description=document.createElement('span');
  description.textContent='Elegí tu identidad. Podrás personalizarte con el estilista dentro del mundo.';
  description.style.cssText='font:13px system-ui,sans-serif;color:#d6e3f5;';
  const input=document.createElement('input');
  input.type='text';input.maxLength=16;input.autocomplete='off';
  input.placeholder='Nombre del Hunter';input.id='hf-origin-name';
  input.style.cssText='box-sizing:border-box;width:100%;min-width:0;min-height:44px;padding:10px;background:#192945;color:#fff;border:1px solid #7d94b8;border-radius:9px;font-size:16px;';
  try{input.value=localStorage.getItem(LAST_NAME_KEY)||'Hunter';}
  catch{input.value='Hunter';}
  const genders=document.createElement('div');
  genders.id='hf-origin-gender-only';
  genders.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;';
  let gender:'male'|'female'='male';
  const male=button('HOMBRE');
  const female=button('MUJER');
  male.dataset.originGender='male';
  female.dataset.originGender='female';
  const selectGender=(value:'male'|'female')=>{
    gender=value;
    for(const btn of [male,female]){
      const active=btn.dataset.originGender===value;
      btn.setAttribute('aria-pressed',String(active));
      btn.style.cssText='flex:1;min-height:48px;touch-action:manipulation;border:1px solid '+(active?'#e1c078':'#617a9a')+';border-radius:9px;color:#fff;background:'+(active?'#725b2e':'#202a3e')+';font-weight:750;';
    }
  };
  male.addEventListener('click',()=>selectGender('male'));
  female.addEventListener('click',()=>selectGender('female'));
  selectGender(normalizeAppearance(initialAppearance).gender==='female'?'female':'male');
  genders.append(male,female);
  const status=document.createElement('small');
  status.style.cssText='min-height:16px;font:12px system-ui,sans-serif;color:#bad5fa;';
  const actions=document.createElement('div');
  actions.style.cssText='display:grid;grid-template-columns:1fr auto;gap:8px;';
  const start=button('CREAR HUNTER');
  start.id='hf-origin-start-hunter';
  start.style.minHeight='48px';
  const back=button('VOLVER');
  back.id='hf-origin-back';
  back.style.cssText='min-height:48px;padding:10px;border:1px solid #586b89;color:#e6eaf7;background:#152039;border-radius:9px;';
  actions.append(start,back);
  form.append(title,description,input,genders,actions,status);
  section.append(open,form);
  host.appendChild(section);
  let lookupVersion=0;
  const refreshExisting=async()=>{
    const version=++lookupVersion;
    const name=input.value.trim();
    if(!validName(name)){
      status.textContent='Nombre de 2 a 16 letras, espacios o guiones.';
      genders.style.display='grid';
      start.textContent='CREAR HUNTER';
      return;
    }
    const saved=await loadOriginTrialSave(name);
    if(version!==lookupVersion)return;
    const restored=Boolean(saved?.state.originHunter);
    genders.style.display=restored?'none':'grid';
    start.textContent=restored?'CONTINUAR HUNTER':'CREAR HUNTER';
    status.textContent=restored?'Hunter guardado: conserva progreso y apariencia.':'Elegí hombre o mujer para crear tu Hunter.';
  };
  open.addEventListener('click',()=>{
    open.style.display='none';
    form.hidden=false;form.style.display='grid';
    void refreshExisting();
  });
  back.addEventListener('click',()=>{
    ++lookupVersion;
    form.hidden=true;form.style.display='none';
    open.style.display='block';
  });
  input.addEventListener('input',()=>{void refreshExisting();});
  start.addEventListener('click',async()=>{
    const name=input.value.trim();
    if(!validName(name)){
      status.textContent='Usá entre 2 y 16 letras y espacios (sin números ni símbolos).';
      return;
    }
    start.disabled=true;status.textContent='Preparando el mundo...';
    try{
      const saved=await loadOriginTrialSave(name);
      const chosen=saved?.state.originHunter && saved.appearance
        ? normalizeAppearance(saved.appearance as Partial<ModularAppearance>)
        : normalizeAppearance({...initialAppearance,gender});
      if(!saved?.state.originHunter)onAppearanceChange(chosen);
      onStart(name,chosen);
    }catch{
      start.disabled=false;
      status.textContent='No se pudo revisar el Hunter guardado. Reintentá para proteger su progreso.';
    }
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter')start.click();});
}
"""
p.write_text(s[:start]+new+s[end:],encoding='utf8')
result=p.read_text(encoding='utf8')
for invariant in ("loadOriginTrialSave(name)","onStart(name,chosen)","hf-origin-open-world","hf-origin-gender-only","hf-origin-back"):
    if invariant not in result:raise SystemExit('R38_MISSING_'+invariant)
if "mountAppearanceCustomizer(" in result:raise SystemExit('R38_CUSTOMIZER_STILL_MOUNTED')
print('HIGHFLY_R38_ONE_ENTRY_GENDER_ONLY_EXISTING_HUNTER_RESTORES_NO_CUSTOMIZER_GREEN=1')
