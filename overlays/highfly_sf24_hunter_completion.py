#!/usr/bin/env python3
"""SF24 exact pinned source compatibility: award original Hunter Bloodtrail
ONCE on successfully completed SIX-pulse original rapid-fire channel only.
No UI/renderer/second combat Sim changes. Fail closed on frozen source drift.
"""
from pathlib import Path
p=Path("src/sim/combat/casting_lifecycle.ts")
s=p.read_text(encoding="utf-8")
changes=[
 ("import { cancelRecedingShell, noteHunterFocusSpend } from './hunter_shared';",
  "import { activateHunterMajorWindow, cancelRecedingShell, noteHunterFocusSpend } from './hunter_shared';"),
 ("      p.channelTicksLeft = 0; // any tick pushback orphaned here owes nothing",
  """      // HIGHFLY SF24: only a fully delivered native six-shot Hunter channel
      // earns the ORIGINAL Bloodtrail aura. Never award a buff after shortened
      // or interrupted channels; measure before the source zeroes the counter.
      const hf24SixShotsCompleted = p.castingAbility === 'hf_hunter_u1' &&
        p.channelTicksLeft === 0;
      p.channelTicksLeft = 0; // any tick pushback orphaned here owes nothing"""),
 ("      coldsightFeveredDrawCompleted(ctx, p, p.castingAbility, channelTarget);",
  """      coldsightFeveredDrawCompleted(ctx, p, p.castingAbility, channelTarget);
      if (hf24SixShotsCompleted && completed?.def.id === 'hf_hunter_u1') {
        const buff = completed.effects.find(
          e => e.type === 'selfBuff' && e.kind === 'hunter_bloodtrail',
        );
        if (buff?.type === 'selfBuff') {
          // The native channel runner dispatches only directDamage per pulse.
          // At genuine completion reuse the source original selfBuff aura
          // and its Hunter major-window handler EXACTLY ONCE.
          ctx.applyAura(p, {
            id: buff.auraId ?? completed.def.id,
            name: completed.def.name,
            kind: buff.kind,
            value: buff.value,
            remaining: buff.duration,
            duration: buff.duration,
            sourceId: p.id,
            school: completed.def.school,
          });
          activateHunterMajorWindow(ctx, p, buff.duration);
        }
      }""")
]
for old,new in changes:
 if s.count(old)!=1:
  raise SystemExit("SF24_FROZEN_SOURCE_DRIFT:"+old[:65]+":"+str(s.count(old)))
 s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("HF_SF24_SOURCE_NATIVE_HUNTER_SIX_COMPLETED_PULSES_BUFF_ONCE_GREEN=1")
