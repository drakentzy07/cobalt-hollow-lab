import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { PlayerClass, Entity } from '../src/sim/types';
import { COMMAND_NAMES, COMMAND_FACETS } from '../src/world_api';
import { readFileSync } from 'node:fs';

// HIGHFLY CLEAN V1 already implements the 1–2–3–4 attack, animations and
// elemental finisher. P2 adds the online wire only. Never replace that engine.
const CLASSES: readonly PlayerClass[] = [
  'warrior','paladin','hunter','rogue','priest',
  'shaman','mage','warlock','druid',
];

function encounter(cls: PlayerClass) {
  const sim = new Sim({ seed: 42, playerClass: cls, autoEquip: true });
  const p = sim.player;
  const mob = [...sim.entities.values()].find(
    (e): e is Entity => e.kind === 'mob' && e.hostile === true && !e.dead
  );
  if (!mob) throw new Error('HIGHFLY P2 native hostile missing');
  mob.hp = mob.maxHp = 1e9;
  mob.stats.armor = 0;
  p.pos.x = mob.pos.x + 1;
  p.pos.z = mob.pos.z;
  p.pos.y = mob.pos.y;
  p.prevPos = { ...p.pos };
  p.facing = Math.atan2(mob.pos.x-p.pos.x,mob.pos.z-p.pos.z);
  p.targetId = mob.id;
  p.autoAttack = false;
  return {sim,p,mob};
}

describe('HIGHFLY V15.1-P2 — preserve native combo and authorize online intents', () => {
  for(const cls of CLASSES){
    it(cls + ': one explicit attack is accepted without arming auto-attack',()=>{
      const {sim,p,mob}=encounter(cls);
      const before=mob.hp;
      const accepted=sim.highflyBasicAttack(1);
      expect(accepted).toBe(true);
      expect(p.autoAttack).toBe(false);
      expect(mob.hp).toBeLessThanOrEqual(before); // native RNG can miss
      expect(p.swingTimer).toBeGreaterThan(0);
      // Never enable repeated autoattacks in the simulation tick path.
      for(let t=0;t<3;t++) sim.tick();
      expect(p.autoAttack).toBe(false);
    });
  }

  it('rejects attacks without live targets, or from far beyond reach',()=>{
    const {sim,p,mob}=encounter('rogue');
    p.targetId=null;
    expect(sim.highflyBasicAttack(1)).toBe(false);
    expect(mob.hp).toBe(1e9);
    p.targetId=mob.id;
    p.pos.x += 100;
    expect(sim.highflyBasicAttack(1)).toBe(false);
    expect(mob.hp).toBe(1e9);
  });

  it('keeps the elemental fourth hit gated by a real equipped gem',()=>{
    const {sim,p}=encounter('warrior');
    expect(sim.highflyElementalFinisherReady()).toBe(false);
    expect(sim.highflyBasicAttack(4)).toBe(false);
    expect(p.autoAttack).toBe(false);
  });

  it('appends one command with real server PID and cooldown check',()=>{
    expect(COMMAND_NAMES.at(-1)).toBe('highfly_basic_attack');
    expect(COMMAND_FACETS.highfly_basic_attack).toBe('IWorldCombat');
    const server=readFileSync('server/game.ts','utf8');
    expect(server).toContain("case 'highfly_basic_attack':");
    expect(server).toContain('sim.highflyBasicAttack(step, pid);');
    expect(server).toContain('attacker.swingTimer <= 0');
    const client=readFileSync('src/net/online.ts','utf8');
    expect(client).toContain("this.cmd({ cmd: 'highfly_basic_attack', step });");
    expect(client).toContain('highflyBasicAttack(step: 1 | 2 | 3 | 4): boolean {');
  });

  it('retains CLEAN V1 HUD callback, 1-2-3-4, elements and GOLDEN input',()=>{
    const hud=readFileSync('src/ui/hud.ts','utf8');
    expect(hud).toContain('if (this.onHighflyBasicAttack?.(next)) {');
    expect(hud).toContain('this.highflyComboStep === 3 && elemental');
    expect(hud).toContain('this.onHighflyElementalFinisherReady?.()');
    expect(hud).toContain('this.highflyComboEvadeGraceUsed');
    const native=readFileSync('src/sim/combat/auto_attack.ts','utf8');
    expect(native).toContain('export function highflyBasicAttack(');
    expect(native).toContain('applyHighflyElementalFinisher(ctx, p, t, element)');
    const input=readFileSync('src/game/input.ts','utf8');
    expect(input).not.toContain('HF15P2');
  });
});
