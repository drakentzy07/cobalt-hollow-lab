#!/usr/bin/env python3
"""ORIGIN OR-1 P2: reuse upstream commandOutcome to confirm manual basic attacks.
Apply AFTER R0 forensic and OR-1 P1, BEFORE tsc, combat gates and WebGL build.
No new server WS envelope, no new damage path, no persisted fields.
"""
from pathlib import Path
import shutil

def once(file: str, old: str, new: str) -> None:
    p = Path(file)
    data = p.read_text(encoding="utf-8")
    count = data.count(old)
    if count != 1:
        raise SystemExit(f"ORIGIN_OR1_P2_SOURCE_DRIFT {file} count={count}: {old[:90]!r}")
    p.write_text(data.replace(old,new,1),encoding="utf-8")

helper = Path("src/ui/hud/action_bar/highfly_origin_strike_ack.ts")
if helper.exists():
    raise SystemExit("ORIGIN_OR1_P2_ACK_HELPER_ALREADY_EXISTS")
shutil.copyfile("../v9-corrections/game/c1/highfly_origin_strike_ack.ts",helper)
hud="src/ui/hud.ts"
once(hud,
  "import { highflyOriginBufferedStrikeAllowed,",
  "import { HighflyOriginStrikeAckGate } from './hud/action_bar/highfly_origin_strike_ack';\nimport { highflyOriginBufferedStrikeAllowed,")
once(hud,
  "  onHighflyBasicAttack: ((step: 1 | 2 | 3 | 4) => boolean) | null = null;",
  "  onHighflyBasicAttack: ((step: 1 | 2 | 3 | 4) => boolean | Promise<boolean>) | null = null;")
once(hud,
  "  private highflyAcceptedBasicAttacks = 0;",
  "  private highflyAcceptedBasicAttacks = 0;\n  private readonly highflyOriginStrikeAck = new HighflyOriginStrikeAckGate();")
once(hud,
  "  private activateFixedAttackSlot(): void {",
  """  /** Advance combo only after a real offline Sim acceptance or an online
   *  authoritative commandOutcome. This is a swing, not guaranteed damage. */
  private highflyOriginAcceptBasicStrike(
    next: 1 | 2 | 3 | 4, elemental: boolean, requestedAt: number,
  ): void {
    if (next === 4) this.highflyComboStep = 0;
    else if (next === 3) this.highflyComboStep = elemental ? 3 : 0;
    else this.highflyComboStep = next;
    this.highflyComboExpiresAt = performance.now() / 1000 + 0.95;
    // Shared with Sim swingTimer (not optimistic .30/.34); avoid client ahead
    // of the server's min recovery. Requested time includes network flight.
    this.highflyComboReadyAt = requestedAt +
      (next === 1 ? 0.36 : next === 2 ? 0.40 : next === 3 ? 0.58 : 0.68);
    this.highflyAcceptedBasicAttacks++;
    document.body.dataset.highflyBasicAttackCount = String(this.highflyAcceptedBasicAttacks);
    document.body.dataset.highflyBasicAttackStep = String(next);
    this.flashActionSlot(0);
  }

  private activateFixedAttackSlot(): void {""")
once(hud,
  "    const now = performance.now() / 1000;\n    if (now < this.highflyComboReadyAt)",
  "    const now = performance.now() / 1000;\n    if (this.highflyOriginStrikeAck.pending) return;\n    if (now < this.highflyComboReadyAt)")
old="""    if (this.onHighflyBasicAttack?.(next)) {
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
    }"""
new="""    const intent = this.onHighflyBasicAttack?.(next) ?? false;
    if (typeof intent === 'boolean') {
      // Offline native Sim returns actual acceptance synchronously.
      if (intent) this.highflyOriginAcceptBasicStrike(next, elemental, now);
      return;
    }
    // Online ClientWorld returns a Promise from the existing commandOutcome
    // channel. No increment, flash or next attack while it is unresolved.
    const token = this.highflyOriginStrikeAck.begin();
    if (token === null) return;
    void intent.then((accepted) => {
      if (!this.highflyOriginStrikeAck.settle(token, accepted)) return;
      if (this.sim.player.dead) return;
      this.highflyOriginAcceptBasicStrike(next, elemental, now);
    }).catch(() => { this.highflyOriginStrikeAck.settle(token, false); });"""
once(hud,old,new)
# Main's duck-typed local/online action world must allow Promise confirmation.
once("src/main.ts",
   "highflyBasicAttack?: (comboStep: 1 | 2 | 3 | 4) => boolean;",
   "highflyBasicAttack?: (comboStep: 1 | 2 | 3 | 4) => boolean | Promise<boolean>;")
# Existing request/reply infrastructure guarantees pending cleanup on timeout,
# reconnect or denied commands; commandOutcome is wire-compatible.
once("src/net/online.ts",
  """  /** Submit ONE HIGHFLY basic-combo press, keeping all damage authoritative.
   * Returns 'sent', not server hit-acceptance (network is asynchronous). */
  highflyBasicAttack(step: 1 | 2 | 3 | 4): boolean {
    if (step !== 1 && step !== 2 && step !== 3 && step !== 4) return false;
    this.cmd({ cmd: 'highfly_basic_attack', step });
    return true;
  }""",
  """  /** Submit ONE HIGHFLY basic-combo intent and await the existing server
   * commandOutcome. true means Sim accepted a swing, NOT guaranteed damage. */
  highflyBasicAttack(step: 1 | 2 | 3 | 4): Promise<boolean> {
    if (step !== 1 && step !== 2 && step !== 3 && step !== 4)
      return Promise.resolve(false);
    return this.cmdWithOutcome({ cmd: 'highfly_basic_attack', step });
  }""")
once("server/game.ts",
  """      case 'highfly_basic_attack': {
        const step = msg.step;
        const attacker = sim.entities.get(pid);
        if ((step === 1 || step === 2 || step === 3 || step === 4) &&
            attacker && attacker.swingTimer <= 0) {
          sim.highflyBasicAttack(step, pid);
        }
        break;
      }""",
  """      case 'highfly_basic_attack': {
        const step = msg.step;
        const attacker = sim.entities.get(pid);
        const accepted =
          (step === 1 || step === 2 || step === 3 || step === 4) &&
          !!attacker && attacker.swingTimer <= 0 &&
          sim.highflyBasicAttack(step, pid);
        this.sendCommandOutcome(session, msg, accepted);
        break;
      }""")
assert "return this.cmdWithOutcome({ cmd: 'highfly_basic_attack', step });" in Path("src/net/online.ts").read_text()
assert "this.sendCommandOutcome(session, msg, accepted);" in Path("server/game.ts").read_text()
assert "highflyOriginAcceptBasicStrike" in Path(hud).read_text()
assert "this.highflyOriginStrikeAck.pending" in Path(hud).read_text()
assert "if (this.onHighflyBasicAttack?.(next))" not in Path(hud).read_text()
print("HIGHFLY_ORIGIN_OR1_P2_SERVER_ACK_MANUAL_BASIC_SWING_WIRED=1")
