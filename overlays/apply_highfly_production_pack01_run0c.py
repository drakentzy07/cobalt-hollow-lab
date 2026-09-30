from pathlib import Path

ROOT = Path(".")

def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")

def write(path: str, text: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")

def rep(path: str, old: str, new: str) -> None:
    text = read(path)
    n = text.count(old)
    if n != 1:
        raise SystemExit(f"{path}: expected 1 anchor, found {n}: {old[:140]!r}")
    write(path, text.replace(old, new, 1))

# ---------------------------------------------------------------------------
# Premium presentation identities for the four EVO endpoints that did not yet
# own bespoke presentation. Jump Smash already owns its full presentation.
# Animation/SFX may reuse a proven Claude donor; VFX identity is HIGHFLY-owned.
# ---------------------------------------------------------------------------
rep(
    "src/highfly/presentation_adapter.ts",
    """    cameraFeedback: { event: 'landing', amount: 0.24, hitStopSeconds: 0.07 },
  },
};""",
    """    cameraFeedback: { event: 'landing', amount: 0.24, hitStopSeconds: 0.07 },
  },
  hf_hunter_prison_01: {
    animationRoute: 'frostjaw_trap',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'hf_hunter_prison_01',
    sfxRoute: 'frost_nova',
  },
  hf_phoenix_lance_01: {
    animationRoute: 'pyroblast',
    visualHitMoments: [
      { event: 'release', normalizedTime: 0.9 },
      { event: 'impact', normalizedTime: 1 },
    ],
    vfxRoute: 'hf_phoenix_lance_01',
    sfxRoute: 'pyroblast',
  },
  hf_living_covenant_01: {
    animationRoute: 'power_word_shield',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'hf_living_covenant_01',
    sfxRoute: 'power_word_shield',
  },
  moonlash: {
    animationRoute: 'moonseed',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'moonlash',
    sfxRoute: 'arcane_surge',
  },
};""",
)

write(
    "src/highfly/production_pack01_vfx_specs.ts",
    """import type { AbilityVfxFullSpec, AbilityVfxSpec } from '../render/ability_vfx_core';

export const HF_HUNTER_PRISON_VFX_SPEC: AbilityVfxSpec = {
  c: '#7fd8ff',
  p: 'frost',
  pw: 1.35,
  sp: 34,
  rg: 1.8,
  vr: 1,
  li: 1.1,
  lg: 2.4,
  wu: 0.22,
  a: 'cc',
};
export const HF_HUNTER_PRISON_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'cc',
  palette: 'frost',
  power: 1.35,
  windup: 0.22,
  windupStyle: 'runes',
  motifs: ['barrier'],
  motifAt: 'target',
  impact: { ring: 1.8, vRing: true, sparks: 30, flipbook: true, light: 1.1 },
  cc: { style: 'tendrils' },
  decal: 'rune',
  linger: 2.4,
  rim: '#b9efff',
  tint: '#62c8ff',
  accent: '#effcff',
  hot: 0.18,
};

export const HF_PHOENIX_LANCE_VFX_SPEC: AbilityVfxSpec = {
  c: '#ff572b',
  p: 'fire',
  pw: 1.75,
  sp: 56,
  rg: 1.35,
  vr: 1,
  sm: 1,
  li: 1.9,
  lg: 2.2,
  wu: 0.55,
  a: 'bolt',
  b: { v: 1.05, h: 1.8, co: 1 },
};
export const HF_PHOENIX_LANCE_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'bolt',
  palette: 'fire',
  power: 1.75,
  chargeStreams: 3,
  windup: 0.55,
  windupStyle: 'vortex',
  bolt: {
    speed: 1.05,
    headScale: 1.8,
    style: 'comet',
    core: '#fff2c4',
    accent: '#ff8a3d',
    coils: true,
    tracer: true,
  },
  impact: {
    ring: 1.35,
    vRing: true,
    sparks: 56,
    smoke: true,
    flipbook: true,
    light: 1.9,
  },
  decal: 'scorch',
  linger: 2.2,
  rim: '#ffb15c',
  tint: '#ff4d20',
  accent: '#fff0b0',
  hot: 0.35,
  screenFx: true,
  finisher: true,
};

export const HF_LIVING_COVENANT_VFX_SPEC: AbilityVfxSpec = {
  c: '#ffeaa3',
  p: 'holy',
  pw: 1.35,
  sp: 28,
  rg: 1.15,
  vr: 1,
  li: 1.4,
  lg: 1.6,
  wu: 0.28,
  a: 'heal',
};
export const HF_LIVING_COVENANT_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'heal',
  palette: 'holy',
  power: 1.35,
  windup: 0.28,
  windupStyle: 'runes',
  motifs: ['cross', 'barrier'],
  motifAt: 'target',
  impact: { ring: 1.15, vRing: true, sparks: 26, flipbook: true, light: 1.4 },
  barrier: true,
  shaft: 1.25,
  linger: 1.6,
  rim: '#fff7cf',
  tint: '#ffd95c',
  accent: '#ffffff',
  hot: 0.2,
};

export const HF_MOONLASH_VFX_SPEC: AbilityVfxSpec = {
  c: '#a985ff',
  p: 'moon',
  pw: 1.5,
  sp: 42,
  rg: 1.3,
  vr: 1,
  li: 1.55,
  lg: 1.8,
  wu: 0.32,
  a: 'burst',
};
export const HF_MOONLASH_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'burst',
  palette: 'moon',
  power: 1.5,
  windup: 0.32,
  windupStyle: 'orb',
  motifs: ['crescents'],
  motifAt: 'target',
  impact: { ring: 1.3, vRing: true, sparks: 42, flipbook: true, light: 1.55 },
  decal: 'rune',
  linger: 1.8,
  rim: '#d9c7ff',
  tint: '#8d69ff',
  accent: '#f5eeff',
  hot: 0.25,
  finisher: true,
};
""",
)

# Registry owns the premium VFX identities. The highflyPresentationRoute guard
# stays first, so donor routing remains available for future non-bespoke rows.
rep(
    "src/render/ability_vfx_registry.ts",
    """import {
  HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC,
  HIGHFLY_JUMP_SMASH_VFX_SPEC,
} from '../highfly/jump_smash_vfx_spec';
import { highflyPresentationRoute } from '../highfly/presentation_adapter';
""",
    """import {
  HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC,
  HIGHFLY_JUMP_SMASH_VFX_SPEC,
} from '../highfly/jump_smash_vfx_spec';
import {
  HF_HUNTER_PRISON_VFX_FULL_SPEC,
  HF_HUNTER_PRISON_VFX_SPEC,
  HF_LIVING_COVENANT_VFX_FULL_SPEC,
  HF_LIVING_COVENANT_VFX_SPEC,
  HF_MOONLASH_VFX_FULL_SPEC,
  HF_MOONLASH_VFX_SPEC,
  HF_PHOENIX_LANCE_VFX_FULL_SPEC,
  HF_PHOENIX_LANCE_VFX_SPEC,
} from '../highfly/production_pack01_vfx_specs';
import { highflyPresentationRoute } from '../highfly/presentation_adapter';
""",
)
rep(
    "src/render/ability_vfx_registry.ts",
    """  if (abilityId === 'hf_jump_smash_01') return HIGHFLY_JUMP_SMASH_VFX_SPEC;
""",
    """  if (abilityId === 'hf_jump_smash_01') return HIGHFLY_JUMP_SMASH_VFX_SPEC;
  if (abilityId === 'hf_hunter_prison_01') return HF_HUNTER_PRISON_VFX_SPEC;
  if (abilityId === 'hf_phoenix_lance_01') return HF_PHOENIX_LANCE_VFX_SPEC;
  if (abilityId === 'hf_living_covenant_01') return HF_LIVING_COVENANT_VFX_SPEC;
  if (abilityId === 'moonlash') return HF_MOONLASH_VFX_SPEC;
""",
)
rep(
    "src/render/ability_vfx_registry.ts",
    """  if (abilityId === 'hf_jump_smash_01') return HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC;
""",
    """  if (abilityId === 'hf_jump_smash_01') return HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC;
  if (abilityId === 'hf_hunter_prison_01') return HF_HUNTER_PRISON_VFX_FULL_SPEC;
  if (abilityId === 'hf_phoenix_lance_01') return HF_PHOENIX_LANCE_VFX_FULL_SPEC;
  if (abilityId === 'hf_living_covenant_01') return HF_LIVING_COVENANT_VFX_FULL_SPEC;
  if (abilityId === 'moonlash') return HF_MOONLASH_VFX_FULL_SPEC;
""",
)

# Ground-nova SFX now gets the same donor-routing fallback as cast/damage SFX.
# Keep an ability's direct one-shot override first (Jump Smash already owns one).
rep(
    "src/ui/combat_sfx.ts",
    """export function novaAbilityCue(ability: string | undefined): SfxId {
  return (ability && NOVA_ABILITY_CUES[ability]) || 'spell_nova';
}""",
    """export function novaAbilityCue(ability: string | undefined): SfxId {
  if (ability && NOVA_ABILITY_CUES[ability]) return NOVA_ABILITY_CUES[ability];
  const routed = ability ? highflyPresentationRoute(ability, 'sfx') : undefined;
  return (routed && NOVA_ABILITY_CUES[routed]) || 'spell_nova';
}""",
)

write(
    "src/highfly/production_pack01_presentation.ts",
    """export interface HighflyProductionPresentation {
  abilityId: string;
  familyId: string;
  animation: 'DONOR_ROUTED' | 'BESPOKE';
  vfx: 'BESPOKE';
  sfx: 'DONOR_ROUTED' | 'BESPOKE';
  camera: 'GENERIC_SPECTACLE' | 'BESPOKE' | 'NONE';
  mobileBudgeted: true;
  damageAuthority: 'SIM_ONLY';
}

export const HIGHFLY_PRODUCTION_PACK01_PRESENTATION: readonly HighflyProductionPresentation[] = [
  {
    abilityId: 'hf_jump_smash_01',
    familyId: 'warrior_heroic_leap',
    animation: 'DONOR_ROUTED',
    vfx: 'BESPOKE',
    sfx: 'BESPOKE',
    camera: 'BESPOKE',
    mobileBudgeted: true,
    damageAuthority: 'SIM_ONLY',
  },
  {
    abilityId: 'hf_hunter_prison_01',
    familyId: 'hunter_frostjaw',
    animation: 'DONOR_ROUTED',
    vfx: 'BESPOKE',
    sfx: 'DONOR_ROUTED',
    camera: 'NONE',
    mobileBudgeted: true,
    damageAuthority: 'SIM_ONLY',
  },
  {
    abilityId: 'hf_phoenix_lance_01',
    familyId: 'mage_pyrelance',
    animation: 'DONOR_ROUTED',
    vfx: 'BESPOKE',
    sfx: 'DONOR_ROUTED',
    camera: 'GENERIC_SPECTACLE',
    mobileBudgeted: true,
    damageAuthority: 'SIM_ONLY',
  },
  {
    abilityId: 'hf_living_covenant_01',
    familyId: 'priest_psalm',
    animation: 'DONOR_ROUTED',
    vfx: 'BESPOKE',
    sfx: 'DONOR_ROUTED',
    camera: 'NONE',
    mobileBudgeted: true,
    damageAuthority: 'SIM_ONLY',
  },
  {
    abilityId: 'moonlash',
    familyId: 'druid_moonseed',
    animation: 'DONOR_ROUTED',
    vfx: 'BESPOKE',
    sfx: 'DONOR_ROUTED',
    camera: 'GENERIC_SPECTACLE',
    mobileBudgeted: true,
    damageAuthority: 'SIM_ONLY',
  },
] as const;
""",
)

write(
    "tests/highfly_production_pack01_run0c.test.ts",
    """import { describe, expect, it } from 'vitest';
import { HIGHFLY_PRODUCTION_PACK01_PRESENTATION } from '../src/highfly/production_pack01_presentation';
import {
  HF_HUNTER_PRISON_VFX_FULL_SPEC,
  HF_LIVING_COVENANT_VFX_FULL_SPEC,
  HF_MOONLASH_VFX_FULL_SPEC,
  HF_PHOENIX_LANCE_VFX_FULL_SPEC,
} from '../src/highfly/production_pack01_vfx_specs';
import {
  highflyPresentation,
  highflyPresentationRoute,
} from '../src/highfly/presentation_adapter';
import { abilityVfxFullSpec } from '../src/render/ability_vfx_registry';
import { castCueForAbility, novaAbilityCue } from '../src/ui/combat_sfx';

describe('HIGHFLY Production Pack 01 RUN0C - premium presentation', () => {
  it('covers all five EVO endpoints with SIM-only authority and mobile budgeting', () => {
    expect(HIGHFLY_PRODUCTION_PACK01_PRESENTATION).toHaveLength(5);
    expect(HIGHFLY_PRODUCTION_PACK01_PRESENTATION.every((p) => p.damageAuthority === 'SIM_ONLY')).toBe(true);
    expect(HIGHFLY_PRODUCTION_PACK01_PRESENTATION.every((p) => p.mobileBudgeted)).toBe(true);
    expect(HIGHFLY_PRODUCTION_PACK01_PRESENTATION.every((p) => p.vfx === 'BESPOKE')).toBe(true);
  });

  it('Hunter Prison owns frost barrier/tendrils visuals and reuses Frost Nova audio', () => {
    expect(highflyPresentationRoute('hf_hunter_prison_01', 'animation')).toBe('frostjaw_trap');
    expect(highflyPresentationRoute('hf_hunter_prison_01', 'vfx')).toBe('hf_hunter_prison_01');
    expect(abilityVfxFullSpec('hf_hunter_prison_01')).toBe(HF_HUNTER_PRISON_VFX_FULL_SPEC);
    expect(HF_HUNTER_PRISON_VFX_FULL_SPEC.motifs).toContain('barrier');
    expect(HF_HUNTER_PRISON_VFX_FULL_SPEC.cc?.style).toBe('tendrils');
    expect(novaAbilityCue('hf_hunter_prison_01')).toBe(novaAbilityCue('frost_nova'));
  });

  it('Phoenix Lance owns a three-stream comet crescendo with donor Pyroblast sound', () => {
    const p = highflyPresentation('hf_phoenix_lance_01');
    expect(p?.animationRoute).toBe('pyroblast');
    expect(abilityVfxFullSpec('hf_phoenix_lance_01')).toBe(HF_PHOENIX_LANCE_VFX_FULL_SPEC);
    expect(HF_PHOENIX_LANCE_VFX_FULL_SPEC.chargeStreams).toBe(3);
    expect(HF_PHOENIX_LANCE_VFX_FULL_SPEC.bolt?.style).toBe('comet');
    expect(HF_PHOENIX_LANCE_VFX_FULL_SPEC.finisher).toBe(true);
    expect(castCueForAbility('hf_phoenix_lance_01')).toBe(castCueForAbility('pyroblast'));
  });

  it('Living Covenant owns holy cross+barrier presentation while reusing shield casting language', () => {
    expect(highflyPresentationRoute('hf_living_covenant_01', 'animation')).toBe('power_word_shield');
    expect(abilityVfxFullSpec('hf_living_covenant_01')).toBe(HF_LIVING_COVENANT_VFX_FULL_SPEC);
    expect(HF_LIVING_COVENANT_VFX_FULL_SPEC.motifs).toEqual(
      expect.arrayContaining(['cross', 'barrier']),
    );
    expect(HF_LIVING_COVENANT_VFX_FULL_SPEC.barrier).toBe(true);
    expect(castCueForAbility('hf_living_covenant_01')).toBe(castCueForAbility('power_word_shield'));
  });

  it('Oleada Lunar owns moon crescents and a budgeted spectacle camera beat', () => {
    expect(highflyPresentationRoute('moonlash', 'animation')).toBe('moonseed');
    expect(abilityVfxFullSpec('moonlash')).toBe(HF_MOONLASH_VFX_FULL_SPEC);
    expect(HF_MOONLASH_VFX_FULL_SPEC.motifs).toContain('crescents');
    expect(HF_MOONLASH_VFX_FULL_SPEC.finisher).toBe(true);
    expect(
      HIGHFLY_PRODUCTION_PACK01_PRESENTATION.find((p) => p.abilityId === 'moonlash')?.camera,
    ).toBe('GENERIC_SPECTACLE');
  });
});
""",
)

print("HIGHFLY_PRODUCTION_PACK01_RUN0C=1")
