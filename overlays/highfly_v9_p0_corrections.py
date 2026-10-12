#!/usr/bin/env python3
"""HIGHFLY V9 P0: surgical changes to assembled SUPREME after all frozen overlays.
Never edits training data, saves, locomotion vector, damage, or GitHub Pages.
Fail closed if donor/overlay source does not match the frozen release.
"""
from pathlib import Path
import re

def replace_once(path: str, old: str, new: str) -> None:
    f = Path(path)
    txt = f.read_text(encoding="utf-8")
    count = txt.count(old)
    if count != 1:
        raise SystemExit(f"HF_V9_P0_ANCHOR_MISMATCH:{path}:{old[:70]!r}:{count}")
    f.write_text(txt.replace(old, new, 1), encoding="utf-8")

def replace_regex(path: str, pattern: str, replacement: str, *, flags: int = 0) -> None:
    f = Path(path)
    txt = f.read_text(encoding="utf-8")
    out, n = re.subn(pattern, lambda _: replacement, txt, flags=flags)
    if n != 1:
        raise SystemExit(f"HF_V9_P0_REGEX_MISMATCH:{path}:{n}")
    f.write_text(out, encoding="utf-8")

# ROGUE: donor Duskveil and Smokefade are both half-speed (0.5). Keep the
# original stealth aura, durations, damage, and visibility semantics.
rogue = "src/sim/content/classes.ts"
replace_once(rogue,
    "effects: [{ type: 'selfBuff', kind: 'stealth', value: 0.5, duration: 3600 }],",
    "effects: [{ type: 'selfBuff', kind: 'stealth', value: 0.9, duration: 3600 }],")
replace_once(rogue,
    "effects: [{ type: 'selfBuff', kind: 'stealth', value: 0.5, duration: 10 }],",
    "effects: [{ type: 'selfBuff', kind: 'stealth', value: 0.9, duration: 10 }],")
replace_once(rogue,
    "enemies barely notice you, but you move 50% slower.",
    "enemies barely notice you, and you move at 90% speed.")
replace_once(rogue,
    "You move 50% slower while hidden.",
    "You move at 90% speed while hidden.")

# Existing mastery False Face increases stealth aura value by +100% (0.5->1).
# Rebase buffPct so the new 0.9->1.0, not 0.9->1.8.
mastery = "src/sim/content/talents_classic.ts"
for aid in ("stealth", "vanish"):
    replace_once(mastery,
        "{ ability: '"+aid+"', buffPct: 1 }",
        "{ ability: '"+aid+"', buffPct: 1 / 9 }")
replace_once(mastery,
    "// so 1.0 lifts it to 1.0: the mastery removes the stealth slow outright",
    "// so +1/9 lifts 0.9 to 1.0: the mastery removes the remaining slow")
replace_once(mastery,
    "// rather than easing it to 75%.",
    "// without creating the old 180% over-speed regression.")
ability_text = "src/ui/i18n.catalog/abilities.ts"
replace_once(ability_text,
    "enemies barely notice you, but you move 50% slower.",
    "enemies barely notice you, and you move at 90% speed.")
replace_once(ability_text,
    "You move 50% slower while hidden.",
    "You move at 90% speed while hidden.")

# One PURE authority shared by both native Android/pad and the HUD ATK path.
# Frontal target wins when similarly near; genuinely near 360 target beats a
# distant frontal target. The current soft target is retained within a small
# bounded score margin; explicit manual LOCK is handled before entering this.
target_file = "src/game/auto_target.ts"
start = "export function bestSoftAutoTarget("
end = "\n/**\n * The nearest attackable entity"
target_text = Path(target_file).read_text(encoding="utf-8")
at = target_text.find(start)
if at < 0: raise SystemExit("HF_V9_SOFT_TARGET_MISSING")
tail = target_text.find(end, at)
if tail < 0:
    tail = target_text.find("export function nearestAutoTarget(", at)
    if tail < 0: raise SystemExit("HF_V9_NEAREST_TARGET_MISSING")
# Keep helper highflyFinisherBias; replace only the existing bestSoft body.
replace_regex(target_file,
    r"export function bestSoftAutoTarget\([\s\S]*?\n}\n(?=\n(?:/\*\*|\s*export function nearestAutoTarget))",
    """export function bestSoftAutoTarget(
  entities: Iterable<AutoTargetEntity>,
  origin: { x: number; z: number },
  facing: number,
  isAttackable: (e: AutoTargetEntity) => boolean,
  range = AUTO_TARGET_RANGE,
  currentId: number | null = null,
): number | null {
  let best: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let currentScore = Number.POSITIVE_INFINITY;
  const fx = Math.sin(facing);
  const fz = Math.cos(facing);
  // Moderate frontal preference, never a hard cone; target behind is legal.
  // A target 2 yd behind beats a frontal target 5 yd away.
  const facingBonus = 1.45;
  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const dx = e.pos.x - origin.x;
    const dz = e.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (!Number.isFinite(distance) || distance <= 0.0001 || distance > range) continue;
    const dot = (dx * fx + dz * fz) / distance;
    const frontal = Math.max(0, Math.min(1, (dot + 0.25) / 1.25));
    const score = distance - facingBonus * frontal - highflyFinisherBias(e);
    if (e.id === currentId) currentScore = score;
    if (score < bestScore - 0.00001 || (Math.abs(score - bestScore) <= 0.00001 && (best === null || e.id < best))) {
      best = e.id;
      bestScore = score;
    }
  }
  // 0.6 yd equivalent hysteresis prevents frantic target changes per press.
  return currentId !== null && currentScore <= bestScore + 0.6 ? currentId : best;
}
""")
# Pad action, including ability cast and basic attack, uses same scoring,
# legal attackability predicate, and current soft-target hysteresis.
picker="src/game/pad_target_pick.ts"
replace_once(picker,
    "const picked = bestSoftAutoTarget(\n        world.entities.values(),\n        world.player.pos,\n        softTargetFacing?.() ?? world.player.facing,\n        (e) => attackable(e as Entity),\n      );",
    """const picked = bestSoftAutoTarget(
        world.entities.values(),
        world.player.pos,
        softTargetFacing?.() ?? world.player.facing,
        (e) => attackable(e as Entity),
        action.id === CROSS_HOTBAR_ATTACK_ID ? 12 : (typeof ability?.range === 'number' && ability.range > 0 ? Math.min(40, Math.max(12, ability.range)) : 12),
        currentHostile ? current : null,
      );""")
# Preserve healing / un-targeted AoE logic; orient avatar, never camera.
replace_once(picker,
    "if (picked !== null) world.targetEntity(picked);",
    """if (picked !== null) {
        if (picked !== current) world.targetEntity(picked);
        const foe = world.entities.get(picked);
        if (foe) {
          world.player.facing = Math.atan2(foe.pos.x - world.player.pos.x, foe.pos.z - world.player.pos.z);
        }
      }""")
replace_once(target_file,
    "  requiresTarget?: boolean;",
    "  requiresTarget?: boolean;\n  range?: number;")

# HUD basic attack uses the SAME pure picker and no competing C2.3 stale
# cone gate. Explicit LOCK branch above remains unchanged.
main="src/main.ts"
replace_regex(main,
    r"    // C2\.3 competitive hysteresis\.[\s\S]*?    highflyManualTargetId = null;",
    "    // V9: current soft-target hysteresis is now inside bestSoftAutoTarget.\n    highflyManualTargetId = null;")
replace_once(main,
    """      (e) =>
        isAttackableEntity(
          world.entities.get(e.id),
          world.playerId,
          activePvpOpponents,
        ),
    );

    // V9:""",
    """      (e) =>
        isAttackableEntity(
          world.entities.get(e.id),
          world.playerId,
          activePvpOpponents,
        ),
      40,
      p.targetId,
    );

    // V9:""")
replace_once(main,
    "if (p.targetId !== best) world.targetEntity(best);",
    """if (p.targetId !== best) world.targetEntity(best);
    const foe = world.entities.get(best);
    if (foe) p.facing = Math.atan2(foe.pos.x - p.pos.x, foe.pos.z - p.pos.z);""")

# TRAINING P0: the original mount is ".window.panel" containing ".panel-title",
# not ".window-titlebar". Existing fullscreen styles only targeted the wrong
# header class; the flex row left the giant bar in the left column.
# Fix geometry at the effective last stylesheet location, no Training Core logic.
css="src/styles/shell.css"
with Path(css).open("a",encoding="utf-8") as f:
    f.write("""
/* HIGHFLY V9 P0: ONE full-width header above the actual Training Core. */
#highfly-training-window[hidden] { display: none !important; }
#highfly-training-window:not([hidden]) {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) !important;
  grid-template-rows: 44px minmax(0, 1fr) !important;
  align-content: stretch !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}
#highfly-training-window > .panel-title,
#highfly-training-window > .window-titlebar {
  display: flex !important;
  grid-column: 1 !important;
  grid-row: 1 !important;
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
  min-height: 44px !important;
  height: 44px !important;
  flex: 0 0 44px !important;
  flex-direction: row !important;
  justify-content: space-between !important;
  align-items: center !important;
  position: relative !important;
  inset: auto !important;
  margin: 0 !important;
  padding: 0 12px !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(86,224,255,.28) !important;
  box-sizing: border-box !important;
  text-align: left !important;
  white-space: nowrap !important;
  background: linear-gradient(90deg,#0a1c2c,#0c1526) !important;
}
#highfly-training-window #highfly-training-title {
  display: block !important;
  flex: 1 1 auto !important;
  min-width: 0 !important;
  max-width: none !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
  line-height: 1.3 !important;
  font-size: clamp(13px,2vw,17px) !important;
  color: #eaf8ff !important;
}
#highfly-training-window #highfly-training-close {
  display: grid !important;
  place-items: center !important;
  position: relative !important;
  inset: auto !important;
  margin-left: auto !important;
  flex: 0 0 38px !important;
  width: 38px !important;
  height: 38px !important;
  min-width: 38px !important;
  min-height: 38px !important;
}
#highfly-training-window > .highfly-training-shell {
  grid-column: 1 !important;
  grid-row: 2 !important;
  display: grid !important;
  width: 100% !important;
  height: 100% !important;
  max-height: none !important;
  min-width: 0 !important;
  min-height: 0 !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  align-content: start !important;
  box-sizing: border-box !important;
  padding: 10px 14px max(28px,env(safe-area-inset-bottom)) !important;
}
body.mobile-touch #highfly-training-window:not([hidden]) {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  border-radius: 0 !important;
}
@media (orientation: landscape) and (max-height: 520px) {
  #highfly-training-window:not([hidden]) { grid-template-rows: 40px minmax(0,1fr) !important; }
  #highfly-training-window > .panel-title { min-height: 40px !important; height: 40px !important; }
  #highfly-training-window .hf-rm-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
  #highfly-training-window .hf-rm-inputs { grid-template-columns: minmax(0,1fr) minmax(0,.75fr) minmax(0,1.2fr) !important; }
  #highfly-training-window .hf-exercise-system { grid-template-columns: repeat(3,minmax(0,1fr)) !important; }
  #highfly-training-window .hf-rest-actions { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
}
""")

# Structural/fail-closed checks.
source=Path(target_file).read_text()
assert "currentId: number | null = null" in source
assert "if (forwardDot < coneDot) continue;" not in source
assert "p.facing = Math.atan2" in Path(main).read_text()
assert "value: 0.9, duration: 3600" in Path(rogue).read_text()
print("HF_V9_P0_TARGET_360_ROGUE90_TRAINING_HEADER_APPLIED=1")
