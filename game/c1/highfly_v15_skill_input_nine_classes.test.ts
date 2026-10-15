import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CLASSES, ABILITIES } from '../src/sim/content/classes';
import { Sim } from '../src/sim/sim';
import { isAbilityActionBarEligible, encodeHotbarAction, parseHotbarAction } from '../src/ui/hud/action_bar/hotbar';
import { sourceSlotForMobileButton } from '../src/ui/hud/action_bar/mobile_action_page_view';

const NINE = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest',
  'shaman', 'mage', 'warlock', 'druid',
] as const;

describe('HIGHFLY V15.2 P0: original ClaudeCraft skill catalog 9/9, no ability rewrites', () => {
  for (const cls of NINE) {
    it(cls + ': every original class skill retains its identity and routes through the native action-bar serializer', () => {
      const abilities = CLASSES[cls].abilities;
      expect(abilities.length).toBeGreaterThan(5);
      expect(new Set(abilities).size).toBe(abilities.length);
      let usableCount = 0;
      for (const id of abilities) {
        const original = ABILITIES[id];
        expect(original, cls + ' missing native ability ' + id).toBeDefined();
        expect(original.id).toBe(id);
        if (!isAbilityActionBarEligible(original)) continue;
        usableCount++;
        const action = { type: 'ability' as const, id };
        const serialized = encodeHotbarAction(action);
        expect(parseHotbarAction(JSON.parse(serialized), key => key in ABILITIES, () => false))
          .toEqual(action);
      }
      expect(usableCount).toBeGreaterThan(5);

      // A character's ACTUALLY LEARNED spells must resolve to the original Sim;
      // unlearned/talent-gated rows are never force-granted for this test.
      const sim = new Sim({ seed: 19, playerClass: cls, autoEquip: true });
      sim.setPlayerLevel(20);
      const learned = sim.known.filter(k => isAbilityActionBarEligible(k.def));
      expect(learned.length).toBeGreaterThan(0);
      for (const known of learned) {
        expect(sim.resolvedAbility(known.def.id), cls + '/' + known.def.id).not.toBeNull();
      }
    });
  }
});

describe('HIGHFLY V15.2 P0: all ten visible skill slots keep native casts and hold semantics', () => {
  const hud = readFileSync('src/ui/hud.ts', 'utf8');
  const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
  const ring = readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts', 'utf8');

  it('maps all S1-S10 to real original slot IDs without replacing ability IDs', () => {
    for (let i = 1; i <= 10; i++) {
      expect(i).toBeGreaterThanOrEqual(1);
      expect(i).toBeLessThanOrEqual(33);
    }
    expect(hud).toContain('btn.dataset.hotbarSlot = String(slot)');
    expect(runtime).toContain("if (slot < 1 || slot > 10 || btn.dataset.hfC1Touch === '1') return;");
    expect(runtime).toContain('btn.click();');
    expect(hud).toContain('this.sim.castAbility(action.id)');
    expect(sourceSlotForMobileButton(0, 0)).toBe(1);
    expect(sourceSlotForMobileButton(0, 3)).toBe(4);
  });

  it('never swallows a charge pointerdown/release before ClaudeCraft native hold', () => {
    expect(hud).toContain("this.empoweredAbilityIdForSlot(slot) !== null ? '1' : '0'");
    expect(hud).toContain("this.bindEmpoweredActionHold(btn, () => slot)");
    const start = hud.indexOf("btn.dataset.hotbarSlot = String(slot);");
    const guard = hud.indexOf("btn.dataset.hfV15NativeEmpowerHold =", start);
    const native = hud.indexOf("this.bindEmpoweredActionHold(btn, () => slot)", guard);
    expect(start).toBeGreaterThan(0);
    expect(guard).toBeGreaterThan(start);
    expect(native).toBeGreaterThan(guard);
    expect((runtime.match(/if \(btn\.dataset\.hfV15NativeEmpowerHold === '1'\) return;/g) ?? []).length)
      .toBe(5);
    expect(runtime).toContain('dispatchingNativeClick = true;');
    expect(runtime).toContain('suppressClickUntil = Date.now() + 800;');
    // Do not swap to a duplicate cast engine or disable source ring.
    expect(ring).toContain('deps.castSlot(deps.sourceSlot(buttonIndex, direction))');
  });

  it('keeps Rogue Backstab/Estocada original requirements and the prior V9.1 stealth fix', () => {
    const backstab = ABILITIES.backstab;
    expect(backstab.class).toBe('rogue');
    expect(backstab.learnLevel).toBe(3);
    expect(backstab.cost).toBe(60);
    expect(backstab.requiresTarget).toBe(true);
    expect(backstab.effects.some(e => e.type === 'weaponStrike' && e.requiresBehind)).toBe(true);
    const cast = readFileSync('src/sim/combat/casting_lifecycle.ts', 'utf8');
    expect(cast).toContain('if (!p.weapon.dagger)');
    expect(cast).toContain('highflyV91UnawareStealthBackstab(ability.id, p, target)');
    expect(cast).toContain("ctx.error(p.id, 'You must be behind your target.')");
  });
});
