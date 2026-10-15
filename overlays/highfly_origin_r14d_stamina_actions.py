#!/usr/bin/env python3
"""R1-4D cohesive native manual attack + highfly dodge/double jump stamina.
Apply AFTER R1-4C and all native movement overlays.
Retain directional movement, camera/joystick, weapon, real hit tables,
server ACK, skill mappings, 9 legacy classes and original HP.
"""
from pathlib import Path
import shutil

def once(path, before, after):
    p=Path(path)
    src=p.read_text(encoding='utf8')
    count=src.count(before)
    if count != 1:
        raise SystemExit(f'ORIGIN_R14D_SOURCE_DRIFT {path}: {count}: {before[:110]!r}')
    p.write_text(src.replace(before,after,1),encoding='utf8')

dest=Path('src/sim/highfly_origin_action_stamina.ts')
if dest.exists(): raise SystemExit('ORIGIN_R14D_ALREADY_INSTALLED')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_action_stamina.ts',dest)

motion=Path('src/sim/player_motion.ts')
src=motion.read_text(encoding='utf8')
if "import { originCanSpendStamina" in src: raise SystemExit('ORIGIN_R14D_MOTION_DUPLICATE')
motion.write_text("""import {
  originCanSpendStamina,
  ORIGIN_MOTION_STAMINA_COST,
  type OriginMotionAction,
} from './highfly_origin_action_stamina';
"""+src,encoding='utf8')

once('src/sim/player_motion.ts',
     """export interface PlayerMotionDeps {
  seed: number;""",
     """export interface PlayerMotionDeps {
  seed: number;
  /** AUTHORITATIVE server/offline action-billing, absent on client prediction.
   * Never touch a legacy class. Called ONLY on a gated jump/evade edge. */
  originSpendMotionStamina?(p: Entity, action: OriginMotionAction): boolean;""")

# Jump logic is owned by HIGHFLY double-jump movement overlay.
once('src/sim/player_motion.ts',
     """  if (startsGroundJump) {
    p.vy = JUMP_VELOCITY * jumpMult(p);""",
     """  if (
    startsGroundJump &&
    (!p.originResources ||
      (deps.originSpendMotionStamina
        ? deps.originSpendMotionStamina(p, 'groundJump')
        : originCanSpendStamina(p.originResources, ORIGIN_MOTION_STAMINA_COST.groundJump)))
  ) {
    p.vy = JUMP_VELOCITY * jumpMult(p);""")

once('src/sim/player_motion.ts',
     """    !p.auras.some((a) => a.id === 'rift_feather_glider')
  ) {
    // One mid-air refresh.""",
     """    !p.auras.some((a) => a.id === 'rift_feather_glider') &&
    (!p.originResources ||
      (deps.originSpendMotionStamina
        ? deps.originSpendMotionStamina(p, 'airJump')
        : originCanSpendStamina(p.originResources, ORIGIN_MOTION_STAMINA_COST.airJump)))
  ) {
    // One mid-air refresh.""")

# Evade starts at the actual legal move edge (not at an input callback,
# not each collision/tick, not during cooldown). Direction is unchanged.
once('src/sim/player_motion.ts',
     """    !p.climb &&
    !isRooted(p)
  ) {
    const hx = inp.highflyWorldX ?? 0;""",
     """    !p.climb &&
    !isRooted(p) &&
    (!p.originResources ||
      (deps.originSpendMotionStamina
        ? deps.originSpendMotionStamina(p, 'evade')
        : originCanSpendStamina(p.originResources, ORIGIN_MOTION_STAMINA_COST.evade)))
  ) {
    const hx = inp.highflyWorldX ?? 0;""")

# Sim is the one server/offline authority. The ClientWorld movement predictor
# reads resource balance only; it never debits stamina locally.
once('src/sim/sim.ts',
     "import { originRegen } from './highfly_origin_universal_resources';",
     """import { originRegen } from './highfly_origin_universal_resources';
import { originSpendMotionStamina } from './highfly_origin_action_stamina';""")
once('src/sim/sim.ts',
     """    this.playerMotionDeps = {
      seed: this.cfg.seed,""",
     """    this.playerMotionDeps = {
      seed: this.cfg.seed,
      originSpendMotionStamina: (p, action) =>
        originSpendMotionStamina(this.players.get(p.id)?.originHunter, action),""")

# Basic attacks are already server-authorized and ACK'd by OR-1 P2.
# Charge exactly once AFTER original target, range and LoS validation,
# BEFORE damage dispatch and before returning an accepted swing.
attack=Path('src/sim/combat/auto_attack.ts')
data=attack.read_text(encoding='utf8')
if "import { originSpendBasicStamina" in data: raise SystemExit('ORIGIN_R14D_ATTACK_DUPLICATE')
attack.write_text("import { originSpendBasicStamina } from '../highfly_origin_action_stamina';\n"+data,encoding='utf8')
once('src/sim/combat/auto_attack.ts',
     """    if (!ctx.hasLineOfSight(p, t)) return false;
    ctx.breakGhostWolf(p);
    const shot = rangedShotProfile(ranged, p.weapon);""",
     """    if (!ctx.hasLineOfSight(p, t)) return false;
    if (!originSpendBasicStamina(r.meta.originHunter, step)) return false;
    ctx.breakGhostWolf(p);
    const shot = rangedShotProfile(ranged, p.weapon);""")
once('src/sim/combat/auto_attack.ts',
     """  if (d > effectivePlayerAttackRange(t, MELEE_RANGE, meleeReachActor(ctx, p))) return false;
  if (isArenaPos(p.pos.x) && !ctx.hasLineOfSight(p, t)) return false;

  ctx.breakGhostWolf(p);""",
     """  if (d > effectivePlayerAttackRange(t, MELEE_RANGE, meleeReachActor(ctx, p))) return false;
  if (isArenaPos(p.pos.x) && !ctx.hasLineOfSight(p, t)) return false;
  // A miss is still an accepted ATTACK and costs stamina; an out-of-range
  // button press does not. This precedes all damage RNG and the server ACK.
  if (!originSpendBasicStamina(r.meta.originHunter, step)) return false;

  ctx.breakGhostWolf(p);""")

for path, checks in {
  'src/sim/player_motion.ts':[
    "originSpendMotionStamina(p, 'groundJump')",
    "originSpendMotionStamina(p, 'airJump')",
    "originSpendMotionStamina(p, 'evade')",
    "p.highflyEvadeDirX",
    "highflyFreshJumpPress",
  ],
  'src/sim/combat/auto_attack.ts':[
    "originSpendBasicStamina(r.meta.originHunter, step)",
    "meleeSwing(ctx, p, t, 0, 'HIGHFLY Basic'",
    "rangedSwing(",
  ],
  'src/sim/sim.ts':["originSpendMotionStamina(this.players.get(p.id)?.originHunter, action)"],
}.items():
    body=Path(path).read_text()
    for check in checks:
        if check not in body: raise SystemExit(f'ORIGIN_R14D_MISSING {path}:{check}')
print('HIGHFLY_ORIGIN_R14D_MANUAL_BASIC_AND_GOLDEN_EVADE_DOUBLE_JUMP_STAMINA_LINKED=1')
