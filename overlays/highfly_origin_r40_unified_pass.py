#!/usr/bin/env python3
"""R40: isolated additive runtime repair AFTER R39 FINAL, no new Sim/renderer.
Fail closed on drift. This file only patches the disposable CI donor worktree.
"""
from pathlib import Path
import shutil

def once(path, old, new):
    p=Path(path)
    source=p.read_text(encoding='utf-8')
    n=source.count(old)
    if n!=1: raise SystemExit(f'R40_SOURCE_DRIFT {path} count={n}: {old[:95]!r}')
    p.write_text(source.replace(old,new,1),encoding='utf-8')

# Single immediate entry, no second 'enter' CTA and no landscape-truncated
# intermediary. Actual R38 native save/gender/appearance restore is untouched.
entry='src/highfly/highfly_origin_trial_runtime.ts'
once(entry,"  form.hidden=true;\n  form.style.cssText='display:none;gap:10px;",
           "  form.hidden=false;\n  form.style.cssText='display:grid;gap:10px;")
once(entry,"  section.append(open,form);","  section.append(form);")
once(entry,"  back.style.cssText='min-height:48px;",
           "  back.style.cssText='display:none;min-height:48px;")

# One optional presentation only. Native event authority stays in R39 Sim.
shutil.copy2('../v9-corrections/game/c1/highfly_origin_r40_feedback.ts',
             'src/highfly/highfly_origin_r40_feedback.ts')
main='src/main.ts'
p=Path(main)
s=p.read_text(encoding='utf8')
if 'installHighflyR40Feedback' in s: raise SystemExit('R40_DUPLICATE_INSTALL')
p.write_text("import {installHighflyR40Feedback} from './highfly/highfly_origin_r40_feedback';\n"+s,encoding='utf8')
once(main,
"""  document.body.classList.toggle('hf-android-p35',androidP2 &&
    new URLSearchParams(location.search).get('hf_android_p3')==='1' &&
    new URLSearchParams(location.search).get('hf_android_p35')==='1');""",
"""  document.body.classList.toggle('hf-android-p35',androidP2 &&
    new URLSearchParams(location.search).get('hf_android_p3')==='1' &&
    new URLSearchParams(location.search).get('hf_android_p35')==='1');
  const r40Android=androidP2 &&
    new URLSearchParams(location.search).get('hf_android_p3')==='1' &&
    new URLSearchParams(location.search).get('hf_android_p35')==='1' &&
    new URLSearchParams(location.search).get('hf_r40')==='1';
  document.body.classList.toggle('hf-r40-universal',r40Android);
  if(r40Android)installHighflyR40Feedback();""")

# Native renderer events only, NO speculative damage/impact or new state owner.
renderer='src/render/renderer.ts'
once(renderer,
"""      case 'highflyR39Defense': {
        if(ev.action==='parry')
          this.triggerAttack(ev.targetId,'highfly_r39_parry');
        break;
      }""",
"""      case 'highflyR39Defense': {
        if(ev.action==='parry'){
          this.triggerAttack(ev.targetId,'highfly_r39_parry');
          this.triggerHit(ev.sourceId);
          this.vfx.meleeSpark(ev.targetId,true);
        }else{
          this.vfx.meleeSpark(ev.targetId,false);
        }
        if(document.body.classList.contains('hf-r40-universal'))
          document.dispatchEvent(new CustomEvent('hf-r40-confirmed-combat',{
            detail:{kind:ev.action}
          }));
        break;
      }""")
once(renderer,
"""      case 'highflyR39GuardBreak': {
        this.triggerHit(ev.targetId);
        this.vfx.meleeSpark(ev.targetId,true);
        break;
      }""",
"""      case 'highflyR39GuardBreak': {
        this.triggerHit(ev.targetId);
        this.vfx.meleeSpark(ev.targetId,true);
        if(document.body.classList.contains('hf-r40-universal'))
          document.dispatchEvent(new CustomEvent('hf-r40-confirmed-combat',{
            detail:{kind:'guard-break'}
          }));
        break;
      }""")

# A genuine ATK-timed parry becomes a weapon RIPOSTE instead of the old
# misleading "Block" clip; native Sim and defense windows remain authoritative.
once('src/render/characters/visual.ts',
"""       if(abilityId==='highfly_r39_parry' && this.action('Block')){
         this.playOneShot('Block',1.1);
         this.currentOneShotIsAttack=false;
         return;
       }""",
"""       if(abilityId==='highfly_r39_parry'){
         const riposte='1H_Melee_Attack_Slice_Diagonal';
         if(this.action(riposte)){
           this.playOneShot(riposte,1.4);
           this.currentOneShotIsAttack=true;
           return;
         }
       }""")

# Reuse the SAME native R22 preview: bright full-width fireball direction lane,
# no bogus target circle, never extend beyond Sim's real projectile width.
visual='src/highfly/highfly_origin_r22_premium_visual.ts'
once(visual,"    const half=Math.max(.15,Math.min(.38,width*.35));",
            "    const half=Math.max(.15,Math.min(.50,width*.50));")
once(visual,"    this.strip(this.edge,leftA,leftB,.052);",
            "    this.strip(this.edge,leftA,leftB,.11);")
once(visual,"    this.strip(this.edge,rightA,rightB,.052);",
            "    this.strip(this.edge,rightA,rightB,.11);")

# LAB-ONLY in-memory projections; only native castAbilityAt admits casts.
# Actual originHunter learnedSkillIds, serialization and resource costs untouched.
runtime='src/highfly/highfly_android_p3_runtime.ts'
once(runtime,"import { ABILITIES } from '../sim/content/classes';",
"""import { ABILITIES } from '../sim/content/classes';
import { originCostDecision } from '../sim/highfly_origin_universal_resources';""")
once(runtime,"    editorPanel.prepend(samples);\n  }\n  syncPanel();",
"""  editorPanel.prepend(preset);
  if(document.body.classList.contains('hf-r40-universal') &&
     new URLSearchParams(location.search).get('hf_lab')==='1')
    installR40IsolatedCastLab(sim,editorPanel);
  syncPanel();""")
p=Path(runtime)
p.write_text(p.read_text(encoding='utf8')+r"""
/** DEV fixture: derived known-list projection, NEVER an unlock or profile edit.
 * No direct damage; every cast travels through the native Sim admission path.
 */
function installR40IsolatedCastLab(sim:Sim,parent:HTMLElement):void{
  if(document.getElementById('hf-r40-native-lab'))return;
  const names=['fireball','meteor','flamestrike','blizzard','rain_of_fire'] as const;
  const root=document.createElement('section');root.id='hf-r40-native-lab';
  root.style.cssText='display:flex;flex-wrap:wrap;gap:7px;padding:9px;border:1px solid #86b5dd;border-radius:8px;max-height:34vh;overflow-y:auto;';
  const header=document.createElement('strong');
  header.textContent='R40 · CAST NATIVO TEMPORAL (sin guardar habilidades)';
  header.style.cssText='flex:1 0 100%;font:700 13px system-ui;';
  root.append(header);
  const status=document.createElement('p');status.id='hf-r40-cast-status';
  status.style.cssText='flex:1 0 100%;font:12px system-ui;margin:0;';
  status.textContent='Solo sesión. Debés tener los recursos reales para lanzar.';
  for(const id of names){
    const def=ABILITIES[id];if(!def)throw Error('R40_NATIVE_SKILL_MISSING_'+id);
    const b=document.createElement('button');b.type='button';b.dataset.r40Cast=id;
    const permitted=originCostDecision(def);
    b.disabled=!permitted.ok;
    b.textContent=(id==='meteor'?'METEORITO / '+(def.name??id):(def.name??id))+
      ' · '+String(def.cost??0)+' MP'+(permitted.ok?'':' · PENDIENTE');
    b.title=!permitted.ok?'Recurso heredado pendiente de adaptar al Hunter universal':
      (def.requiresTarget?'Requiere seleccionar objetivo':'Usa el coste y daño nativos');
    b.style.cssText='min-height:44px;padding:6px;border-radius:7px;border:1px solid #9acfed;background:#143555;color:white;touch-action:manipulation;';
    b.addEventListener('click',()=>{
      // Sim.known is the original primary PlayerMeta.known (session projection).
      // These records are NOT copied into originHunter.learnedSkillIds.
      if(!sim.known.some(x=>x.def.id===id))
        sim.known.push({def,rank:1,cost:def.cost,castTime:def.castTime,
          cooldown:def.cooldown,effects:def.effects,threatFlat:0,threatMult:1});
      const range=Math.min(def.range??12,12);
      const p=sim.player;
      const at={x:p.pos.x+Math.sin(p.facing)*range,
                z:p.pos.z+Math.cos(p.facing)*range};
      document.dispatchEvent(new CustomEvent('hf-origin-aim-gallery',
        {detail:{shape:id}}));
      sim.castAbilityAt(id,at);
      status.textContent='Solicitud nativa: '+def.name+
        '. Confirmar castStart, VFX, impacto y gasto real en QA; sin concesión permanente.';
    });
    root.append(b);
  }
  root.append(status);
  parent.prepend(root);
}
""",encoding='utf8')

css=Path('src/styles/hud.mobile.css')
css.write_text(css.read_text(encoding='utf8')+r"""
/* R40 isolated only: single owner for touch HUD; no legacy overlay stacking. */
body.hf-r40-universal #actionbar,
body.hf-r40-universal #actionbar2,
body.hf-r40-universal #actionbar3,
body.hf-r40-universal #hf-c1-special-seats,
body.hf-r40-universal #hf-c22-ghost-skills,
body.hf-r40-universal #hf-origin-utility-row {
  display:none !important;pointer-events:none !important;
}
body.hf-r40-universal #hf-origin-simple-creator {
  max-height:min(75dvh,290px);overflow-y:auto;box-sizing:border-box;
  padding:8px !important;gap:6px !important;
}
body.hf-r40-universal #hf-origin-entry {gap:5px !important;}
body.hf-r40-universal #hf-origin-start-hunter {
  min-height:44px !important;
}
body.hf-r40-universal #hf-r40-confirmed {
  position:fixed;top:19%;left:50%;transform:translateX(-50%);
  z-index:11000;pointer-events:none;
  padding:9px 15px;background:#15283fe8;color:#f5e5a8;
  border:1px solid #d9bb6c;border-radius:16px;
  font:800 17px system-ui;letter-spacing:.04em;
  animation:hf-r40-cue .72s ease-out forwards;
}
@keyframes hf-r40-cue {from{opacity:1}to{opacity:0;translate:0 -16px}}
""",encoding='utf8')
assert "sim.known.push" in Path(runtime).read_text() and "learnedSkillIds.push" not in Path(runtime).read_text()
print('R40_ISOLATED_UNIFIED_ENTRY_NATIVE_EVENTS_CAST_LAB_APPLIED=1')
