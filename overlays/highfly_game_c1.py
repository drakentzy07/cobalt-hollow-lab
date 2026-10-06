from pathlib import Path
import shutil

ROOT = Path(".")
HOST = ROOT.resolve().parent

def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")

def write(path: str, text: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")

def rep(path: str, old: str, new: str, label: str, count: int = 1) -> None:
    text = read(path)
    found = text.count(old)
    if found != count:
        raise SystemExit(f"{label}: expected {count}, found {found}")
    write(path, text.replace(old, new, count))

for src, dst in [
    ("game/c1/runtime.ts", "src/highfly/game_c1_runtime.ts"),
    ("game/c1/elemental_basic.ts", "src/sim/combat/highfly_elemental_basic.ts"),
    ("game/c1/elemental_weapon_vfx.ts", "src/highfly/game_c1_elemental_weapon_vfx.ts"),
    ("game/c1/hud.css", "src/styles/hf_game_c1.css"),
]:
    target = ROOT / dst
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(HOST / src, target)

# Runtime is always present, but its layout rules activate only on mobile-touch.
main = ROOT / "src/main.ts"
main.write_text("import './highfly/game_c1_runtime';\n" + main.read_text(encoding="utf-8"), encoding="utf-8")

# Real native S1-S10 stay painted on mobile. No proxy skills, no class-skill copies.
rep(
    "src/ui/hud.ts",
    "    if (!this.isMobileLayout())\n      this.actionBarPainter.paint(this.actionBarView.tick(actionBarWorld));",
    "    if (!this.isMobileLayout() || document.body.classList.contains('hf-game-c1'))\n"
    "      this.actionBarPainter.paint(this.actionBarView.tick(actionBarWorld));",
    "GAME-C1 native actionbar mobile paint",
)

# ---------------------------------------------------------------------------
# Basic attack: preserve approved 1-2-3; active equipped gem unlocks ONE ATK4.
# ---------------------------------------------------------------------------
rep(
    "src/ui/hud.ts",
    "  onHighflyBasicAttack: ((step: 1 | 2 | 3) => boolean) | null = null;\n"
    "  /** Mobile skill intent hook: acquire before the existing cast path. */",
    "  onHighflyBasicAttack: ((step: 1 | 2 | 3 | 4) => boolean) | null = null;\n"
    "  onHighflyElementalFinisherReady: (() => boolean) | null = null;\n"
    "  /** Mobile skill intent hook: acquire before the existing cast path. */",
    "GAME-C1 combo hook",
)
rep(
    "src/ui/hud.ts",
    "  private highflyComboStep: 0 | 1 | 2 | 3 = 0;",
    "  private highflyComboStep: 0 | 1 | 2 | 3 | 4 = 0;",
    "GAME-C1 combo state",
)
rep(
    "src/ui/hud.ts",
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
      // One real-time cadence source for action combat:
      // quick 1 -> 2 -> 3, then a clearly perceptible short finisher recovery.
      this.highflyComboReadyAt =
        now + (next === 1 ? 0.30 : next === 2 ? 0.34 : 0.62);
      this.highflyAcceptedBasicAttacks += 1;
      document.body.dataset.highflyBasicAttackCount = String(this.highflyAcceptedBasicAttacks);
      this.flashActionSlot(0);
    }
  }""",
    """  private activateFixedAttackSlot(): void {
    const now = performance.now() / 1000;
    if (now < this.highflyComboReadyAt) return;
    if (now > this.highflyComboExpiresAt) this.highflyComboStep = 0;
    const elemental = this.onHighflyElementalFinisherReady?.() ?? false;
    const next: 1 | 2 | 3 | 4 =
      this.highflyComboStep === 3 && elemental
        ? 4
        : (((this.highflyComboStep % 3) + 1) as 1 | 2 | 3);

    if (this.onHighflyBasicAttack?.(next)) {
      if (next === 4) this.highflyComboStep = 0;
      else if (next === 3) this.highflyComboStep = elemental ? 3 : 0;
      else this.highflyComboStep = next;
      this.highflyComboExpiresAt = now + 0.95;
      this.highflyComboReadyAt =
        now + (next === 1 ? 0.30 : next === 2 ? 0.34 : next === 3 ? (elemental ? 0.38 : 0.62) : 0.72);
      this.highflyAcceptedBasicAttacks += 1;
      document.body.dataset.highflyBasicAttackCount = String(this.highflyAcceptedBasicAttacks);
      document.body.dataset.highflyBasicAttackStep = String(next);
      this.flashActionSlot(0);
    }
  }""",
    "GAME-C1 elemental combo",
)

aa = ROOT / "src/sim/combat/auto_attack.ts"
aa.write_text(
    "import { applyHighflyElementalFinisher, highflyElementalFinisherReady, highflyWeaponElement } from './highfly_elemental_basic';\n"
    + aa.read_text(encoding="utf-8"),
    encoding="utf-8",
)
rep("src/sim/combat/auto_attack.ts", "  step: 1 | 2 | 3,", "  step: 1 | 2 | 3 | 4,", "GAME-C1 attack step")
rep(
    "src/sim/combat/auto_attack.ts",
    """  const ranged = rangedAutoProfile(p, r.meta.cls);
  if (ranged && d <= ranged.maxRange && d >= (ranged.wand ? 0 : ranged.minRange)) {""",
    """  const element = highflyWeaponElement(p);
  if (step === 4 && !highflyElementalFinisherReady(p)) return false;
  const ranged = rangedAutoProfile(p, r.meta.cls);
  if (ranged && d <= ranged.maxRange && d >= (ranged.wand ? 0 : ranged.minRange)) {""",
    "GAME-C1 element gate",
)
rep(
    "src/sim/combat/auto_attack.ts",
    """    rangedSwing(ctx, p, t, { ...ranged, min: shot.min, max: shot.max, speed: shot.speed });
    p.swingTimer = step === 1 ? 0.36 : step === 2 ? 0.4 : 0.58;
    return true;""",
    """    rangedSwing(
      ctx,
      p,
      t,
      { ...ranged, min: shot.min, max: shot.max, speed: shot.speed },
      step === 4 && element !== 'base'
        ? { abilityId: 'highfly_basic_4_' + element, element }
        : undefined,
    );
    p.swingTimer = step === 1 ? 0.36 : step === 2 ? 0.4 : step === 3 ? 0.58 : 0.68;
    return true;""",
    "GAME-C1 ranged ATK4",
)
rep(
    "src/sim/combat/auto_attack.ts",
    """  meleeSwing(ctx, p, t, 0, 'HIGHFLY Basic', {
    autoAttackHand: 'mainhand',
    abilityId: 'highfly_basic_' + step,
    weaponMult: 1,
    autoAttack: false,
  });
  p.swingTimer = step === 1 ? 0.36 : step === 2 ? 0.4 : 0.58;
  return true;""",
    """  const landed = meleeSwing(ctx, p, t, 0, 'HIGHFLY Basic', {
    autoAttackHand: 'mainhand',
    abilityId: step === 4 && element !== 'base' ? 'highfly_basic_4_' + element : 'highfly_basic_' + step,
    weaponMult: 1,
    autoAttack: false,
  });
  if (landed && step === 4 && element !== 'base') applyHighflyElementalFinisher(ctx, p, t, element);
  p.swingTimer = step === 1 ? 0.36 : step === 2 ? 0.4 : step === 3 ? 0.58 : 0.68;
  return true;""",
    "GAME-C1 melee ATK4",
)
rep(
    "src/sim/combat/auto_attack.ts",
    """export function rangedSwing(
  ctx: SimContext,
  attacker: Entity,
  target: Entity,
  ranged: { min: number; max: number; speed: number; wand?: boolean; school?: string },
): void {""",
    """export function rangedSwing(
  ctx: SimContext,
  attacker: Entity,
  target: Entity,
  ranged: { min: number; max: number; speed: number; wand?: boolean; school?: string },
  highfly?: { abilityId: string; element: Exclude<ReturnType<typeof highflyWeaponElement>, 'base'> },
): void {""",
    "GAME-C1 ranged signature",
)
rep(
    "src/sim/combat/auto_attack.ts",
    """        kind: 'miss',
        ...(ranged.wand ? {} : { attackAnimationStarted: true as const }),""",
    """        kind: 'miss',
        ...(highfly ? { abilityId: highfly.abilityId } : {}),
        ...(ranged.wand ? {} : { attackAnimationStarted: true as const }),""",
    "GAME-C1 ranged miss event",
)
rep(
    "src/sim/combat/auto_attack.ts",
    """    ctx.dealDamage(
      atk,
      tgt,
      Math.max(1, Math.round(dmg)),
      crit,
      school,
      label,
      'hit',
      false,
      undefined,
      true,
      !ranged.wand,
    );""",
    """    const dealt = ctx.dealDamage(
      atk,
      tgt,
      Math.max(1, Math.round(dmg)),
      crit,
      school,
      label,
      'hit',
      false,
      undefined,
      true,
      !ranged.wand,
      false,
      highfly?.abilityId ?? null,
    );
    if (dealt > 0 && highfly) applyHighflyElementalFinisher(ctx, atk, tgt, highfly.element);""",
    "GAME-C1 ranged rider",
)

rep(
    "src/sim/sim.ts",
    """  highflyBasicAttack(step: 1 | 2 | 3, pid?: number): boolean {
    return highflyBasicAttackImpl(this.ctx, step, pid);
  }""",
    """  highflyBasicAttack(step: 1 | 2 | 3 | 4, pid?: number): boolean {
    return highflyBasicAttackImpl(this.ctx, step, pid);
  }

  highflyElementalFinisherReady(pid?: number): boolean {
    const r = this.ctx.resolve(pid);
    return !!r && highflyElementalFinisherReadyImpl(r.e);
  }""",
    "GAME-C1 sim delegate",
)
sim = ROOT / "src/sim/sim.ts"
sim_text = sim.read_text(encoding="utf-8")
needle = "from './combat/auto_attack';"
idx = sim_text.find(needle)
if idx < 0:
    raise SystemExit("GAME-C1 sim auto_attack import not found")
line_end = sim_text.find("\n", idx)
helper = "import { highflyElementalFinisherReady as highflyElementalFinisherReadyImpl } from './combat/highfly_elemental_basic';\n"
sim.write_text(sim_text[:line_end + 1] + helper + sim_text[line_end + 1:], encoding="utf-8")

rep(
    "src/main.ts",
    """  hud.onHighflyBasicAttack = (step) => {
    const actionWorld = world as typeof world & {
      highflyBasicAttack?: (comboStep: 1 | 2 | 3) => boolean;
    };
    return actionWorld.highflyBasicAttack?.(step) ?? false;
  };""",
    """  hud.onHighflyBasicAttack = (step) => {
    const actionWorld = world as typeof world & {
      highflyBasicAttack?: (comboStep: 1 | 2 | 3 | 4) => boolean;
    };
    return actionWorld.highflyBasicAttack?.(step) ?? false;
  };
  hud.onHighflyElementalFinisherReady = () => {
    const actionWorld = world as typeof world & {
      highflyElementalFinisherReady?: () => boolean;
    };
    return actionWorld.highflyElementalFinisherReady?.() ?? false;
  };""",
    "GAME-C1 HUD elemental wiring",
)

# Render-only element communication.
renderer = ROOT / "src/render/renderer.ts"
renderer.write_text(
    "import { paintHighflyElementalBasic, highflyWeaponElementColor } from '../highfly/game_c1_elemental_weapon_vfx';\n"
    + renderer.read_text(encoding="utf-8"),
    encoding="utf-8",
)
rep(
    "src/render/renderer.ts",
    "    this.riftDeathZoneVisuals?.handleEvent(ev);",
    "    this.riftDeathZoneVisuals?.handleEvent(ev);\n"
    "    if (ev.type === 'damage') paintHighflyElementalBasic(ev, this.sim.entities.get(ev.sourceId), this.vfx);",
    "GAME-C1 elemental impact VFX",
)
rep(
    "src/render/renderer.ts",
    "      v.visual.setWeaponAura(weaponAura ? weaponAura.color : null, weaponAura?.tip ?? false);",
    "      const highflyElement = highflyWeaponElementColor(e);\n"
    "      v.visual.setWeaponAura(highflyElement ?? (weaponAura ? weaponAura.color : null), highflyElement !== null ? false : (weaponAura?.tip ?? false));",
    "GAME-C1 weapon aura",
)
rep(
    "src/render/characters/manifest.ts",
    "        highfly_basic_3: 'Warrior_Reaping_Arc',",
    "        highfly_basic_3: 'Warrior_Reaping_Arc',\n"
    "        highfly_basic_4_fire: 'Warrior_Reaping_Arc',\n"
    "        highfly_basic_4_frost: 'Warrior_Reaping_Arc',\n"
    "        highfly_basic_4_lightning: 'Warrior_Reaping_Arc',\n"
    "        highfly_basic_4_air: 'Warrior_Reaping_Arc',",
    "GAME-C1 warrior ATK4 visual",
)
rep(
    "src/render/characters/manifest.ts",
    "        highfly_basic_3: 'Rogue_Finisher_Slash',",
    "        highfly_basic_3: 'Rogue_Finisher_Slash',\n"
    "        highfly_basic_4_fire: 'Rogue_Finisher_Slash',\n"
    "        highfly_basic_4_frost: 'Rogue_Finisher_Slash',\n"
    "        highfly_basic_4_lightning: 'Rogue_Finisher_Slash',\n"
    "        highfly_basic_4_air: 'Rogue_Finisher_Slash',",
    "GAME-C1 rogue ATK4 visual",
)

# ---------------------------------------------------------------------------
# One big ATK/USAR control: same native interaction route, never duplicated.
# ---------------------------------------------------------------------------
rep(
    "src/ui/hud.ts",
    "  onHighflyElementalFinisherReady: (() => boolean) | null = null;\n"
    "  /** Mobile skill intent hook: acquire before the existing cast path. */",
    "  onHighflyElementalFinisherReady: (() => boolean) | null = null;\n"
    "  /** Returns true only when the native contextual interaction consumed the tap. */\n"
    "  onMobileContextualUse: (() => boolean) | null = null;\n"
    "  /** Mobile skill intent hook: acquire before the existing cast path. */",
    "GAME-C1 contextual HUD hook",
)
rep(
    "src/ui/hud.ts",
    "      attackNearest: () => this.onMobileAttackNearest?.(),\n"
    "      attackTapState: () => {",
    "      attackNearest: () => this.onMobileAttackNearest?.(),\n"
    "      contextualUse: () => this.onMobileContextualUse?.() ?? false,\n"
    "      attackTapState: () => {",
    "GAME-C1 contextual ring dependency",
)
rep(
    "src/ui/hud/action_bar/mobile_action_ring_controller.ts",
    "  attackNearest: (() => void) | null;\n"
    "  attackTapState(): { autoAttack: boolean; hasLiveHostileTarget: boolean };",
    "  attackNearest: (() => void) | null;\n"
    "  /** Native contextual interaction. True means the press was consumed as USAR. */\n"
    "  contextualUse(): boolean;\n"
    "  attackTapState(): { autoAttack: boolean; hasLiveHostileTarget: boolean };",
    "GAME-C1 controller contextual dependency",
)
rep(
    "src/ui/hud/action_bar/mobile_action_ring_controller.ts",
    """    audio.click();
    handleMobileAttackTap(deps.attackTapState(), {""",
    """    audio.click();
    if (deps.contextualUse()) {
      attackBtn.blur();
      return;
    }
    handleMobileAttackTap(deps.attackTapState(), {""",
    "GAME-C1 contextual attack routing",
)

rep(
    "src/main.ts",
    "import { tryNearbyInteraction } from './game/nearby_interaction';",
    "import { tryNearbyInteraction } from './game/nearby_interaction';\n"
    "import { resolveNearbyInteractionCandidate } from './game/nearby_interaction_core';",
    "GAME-C1 interaction resolver import",
)

rep(
    "src/main.ts",
    """  function interactKey(preferNpcId?: number | null): void {
    if (shouldRouteInteractToBgFlag(world.bgInfo, world.player, world.entities)) {
      world.bgFlagAction();
      return;
    }
    stopAutorunForInteraction(
      tryNearbyInteraction(
        world,
        hud,
        t('questUi.errors.escortAway'),
        t('errors.nothingInteract'),
        undefined,
        preferNpcId,
        interactKeyGatherOptions(world, gatherEffectConfirm),
      ),
      input,
      mobileControls,
    );
  }

  const padTargetPick = createPadTargetPick({""",
    """  function interactKey(preferNpcId?: number | null): void {
    if (shouldRouteInteractToBgFlag(world.bgInfo, world.player, world.entities)) {
      world.bgFlagAction();
      return;
    }
    stopAutorunForInteraction(
      tryNearbyInteraction(
        world,
        hud,
        t('questUi.errors.escortAway'),
        t('errors.nothingInteract'),
        undefined,
        preferNpcId,
        interactKeyGatherOptions(world, gatherEffectConfirm),
      ),
      input,
      mobileControls,
    );
  }

  function highflyContextualUseAvailable(): boolean {
    if (padReelItemId(world.player.castingAbility, world.inventory) !== null) return true;
    if (shouldRouteInteractToBgFlag(world.bgInfo, world.player, world.entities)) return true;
    const candidate = resolveNearbyInteractionCandidate(world, true, undefined, GATHER_NODES);
    return candidate !== null && candidate.kind !== 'escortAway';
  }

  function highflyContextualUse(): boolean {
    const reelRod = padReelItemId(world.player.castingAbility, world.inventory);
    if (reelRod !== null) {
      world.useItem(reelRod);
      return true;
    }
    if (!highflyContextualUseAvailable()) return false;
    interactKey();
    return true;
  }

  hud.onMobileContextualUse = highflyContextualUse;
  (
    window as Window & {
      __highflyGameC1Context?: { canUse(): boolean };
    }
  ).__highflyGameC1Context = { canUse: highflyContextualUseAvailable };

  const padTargetPick = createPadTargetPick({""",
    "GAME-C1 contextual use seam",
)

# Closure: no Q body/Affinity runtime, no fake elemental skill variants.
for forbidden in ("qmale", "qfemale", "hf_aff_"):
    for path in (
        "src/highfly/game_c1_runtime.ts",
        "src/sim/combat/highfly_elemental_basic.ts",
        "src/highfly/game_c1_elemental_weapon_vfx.ts",
        "src/styles/hf_game_c1.css",
    ):
        if forbidden in read(path).lower():
            raise SystemExit(f"GAME-C1 forbidden runtime token {forbidden} in {path}")

print("HIGHFLY_GAME_C1_APPLIED=1")
