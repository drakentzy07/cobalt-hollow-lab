#!/usr/bin/env python3
"""HIGHFLY V15.1-P2 — true manual basic attack on the ORIGINAL Sim and server.

Install only after V9/V9.1 and V15.1-P1 overlays; fail on donor anchor drift.
No autoAttack toggling or timeouts. One command invokes at most one regular
mainhand OR offhand attack, reusing existing accuracy/crit/range/LoS/procs and
native animation events. Respects original weapon timers and nine-class logic.
"""
from pathlib import Path

def once(filename: str, old: str, new: str) -> None:
    path=Path(filename); s=path.read_text(encoding="utf-8")
    n=s.count(old)
    if n != 1: raise SystemExit(f"HF15P2_SOURCE_DRIFT {filename} {n}: {old[:110]!r}")
    path.write_text(s.replace(old,new,1),encoding="utf-8")

path="src/sim/combat/auto_attack.ts"
once(path,
    "export function updatePlayerAutoAttack(ctx: SimContext, p: Entity, meta: PlayerMeta): void {",
    """/**
 * One authoritative manual attack request. NEVER arms the per-tick driver.
 * Range/facing/weapon timer/LoS/stealth/miss/crit/procs use the same native
 * tryPlayerSwing path as regular white hits. The server resolves the request
 * against the authenticated pid; the client cannot supply power or victim.
 */
export function manualBasicAttack(ctx: SimContext, pid?: number): void {
  const r = ctx.resolve(pid);
  if (!r) return;
  const p = r.e;
  // Legacy continuing autoattack must not run after a deliberate manual press.
  p.autoAttack = false;
  if (r.meta.vehicle || p.dead || isInStasis(p) ||
      isValkyrsCallingAirborne(p) ||
      wispMazeActionsLocked(r.meta.worldQuestLog) ||
      shadowActionsLocked(r.meta.worldQuestLog) ||
      gliderActionsLocked(r.meta.worldQuestLog) ||
      p.auras.some(a => isTravelFormAuraKind(a.kind))) return;
  const target = p.targetId === null ? null : ctx.entities.get(p.targetId);
  if (!target || target.dead || !ctx.isHostileTo(p, target) || hasEscapeStealth(target)) return;
  if (p.castingAbility || isStunned(p) || isDisarmed(p)) return;
  if (p.swingTimer > 0 &&
      (!p.dualWielding || !p.offhandWeapon || p.offhandSwingTimer > 0)) return;
  if (p.sitting) ctx.standUp(p);
  if (p.weaponStowed) drawWeapon(p);
  r.meta.lastActiveTick = ctx.tickCount;
  tryPlayerSwing(ctx, p, r.meta, true);
}

export function updatePlayerAutoAttack(ctx: SimContext, p: Entity, meta: PlayerMeta): void {""")
once(path,
    "export function tryPlayerSwing(ctx: SimContext, p: Entity, meta: PlayerMeta): void {",
    """export function tryPlayerSwing(
  ctx: SimContext, p: Entity, meta: PlayerMeta, manual = false,
): void {""")
once(path,
    "  if (!p.autoAttack || p.castingAbility) return;",
    "  if ((!manual && !p.autoAttack) || p.castingAbility) return;")
once(path,
    """  const dualWieldWhiteMissPenalty = hasDualWieldWhiteMissPenalty(ctx, p, meta);

  if (p.swingTimer <= 0) {""",
    """  const dualWieldWhiteMissPenalty = hasDualWieldWhiteMissPenalty(ctx, p, meta);
  const manualMainReady = p.swingTimer <= 0;

  if (p.swingTimer <= 0) {""")
once(path,
    """  if (p.dualWielding && p.offhandWeapon && p.offhandSwingTimer <= 0) {""",
    """  // A manual press is ONE weapon attempt. Duals alternate to the ready
  // offhand only when the main hand was still cooling down at this press.
  if (p.dualWielding && p.offhandWeapon && p.offhandSwingTimer <= 0 &&
      (!manual || !manualMainReady)) {""")

path="src/sim/sim.ts"
once(path,
    "  meleeSwing as meleeSwingImpl,",
    "  manualBasicAttack as manualBasicAttackImpl,\n  meleeSwing as meleeSwingImpl,")
once(path,
    """  startAutoAttack(pid?: number): void {
    startAutoAttackImpl(this.ctx, pid);
  }""",
    """  /** HIGHFLY: one real, server-authoritative native weapon strike. */
  manualBasicAttack(pid?: number): void {
    manualBasicAttackImpl(this.ctx, pid);
  }

  startAutoAttack(pid?: number): void {
    startAutoAttackImpl(this.ctx, pid);
  }""")

path="src/world_api/combat.ts"
once(path,
    """  startAutoAttack(): void;
  stopAutoAttack(): void;""",
    """  /** One press = at most one regular native basic-attack attempt. */
  manualBasicAttack(): void;
  startAutoAttack(): void;
  stopAutoAttack(): void;""")

path="src/net/online.ts"
once(path,
    """  startAutoAttack(): void {
    this.cmd({ cmd: 'attack' });
  }""",
    """  manualBasicAttack(): void {
    // No client damage/target payload: authenticated Sim is authoritative.
    this.cmd({ cmd: 'manual_attack' });
  }
  startAutoAttack(): void {
    this.cmd({ cmd: 'attack' });
  }""")

path="server/game.ts"
once(path,
    """      case 'attack':
        sim.startAutoAttack(pid);
        break;""",
    """      case 'manual_attack':
        // Already authenticated pid, existing rate-limited command lane.
        sim.manualBasicAttack(pid);
        break;
      case 'attack':
        sim.startAutoAttack(pid);
        break;""")

path="src/world_api.ts"
once(path,
    """  'guild_set_ranks',
] as const;""",
    """  'guild_set_ranks',
  // HIGHFLY single-strike command. Append-only; never rename legacy attack.
  'manual_attack',
] as const;""")
once(path,
    """  attack: 'IWorldCombat',
  stopattack: 'IWorldCombat',""",
    """  attack: 'IWorldCombat',
  manual_attack: 'IWorldCombat',
  stopattack: 'IWorldCombat',""")

path="src/ui/hud.ts"
once(path,
    """  private activateFixedAttackSlot(): void {
    if (this.sim.player.autoAttack) this.sim.stopAutoAttack();
    else this.sim.startAutoAttack();
    this.flashActionSlot(0);
  }""",
    """  private activateFixedAttackSlot(): void {
    // HIGHFLY: Attack is a discrete manual action on both PC and mobile.
    // The game already chooses a nearby enemy for the mobile button.
    // No start/stop autoattack trick, and no client-side damage calculation.
    this.sim.manualBasicAttack();
    this.flashActionSlot(0);
  }""")

# Original W0b and W0c contract tests must stay strict, not skipped.
path="tests/command_schema.test.ts"
if Path(path).exists():
    once(path,"const EXPECTED_SEND_COUNT = 247;","const EXPECTED_SEND_COUNT = 248;")
    once(path,"const EXPECTED_DISPATCH_COUNT = 261;","const EXPECTED_DISPATCH_COUNT = 262;")

path="tests/world_api_parity.test.ts"
if Path(path).exists():
    once(path, "  { name: 'startAutoAttack', kind: 'method' },",
         "  { name: 'manualBasicAttack', kind: 'method' },\n  { name: 'startAutoAttack', kind: 'method' },")
    once(path, "    expect(IWORLD_MEMBERS.length).toBe(424);",
         "    expect(IWORLD_MEMBERS.length).toBe(425);")
    once(path, "    expect(METHOD_MEMBERS.length).toBe(298);",
         "    expect(METHOD_MEMBERS.length).toBe(299);")
    once(path, "  'startAutoAttack',\n  'stopAutoAttack',\n  'unstuck',",
         "  'manualBasicAttack',\n  'startAutoAttack',\n  'stopAutoAttack',\n  'unstuck',")
    # Sorted member/method snapshots are updated, never relaxed.
    src=Path(path).read_text(encoding="utf-8")
    marker="      'manualBasicAttack',"
    if marker in src: raise SystemExit("HF15P2_PARITY_ALREADY_PATCHED")
    # Both arrays' alphabetical positions immediately before marketBuy.
    needle="      'marketBuy',"
    if src.count(needle)!=2:
        raise SystemExit(f"HF15P2_PARITY_SORTED_ANCHOR:{src.count(needle)}")
    src=src.replace(needle,"      'manualBasicAttack',\n"+needle)
    Path(path).write_text(src,encoding="utf-8")

checks={
    "server": "case 'manual_attack':" in Path("server/game.ts").read_text(),
    "network": "this.cmd({ cmd: 'manual_attack' });" in Path("src/net/online.ts").read_text(),
    "no_timed_fake": "this.sim.manualBasicAttack();" in Path("src/ui/hud.ts").read_text(),
    "original_hit_path": "tryPlayerSwing(ctx, p, r.meta, true)" in Path("src/sim/combat/auto_attack.ts").read_text(),
    "no_weapon_double": "(!manual || !manualMainReady)" in Path("src/sim/combat/auto_attack.ts").read_text(),
}
if not all(checks.values()): raise SystemExit(f"HF15P2_INSTALL_CHECK_FAILED {checks}")
print("HF15P2_NATIVE_SINGLE_STRIKE_SERVER_AUTHORITY_APPLIED=1")
