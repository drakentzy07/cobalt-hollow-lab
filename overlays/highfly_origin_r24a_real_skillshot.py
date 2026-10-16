#!/usr/bin/env python3
"""R24A opt-in native ballistic skillshot for Origin Hunter ONLY.
Donor ClaudeCraft targeted/homing spells remain byte-identical for all other
casts and classes. No auto-targeting; miss pays normal skill cost/cooldown.
"""
from pathlib import Path
import shutil
def edit(path,needle,replacement,expected=1):
 p=Path(path);s=p.read_text(encoding='utf8');count=s.count(needle)
 if count!=expected:raise SystemExit(f'R24A_SOURCE_DRIFT:{path}:{count}:{needle[:90]}')
 p.write_text(s.replace(needle,replacement,1),encoding='utf8')
def replace_after(path,anchor,needle,replacement):
 p=Path(path);s=p.read_text(encoding='utf8')
 if s.count(anchor)!=1:raise SystemExit(f'R24A_ANCHOR_DRIFT:{path}:{anchor[:70]}')
 index=s.index(anchor);pre=s[:index];tail=s[index:];n=tail.count(needle)
 if n!=1:raise SystemExit(f'R24A_SPAN_DRIFT:{path}:{n}:{needle[:60]}')
 p.write_text(pre+tail.replace(needle,replacement,1),encoding='utf8')

shutil.copy2('../v9-corrections/game/c1/highfly_origin_r24a_skillshot_physics.ts',
 'src/sim/highfly_origin_r24a_skillshot_physics.ts')
shutil.copy2('../v9-corrections/game/c1/highfly_origin_r24a_native_skillshot.ts',
 'src/sim/highfly_origin_r24a_native_skillshot.ts')
casting='src/sim/combat/casting_lifecycle.ts'
edit(casting,
 "import { scheduleProjectile } from '../projectile_travel';",
 "import { scheduleProjectile } from '../projectile_travel';\nimport { originCanFreeFire,originRememberFreeAim,originHasFreeAim,originTakeFreeAim,originScheduleFreeShot } from '../highfly_origin_r24a_native_skillshot';")
edit(casting,
 "  if (cancelRecedingShell(ctx, p, meta, ability.id)) return;",
 "  const originFreeAim = originCanFreeFire(p,ability.id,aim);\n  if (cancelRecedingShell(ctx, p, meta, ability.id)) return;")
edit(casting,
 "  } else if (ability.requiresTarget) {\n    if (p.targetId !== null) {",
 "  } else if (ability.requiresTarget && !originFreeAim) {\n    if (p.targetId !== null) {")
edit(casting,
 "  if (ability.targetMode === 'position') {",
 "  if (ability.targetMode === 'position' || originFreeAim) {")
edit(casting,
 "  p.castAim = aimPoint;\n\n  // Heroic-strike style:",
 "  p.castAim = aimPoint;\n  if(originFreeAim && aimPoint)originRememberFreeAim(p,ability.id,aimPoint);\n\n  // Heroic-strike style:")
edit(casting,
 "    activeCast?.def.requiresTarget &&\n    !activeCast.def.targetsDead &&",
 "    activeCast?.def.requiresTarget &&\n    !originHasFreeAim(p,activeCast.def.id) &&\n    !activeCast.def.targetsDead &&")
replace_after(casting,
 "function applyAbility(\n",
 "  } else if (ability.requiresTarget) {\n    target = castTarget !== null ? (ctx.entities.get(castTarget) ?? null) : null;",
 "  } else if (ability.requiresTarget && !originHasFreeAim(p,ability.id)) {\n    target = castTarget !== null ? (ctx.entities.get(castTarget) ?? null) : null;")
# Dedicated ballistic delivery after native admission but before the generic
# projectile target and homing path. This keeps the original cost, cooldown,
# resist, damage and DoT mechanics authoritative.
replace_after(casting,
 "function applyAbility(\n",
 "  // helpful spells never miss\n",
 """  const freeHeading=originHasFreeAim(p,ability.id)?originTakeFreeAim(p,ability.id):null;
  if (freeHeading) {
    spendAbilityCost(ctx,p,meta,res,null);
    armAbilityCooldownWithReflection(ctx,p,meta,res,togglingOff);
    const reach=ability.range>0?ability.range:30;
    originScheduleFreeShot(ctx,p,ability.id,freeHeading,reach,
      (src,tgt,hit)=>{
        // Enemy is tested at collision-time against the shot's fixed swept ray.
        // No home/lock-on, no direct damage at release.
        if(!resolveHostileSpellResist(ctx,src,tgt,ability)){
          ctx.runEffects(src,meta,tgt,res,false);
          ctx.emit({type:'spellfxAt',x:hit.x,z:hit.z,school:ability.school,
            fx:'burst',ability:ability.id,radius:.8,sourceId:src.id});
        }
      },
      (_end)=>{ /* Miss: paid cast, cooldown, NO impact and NO damage. */ }
    );
    if(p.kind==='player' && ability.school!=='physical')ctx.applySetProcs(p,null,'spellCast');
    if(p.kind==='player')onCastCompleted(ctx,p,ability.id,null);
    return;
  }

  // helpful spells never miss
""")
project='src/sim/projectile_travel.ts'
edit(project,
 "import { DT, type Entity } from './types';",
 "import { DT, type Entity } from './types';\nimport { originAdvanceFreeShots } from './highfly_origin_r24a_native_skillshot';")
edit(project,
 "  if (ctx.pendingProjectiles.length === 0) return;",
 "  if (ctx.pendingProjectiles.length === 0) {originAdvanceFreeShots(ctx);return;}")
edit(project,
 "  ctx.pendingProjectiles = [...stillFlying, ...ctx.pendingProjectiles];",
 "  ctx.pendingProjectiles = [...stillFlying, ...ctx.pendingProjectiles];\n  originAdvanceFreeShots(ctx);")
# HIGHFLY R21 manual aim currently refuses skill release without a target.
# Free skillshots instead use the existing native Sim.castAbilityAt seam.
hud='src/highfly/highfly_origin_r17_hud.ts'
edit(hud,
 "import { highflyManualAim,highflyManualRayTarget,highflyEffectiveAimRange } from './highfly_origin_r21_aim_intent';",
 "import { highflyManualAim,highflyManualRayTarget,highflyEffectiveAimRange } from './highfly_origin_r21_aim_intent';\nimport { ORIGIN_FREE_SKILLS } from '../sim/highfly_origin_r24a_skillshot_physics';")
edit(hud,
 "        }else if(def.requiresTarget){\n          const corridor=Math.max(1.4,",
 "        }else if(def.requiresTarget){\n          if(ORIGIN_FREE_SKILLS.has(def.id)){h.face(aimed.point);h.castAt(def.id,aimed.point);}\n          else {\n          const corridor=Math.max(1.4,")
edit(hud,
 "          // Direction with no valid enemy: do not fake a direct-damage projectile.",
 "          } // R24A real free projectile: only other targeted abilities require victim.\n          // Direction with no valid enemy: do not fake a direct-damage projectile.")
edit(hud,
 "        }else if(def.requiresTarget){\n          if(unit){h.face(unit.pos);h.target(unit.id);h.castSlot(p.slot);}",
 "        }else if(def.requiresTarget){\n          if(ORIGIN_FREE_SKILLS.has(def.id)){\n            const a=h.player(),point=unit?.pos??{x:a.pos.x+Math.sin(a.facing)*range,z:a.pos.z+Math.cos(a.facing)*range};\n            h.face(point);h.castAt(def.id,point);\n          }else if(unit){h.face(unit.pos);h.target(unit.id);h.castSlot(p.slot);}")
# Preserve manual preview green when no monster: it is NOT a failed command.
edit(hud,
 "    if(def.requiresTarget){\n      const corridor=Math.max(1.4,",
 "    if(def.requiresTarget && !ORIGIN_FREE_SKILLS.has(def.id)){\n      const corridor=Math.max(1.4,")
print('HIGHFLY_R24A_NATIVE_FIXED_DIRECTION_SHOTS_AND_REAL_MISS_READY=1')
