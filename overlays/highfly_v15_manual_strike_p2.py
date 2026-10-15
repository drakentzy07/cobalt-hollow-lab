#!/usr/bin/env python3
"""HF15.1 P2 — wire EXISTING CLEAN V1 highflyBasicAttack(1|2|3|4) online.

Preserves approved GAME-C1 1-2-3-4, elemental gem finalizer, animation,
Sim combat damage, targeting, and GOLDEN mobile input. No duplicate strike
engine, no bogus startAutoAttack/stopAutoAttack pulse and no HUD rewrite.
Install AFTER immutable CLEAN V1 and P1.
"""
from pathlib import Path

def once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'HF15P2_SOURCE_DRIFT {path}: count={n} anchor={old[:100]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

# Reuse already-accepted ONE-SWING combat primitive in CLEAN V1, rather
# than altering the native hit table or shadowing the approved combo HUD.
sim = Path("src/sim/sim.ts").read_text(encoding='utf-8')
assert 'highflyBasicAttack(step: 1 | 2 | 3 | 4, pid?: number): boolean' in sim, 'HF15P2_CLEAN_BASIC_SIM_MISSING'
hud = Path("src/ui/hud.ts").read_text(encoding='utf-8')
assert 'if (this.onHighflyBasicAttack?.(next)) {' in hud, 'HF15P2_CLEAN_COMBO_HUD_MISSING'
assert 'this.onHighflyElementalFinisherReady?.()' in hud, 'HF15P2_ELEMENTAL_COMBO_MISSING'
native = Path("src/sim/combat/auto_attack.ts").read_text(encoding='utf-8')
assert 'export function highflyBasicAttack(' in native, 'HF15P2_NATIVE_ATTACK_MISSING'
assert 'p.autoAttack = false;' in native, 'HF15P2_NATIVE_MANUAL_MODE_MISSING'
assert 'applyHighflyElementalFinisher(ctx, p, t, element)' in native, 'HF15P2_GEM4_NATIVE_MISSING'

# Add a narrow method on ClientWorld; main.ts already duck-types the existing
# highflyBasicAttack method and correctly passes the HIGHFLY combo step.
# A true return value here means the intent was SENT, never damage confirmed.
once("src/net/online.ts",
    """  startAutoAttack(): void {
    this.cmd({ cmd: 'attack' });
  }""",
    """  /** Submit ONE HIGHFLY basic-combo press, keeping all damage authoritative.
   * Returns 'sent', not server hit-acceptance (network is asynchronous). */
  highflyBasicAttack(step: 1 | 2 | 3 | 4): boolean {
    if (step !== 1 && step !== 2 && step !== 3 && step !== 4) return false;
    this.cmd({ cmd: 'highfly_basic_attack', step });
    return true;
  }
  startAutoAttack(): void {
    this.cmd({ cmd: 'attack' });
  }""")

# Server binds the authenticated player ID and ignores client damage/target.
# Anti-spam: do not allow the same socket to bypass the canonical native
# swing-recovery timer. This is in ADDITION to the existing command lane.
once("server/game.ts",
    """      case 'attack':
        sim.startAutoAttack(pid);
        break;""",
    """      case 'highfly_basic_attack': {
        const step = msg.step;
        const attacker = sim.entities.get(pid);
        if ((step === 1 || step === 2 || step === 3 || step === 4) &&
            attacker && attacker.swingTimer <= 0) {
          sim.highflyBasicAttack(step, pid);
        }
        break;
      }
      case 'attack':
        sim.startAutoAttack(pid);
        break;""")

# Append-only protocol change: never replace or change the legacy 'attack'.
once("src/world_api.ts",
    """  'guild_set_ranks',
] as const;""",
    """  'guild_set_ranks',
  // HIGHFLY native combo 1/2/3/4. Validated server-side.
  'highfly_basic_attack',
] as const;""")
once("src/world_api.ts",
    """  attack: 'IWorldCombat',
  stopattack: 'IWorldCombat',""",
    """  attack: 'IWorldCombat',
  highfly_basic_attack: 'IWorldCombat',
  stopattack: 'IWorldCombat',""")

# Preserve strict command-schema parity; numbers change only for the NEW pair.
path = "tests/command_schema.test.ts"
if Path(path).exists():
    once(path, "const EXPECTED_SEND_COUNT = 247;", "const EXPECTED_SEND_COUNT = 248;")
    once(path, "const EXPECTED_DISPATCH_COUNT = 261;", "const EXPECTED_DISPATCH_COUNT = 262;")

assert "this.cmd({ cmd: 'highfly_basic_attack', step });" in Path('src/net/online.ts').read_text()
assert "sim.highflyBasicAttack(step, pid)" in Path('server/game.ts').read_text()
assert "if (this.onHighflyBasicAttack?.(next)) {" in Path('src/ui/hud.ts').read_text()
print("HF15P2_REUSE_HIGHFLY_NATIVE_COMBO_ONE_STRIKE_ONLINE_WIRE=1")
