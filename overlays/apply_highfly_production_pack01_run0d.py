from pathlib import Path

ROOT = Path(".")

def write(path: str, text: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")

write(
    "tests/highfly_production_pack01_freeze.test.ts",
    """import { describe, expect, it } from 'vitest';
import { HIGHFLY_PRODUCTION_PACK_01 } from '../src/highfly/production_pack01';
import { HIGHFLY_PRODUCTION_PACK01_PRESENTATION } from '../src/highfly/production_pack01_presentation';
import { abilityVfxFullSpec } from '../src/render/ability_vfx_registry';
import { ABILITIES } from '../src/sim/data';

const EXPECTED = {
  warrior: ['heroic_leap', 'hf_jump_smash_01'],
  hunter: ['frostjaw_trap', 'hf_hunter_prison_01'],
  mage: ['pyroblast', 'hf_phoenix_lance_01'],
  priest: ['power_word_shield', 'hf_living_covenant_01'],
  druid: ['moonseed', 'moonlash'],
} as const;

describe('HIGHFLY Production Pack 01 freeze gate', () => {
  it('pins exactly five approved class families and their base/evolution ids', () => {
    expect(HIGHFLY_PRODUCTION_PACK_01).toHaveLength(5);
    for (const family of HIGHFLY_PRODUCTION_PACK_01) {
      const expected = EXPECTED[family.classId];
      expect([family.baseAbilityId, family.evolutionAbilityId]).toEqual(expected);
      expect(ABILITIES[family.baseAbilityId]).toBeTruthy();
      expect(family.evolutionAbilityId && ABILITIES[family.evolutionAbilityId]).toBeTruthy();
    }
  });

  it('has no unfinished EVO adaptation markers left in Pack 01', () => {
    expect(HIGHFLY_PRODUCTION_PACK_01.some((f) => f.state === 'EVO_ADAPT_NEXT')).toBe(false);
  });

  it('pins premium VFX identity on every evolution endpoint', () => {
    for (const [, evo] of Object.values(EXPECTED)) {
      expect(abilityVfxFullSpec(evo), evo).toBeTruthy();
    }
  });

  it('keeps presentation as SIM-only authority for all five endpoints', () => {
    expect(HIGHFLY_PRODUCTION_PACK01_PRESENTATION).toHaveLength(5);
    expect(
      HIGHFLY_PRODUCTION_PACK01_PRESENTATION.every(
        (p) => p.damageAuthority === 'SIM_ONLY' && p.mobileBudgeted && p.vfx === 'BESPOKE',
      ),
    ).toBe(true);
  });

  it('keeps progression-only EVO ids hidden until the progression layer swaps them', () => {
    expect(ABILITIES.hf_hunter_prison_01.hiddenFromPlayer).toBe(true);
    expect(ABILITIES.hf_phoenix_lance_01.hiddenFromPlayer).toBe(true);
    expect(ABILITIES.hf_living_covenant_01.hiddenFromPlayer).toBe(true);
  });

  it('pins the mechanical differentiators that justify EVO status', () => {
    const hunter = ABILITIES.hf_hunter_prison_01.effects.find((e) => e.type === 'frostjawTrap');
    const mage = ABILITIES.hf_phoenix_lance_01.effects.find((e) => e.type === 'dot');
    const priest = ABILITIES.hf_living_covenant_01.effects.find((e) => e.type === 'absorb');

    expect(hunter?.rootAll).toBe(true);
    expect(mage).toMatchObject({ total: 50, duration: 6, interval: 1 });
    expect(priest).toBeTruthy();
    const moonReplacement = ABILITIES.moonseed.actionReplacement;
    const moonRules = Array.isArray(moonReplacement)
      ? moonReplacement
      : moonReplacement
        ? [moonReplacement]
        : [];
    expect(moonRules.some((rule) => rule.abilityId === 'moonlash')).toBe(true);
    expect(
      ABILITIES.hf_jump_smash_01.effects.some(
        (e) => e.type === 'repositionToAim' && e.landingAoe?.radius === 6,
      ),
    ).toBe(true);
  });
});
""",
)

print("HIGHFLY_PRODUCTION_PACK01_FREEZE_GATE=1")
