import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { HighflyOriginStrikeAckGate } from '../src/ui/hud/action_bar/highfly_origin_strike_ack';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';

describe('HIGHFLY ORIGIN OR-1 P2 online swing ACK, not optimistic sent', () => {
  it('an accepted server response can advance the combo, once only', () => {
    const gate = new HighflyOriginStrikeAckGate();
    const a = gate.begin();
    expect(a).not.toBeNull();
    expect(gate.pending).toBe(true);
    expect(gate.begin()).toBeNull();
    expect(gate.settle(a!, true)).toBe(true);
    expect(gate.pending).toBe(false);
    expect(gate.settle(a!, true)).toBe(false);
  });
  it('a server reject or timeout result does not authorize step 2', () => {
    const gate = new HighflyOriginStrikeAckGate();
    const a = gate.begin();
    expect(gate.settle(a!, false)).toBe(false);
    expect(gate.pending).toBe(false);
    const b = gate.begin();
    expect(b).not.toBe(a);
    expect(gate.settle(b!, true)).toBe(true);
  });
  it('late ACK after reset never advances the new sequence', () => {
    const gate = new HighflyOriginStrikeAckGate();
    const a = gate.begin();
    gate.cancel();
    expect(gate.settle(a!, true)).toBe(false);
    const b = gate.begin();
    expect(gate.settle(a!, true)).toBe(false);
    expect(gate.settle(b!, true)).toBe(true);
  });
  it('retains the native honest Sim strike (miss is not an acceptance failure)', () => {
    const sim = new Sim({ seed: 420, playerClass: 'warrior', autoEquip: true });
    const p = sim.player;
    const mob = [...sim.entities.values()].find(
      (e): e is Entity => e.kind === 'mob' && e.hostile && !e.dead
    );
    if (!mob) throw Error('native hostile missing');
    p.pos.x = mob.pos.x + 1;
    p.pos.z = mob.pos.z;
    p.pos.y = mob.pos.y;
    p.targetId = mob.id;
    p.autoAttack = false;
    expect(sim.highflyBasicAttack(1)).toBe(true);
    expect(p.autoAttack).toBe(false);
    expect(p.swingTimer).toBeGreaterThan(0);
  });
  it('online returns the authenticated commandOutcome; server checks Sim and recovery', () => {
    const online = readFileSync('src/net/online.ts','utf8');
    const server = readFileSync('server/game.ts','utf8');
    const hud = readFileSync('src/ui/hud.ts','utf8');
    expect(online).toContain("return this.cmdWithOutcome({ cmd: 'highfly_basic_attack', step });");
    expect(online).not.toContain("this.cmd({ cmd: 'highfly_basic_attack', step });");
    expect(server).toContain("case 'highfly_basic_attack':");
    expect(server).toContain('attacker.swingTimer <= 0');
    expect(server).toContain('sim.highflyBasicAttack(step, pid)');
    expect(server).toContain('this.sendCommandOutcome(session, msg, accepted)');
    expect(hud).toContain('if (this.highflyOriginStrikeAck.pending) return;');
    expect(hud).toContain("const intent = this.onHighflyBasicAttack?.(next) ?? false;");
    expect(hud).toContain('if (typeof intent === \'boolean\')');
    expect(hud).toContain('this.highflyOriginStrikeAck.settle(token, accepted)');
    expect(hud).toContain('this.highflyOriginAcceptBasicStrike(next, elemental, now)');
    expect(hud).not.toContain('if (this.onHighflyBasicAttack?.(next)) {');
  });
});
