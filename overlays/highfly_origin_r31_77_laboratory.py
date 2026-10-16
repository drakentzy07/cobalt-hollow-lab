#!/usr/bin/env python3
"""R31 first executable layer AFTER R30, disposable worktree ONLY.
Server-backed nine passive effects, transparent 68-vs-9 Premium lab previews,
complete 77-identity QA hooks. Keeps 9 unported semantic behaviors blocked.
Never alters public Pages, main, player stats or persistent unlocks.
"""
from pathlib import Path
import shutil

def once(path,old,new):
 p=Path(path);s=p.read_text('utf-8')
 n=s.count(old)
 if n!=1 and old.lstrip(' ')!=old:
  # Prior R29/R30 patches preserve semantics but sometimes change indentation.
  # Allow only ONE exact code anchor with different leading spaces, not fuzzy edits.
  candidate=old.lstrip(' ')
  if s.count(candidate)==1:
   old=candidate
   new=new.lstrip(' ')
   n=1
   print('R31_INDENT_ONLY_COMPAT:'+str(path)+':'+repr(old[:65]))
 if n!=1:raise SystemExit('R31_SOURCE_DRIFT:'+str(path)+':'+str(n)+':'+repr(old[:120]))
 p.write_text(s.replace(old,new,1),encoding='utf-8')

shutil.copy2('../v9-corrections/game/c1/highfly_origin_r31_passive_runtime.ts',
             'src/sim/highfly_origin_r31_passive_runtime.ts')

# Nine passive effects reside in the AUTHORITATIVE Sim. Never client-calculated.
damage='src/sim/combat/damage.ts'
once(damage,
 "import type {",
 "import { r31OutgoingDamageMultiplier, r31IncomingDamageMultiplier } from '../highfly_origin_r31_passive_runtime';\nimport type {") if False else None
p=Path(damage);raw=p.read_text('utf8')
raw="import { r31OutgoingDamageMultiplier, r31IncomingDamageMultiplier } from '../highfly_origin_r31_passive_runtime';\n"+raw
p.write_text(raw,'utf8')
once(damage,
 "  // Defensive Stance, classic: deal 10% less, take 10% less (and +30% threat below)",
 """  // R31 lab-only passives: applied once at the canonical damage choke point.
  // Actual originHunter on the SERVER is mandatory; redirected/copy damage does
  // not earn another buff. No legacy character sees this under default flags.
  if (import.meta.env.VITE_HIGHFLY_ORIGIN_R31 === '1' &&
      !resolvedHpLoss && source && source.id !== target.id && amount > 0) {
    if (!alreadyFinal && source.kind === 'player' &&
        ctx.players.get(source.id)?.originHunter) {
      amount = Math.round(amount*r31OutgoingDamageMultiplier(school,abilityId));
    }
    if (target.kind === 'player' && ctx.players.get(target.id)?.originHunter) {
      amount = Math.round(amount*r31IncomingDamageMultiplier());
    }
  }

  // Defensive Stance, classic: deal 10% less, take 10% less (and +30% threat below)""")

sim='src/sim/sim.ts'
p=Path(sim);p.write_text(
 "import { r31MovementSpeedBonus, r31ManaRegenMultiplier } from './highfly_origin_r31_passive_runtime';\n"+
 p.read_text('utf8'),'utf8')
once(sim,
 "    let extra = meta?.fiestaSpecial.moveSpeedPct ?? 0;",
 """    let extra = meta?.fiestaSpecial.moveSpeedPct ?? 0;
    if (import.meta.env.VITE_HIGHFLY_ORIGIN_R31 === '1' && meta?.originHunter)
      extra += r31MovementSpeedBonus();""")
once(sim,
 "if (meta.originHunter) originRegen(meta.originHunter, DT);",
 """if (meta.originHunter)
          originRegen(meta.originHunter, DT,
            import.meta.env.VITE_HIGHFLY_ORIGIN_R31 === '1'
              ? r31ManaRegenMultiplier() : 1);""")
resources='src/sim/highfly_origin_universal_resources.ts'
once(resources,
 "export function originRegen(profile: OriginHunterProfileV1, dtSeconds: number): void {",
 "export function originRegen(profile: OriginHunterProfileV1, dtSeconds: number, manaMultiplier=1): void {")
once(resources,
 "  r.mana = Math.min(r.maxMana, r.mana + ORIGIN_MANA_REGEN_PER_SECOND * dtSeconds);",
 """  r.mana = Math.min(r.maxMana, r.mana +
    ORIGIN_MANA_REGEN_PER_SECOND * dtSeconds *
    (Number.isFinite(manaMultiplier) ? Math.max(0,manaMultiplier) : 1));""")

# R31 QA: preview the visual-only original MIT particle scenes safely, without
# spending MP/CD, sending a cast to Sim or pretending a summon/portal/barrier exists.
ui='src/highfly/highfly_origin_r28_universal_tester.ts'
once(ui,
 "import {R30_PASSIVE_DESIGNS,R30_ORIGINAL_45} from '../sim/highfly_origin_r30_curated77';",
 """import {R30_PASSIVE_DESIGNS,R30_ORIGINAL_45} from '../sim/highfly_origin_r30_curated77';
import { r31PassiveLabAudit } from '../sim/highfly_origin_r31_passive_runtime';""")
once(ui,
 "status:'passive' as const,note:'DISEÑO R30 · aún NO activada en combate'",
 """status:'passive' as const,
    note:import.meta.env.VITE_HIGHFLY_ORIGIN_R31==='1'
      ?'R31 · PASIVA ACTIVA EN LAB (servidor; desbloqueo permanente futuro)'
      :'DISEÑO R30 · aún NO activada en combate'""")
once(ui,
 "    const works=r28Selectable(item.id);",
 """    const works=r28Selectable(item.id);
    const previewOnly=import.meta.env.VITE_HIGHFLY_ORIGIN_R31==='1' &&
      item.kind==='premium' &&
      R29_PREMIUM_CONTRACTS.some(c=>c.id===item.id&&
        c.readiness==='visual-only-behavior-pending');""")
once(ui,
 "status.textContent=works?'TOCAR PARA PROBAR EN ATK · daño/CD/MP nativos':item.note;",
 """status.textContent=works?'TOCAR PARA PROBAR EN ATK · daño/CD/MP nativos':
      previewOnly?'👁 VER VFX MIT · SIN LANZAMIENTO / SIN DAÑO':item.note;""")
once(ui,
 "    else row.disabled=true;",
 """    else if(previewOnly){
      row.onclick=()=>{
        const contract=R29_PREMIUM_CONTRACTS.find(c=>c.id===item.id);
        if(!contract||!r29Fx){
          state.textContent='VFX NO DISPONIBLE EN ESTE DISPOSITIVO';
          return;
        }
        const from=h.sim.player.pos;
        const to={x:from.x+Math.sin(h.sim.player.facing)*8,
                  z:from.z+Math.cos(h.sim.player.facing)*8};
        const out=r29Fx.start(contract.sourceId,contract.source,from,to);
        state.textContent=out.ok
          ?'VISTA VFX · '+contract.name+' · mecánica '+contract.role+' PENDIENTE'
          :'ERROR VFX · '+out.reason;
        show(false);
      };
    }else row.disabled=true;""")
once(ui,
 "  info.textContent='GRIMORIO · '+rows.length+' '+(category==='premium'?'PREMIUM':category==='passives'?'PASIVAS EN DISEÑO':'HABILIDADES');",
 """  info.textContent='GRIMORIO · '+rows.length+' '+
      (category==='premium'?'PREMIUM (14 LANZABLES + 9 VFX)':
       category==='passives'?(import.meta.env.VITE_HIGHFLY_ORIGIN_R31==='1'?
         'PASIVAS ACTIVAS EN LAB':'PASIVAS EN DISEÑO'):'HABILIDADES');""")
# Browser QA reads live snapshots, no debug/stat grant UI.
once(ui,
 "  if(r29Fx)raf=requestAnimationFrame(frame);",
 """  if(r29Fx)raf=requestAnimationFrame(frame);
  if(import.meta.env.VITE_HIGHFLY_ORIGIN_R31==='1'){
    (window as any).__HIGHFLY_R31_77_QA__={
      identityCount:77,
      original:R30_ORIGINAL_45.length,
      premiumReady:R29_PREMIUM_CONTRACTS.filter(c=>c.readiness!=='visual-only-behavior-pending').length,
      premiumVisualOnly:R29_PREMIUM_CONTRACTS.filter(c=>c.readiness==='visual-only-behavior-pending').length,
      passives:r31PassiveLabAudit(),autoEnabledPassivesInDisposableLab:true
    };
  }
  """)
once(ui,
 "  if(import.meta.env.VITE_HIGHFLY_ORIGIN_R29==='1')delete (window as any).__HIGHFLY_R29_VFX_QA__;",
 """  if(import.meta.env.VITE_HIGHFLY_ORIGIN_R31==='1')delete (window as any).__HIGHFLY_R31_77_QA__;
  if(import.meta.env.VITE_HIGHFLY_ORIGIN_R29==='1')delete (window as any).__HIGHFLY_R29_VFX_QA__;""")
print('HF_R31_SERVER_9_PASSIVES_AND_77_TRANSPARENT_MOBILE_GRIMOIRE_WIRED=1')
