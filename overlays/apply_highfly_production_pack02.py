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
# Pack 02 doctrine:
# EVO = same family, same authority/runtime, clearly amplified.
# No mutation/unique mechanics are introduced here.
# ---------------------------------------------------------------------------

# Donor base ids/names remain frozen; HIGHFLY Spanish labels live in the manifest/UI.

# Register hidden EVO endpoints in the real class kits.
rep(
    "src/sim/content/classes.ts",
    """      'consecration',
      'righteous_fury',""",
    """      'consecration',
      'hf_radiant_sanctuary_01',
      'righteous_fury',""",
)
rep(
    "src/sim/content/classes.ts",
    """      'ambush',
      'rupture',""",
    """      'ambush',
      'hf_shadow_hunt_01',
      'rupture',""",
)
rep(
    "src/sim/content/classes.ts",
    """      'earthquake',
      'bloodlust',""",
    """      'earthquake',
      'hf_primordial_cataclysm_01',
      'bloodlust',""",
)
rep(
    "src/sim/content/classes.ts",
    """      'reaping_command',
      'sacrifice_undead',""",
    """      'reaping_command',
      'hf_unholy_dominion_01',
      'sacrifice_undead',""",
)

# ---------------------------------------------------------------------------
# Paladin EVO — Santuario Radiante
# Same Consecration ground-AoE authority. Larger radius + longer duration,
# retaining the first-hit Devotion and Faithwarden zone semantics.
# ---------------------------------------------------------------------------
rep(
    "src/sim/content/paladin_core_abilities.ts",
    """  },
];

const devotions: AbilityDef[] = [""",
    """  },
  {
    id: 'hf_radiant_sanctuary_01',
    name: 'Santuario Radiante',
    class: 'paladin',
    specs: ['protection', 'retribution'],
    hiddenFromPlayer: true,
    learnLevel: 5,
    cost: 35,
    castTime: 0,
    cooldown: 12,
    range: 0,
    school: 'holy',
    requiresTarget: false,
    threat: { mult: 1.75 },
    effects: [
      {
        type: 'groundAoE',
        min: 11,
        max: 14,
        radius: 8,
        duration: 10,
        interval: 1,
        devotionOnFirstHit: 1,
      },
    ],
    ranks: [
      {
        rank: 2,
        level: 11,
        cost: 35,
        effects: [
          {
            type: 'groundAoE',
            min: 18,
            max: 22,
            radius: 8,
            duration: 10,
            interval: 1,
            devotionOnFirstHit: 1,
          },
        ],
      },
      {
        rank: 3,
        level: 16,
        cost: 35,
        effects: [
          {
            type: 'groundAoE',
            min: 26,
            max: 33,
            radius: 8,
            duration: 10,
            interval: 1,
            devotionOnFirstHit: 1,
          },
        ],
      },
    ],
    description:
      'Evolución de Tierra Consagrada: el mismo santuario se expande a 8 m y permanece 10 sec, manteniendo su amenaza, Devoción y protección de Faithwarden.',
  },
];

const devotions: AbilityDef[] = [""",
)
rep(
    "src/sim/combat/effect_dispatch.ts",
    """            ability.id === 'consecration'
              ? {""",
    """            (ability.id === 'consecration' || ability.id === 'hf_radiant_sanctuary_01')
              ? {""",
)

# ---------------------------------------------------------------------------
# Rogue EVO — Cacería Sombría
# Same stealth/backstab/dagger opener. It hits slightly harder and awards a
# second combo point; the native true-stealth snapshot remains authoritative.
# ---------------------------------------------------------------------------
rep(
    "src/sim/content/classes.ts",
    """  stealth: {
    id: 'stealth',""",
    """  hf_shadow_hunt_01: {
    id: 'hf_shadow_hunt_01',
    name: 'Cacería Sombría',
    class: 'rogue',
    hiddenFromPlayer: true,
    learnLevel: 4,
    cost: 60,
    castTime: 0,
    cooldown: 0,
    range: 0,
    school: 'physical',
    requiresTarget: true,
    awardsCombo: 2,
    requiresStealth: true,
    effects: [
      {
        type: 'weaponStrike',
        bonus: 34,
        requiresBehind: true,
        weaponMult: 2.75,
      },
    ],
    description:
      'Evolución de Emboscada: conserva el ataque desde Duskveil y por la espalda, golpea con mayor fuerza y otorga 2 puntos de combo.',
    specNotes: {
      subtlety:
        'Cuenta como apertura real desde Duskveil y conserva el flujo de Gloam de Emboscada.',
    },
  },
  stealth: {
    id: 'stealth',""",
)
rep(
    "src/sim/combat/rogue_stealth_opener.ts",
    """export const TRUE_STEALTH_OPENER_ABILITY_ID = 'ambush';""",
    """export const TRUE_STEALTH_OPENER_ABILITY_ID = 'ambush';
const TRUE_STEALTH_OPENER_ABILITY_IDS: ReadonlySet<string> = new Set([
  TRUE_STEALTH_OPENER_ABILITY_ID,
  'hf_shadow_hunt_01',
]);""",
)
rep(
    "src/sim/combat/rogue_stealth_opener.ts",
    """  if (abilityId !== TRUE_STEALTH_OPENER_ABILITY_ID) return false;""",
    """  if (!TRUE_STEALTH_OPENER_ABILITY_IDS.has(abilityId)) return false;""",
)

# ---------------------------------------------------------------------------
# Shaman EVO — Cataclismo Primordial
# Same ground-targeted Faultwake + Thundercall vent. The field is wider and
# denser while retaining the six-second authoritative ground-AoE lifecycle.
# ---------------------------------------------------------------------------
rep(
    "src/sim/content/classes.ts",
    """  scorch: {
    id: 'scorch',""",
    """  hf_primordial_cataclysm_01: {
    id: 'hf_primordial_cataclysm_01',
    name: 'Cataclismo Primordial',
    class: 'shaman',
    specs: ['elemental'],
    hiddenFromPlayer: true,
    learnLevel: 18,
    cost: 80,
    castTime: 0,
    cooldown: 12,
    range: 30,
    school: 'nature',
    requiresTarget: false,
    targetMode: 'position',
    effects: [
      {
        type: 'groundAoE',
        min: 15,
        max: 20,
        radius: 10,
        duration: 6,
        interval: 1.5,
      },
    ],
    description:
      'Evolución de Despertar de la Falla: sacude una zona de 10 m durante 6 sec y conserva el consumo completo de Thunder de Thundercall.',
  },
  scorch: {
    id: 'scorch',""",
)
rep(
    "src/sim/combat/shaman_thundercall.ts",
    """const THUNDER_VENTS: ReadonlySet<string> = new Set(['earth_shock', 'earthquake']);""",
    """export const THUNDER_VENTS: ReadonlySet<string> = new Set([
  'earth_shock',
  'earthquake',
  'hf_primordial_cataclysm_01',
]);""",
)

# ---------------------------------------------------------------------------
# Warlock EVO — Dominio Profano
# Same Reaping Command unison strike. The evolved command then empowers the
# same undead for a short six-second aftermath; no new pet/command system.
# ---------------------------------------------------------------------------
rep(
    "src/sim/content/classes.ts",
    """  sacrifice_undead: {
    id: 'sacrifice_undead',""",
    """  hf_unholy_dominion_01: {
    id: 'hf_unholy_dominion_01',
    name: 'Dominio Profano',
    class: 'warlock',
    specs: ['demonology'],
    hiddenFromPlayer: true,
    learnLevel: 14,
    cost: 45,
    soulFragmentCost: 2,
    castTime: 0,
    cooldown: 8,
    range: 30,
    school: 'shadow',
    requiresTarget: true,
    projectile: false,
    effects: [
      { type: 'reapingCommand' },
      { type: 'commandUndead', duration: 6, dmgPct: 0.15, hastePct: 0.1 },
    ],
    description:
      'Evolución de Mandato de Siega: los no-muertos golpean al unísono y quedan exaltados 6 sec, ganando 15% de daño y 10% de velocidad de acción.',
  },
  sacrifice_undead: {
    id: 'sacrifice_undead',""",
)

write("src/highfly/production_pack02.ts", """export interface HighflyProductionPack02Family {
  familyId: string;
  classId: 'paladin' | 'rogue' | 'shaman' | 'warlock';
  baseAbilityId: string;
  baseName: string;
  evolutionAbilityId: string;
  evolutionName: string;
  state: 'PRODUCTION_READY';
  authority: 'CLAUDE_SIM';
  doctrine: 'SAME_SKILL_AMPLIFIED';
}

export const HIGHFLY_PRODUCTION_PACK_02: readonly HighflyProductionPack02Family[] = [
  {
    familyId: 'paladin_consecration',
    classId: 'paladin',
    baseAbilityId: 'consecration',
    baseName: 'Tierra Consagrada',
    evolutionAbilityId: 'hf_radiant_sanctuary_01',
    evolutionName: 'Santuario Radiante',
    state: 'PRODUCTION_READY',
    authority: 'CLAUDE_SIM',
    doctrine: 'SAME_SKILL_AMPLIFIED',
  },
  {
    familyId: 'rogue_ambush',
    classId: 'rogue',
    baseAbilityId: 'ambush',
    baseName: 'Emboscada',
    evolutionAbilityId: 'hf_shadow_hunt_01',
    evolutionName: 'Cacería Sombría',
    state: 'PRODUCTION_READY',
    authority: 'CLAUDE_SIM',
    doctrine: 'SAME_SKILL_AMPLIFIED',
  },
  {
    familyId: 'shaman_faultwake',
    classId: 'shaman',
    baseAbilityId: 'earthquake',
    baseName: 'Despertar de la Falla',
    evolutionAbilityId: 'hf_primordial_cataclysm_01',
    evolutionName: 'Cataclismo Primordial',
    state: 'PRODUCTION_READY',
    authority: 'CLAUDE_SIM',
    doctrine: 'SAME_SKILL_AMPLIFIED',
  },
  {
    familyId: 'warlock_reaping_command',
    classId: 'warlock',
    baseAbilityId: 'reaping_command',
    baseName: 'Mandato de Siega',
    evolutionAbilityId: 'hf_unholy_dominion_01',
    evolutionName: 'Dominio Profano',
    state: 'PRODUCTION_READY',
    authority: 'CLAUDE_SIM',
    doctrine: 'SAME_SKILL_AMPLIFIED',
  },
] as const;
""")

# ---------------------------------------------------------------------------
# Premium presentation, same contract as Pack 01: bespoke VFX identity,
# donor-routed animation/SFX, SIM-only damage authority, mobile budgeted.
# ---------------------------------------------------------------------------
rep(
    "src/highfly/presentation_adapter.ts",
    """  moonlash: {
    animationRoute: 'moonseed',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'moonlash',
    sfxRoute: 'arcane_surge',
  },
};""",
    """  moonlash: {
    animationRoute: 'moonseed',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'moonlash',
    sfxRoute: 'arcane_surge',
  },
  hf_radiant_sanctuary_01: {
    animationRoute: 'consecration',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'hf_radiant_sanctuary_01',
    sfxRoute: 'consecration',
  },
  hf_shadow_hunt_01: {
    animationRoute: 'ambush',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'hf_shadow_hunt_01',
    sfxRoute: 'ambush',
  },
  hf_primordial_cataclysm_01: {
    animationRoute: 'earthquake',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'hf_primordial_cataclysm_01',
    sfxRoute: 'earthquake',
  },
  hf_unholy_dominion_01: {
    animationRoute: 'reaping_command',
    visualHitMoments: [{ event: 'impact', normalizedTime: 1 }],
    vfxRoute: 'hf_unholy_dominion_01',
    sfxRoute: 'reaping_command',
  },
};""",
)

write("src/highfly/production_pack02_vfx_specs.ts", """import type { AbilityVfxFullSpec, AbilityVfxSpec } from '../render/ability_vfx_core';

export const HF_RADIANT_SANCTUARY_VFX_SPEC: AbilityVfxSpec = {
  c: '#ffd85a', p: 'gold', pw: 1.45, sp: 38, rg: 2, vr: 1, li: 1.35, lg: 3.2, wu: 0.4, a: 'nova',
};
export const HF_RADIANT_SANCTUARY_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'nova', palette: 'gold', power: 1.45, windup: 0.4, windupStyle: 'runes',
  motifs: ['pillars', 'cross'], motifAt: 'caster', nova: { radius: 10 },
  impact: { vRing: true, sparks: 38, light: 1.35 }, decal: 'rune', linger: 3.2,
  rim: '#fff2a8', tint: '#ffd85a', accent: '#ffffff', hot: 0.2,
};

export const HF_SHADOW_HUNT_VFX_SPEC: AbilityVfxSpec = {
  c: '#8b5cff', p: 'shadow', pw: 1.35, sp: 32, vr: 1, bl: 1, li: 0.9, lg: 1.2, wu: 0.18, fin: 1, a: 'strike',
};
export const HF_SHADOW_HUNT_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'strike', palette: 'shadow', power: 1.35, windup: 0.18, windupStyle: 'weapon',
  motifs: ['chains'], motifAt: 'target', strike: { swings: 1, arc: 'thrust', bleed: true },
  impact: { vRing: true, sparks: 32, light: 0.9, trail: 'riposte' }, linger: 1.2,
  rim: '#c6a8ff', tint: '#6f42d9', accent: '#f1e8ff', finisher: true,
};

export const HF_PRIMORDIAL_CATACLYSM_VFX_SPEC: AbilityVfxSpec = {
  c: '#7ccf58', p: 'nature', pw: 1.55, sp: 46, rg: 2.2, vr: 1, db: 1, sm: 1, li: 1.25, lg: 2.4, wu: 0.35, a: 'burst',
};
export const HF_PRIMORDIAL_CATACLYSM_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'burst', palette: 'nature', power: 1.55, windup: 0.35, windupStyle: 'compression',
  motifs: ['fissure', 'pillars'], motifAt: 'target', burst: { style: 'ground' },
  impact: { vRing: true, sparks: 46, debris: true, smoke: true, light: 1.25 },
  decal: 'crack', linger: 2.4, rim: '#d2ff9e', tint: '#74c94b', accent: '#f4ffd9', hot: 0.16,
};

export const HF_UNHOLY_DOMINION_VFX_SPEC: AbilityVfxSpec = {
  c: '#9a62ff', p: 'shadow', pw: 1.5, sp: 42, rg: 1.5, vr: 1, sm: 1, li: 1.25, lg: 2.2, wu: 0.3, a: 'shout',
};
export const HF_UNHOLY_DOMINION_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'shout', palette: 'shadow', power: 1.5, windup: 0.3, windupStyle: 'runes',
  motifs: ['chains', 'implosion'], motifAt: 'target', shout: { radius: 9, target: true },
  impact: { vRing: true, sparks: 42, smoke: true, light: 1.25 }, decal: 'portal', linger: 2.2,
  rim: '#d8c2ff', tint: '#7d43d6', accent: '#f2e8ff', hot: 0.2,
};
""")

rep(
    "src/render/ability_vfx_registry.ts",
    """import { highflyPresentationRoute } from '../highfly/presentation_adapter';""",
    """import {
  HF_PRIMORDIAL_CATACLYSM_VFX_FULL_SPEC,
  HF_PRIMORDIAL_CATACLYSM_VFX_SPEC,
  HF_RADIANT_SANCTUARY_VFX_FULL_SPEC,
  HF_RADIANT_SANCTUARY_VFX_SPEC,
  HF_SHADOW_HUNT_VFX_FULL_SPEC,
  HF_SHADOW_HUNT_VFX_SPEC,
  HF_UNHOLY_DOMINION_VFX_FULL_SPEC,
  HF_UNHOLY_DOMINION_VFX_SPEC,
} from '../highfly/production_pack02_vfx_specs';
import { highflyPresentationRoute } from '../highfly/presentation_adapter';""",
)
rep(
    "src/render/ability_vfx_registry.ts",
    """  if (abilityId === 'moonlash') return HF_MOONLASH_VFX_SPEC;""",
    """  if (abilityId === 'moonlash') return HF_MOONLASH_VFX_SPEC;
  if (abilityId === 'hf_radiant_sanctuary_01') return HF_RADIANT_SANCTUARY_VFX_SPEC;
  if (abilityId === 'hf_shadow_hunt_01') return HF_SHADOW_HUNT_VFX_SPEC;
  if (abilityId === 'hf_primordial_cataclysm_01') return HF_PRIMORDIAL_CATACLYSM_VFX_SPEC;
  if (abilityId === 'hf_unholy_dominion_01') return HF_UNHOLY_DOMINION_VFX_SPEC;""",
)
rep(
    "src/render/ability_vfx_registry.ts",
    """  if (abilityId === 'moonlash') return HF_MOONLASH_VFX_FULL_SPEC;""",
    """  if (abilityId === 'moonlash') return HF_MOONLASH_VFX_FULL_SPEC;
  if (abilityId === 'hf_radiant_sanctuary_01') return HF_RADIANT_SANCTUARY_VFX_FULL_SPEC;
  if (abilityId === 'hf_shadow_hunt_01') return HF_SHADOW_HUNT_VFX_FULL_SPEC;
  if (abilityId === 'hf_primordial_cataclysm_01') return HF_PRIMORDIAL_CATACLYSM_VFX_FULL_SPEC;
  if (abilityId === 'hf_unholy_dominion_01') return HF_UNHOLY_DOMINION_VFX_FULL_SPEC;""",
)

write("src/highfly/production_pack02_presentation.ts", """export interface HighflyProductionPack02Presentation {
  abilityId: string;
  familyId: string;
  animation: 'DONOR_ROUTED';
  vfx: 'BESPOKE';
  sfx: 'DONOR_ROUTED';
  camera: 'GENERIC_SPECTACLE' | 'NONE';
  mobileBudgeted: true;
  damageAuthority: 'SIM_ONLY';
}

export const HIGHFLY_PRODUCTION_PACK02_PRESENTATION: readonly HighflyProductionPack02Presentation[] = [
  { abilityId: 'hf_radiant_sanctuary_01', familyId: 'paladin_consecration', animation: 'DONOR_ROUTED', vfx: 'BESPOKE', sfx: 'DONOR_ROUTED', camera: 'GENERIC_SPECTACLE', mobileBudgeted: true, damageAuthority: 'SIM_ONLY' },
  { abilityId: 'hf_shadow_hunt_01', familyId: 'rogue_ambush', animation: 'DONOR_ROUTED', vfx: 'BESPOKE', sfx: 'DONOR_ROUTED', camera: 'NONE', mobileBudgeted: true, damageAuthority: 'SIM_ONLY' },
  { abilityId: 'hf_primordial_cataclysm_01', familyId: 'shaman_faultwake', animation: 'DONOR_ROUTED', vfx: 'BESPOKE', sfx: 'DONOR_ROUTED', camera: 'GENERIC_SPECTACLE', mobileBudgeted: true, damageAuthority: 'SIM_ONLY' },
  { abilityId: 'hf_unholy_dominion_01', familyId: 'warlock_reaping_command', animation: 'DONOR_ROUTED', vfx: 'BESPOKE', sfx: 'DONOR_ROUTED', camera: 'GENERIC_SPECTACLE', mobileBudgeted: true, damageAuthority: 'SIM_ONLY' },
] as const;
""")

write("tests/highfly_production_pack02.test.ts", """import { describe, expect, it } from 'vitest';
import { HIGHFLY_PRODUCTION_PACK_02 } from '../src/highfly/production_pack02';
import { HIGHFLY_PRODUCTION_PACK02_PRESENTATION } from '../src/highfly/production_pack02_presentation';
import { highflyPresentationRoute } from '../src/highfly/presentation_adapter';
import { abilityVfxFullSpec } from '../src/render/ability_vfx_registry';
import { THUNDER_VENTS } from '../src/sim/combat/shaman_thundercall';
import { ABILITIES, CLASSES } from '../src/sim/data';

describe('HIGHFLY Production Pack 02 - four missing classes', () => {
  it('pins exactly Paladin, Rogue, Shaman and Warlock on Claude sim authority', () => {
    expect(HIGHFLY_PRODUCTION_PACK_02).toHaveLength(4);
    expect(HIGHFLY_PRODUCTION_PACK_02.map((f) => f.classId).sort()).toEqual(
      ['paladin', 'rogue', 'shaman', 'warlock'],
    );
    expect(HIGHFLY_PRODUCTION_PACK_02.every((f) => f.authority === 'CLAUDE_SIM')).toBe(true);
    expect(HIGHFLY_PRODUCTION_PACK_02.every((f) => f.doctrine === 'SAME_SKILL_AMPLIFIED')).toBe(true);
  });

  it('registers every EVO in the real class kit but keeps it progression-hidden', () => {
    for (const family of HIGHFLY_PRODUCTION_PACK_02) {
      expect(CLASSES[family.classId].abilities).toContain(family.evolutionAbilityId);
      expect(ABILITIES[family.evolutionAbilityId]).toBeTruthy();
      expect(ABILITIES[family.evolutionAbilityId].hiddenFromPlayer).toBe(true);
    }
  });

  it('Paladin EVO is the same Consecration family, expanded rather than replaced', () => {
    const base = ABILITIES.consecration.effects.find((e) => e.type === 'groundAoE');
    const evo = ABILITIES.hf_radiant_sanctuary_01.effects.find((e) => e.type === 'groundAoE');
    expect(base).toMatchObject({ radius: 6, duration: 9, interval: 1, devotionOnFirstHit: 1 });
    expect(evo).toMatchObject({ radius: 8, duration: 10, interval: 1, devotionOnFirstHit: 1 });
  });

  it('Rogue EVO preserves the true Ambush contract and amplifies its reward', () => {
    const base = ABILITIES.ambush;
    const evo = ABILITIES.hf_shadow_hunt_01;
    const baseHit = base.effects.find((e) => e.type === 'weaponStrike');
    const evoHit = evo.effects.find((e) => e.type === 'weaponStrike');
    expect(evo.requiresStealth).toBe(true);
    expect(evo.awardsCombo).toBe(2);
    expect(evoHit?.requiresBehind).toBe(true);
    expect(evoHit?.weaponMult).toBeGreaterThan(baseHit?.weaponMult ?? 0);
  });

  it('Shaman EVO stays on the same Thundercall vent and expands Faultwake', () => {
    const evo = ABILITIES.hf_primordial_cataclysm_01.effects.find((e) => e.type === 'groundAoE');
    expect(THUNDER_VENTS.has('earthquake')).toBe(true);
    expect(THUNDER_VENTS.has('hf_primordial_cataclysm_01')).toBe(true);
    expect(evo).toMatchObject({ radius: 10, duration: 6, interval: 1.5 });
  });

  it('Warlock EVO reuses Reaping Command then adds a short undead empowerment tail', () => {
    const effects = ABILITIES.hf_unholy_dominion_01.effects;
    expect(effects.some((e) => e.type === 'reapingCommand')).toBe(true);
    expect(effects.find((e) => e.type === 'commandUndead')).toMatchObject({
      duration: 6,
      dmgPct: 0.15,
      hastePct: 0.1,
    });
  });

  it('gives all four EVOs bespoke VFX while keeping damage authority in the sim', () => {
    expect(HIGHFLY_PRODUCTION_PACK02_PRESENTATION).toHaveLength(4);
    for (const row of HIGHFLY_PRODUCTION_PACK02_PRESENTATION) {
      expect(row.damageAuthority).toBe('SIM_ONLY');
      expect(row.mobileBudgeted).toBe(true);
      expect(row.vfx).toBe('BESPOKE');
      expect(abilityVfxFullSpec(row.abilityId)).toBeTruthy();
      expect(highflyPresentationRoute(row.abilityId, 'vfx')).toBe(row.abilityId);
    }
  });
});
""")

write("tests/highfly_production_pack02_freeze.test.ts", """import { describe, expect, it } from 'vitest';
import { HIGHFLY_PRODUCTION_PACK_01 } from '../src/highfly/production_pack01';
import { HIGHFLY_PRODUCTION_PACK_02 } from '../src/highfly/production_pack02';
import { ABILITIES } from '../src/sim/data';

describe('HIGHFLY 9/9 BASE+EVO freeze gate', () => {
  it('covers all nine audited classes exactly once across Pack 01 + Pack 02', () => {
    const classes = [...HIGHFLY_PRODUCTION_PACK_01, ...HIGHFLY_PRODUCTION_PACK_02]
      .map((f) => f.classId)
      .sort();
    expect(classes).toEqual(
      ['druid', 'hunter', 'mage', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'],
    );
    expect(new Set(classes).size).toBe(9);
  });

  it('keeps all Pack 02 EVO endpoints hidden until HIGHFLY progression swaps them', () => {
    for (const family of HIGHFLY_PRODUCTION_PACK_02) {
      expect(ABILITIES[family.evolutionAbilityId].hiddenFromPlayer).toBe(true);
    }
  });

  it('does not introduce Mutation or Unique endpoints into the BASE+EVO production gate', () => {
    const ids = HIGHFLY_PRODUCTION_PACK_02.flatMap((f) => [f.baseAbilityId, f.evolutionAbilityId]);
    expect(ids.some((id) => /mutation|unique|titan|phoenix|valkyr/i.test(id))).toBe(false);
  });
});
""")

print("HIGHFLY_PRODUCTION_PACK02_RUN0A=1")
