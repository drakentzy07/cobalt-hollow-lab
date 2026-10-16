#!/usr/bin/env python3
"""HIGHFLY ORIGIN R23: HONOR S23 mobile two-thumb control and separated HUD.
Runs AFTER R22 visual patch in the same disposable donor integration.
No Sim, movement GOLDEN, skills, equipment, resources, or save schema changes.
"""
from pathlib import Path
def once(path,before,after):
    p=Path(path);s=p.read_text(encoding='utf8')
    n=s.count(before)
    if n!=1:raise SystemExit(f'HIGHFLY_R23_SOURCE_DRIFT:{path}:count={n}:anchor={before[:90]}')
    p.write_text(s.replace(before,after,1),encoding='utf8')
trial='src/highfly/highfly_origin_trial_runtime.ts'
once(trial,
     "  document.body.appendChild(utility);",
     """  // R23: there is no support PANEL during gameplay. B1-B4 sit against the
  // TOP-centre edge and B5-B8 sit on the BOTTOM-centre edge as independent
  // square GEM-sized buttons, with clear gaps between them. Their parent
  // cannot intercept any touch outside the actual squares (GOLDEN safe).
  utility.style.cssText='position:fixed;inset:0;z-index:8400;pointer-events:none;display:block;';
  const topBank=document.createElement('div');
  topBank.id='hf-origin-buffs-top';
  const bottomBank=document.createElement('div');
  bottomBank.id='hf-origin-buffs-bottom';
  const bankBase='position:fixed;left:50%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:clamp(6px,.75vw,11px);max-width:39vw;pointer-events:none;';
  topBank.style.cssText=bankBase+'top:calc(7px + env(safe-area-inset-top));';
  bottomBank.style.cssText=bankBase+'bottom:calc(8px + env(safe-area-inset-bottom));';
  utilityBtns.forEach((b,i)=>{
    const bank=i<4?topBank:bottomBank;
    bank.appendChild(b);
    b.dataset.originBuff=String(i+1);
    b.style.cssText='position:relative;flex:0 0 auto;width:clamp(39px,4.2vw,50px);height:clamp(39px,4.2vw,50px);min-width:0;min-height:0;max-height:none;box-sizing:border-box;padding:4px;border:1px solid #c3a26a94;border-radius:9px;background:linear-gradient(148deg,#111c27ed,#223242ed);box-shadow:inset 0 0 0 1px #d6c08c27,0 2px 7px #0009;color:#f3e3c0;cursor:pointer;pointer-events:auto;touch-action:manipulation;font:700 17px system-ui;line-height:1;';
  });
  utility.replaceChildren(topBank,bottomBank);
  document.body.appendChild(utility);""")
once(trial,
     "      b.textContent=id?'✦ B'+(i+1):'B'+(i+1);",
     """      b.replaceChildren();
      const mark=document.createElement('span');
      mark.style.cssText='display:block;font-size:17px;text-align:center;line-height:27px;';
      const effect=id?ABILITIES[id]:null;
      const types=effect?.effects?.map(e=>e.type)??[];
      mark.textContent=!id?'◇':types.some(t=>/heal|restore/i.test(t))?'✚'
        :types.some(t=>/absorb|shield/i.test(t))?'⬡'
        :types.some(t=>/buff|aura/i.test(t))?'✦':'◆';
      const tag=document.createElement('span');
      tag.textContent='B'+(i+1);
      tag.style.cssText='position:absolute;bottom:1px;right:3px;font:700 8px system-ui;color:#d6bc8e;line-height:1;';
      b.append(mark,tag);
      b.style.filter=id?'none':'saturate(.35)';
      b.style.boxShadow=id?'inset 0 0 0 1px #e0c07830,0 0 8px #d7b76629':'none';""")
once(trial,
     "      b.style.opacity=id?'1':'.65';",
     "      b.style.opacity=id?'1':'.37';")
aim='src/highfly/highfly_origin_r17_hud.ts'
# Aiming while locomotion continues is a two-POINTER ownership contract.
# Never cancel or prevent events from the other pointer. Native MobileControls
# owns its joystick pointer and touch movement update loop independently.
once(aim,
     "    if(ev.pointerType!=='touch'||pending)return;",
     "    if(ev.pointerType!=='touch'||pending)return; // Claim ONLY skill pointer; a simultaneous joystick pointer stays native.")
once(aim,
     "    if(!pending||pending.id!==ev.pointerId)return;",
     "    if(!pending||pending.id!==ev.pointerId)return; // Never suppress the left joystick move pointer.")
# Prevent silent no-op while running past an enemy with a narrower-than-model
# cursor corridor. This tolerates small lateral motion, not retargeting the
# actual preview: the manually steered arrow NEVER snaps to the creature.
once(aim,
     "      const match=highflyManualRayTarget(h.player().pos,h.targets(),\n        aimed.dir,highflyEffectiveAimRange(def),1.2,def.minRange??0);",
     "      const corridor=Math.max(1.4,Math.min(2.1,(highflyAimSpec(def.id)?.width??1)*1.3));\n      const match=highflyManualRayTarget(h.player().pos,h.targets(),\n        aimed.dir,highflyEffectiveAimRange(def),corridor,def.minRange??0);")
once(aim,
     "          const id=highflyManualRayTarget(h.player().pos,h.targets(),aimed.dir,\n            highflyEffectiveAimRange(def),1.2,def.minRange??0);",
     """          const corridor=Math.max(1.4,Math.min(2.1,(highflyAimSpec(def.id)?.width??1)*1.3));
          const id=highflyManualRayTarget(h.player().pos,h.targets(),aimed.dir,
            highflyEffectiveAimRange(def),corridor,def.minRange??0);""")
# Feedback, but no invented cast, cooldown or mana spending on invalid targets.
once(aim,
     """          // Direction with no valid enemy: do not fake a direct-damage projectile.""",
     """          else {
            indicator.textContent='Sin enemigo en la dirección / alcance';
            indicator.style.cssText+='display:block;left:50%;top:22%;transform:translateX(-50%);';
            window.setTimeout(()=>{if(!pending)indicator.style.display='none';},650);
          }
          // Direction with no valid enemy: do not fake a direct-damage projectile.""")
# Keep own-pointer cancellation from clearing other input state. Already only
# matches pending.id, but document this as explicit regression contract.
print('HIGHFLY_ORIGIN_R23_TWO_THUMBS_TOP_BOTTOM_GEM_SIZED_BUFFS_PATCH_READY=1')
