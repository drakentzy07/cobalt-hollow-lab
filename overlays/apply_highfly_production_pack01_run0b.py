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
        raise SystemExit(f"{path}: expected 1 anchor, found {n}: {old[:120]!r}")
    write(path, text.replace(old, new, 1))

# ---------------------------------------------------------------------------
# Hunter EVO — Prisión del Cazador
# Same Frostjaw runtime, but the evolved trap roots every hostile caught in
# the trigger field. Base still roots only the triggering enemy unless the
# existing Binding talent is active.
# ---------------------------------------------------------------------------
rep(
    "src/sim/types.ts",
    """      slowMult: number;
      slowDuration: number;
    }
  // Ice Block:""",
    """      slowMult: number;
      slowDuration: number;
      rootAll?: boolean;
    }
  // Ice Block:""",
)
rep(
    "src/sim/entity_roster.ts",
    """    rootInstead?: boolean;
    slowMult?: number;
    slowDuration?: number;
  };""",
    """    rootInstead?: boolean;
    slowMult?: number;
    slowDuration?: number;
    rootAll?: boolean;
  };""",
)
rep(
    "src/sim/combat/hunter_trap.ts",
    """  slowMult: number;
  slowDuration: number;
}""",
    """  slowMult: number;
  slowDuration: number;
  rootAll?: boolean;
}""",
)
rep(
    "src/sim/combat/hunter_trap.ts",
    """      rootInstead: true,
      slowMult: effect.slowMult,
      slowDuration: effect.slowDuration,
""",
    """      rootInstead: true,
      slowMult: effect.slowMult,
      slowDuration: effect.slowDuration,
      rootAll: effect.rootAll,
""",
)
rep(
    "src/sim/combat/hunter_trap.ts",
    """export function tickHunterTrap(ctx: SimContext, effect: GroundAoE): void {""",
    """export function frostjawRootsEnemy(
  rootAll: boolean | undefined,
  binding: boolean,
  enemyId: number,
  triggerId: number,
): boolean {
  return rootAll === true || binding || enemyId === triggerId;
}

export function tickHunterTrap(ctx: SimContext, effect: GroundAoE): void {""",
)
rep(
    "src/sim/combat/hunter_trap.ts",
    """        if (binding || enemy.id === target.id) {""",
    """        if (frostjawRootsEnemy(trap.rootAll, binding, enemy.id, target.id)) {""",
)

# Keep EVO defs registered in the real class kit but hidden until the HIGHFLY
# progression layer swaps BASE -> EVO; this avoids exposing duplicate buttons.
rep(
    "src/sim/content/classes.ts",
    """      'frostjaw_trap',
      'tame_beast',""",
    """      'frostjaw_trap',
      'hf_hunter_prison_01',
      'tame_beast',""",
)
rep(
    "src/sim/content/classes.ts",
    """  // ====================== PRIEST ======================""",
    """  hf_hunter_prison_01: {
    id: 'hf_hunter_prison_01',
    name: 'Prisión del Cazador',
    class: 'hunter',
    hiddenFromPlayer: true,
    learnLevel: 11,
    cost: 0,
    castTime: 0,
    cooldown: 30,
    range: 30,
    school: 'frost',
    requiresTarget: false,
    effects: [
      {
        type: 'frostjawTrap',
        radius: 5,
        armTime: 0.75,
        lifetime: 30,
        rootDuration: 3,
        slowMult: 0.5,
        slowDuration: 4,
        rootAll: true,
      },
    ],
    description:
      'Evolución de Trampa Colmillo Helado: al activarse, encierra con raíces de hielo a todos los enemigos dentro del campo y ralentiza el área.',
  },

  // ====================== PRIEST ======================""",
)

# ---------------------------------------------------------------------------
# Mage EVO — Lanza del Fénix
# Same heavy projectile + Hot Streak authority. The DoT keeps the SAME total
# damage budget as Pyrelance, but compresses it from 12s/2s into 6s/1s so the
# evolution changes payout timing rather than simply inflating damage.
# ---------------------------------------------------------------------------
rep(
    "src/sim/content/classes.ts",
    """      'pyroblast',
      'flamestrike',""",
    """      'pyroblast',
      'hf_phoenix_lance_01',
      'flamestrike',""",
)
rep(
    "src/sim/content/classes.ts",
    """  // ---- Chronomancy (healer) Phase 1 kit, docs/prd/mage-chronomancy.md ----""",
    """  hf_phoenix_lance_01: {
    id: 'hf_phoenix_lance_01',
    specs: ['fire'],
    hiddenFromPlayer: true,
    name: 'Lanza del Fénix',
    class: 'mage',
    learnLevel: 5,
    cost: 125,
    castTime: 6.0,
    cooldown: 0,
    range: 30,
    school: 'fire',
    requiresTarget: true,
    projectileFx: 'heavyBolt',
    effects: [
      { type: 'directDamage', min: 179, max: 236 },
      { type: 'dot', total: 50, duration: 6, interval: 1, auraId: 'hf_phoenix_burn' },
    ],
    description:
      'Evolución de Lanza Pírica: conserva el golpe pesado y comprime la misma quemadura en una combustión corta de 6 sec.',
  },

  // ---- Chronomancy (healer) Phase 1 kit, docs/prd/mage-chronomancy.md ----""",
)
rep(
    "src/sim/combat/fire_mage.ts",
    """  'pyroblast',
  'flamestrike',""",
    """  'pyroblast',
  'hf_phoenix_lance_01',
  'flamestrike',""",
)
rep(
    "src/sim/combat/fire_mage.ts",
    """export const HOT_STREAK_SPENDERS: readonly string[] = ['pyroblast', 'flamestrike'];""",
    """export const HOT_STREAK_SPENDERS: readonly string[] = [
  'pyroblast',
  'hf_phoenix_lance_01',
  'flamestrike',
];""",
)

# ---------------------------------------------------------------------------
# Priest EVO — Pacto Viviente
# Same absorb + Doctrine link. Unlike BASE, Doctrine conversion always refills
# this EVO shield by 20% of effective healing up to the original absorb, using
# the same value2 ceiling already owned by Living Covenant.
# ---------------------------------------------------------------------------
rep(
    "src/sim/content/classes.ts",
    """      'power_word_shield',
      'renew',""",
    """      'power_word_shield',
      'hf_living_covenant_01',
      'renew',""",
)
rep(
    "src/sim/content/classes.ts",
    """  renew: {""",
    """  hf_living_covenant_01: {
    id: 'hf_living_covenant_01',
    name: 'Pacto Viviente',
    class: 'priest',
    hiddenFromPlayer: true,
    learnLevel: 4,
    cost: 45,
    castTime: 0,
    cooldown: 6,
    range: 30,
    school: 'holy',
    requiresTarget: true,
    targetType: 'friendly',
    effects: [{ type: 'absorb', amount: 48, duration: 30 }],
    ranks: [
      { rank: 2, level: 12, cost: 70, effects: [{ type: 'absorb', amount: 90, duration: 30 }] },
      { rank: 3, level: 18, cost: 100, effects: [{ type: 'absorb', amount: 145, duration: 30 }] },
      { rank: 4, level: 20, cost: 130, effects: [{ type: 'absorb', amount: 210, duration: 30 }] },
    ],
    description:
      'Evolución de Salmo Protector: crea el vínculo de Doctrina y la curación convertida restaura parcialmente este mismo escudo hasta su valor original.',
  },
  renew: {""",
)
rep(
    "src/sim/combat/priest/doctrine.ts",
    """const DOCTRINE_DAMAGE_ABILITIES = new Set(['smite', 'scouring_mercy']);""",
    """const DOCTRINE_DAMAGE_ABILITIES = new Set(['smite', 'scouring_mercy']);
const DOCTRINE_SHIELD_ABILITY_IDS = new Set(['power_word_shield', 'hf_living_covenant_01']);

export function doctrineShieldRefillsFromConversion(
  shieldAbilityId: string,
  hasLivingCovenantTalent: boolean,
): boolean {
  return shieldAbilityId === 'hf_living_covenant_01' || hasLivingCovenantTalent;
}""",
)
rep(
    "src/sim/combat/priest/doctrine.ts",
    """  if (abilityId === 'power_word_shield' && target && !target.dead) {
    const shield = target.auras.find(
      (aura) => aura.id === 'power_word_shield' && aura.sourceId === priest.id,
    );""",
    """  if (DOCTRINE_SHIELD_ABILITY_IDS.has(abilityId) && target && !target.dead) {
    const shield = target.auras.find(
      (aura) => aura.id === abilityId && aura.sourceId === priest.id,
    );""",
)
rep(
    "src/sim/combat/priest/doctrine.ts",
    """      if (hasPriestTalent(ctx, source, PRIEST_TALENT_IDS.livingCovenant) && healed > 0) {
        const shield = ally.auras.find(
          (aura) => aura.id === 'power_word_shield' && aura.sourceId === source.id,
        );
        if (shield && shield.value2 !== undefined) {
          shield.value = Math.min(shield.value2, shield.value + Math.round(healed * 0.2));
        }
      }""",
    """      if (healed > 0) {
        const shield = ally.auras.find(
          (aura) => DOCTRINE_SHIELD_ABILITY_IDS.has(aura.id) && aura.sourceId === source.id,
        );
        const livingTalent = hasPriestTalent(ctx, source, PRIEST_TALENT_IDS.livingCovenant);
        if (
          shield &&
          shield.value2 !== undefined &&
          doctrineShieldRefillsFromConversion(shield.id, livingTalent)
        ) {
          shield.value = Math.min(shield.value2, shield.value + Math.round(healed * 0.2));
        }
      }""",
)

# Promote the three remaining families in the pack manifest.
rep(
    "src/highfly/production_pack01.ts",
    """    evolutionAbilityId: null,
    evolutionName: 'Prisión del Cazador',
    state: 'EVO_ADAPT_NEXT',""",
    """    evolutionAbilityId: 'hf_hunter_prison_01',
    evolutionName: 'Prisión del Cazador',
    state: 'PRODUCTION_READY',""",
)
rep(
    "src/highfly/production_pack01.ts",
    """    evolutionAbilityId: null,
    evolutionName: 'Lanza del Fénix',
    state: 'EVO_ADAPT_NEXT',""",
    """    evolutionAbilityId: 'hf_phoenix_lance_01',
    evolutionName: 'Lanza del Fénix',
    state: 'PRODUCTION_READY',""",
)
rep(
    "src/highfly/production_pack01.ts",
    """    evolutionAbilityId: null,
    evolutionName: 'Pacto Viviente',
    state: 'EVO_ADAPT_NEXT',""",
    """    evolutionAbilityId: 'hf_living_covenant_01',
    evolutionName: 'Pacto Viviente',
    state: 'PRODUCTION_READY',""",
)

write("tests/highfly_production_pack01_run0b.test.ts", """import { describe, expect, it } from 'vitest';
import { frostjawRootsEnemy } from '../src/sim/combat/hunter_trap';
import {
  HOT_STREAK_BUILDERS,
  HOT_STREAK_SPENDERS,
} from '../src/sim/combat/fire_mage';
import { doctrineShieldRefillsFromConversion } from '../src/sim/combat/priest/doctrine';
import { HIGHFLY_PRODUCTION_PACK_01 } from '../src/highfly/production_pack01';
import { ABILITIES } from '../src/sim/data';

describe('HIGHFLY Production Pack 01 RUN0B - real EVO mechanics', () => {
  it('Hunter EVO changes trap behavior: base roots trigger, Prison roots the field', () => {
    const base = ABILITIES.frostjaw_trap.effects.find((e) => e.type === 'frostjawTrap');
    const evo = ABILITIES.hf_hunter_prison_01.effects.find((e) => e.type === 'frostjawTrap');
    expect(base?.rootAll).not.toBe(true);
    expect(evo?.rootAll).toBe(true);
    expect(frostjawRootsEnemy(false, false, 2, 1)).toBe(false);
    expect(frostjawRootsEnemy(false, false, 1, 1)).toBe(true);
    expect(frostjawRootsEnemy(true, false, 2, 1)).toBe(true);
  });

  it('Mage EVO keeps the damage budget but compresses the burn and remains a Hot Streak spender', () => {
    const base = ABILITIES.pyroblast;
    const evo = ABILITIES.hf_phoenix_lance_01;
    const baseDot = base.effects.find((e) => e.type === 'dot');
    const evoDot = evo.effects.find((e) => e.type === 'dot');
    expect(evo.projectileFx).toBe('heavyBolt');
    expect(evo.effects.find((e) => e.type === 'directDamage')).toEqual(
      base.effects.find((e) => e.type === 'directDamage'),
    );
    expect(evoDot?.total).toBe(baseDot?.total);
    expect(evoDot?.duration).toBe(6);
    expect(evoDot?.interval).toBe(1);
    expect(HOT_STREAK_BUILDERS).toContain('hf_phoenix_lance_01');
    expect(HOT_STREAK_SPENDERS).toContain('hf_phoenix_lance_01');
  });

  it('Priest EVO owns Living Covenant refill without granting it to BASE', () => {
    expect(doctrineShieldRefillsFromConversion('power_word_shield', false)).toBe(false);
    expect(doctrineShieldRefillsFromConversion('power_word_shield', true)).toBe(true);
    expect(doctrineShieldRefillsFromConversion('hf_living_covenant_01', false)).toBe(true);
    expect(ABILITIES.hf_living_covenant_01.effects.some((e) => e.type === 'absorb')).toBe(true);
  });

  it('moves all five families out of EVO_ADAPT_NEXT', () => {
    expect(HIGHFLY_PRODUCTION_PACK_01.some((f) => f.state === 'EVO_ADAPT_NEXT')).toBe(false);
    expect(
      HIGHFLY_PRODUCTION_PACK_01.filter((f) => f.state === 'PRODUCTION_READY').map((f) => f.classId),
    ).toEqual(expect.arrayContaining(['warrior', 'hunter', 'mage', 'priest']));
  });

  it('keeps EVO ids hidden until the HIGHFLY progression layer performs the swap', () => {
    expect(ABILITIES.hf_hunter_prison_01.hiddenFromPlayer).toBe(true);
    expect(ABILITIES.hf_phoenix_lance_01.hiddenFromPlayer).toBe(true);
    expect(ABILITIES.hf_living_covenant_01.hiddenFromPlayer).toBe(true);
  });
});
""")

# ---------------------------------------------------------------------------
# Update previous-stage assertions after promotion. These tests still protect
# the original contracts, but they must assert the evolved state instead of
# expecting RUN0A's temporary "pending adaptation" markers or a literal
# single-id Doctrine branch.
# ---------------------------------------------------------------------------
rep(
    "tests/highfly_validation_pack01.test.ts",
    """    expect(source).toContain("abilityId === 'power_word_shield'");
    expect(source).toContain('placeDoctrineLink');""",
    """    expect(source).toContain('DOCTRINE_SHIELD_ABILITY_IDS.has(abilityId)');
    expect(source).toContain("'power_word_shield'");
    expect(source).toContain('placeDoctrineLink');""",
)

rep(
    "tests/highfly_production_pack01.test.ts",
    """  it('marks Hunter, Mage and Priest for same-runtime EVO adaptation, not duplicate systems', () => {
    const next = HIGHFLY_PRODUCTION_PACK_01.filter((f) => f.state === 'EVO_ADAPT_NEXT');
    expect(next.map((f) => f.classId).sort()).toEqual(['hunter', 'mage', 'priest']);
    expect(next.every((f) => f.evolutionAbilityId === null)).toBe(true);
  });""",
    """  it('promotes Hunter, Mage and Priest through same-runtime EVO adaptations', () => {
    const promoted = HIGHFLY_PRODUCTION_PACK_01.filter((f) =>
      ['hunter', 'mage', 'priest'].includes(f.classId),
    );
    expect(promoted.every((f) => f.state === 'PRODUCTION_READY')).toBe(true);
    expect(promoted.map((f) => f.evolutionAbilityId).sort()).toEqual(
      ['hf_hunter_prison_01', 'hf_living_covenant_01', 'hf_phoenix_lance_01'].sort(),
    );
  });""",
)

print("HIGHFLY_PRODUCTION_PACK01_RUN0B=1")
