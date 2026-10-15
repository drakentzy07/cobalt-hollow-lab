#!/usr/bin/env python3
"""R19 focused 36 native ability shortlist, useful player-facing intro and safe aim."""
from pathlib import Path
import shutil

def once(path,old,new):
    p=Path(path);s=p.read_text(encoding='utf8')
    if s.count(old)!=1:raise SystemExit('OR19_SOURCE_DRIFT '+path+' '+str(s.count(old))+' '+repr(old[:90]))
    p.write_text(s.replace(old,new,1),encoding='utf8')

shutil.copy2('../v9-corrections/game/c1/highfly_origin_r19_selection.ts','src/sim/highfly_origin_r19_selection.ts')
once('src/highfly/highfly_origin_r17_hud.ts',
     "import { originCostDecision } from '../sim/highfly_origin_universal_resources';",
     "import { originCostDecision } from '../sim/highfly_origin_universal_resources';\nimport { originFocusRole } from '../sim/highfly_origin_r19_selection';")
once('src/highfly/highfly_origin_r17_hud.ts',
     """  if(!def||def.passive||def.hiddenFromPlayer||id==='divine_ascension'
    ||!originCostDecision(def).ok||def.requiresShield)return 'reference';
  return originUtilitySkill(id)?'support':'combat';""",
     """  const role=originFocusRole(id);
  if(!role||!def||def.passive||def.hiddenFromPlayer||!originCostDecision(def).ok||def.requiresShield)
    return 'reference';
  return role;""")
# Only the chosen 36 are displayed as learnable. All others remain library.
once('src/highfly/highfly_origin_trial_runtime.ts',
     "import { originUtilitySkill, originSkillRole } from './highfly_origin_r17_hud';",
     "import { originUtilitySkill, originSkillRole } from './highfly_origin_r17_hud';\nimport { ORIGIN_FOCUS_SKILLS } from '../sim/highfly_origin_r19_selection';")
once('src/highfly/highfly_origin_trial_runtime.ts',
     """    const catalog=Object.values(ABILITIES)
      .filter(def=>highflyOriginNativeLearnable(def.id,sim.player.level,meta.questsDone)!==null)
      .sort((a,b)=>a.class.localeCompare(b.class)||a.id.localeCompare(b.id));
    const learnable=catalog.filter(def=>originCostDecision(def).ok&&originSkillRole(def.id)!=='reference');
    const references=catalog.filter(def=>!originCostDecision(def).ok||originSkillRole(def.id)==='reference');""",
     """    const catalog=Object.values(ABILITIES)
      .filter(def=>!def.hiddenFromPlayer)
      .sort((a,b)=>a.class.localeCompare(b.class)||a.id.localeCompare(b.id));
    const learnable=catalog.filter(def=>ORIGIN_FOCUS_SKILLS.has(def.id)
      &&highflyOriginNativeLearnable(def.id,sim.player.level,meta.questsDone)!==null
      &&originCostDecision(def).ok&&originSkillRole(def.id)!=='reference');
    const references=catalog.filter(def=>!ORIGIN_FOCUS_SKILLS.has(def.id)
      ||!originCostDecision(def).ok||originSkillRole(def.id)==='reference');""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "    for(const def of references.slice(0,80)){",
     "    for(const def of references){")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  refTitle.textContent='📖 BIBLIOTECA · CONSULTA (NO EQUIPABLE)';",
     "  refTitle.textContent='📖 BIBLIOTECA · ARCHIVO DE SKILLS (NO EQUIPABLE)';")
# Make classes' selected original native spec signatures available without an
# artificial 9-class talent build, but never remove real level/quest/weapon gates.
once('src/sim/highfly_origin_native_spellbook.ts',
     "import { ABILITIES, abilitiesKnownAt, type KnownAbility } from './content/classes';",
     "import { ABILITIES, CLASSES, abilitiesKnownAt, type KnownAbility } from './content/classes';\nimport { ORIGIN_FOCUS_SKILLS } from './highfly_origin_r19_selection';")
once('src/sim/highfly_origin_native_spellbook.ts',
     """  const native = abilitiesKnownAt(def.class, level, undefined, questsDone)
    .find((known) => known.def.id === abilityId);
  return native ?? null;""",
     """  const native = abilitiesKnownAt(def.class, level, undefined, questsDone)
    .find((known) => known.def.id === abilityId);
  if(native)return native;
  // Explicit, allowlisted mixed-discipline Hunter signature. Never grant a
  // new spell, currency, resource, talent, weapon or skill before native level.
  if(!ORIGIN_FOCUS_SKILLS.has(abilityId)||!CLASSES[def.class].abilities.includes(abilityId)
    ||def.learnLevel>level||def.requiresQuest&&!questsDone.has(def.requiresQuest))return null;
  let rank=1,cost=def.cost,castTime=def.castTime,effects=def.effects;
  let threatFlat=def.threat?.flat??0;
  for(const r of def.ranks??[])if(r.level<=level){
    rank=r.rank;cost=r.cost;effects=r.effects;
    if(r.castTime!==undefined)castTime=r.castTime;
    if(r.threatFlat!==undefined)threatFlat=r.threatFlat;
  }
  const out:KnownAbility={def,rank,cost,castTime,cooldown:def.cooldown,effects,
    threatFlat,threatMult:def.threat?.mult??1,bonusCharges:Math.max(0,(def.maxCharges??1)-1)};
  if(def.maxCharges!==undefined)out.charges=def.maxCharges;
  return out;""")
# Native casts remain authoritative; self-only support cannot accidentally
# try to heal a hostile target.
once('src/ui/hud.ts',
     "        castSlot: (slot) => this.castSlot(slot),",
     """        castSlot: (slot) => {
          const action=this.actionForSlot(slot);
          const def=action?.type==='ability'?ABILITIES[action.id]:null;
          if(slot>=11&&def?.targetType==='friendly'&&action?.type==='ability'){
            this.sim.castAbilityOn(action.id,this.sim.playerId);
            return;
          }
          this.castSlot(slot);
        },""")
# Native 2-row support bank below the action area, not over Jump / Evade.
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  utility.style.cssText='position:fixed;bottom:6px;left:39%;width:min(27vw,212px);z-index:8500;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;padding:3px;border-radius:8px;background:#111c2ade;touch-action:manipulation;';",
     "  utility.style.cssText='position:fixed;left:31%;bottom:clamp(112px,22vh,190px);width:min(26vw,256px);z-index:8400;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:8px;border:1px solid #b7a47799;border-radius:13px;background:linear-gradient(150deg,#111d2eea,#28384dee);box-shadow:0 8px 28px #0008,inset 0 0 0 1px #ffebae18;touch-action:manipulation;';")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "    b.style.cssText+='font-size:10px;min-width:0;padding:2px 0;height:27px;max-height:27px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;';",
     "    b.style.cssText+='font-size:10px;min-width:0;padding:3px 0;height:32px;max-height:32px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;border:1px solid #a99261a8;background:linear-gradient(160deg,#192c43,#34465d);box-shadow:inset 0 0 0 1px #ffffff0b;';")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "      b.textContent=id?'B'+(i+1)+' · '+name.slice(0,3):'B'+(i+1);",
     "      b.textContent=id?'✦ B'+(i+1):'B'+(i+1);\n      b.setAttribute('aria-label',id?'B'+(i+1)+' '+name:'B'+(i+1)+' vacío');")
# Premium single-Hunter intro, only in preview. Existing game/legacy build untouched.
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  const section=document.createElement('section');\n  section.id='hf-origin-entry';",
     """  const backdrop=document.createElement('div');
  backdrop.id='hf-origin-entry-backdrop';
  backdrop.style.cssText='position:fixed;inset:0;z-index:99000;background:radial-gradient(ellipse at 50% 28%,#284363 0%,#0a1829 56%,#050b16 100%);pointer-events:auto;';
  document.body.appendChild(backdrop);
  const introStyle=document.createElement('style');
  introStyle.textContent='#hf-origin-entry input:focus{outline:2px solid #e0c384} #hf-origin-entry button:active{transform:scale(.98)}';
  document.head.appendChild(introStyle);
  const section=document.createElement('section');
  section.id='hf-origin-entry';""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  section.style.cssText='max-width:460px;margin:14px auto;padding:14px;background:#10192ce9;border:1px solid #5374a3;border-radius:12px;color:#fff;display:grid;gap:10px;z-index:3;position:relative;text-align:left;';",
     "  section.style.cssText='position:fixed;z-index:99001;left:50%;top:50%;transform:translate(-50%,-50%);width:min(90vw,480px);box-sizing:border-box;padding:clamp(18px,3vw,32px);background:linear-gradient(160deg,#111c2bf5,#1c2e45f5);border:1px solid #c4a66a;border-radius:17px;color:#f9f3e6;display:grid;gap:13px;box-shadow:0 20px 70px #000d,inset 0 0 0 1px #f9d59122;font:14px system-ui,sans-serif;text-align:left;';")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  const title=document.createElement('strong');title.textContent='⚔️ HIGHFLY ORIGIN · PRUEBA DEL HUNTER';",
     "  const title=document.createElement('strong');title.textContent='✦ HIGHFLY ORIGIN';\n  title.style.cssText='color:#f4d18b;letter-spacing:2px;font-size:clamp(20px,4vw,29px);text-align:center;text-shadow:0 2px 18px #c7a26a55';")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  desc.textContent='Un solo Hunter, sin elegir clase. Mismo personaje, HP / MP / stamina y habilidades de distintas disciplinas. Guardado local por nombre.';",
     "  desc.textContent='EL DESPERTAR DEL HUNTER · Tu único personaje, nueve disciplinas. Combate manual, maná y stamina. Progreso local seguro.';\n  desc.style.textAlign='center';")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  const start=button('CREAR / CONTINUAR HUNTER ORIGIN');",
     "  const start=button('⚔ ENTRAR AL MUNDO · HUNTER');\n  start.style.cssText='background:linear-gradient(135deg,#b79251,#e3ca83,#92713b);color:#162133;border:1px solid #ffedb4;border-radius:9px;min-height:48px;font:800 14px system-ui;letter-spacing:.5px;text-shadow:none;box-shadow:0 4px 18px #c0995433;touch-action:manipulation;';")
# Clean intro when world and its trainer are ready.
once('src/highfly/highfly_origin_trial_runtime.ts',
     "export function mountOriginTrialTrainer(sim:Sim):void{",
     """export function mountOriginTrialTrainer(sim:Sim):void{
  document.getElementById('hf-origin-entry-backdrop')?.remove();
  document.getElementById('hf-origin-entry')?.remove();""")
print('ORIGIN_R19_NATIVE_TOP36_LIBRARY_AND_PREMIUM_HUD_ENTRY_GREEN=1')
