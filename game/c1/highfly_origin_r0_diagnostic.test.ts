import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { highflyV15AbilityAutoEngageAllowed } from '../src/ui/hud/action_bar/highfly_v15_manual_combat';
import type { Entity } from '../src/sim/types';

/** OR-0 forensic tests on the disposable assembled V15.2 runtime. Tests prove
 * existing behavior. They DO NOT claim full OR-1 acceptance or Android QA. */
function setup() {
  const sim = new Sim({ seed: 20261015, playerClass: 'warrior', autoEquip: true });
  const p = sim.player;
  const mob = [...sim.entities.values()].find(
    (e): e is Entity => e.kind === 'mob' && e.hostile === true && !e.dead
  );
  if (!mob) throw new Error('Origin baseline hostile missing');
  mob.hp = mob.maxHp = 1000000;
  mob.stats.armor = 0;
  p.pos.x = mob.pos.x + 1;
  p.pos.z = mob.pos.z;
  p.pos.y = mob.pos.y;
  p.prevPos = { ...p.pos };
  p.targetId = mob.id;
  p.autoAttack = false;
  return { sim, p, mob };
}

describe('ORIGIN OR-0 baseline: actual runtime attack paths', () => {
  it('idle ticks do not create a basic attack when autoAttack is off', () => {
    const { sim, p, mob } = setup();
    const hp = mob.hp;
    for (let i = 0; i < 12; i++) sim.tick();
    expect(p.autoAttack).toBe(false);
    expect(mob.hp).toBe(hp);
  });

  it('one accepted explicit basic intent never arms the repeating engine', () => {
    const { sim, p } = setup();
    expect(sim.highflyBasicAttack(1)).toBe(true);
    expect(p.autoAttack).toBe(false);
    for (let i = 0; i < 5; i++) sim.tick();
    expect(p.autoAttack).toBe(false);
  });

  it('elemental finisher is not free: absent valid gem rejects basic 4', () => {
    const { sim, p } = setup();
    expect(sim.highflyElementalFinisherReady()).toBe(false);
    expect(sim.highflyBasicAttack(4)).toBe(false);
    expect(p.autoAttack).toBe(false);
  });

  it('documents the 200ms buffered mobile ATK timer (candidate risk, NOT fixed)', () => {
    const hud = readFileSync('src/ui/hud.ts','utf8');
    expect(hud).toContain('private highflyV91QueuedAttack: ReturnType<typeof setTimeout> | null = null;');
    expect(hud).toContain('this.highflyV91QueuedAttack = setTimeout(() => {');
    expect(hud).toContain('this.onMobileAttackNearest?.();');
    expect(hud).toContain('this.activateFixedAttackSlot();');
    console.log('ORIGIN_AUDIT_BUFFERED_ATK_TIMER_PRESENT_REQUIRES_GESTURE_TRACE=1');
  });

  it('documents desktop ability auto-engage legacy option (candidate risk, NOT fixed)', () => {
    expect(highflyV15AbilityAutoEngageAllowed(true, true)).toBe(false);
    expect(highflyV15AbilityAutoEngageAllowed(false, true)).toBe(true);
    console.log('ORIGIN_AUDIT_DESKTOP_LEGACY_AUTO_ENGAGE_STILL_ENABLED_BY_OPTION=1');
  });

  it('documents online SENT-vs-ACCEPTED difference and server swingTimer gate', () => {
    const client = readFileSync('src/net/online.ts','utf8');
    const server = readFileSync('server/game.ts','utf8');
    expect(client).toContain("this.cmd({ cmd: 'highfly_basic_attack', step });");
    expect(client).toContain('return true;');
    expect(server).toContain("case 'highfly_basic_attack':");
    expect(server).toContain('attacker.swingTimer <= 0');
    console.log('ORIGIN_AUDIT_ONLINE_SENT_NOT_EQUAL_SERVER_ACCEPTED=1');
  });

  it('confirms V15.2 native charged hold and touch override are assembled', () => {
    const hud = readFileSync('src/ui/hud.ts','utf8');
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts','utf8');
    expect(hud).toContain('this.bindEmpoweredActionHold(btn, () => slot)');
    expect((runtime.match(/if \(btn\.dataset\.hfV15NativeEmpowerHold === '1'\) return;/g) ?? []).length).toBe(5);
  });
});
