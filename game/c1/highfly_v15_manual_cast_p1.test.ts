import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { highflyV15AbilityAutoEngageAllowed } from '../src/ui/hud/action_bar/highfly_v15_manual_combat';

const CLASSES = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest',
  'shaman', 'mage', 'warlock', 'druid',
] as const;

describe('HIGHFLY V15.1-P1 manual skill intent — all nine original classes', () => {
  for (const classId of CLASSES) {
    it(classId + ' cannot turn a single skill press into repeating auto-attacks on mobile', () => {
      expect(highflyV15AbilityAutoEngageAllowed(true, true)).toBe(false);
      expect(highflyV15AbilityAutoEngageAllowed(true, false)).toBe(false);
    });
  }

  it('retains explicitly configured original behavior on desktop', () => {
    expect(highflyV15AbilityAutoEngageAllowed(false, true)).toBe(true);
    expect(highflyV15AbilityAutoEngageAllowed(false, false)).toBe(false);
  });

  it('gates instant and deferred autoattack from native HUD, including older settings', () => {
    const hud = readFileSync('src/ui/hud.ts', 'utf8');
    expect(hud).toContain('highflyV15AbilityAutoEngageAllowed(');
    expect(hud).toContain('this.isMobileLayout(),');
    expect(hud).toContain("this.optionsHooks?.settings.get('startAttackOnAbilityUse') ?? false");
    expect(hud).toContain('if (ev.success && !this.isMobileLayout()) {');
    expect(hud).toContain('pressStartsAutoAttack(resolved.effects, mouseoverPid !== null)');
  });

  it('sets manual default on fresh profiles without mutating original sim/online protocols', () => {
    const settings = readFileSync('src/game/settings.ts', 'utf8');
    expect(settings).toContain('startAttackOnAbilityUse: { def: false }');
    const hud = readFileSync('src/ui/hud.ts', 'utf8');
    expect(hud).toContain('this.sim.startAutoAttack();');
    expect(hud).toContain('this.sim.stopAutoAttack();');
    const ring = readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts','utf8');
    expect(ring).toContain('deps.attackNearest?.();');
    expect(ring).toContain('deps.activateFixedAttackSlot();');
  });
});
