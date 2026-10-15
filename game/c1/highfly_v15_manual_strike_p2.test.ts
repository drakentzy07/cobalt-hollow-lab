import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { type PlayerClass, type Entity } from '../src/sim/types';
import { COMMAND_NAMES, COMMAND_FACETS } from '../src/world_api';
import { readFileSync } from 'node:fs';

const CLASSES: readonly PlayerClass[] = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest',
  'shaman', 'mage', 'warlock', 'druid',
];

function encounter(cls: PlayerClass) {
  const sim = new Sim({ seed: 42, playerClass: cls, autoEquip: true });
  const p = sim.player;
  const mob = [...sim.entities.values()].find(
    (e): e is Entity => e.kind === 'mob' && e.hostile === true && !e.dead
  );
  if (!mob) throw new Error('HIGHFLY P2 native hostile missing');
  // Use one native, unarmored target and the native sim's hit table; do NOT
  // mint fake damage or fake hit events. Don't put the player in a new world.
  mob.hp = mob.maxHp = 1e9;
  mob.stats.armor = 0;
  p.pos.x = mob.pos.x + 1;
  p.pos.z = mob.pos.z;
  p.pos.y = mob.pos.y;
  p.prevPos = { ...p.pos };
  p.facing = Math.atan2(mob.pos.x - p.pos.x, mob.pos.z - p.pos.z);
  p.swingTimer = 0;
  p.offhandSwingTimer = 0;
  p.targetId = mob.id;
  p.autoAttack = false;
  return { sim, p, mob };
}

describe('HIGHFLY V15.1-P2 — single native manual strike, all nine classes', () => {
  for (const cls of CLASSES) {
    it(cls + ': one press uses weapon cooldown and never arms autoAttack', () => {
      const { sim, p, mob } = encounter(cls);
      const firstHp = mob.hp;
      sim.manualBasicAttack();
      expect(p.autoAttack).toBe(false);
      expect(p.swingTimer > 0 || p.offhandSwingTimer > 0).toBe(true);
      const cooldown = p.swingTimer;
      const offhandCooldown = p.offhandSwingTimer;
      const afterFirst = mob.hp;
      expect(afterFirst).toBeLessThanOrEqual(firstHp);
      sim.manualBasicAttack(); // Spam cannot bypass native weapon timers.
      expect(p.swingTimer).toBe(cooldown);
      expect(p.offhandSwingTimer).toBe(offhandCooldown);
      expect(mob.hp).toBe(afterFirst);
      for (let tick = 0; tick < 3; tick++) sim.tick();
      expect(p.autoAttack).toBe(false);
    });
  }

  it('refuses a press without hostile target and does not turn into auto-attack', () => {
    const { sim, p, mob } = encounter('warrior');
    p.targetId = null;
    sim.manualBasicAttack();
    expect(p.autoAttack).toBe(false);
    expect(mob.hp).toBe(1e9);
  });

  it('does not fire through invalid range or reverse facing', () => {
    const { sim, p, mob } = encounter('rogue');
    p.facing += Math.PI;
    sim.manualBasicAttack();
    expect(p.autoAttack).toBe(false);
    expect(mob.hp).toBe(1e9);
    p.facing -= Math.PI;
    p.pos.x += 65;
    sim.manualBasicAttack();
    expect(mob.hp).toBe(1e9);
  });

  it('uses the authenticated original server Sim and an append-only wire command', () => {
    expect(COMMAND_NAMES.at(-1)).toBe('manual_attack');
    expect(COMMAND_FACETS.manual_attack).toBe('IWorldCombat');
    const server = readFileSync('server/game.ts', 'utf8');
    expect(server).toMatch(/case 'manual_attack':\s*[\s\S]{0,170}sim\.manualBasicAttack\(pid\);/);
    const net = readFileSync('src/net/online.ts', 'utf8');
    expect(net).toContain("this.cmd({ cmd: 'manual_attack' });");
  });

  it('never fakes a hit using start/stop autoAttack and keeps golden input untouched', () => {
    const hud = readFileSync('src/ui/hud.ts', 'utf8');
    expect(hud).toMatch(/private activateFixedAttackSlot\(\): void \{\s*[\s\S]{0,270}this\.sim\.manualBasicAttack\(\);/);
    const sim = readFileSync('src/sim/combat/auto_attack.ts', 'utf8');
    expect(sim).toContain('tryPlayerSwing(ctx, p, r.meta, true)');
    expect(sim).toContain('(!manual || !manualMainReady)');
    expect(sim).toContain('if ((!manual && !p.autoAttack) || p.castingAbility) return;');
    const input = readFileSync('src/game/input.ts', 'utf8');
    expect(input).not.toContain('HF15P2');
  });
});
