from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

def insert_before_once(path: Path, needle: str, addition: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(needle)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one insertion point, found {count}")
    path.write_text(text.replace(needle, addition + needle), encoding="utf-8")

auto_target = Path("src/game/auto_target.ts")
insert_before_once(
    auto_target,
    "/**\n * The nearest attackable entity, or null when nothing qualifies.",
    r"""
/**
 * HIGHFLY mobile soft-target. Distance remains the dominant signal, but a
 * hostile in front of the Hunter receives a strong preference over one behind
 * them. Pure and renderer-free: facing is the deterministic gameplay proxy for
 * what the player is looking at.
 *
 * Manual LOCK/current valid targets never reach this picker: callers invoke it
 * only when they have no living hostile target.
 */
export function bestSoftAutoTarget(
  entities: Iterable<AutoTargetEntity>,
  origin: { x: number; z: number },
  facing: number,
  isAttackable: (e: AutoTargetEntity) => boolean,
  range = AUTO_TARGET_RANGE,
): number | null {
  let best: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const fx = Math.sin(facing);
  const fz = Math.cos(facing);
  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const dx = e.pos.x - origin.x;
    const dz = e.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001 || distance > range) continue;
    const forwardDot = (dx * fx + dz * fz) / distance;
    const directionPenalty =
      forwardDot >= 0 ? (1 - forwardDot) * 6 : 14 + Math.abs(forwardDot) * 8;
    const score = distance + directionPenalty;
    if (score < bestScore) {
      best = e.id;
      bestScore = score;
    }
  }
  return best;
}

""",
    "soft target helper",
)

pad = Path("src/game/pad_target_pick.ts")
replace_once(
    pad,
    "import { type AutoTargetAbility, nearestAutoTarget, shouldAutoTarget } from './auto_target';",
    "import { bestSoftAutoTarget, type AutoTargetAbility, shouldAutoTarget } from './auto_target';",
    "pad target import",
)
replace_once(
    pad,
    """export interface PadTargetPickDeps {
  world: PadTargetPickWorld;
  /** The client's one interact path, told which npc the pad chose. */
  interactKey(preferNpcId: number | null): void;
}""",
    """export interface PadTargetPickDeps {
  world: PadTargetPickWorld;
  /** The client's one interact path, told which npc the pad chose. */
  interactKey(preferNpcId: number | null): void;
  /** HIGHFLY: camera-forward is the screen-facing signal on free-camera mobile. */
  softTargetFacing?: () => number;
}""",
    "pad camera-facing dependency",
)
replace_once(
    pad,
    "  const { world, interactKey } = deps;",
    "  const { world, interactKey, softTargetFacing } = deps;",
    "pad camera-facing wiring",
)
replace_once(
    pad,
    """      const picked = nearestAutoTarget(world.entities.values(), world.player.pos, (e) =>
        attackable(e as Entity),
      );""",
    """      const picked = bestSoftAutoTarget(
        world.entities.values(),
        world.player.pos,
        softTargetFacing?.() ?? world.player.facing,
        (e) => attackable(e as Entity),
      );""",
    "pad soft target call",
)

hotbar = Path("src/ui/hud/action_bar/hotbar.ts")
replace_once(
    hotbar,
    """  if (!state.autoAttack && !state.hasLiveHostileTarget && actions.attackNearest) {
    actions.attackNearest();
    return;
  }
  actions.activateAttack();""",
    """  if (!state.hasLiveHostileTarget && actions.attackNearest) {
    actions.attackNearest();
  }
  actions.activateAttack();""",
    "attack tap acquire then strike",
)

hud = Path("src/ui/hud.ts")
replace_once(
    hud,
    """  onMobileAttackNearest: (() => void) | null = null;
  onQuestDialogStateChange: ((open: boolean) => void) | null = null;""",
    """  onMobileAttackNearest: (() => void) | null = null;
  /** HIGHFLY action-combat seam. Returns true when a discrete strike was accepted. */
  onHighflyBasicAttack: ((step: 1 | 2 | 3) => boolean) | null = null;
  /** Mobile skill intent hook: acquire before the existing cast path. */
  onMobileActionIntent: ((action: Exclude<HotbarAction, null>) => void) | null = null;
  private highflyComboStep: 0 | 1 | 2 | 3 = 0;
  private highflyComboExpiresAt = 0;
  private highflyComboReadyAt = 0;
  onQuestDialogStateChange: ((open: boolean) => void) | null = null;""",
    "HUD HIGHFLY seams",
)
replace_once(
    hud,
    """  private activateFixedAttackSlot(): void {
    if (this.sim.player.autoAttack) this.sim.stopAutoAttack();
    else this.sim.startAutoAttack();
    this.flashActionSlot(0);
  }""",
    """  private activateFixedAttackSlot(): void {
    const now = performance.now() / 1000;
    if (now < this.highflyComboReadyAt) return;
    if (now > this.highflyComboExpiresAt) this.highflyComboStep = 0;
    const next = ((this.highflyComboStep % 3) + 1) as 1 | 2 | 3;

    // HIGHFLY fixed Attack is an action-RPG intent, not a continuous
    // ClaudeCraft auto-attack toggle. Advance only when the strike is accepted.
    // After the finisher, force a short recovery before a fresh 1-2-3 can start.
    if (this.onHighflyBasicAttack?.(next)) {
      this.highflyComboStep = next === 3 ? 0 : next;
      this.highflyComboExpiresAt = now + 0.95;
      this.highflyComboReadyAt = next === 3 ? now + 0.38 : 0;
      this.flashActionSlot(0);
    }
  }""",
    "HUD 1-2-3 combo",
)
replace_once(
    hud,
    """      castSlot: (slot) => this.castSlot(slot),
      cyclePage: () => this.cycleMobileActionPage(),""",
    """      castSlot: (slot) => {
        const action = this.actionForSlot(slot);
        if (action) this.onMobileActionIntent?.(action);
        this.castSlot(slot);
      },
      cyclePage: () => this.cycleMobileActionPage(),""",
    "mobile skill pre-target hook",
)
replace_once(
    hud,
    "      attackNearest: this.onMobileAttackNearest,",
    "      attackNearest: () => this.onMobileAttackNearest?.(),",
    "mobile attack late-bound soft-target callback",
)

aa = Path("src/sim/combat/auto_attack.ts")
insert_before_once(
    aa,
    "// Eye Jab (gouge): classic WoW's Gouge resets the caster's own swing timer",
    r"""
/**
 * HIGHFLY action-RPG basic attack. One call is exactly one attack intent.
 *
 * It reuses the real hit tables (meleeSwing / rangedSwing) rather than
 * inventing damage math. It never arms autoAttack. The short action lock only
 * prevents button spam from producing multiple combat events inside one
 * animation; the 0.95s combo reset lives in the HUD like the approved SKILL4.
 */
export function highflyBasicAttack(
  ctx: SimContext,
  step: 1 | 2 | 3,
  pid?: number,
): boolean {
  const r = ctx.resolve(pid);
  if (!r) return false;
  if (
    r.meta.vehicle ||
    wispMazeActionsLocked(r.meta.worldQuestLog) ||
    shadowActionsLocked(r.meta.worldQuestLog) ||
    gliderActionsLocked(r.meta.worldQuestLog)
  )
    return false;

  const p = r.e;
  if (p.dead || p.castingAbility || isInStasis(p) || isValkyrsCallingAirborne(p)) return false;
  if (isStunned(p) || isDisarmed(p)) return false;
  if (p.auras.some((a) => isTravelFormAuraKind(a.kind))) return false;

  const t = p.targetId !== null ? ctx.entities.get(p.targetId) : null;
  if (!t || t.dead || !ctx.isHostileTo(p, t) || hasEscapeStealth(t)) return false;
  if (p.swingTimer > 0) return false;

  if (p.mountKey !== '') forceDismount(ctx, p);
  if (p.sitting) ctx.standUp(p);
  if (p.weaponStowed) drawWeapon(p);
  p.autoAttack = false;
  r.meta.lastActiveTick = ctx.tickCount;

  const d = dist2d(p.pos, t.pos);
  p.facing = angleTo(p.pos, t.pos);

  const ranged = rangedAutoProfile(p, r.meta.cls);
  if (ranged && d <= ranged.maxRange && d >= (ranged.wand ? 0 : ranged.minRange)) {
    if (!ctx.hasLineOfSight(p, t)) return false;
    ctx.breakGhostWolf(p);
    const shot = rangedShotProfile(ranged, p.weapon);
    rangedSwing(ctx, p, t, { ...ranged, min: shot.min, max: shot.max, speed: shot.speed });
    p.swingTimer = step === 1 ? 0.36 : step === 2 ? 0.4 : 0.58;
    return true;
  }

  if (d > effectivePlayerAttackRange(t, MELEE_RANGE, meleeReachActor(ctx, p))) return false;
  if (isArenaPos(p.pos.x) && !ctx.hasLineOfSight(p, t)) return false;

  ctx.breakGhostWolf(p);
  meleeSwing(ctx, p, t, 0, 'HIGHFLY Basic', {
    autoAttackHand: 'mainhand',
    abilityId: 'highfly_basic_' + step,
    weaponMult: 1,
    autoAttack: false,
  });
  p.swingTimer = step === 1 ? 0.36 : step === 2 ? 0.4 : 0.58;
  return true;
}

""",
    "discrete HIGHFLY basic attack",
)

sim = Path("src/sim/sim.ts")
replace_once(
    sim,
    """  meleeSwing as meleeSwingImpl,
  rangedSwing as rangedSwingImpl,
  startAutoAttack as startAutoAttackImpl,""",
    """  highflyBasicAttack as highflyBasicAttackImpl,
  meleeSwing as meleeSwingImpl,
  rangedSwing as rangedSwingImpl,
  startAutoAttack as startAutoAttackImpl,""",
    "sim import HIGHFLY attack",
)
replace_once(
    sim,
    """  stopAutoAttack(pid?: number): void {
    stopAutoAttackImpl(this.ctx, pid);
  }

  private updatePlayerAutoAttack""",
    """  stopAutoAttack(pid?: number): void {
    stopAutoAttackImpl(this.ctx, pid);
  }

  highflyBasicAttack(step: 1 | 2 | 3, pid?: number): boolean {
    return highflyBasicAttackImpl(this.ctx, step, pid);
  }

  private updatePlayerAutoAttack""",
    "sim HIGHFLY attack delegate",
)

main = Path("src/main.ts")
replace_once(
    main,
    "import { createPadTargetPick } from './game/pad_target_pick';",
    "import { bestSoftAutoTarget } from './game/auto_target';\nimport { createPadTargetPick } from './game/pad_target_pick';",
    "main soft target import",
)
replace_once(
    main,
    "  const padTargetPick = createPadTargetPick({ world, interactKey });",
    """  const padTargetPick = createPadTargetPick({
    world,
    interactKey,
    softTargetFacing: () => input.camYaw,
  });""",
    "main camera-facing soft target wiring",
)
replace_once(
    main,
    """  function attackNearest(): void {
    const p = world.player;
    const activePvpOpponents = activePvpOpponentIds(world);
    let best: number | null = null;
    let bestD = 40;
    for (const e of world.entities.values()) {
      if (!isAttackableEntity(e, world.playerId, activePvpOpponents)) continue;
      const d = dist2d(p.pos, e.pos);
      if (d < bestD) {
        best = e.id;
        bestD = d;
      }
    }
    if (best === null) {
      hud.showError(t('errors.noEnemyNearby'));
      return;
    }
    world.targetEntity(best);
    world.startAutoAttack();
  }""",
    """  function attackNearest(): void {
    const p = world.player;
    const activePvpOpponents = activePvpOpponentIds(world);
    const best = bestSoftAutoTarget(
      world.entities.values(),
      p.pos,
      input.camYaw,
      (e) =>
        isAttackableEntity(
          world.entities.get(e.id),
          world.playerId,
          activePvpOpponents,
        ),
    );
    if (best === null) {
      hud.showError(t('errors.noEnemyNearby'));
      return;
    }
    world.targetEntity(best);
  }""",
    "main soft attack acquisition",
)
replace_once(
    main,
    """  hud.onMobileAttackNearest = () => attackNearest();
  // The first island landing's camera fall""",
    """  hud.onMobileAttackNearest = () => attackNearest();
  hud.onMobileActionIntent = (action) => padTargetPick.autoTarget(action);
  hud.onHighflyBasicAttack = (step) => {
    const actionWorld = world as typeof world & {
      highflyBasicAttack?: (comboStep: 1 | 2 | 3) => boolean;
    };
    return actionWorld.highflyBasicAttack?.(step) ?? false;
  };
  // The first island landing's camera fall""",
    "main HIGHFLY attack wiring",
)

manifest = Path("src/render/characters/manifest.ts")
replace_once(
    manifest,
    """      attackByAbility: {
        charge: 'Warrior_Rush_Loop',""",
    """      attackByAbility: {
        highfly_basic_1: '1H_Melee_Attack_Chop',
        highfly_basic_2: '1H_Melee_Attack_Slice_Diagonal',
        highfly_basic_3: 'Warrior_Reaping_Arc',
        charge: 'Warrior_Rush_Loop',""",
    "warrior HIGHFLY combo clips",
)
replace_once(
    manifest,
    """      attackByAbility: {
        // Throat Wire is a wire strangle, not a dagger swing:""",
    """      attackByAbility: {
        highfly_basic_1: 'Rogue_Quick_Strike',
        highfly_basic_2: 'Dualwield_Melee_Attack_Chop',
        highfly_basic_3: 'Rogue_Finisher_Slash',
        // Throat Wire is a wire strangle, not a dagger swing:""",
    "rogue HIGHFLY combo clips",
)

print("HIGHFLY_RUN093_COMBAT_APPLIED=1")
