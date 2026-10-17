#!/usr/bin/env python3
"""CLEAN R1 P1: Only a FRESH Origin Hunter starts without class starter gear.

Keep the original ClaudeCraft modular body, ORIGINAL Sims, original hero rig
and native combat. Legacy classes, restores and the main Pages are untouched.
This patch is intended ONLY after the last certified R23 donor overlay.
"""
from pathlib import Path

def replace_once(path: str, old: str, new: str) -> None:
    f = Path(path)
    value = f.read_text(encoding='utf8')
    seen = value.count(old)
    if seen != 1:
        raise SystemExit('CLEAN_P1_SOURCE_DRIFT '+path+' count='+str(seen)+': '+repr(old[:105]))
    f.write_text(value.replace(old,new,1),encoding='utf8')

sim = 'src/sim/sim.ts'
# Canonical addPlayer's equipment defaults for ALL legacy classes are unchanged.
# Saved characters, even saved ORIGIN Hunter characters, keep their inventory,
# worn gear, stats and visual identity. No hiding meshes as a fake solution.
replace_once(sim,
"""      equipment: {
        mainhand: classDef.startWeapon,
        chest: classDef.startChest,
        ...(classDef.startOffhand ? { offhand: classDef.startOffhand } : {}),
      },""",
"""      equipment: this.cfg.originHunterEnabled && !savedState
        ? {} // CLEAN P1: true unarmed/new Hunter only, never legacy or restored
        : {
            mainhand: classDef.startWeapon,
            chest: classDef.startChest,
            ...(classDef.startOffhand ? { offhand: classDef.startOffhand } : {}),
          },""")

entry = 'src/highfly/highfly_origin_trial_runtime.ts'
replace_once(entry,
    'export function installOriginTrialEntrance(onStart:(name:string)=>void):void{',
    "export function installOriginTrialEntrance(onStart:(name:string,gender:'male'|'female')=>void):void{")
replace_once(entry,
    "  const start=button('",
    """  // CLEAN P1: use ClaudeCraft's shipped male/female modular shapes;
  // no new creator and no custom body mesh. Appearance is saved separately.
  const genderRow=document.createElement('div');
  genderRow.id='hf-clean-gender-picker';
  genderRow.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;';
  let gender:'male'|'female'='male';
  const genderBtns:[HTMLButtonElement,HTMLButtonElement]=[button('HOMBRE'),button('MUJER')];
  genderBtns.forEach((btn,i)=>{
    const variant=i===0?'male':'female';
    btn.dataset.originGender=variant;
    btn.setAttribute('aria-pressed',String(i===0));
    btn.addEventListener('click',()=>{
      gender=variant;
      genderBtns.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
    });
    genderRow.appendChild(btn);
  });
  const start=button('""")
replace_once(entry, "    onStart(name);", "    onStart(name,gender);")
replace_once(entry,"  section.append(title,desc,input,start,status);host.appendChild(section);",
"""  section.append(title,desc,input,genderRow,start,status);host.appendChild(section);""")

main = 'src/main.ts'
replace_once(main,
    'installOriginTrialEntrance((name)=>{',
    """installOriginTrialEntrance((name,gender)=>{
    // NEW Hunter look: only the selected gender changes, all donor 3D
    // material/morph/tint values remain from the existing modular draft.
    modularAppearance=normalizeAppearance({...modularAppearance,gender});""")

# No SIM or player save format change. Existing Player Meta/CharacterState intact.
print('HIGHFLY_CLEAN_P1_FRESH_HUNTER_MALE_FEMALE_UNDERWEAR_NO_WEAPONS_NO_LEGACY_MUTATION=1')
