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
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected 1 anchor, found {count}: {old[:100]!r}")
    write(path, text.replace(old, new, 1))

rep("src/sim/content/classes.ts", "    name: 'Vaulting Charge',\n", "    name: 'Salto Heroico',\n")
rep("src/sim/content/classes.ts", "    name: 'Frostjaw Trap',\n", "    name: 'Trampa Colmillo Helado',\n")
rep("src/sim/content/classes.ts", "    name: 'Pyrelance',\n", "    name: 'Lanza Pírica',\n")
rep("src/sim/content/classes.ts", "    name: 'Psalm of Warding',\n", "    name: 'Salmo Protector',\n")
rep("src/sim/content/classes.ts", "    name: 'Moonseed',\n", "    name: 'Semilla Lunar',\n")
rep("src/sim/content/classes.ts", "    name: 'Moonsurge',\n", "    name: 'Oleada Lunar',\n")

write("src/highfly/production_pack01.ts", """export type HighflyProductionState =
  | 'PRODUCTION_READY'
  | 'RUNTIME_EVO_READY'
  | 'EVO_ADAPT_NEXT';

export interface HighflyProductionFamily {
  familyId: string;
  classId: 'warrior' | 'hunter' | 'mage' | 'priest' | 'druid';
  baseAbilityId: string;
  baseName: string;
  evolutionAbilityId: string | null;
  evolutionName: string;
  state: HighflyProductionState;
  authority: 'CLAUDE_SIM';
  notes: string;
}

export const HIGHFLY_PRODUCTION_PACK_01: readonly HighflyProductionFamily[] = [
  {
    familyId: 'warrior_heroic_leap',
    classId: 'warrior',
    baseAbilityId: 'heroic_leap',
    baseName: 'Salto Heroico',
    evolutionAbilityId: 'hf_jump_smash_01',
    evolutionName: 'Salto Demoledor',
    state: 'PRODUCTION_READY',
    authority: 'CLAUDE_SIM',
    notes: 'Position aim, swept travel and landing AoE already execute on the authoritative sim.',
  },
  {
    familyId: 'hunter_frostjaw',
    classId: 'hunter',
    baseAbilityId: 'frostjaw_trap',
    baseName: 'Trampa Colmillo Helado',
    evolutionAbilityId: null,
    evolutionName: 'Prisión del Cazador',
    state: 'EVO_ADAPT_NEXT',
    authority: 'CLAUDE_SIM',
    notes: 'Base trap lifecycle is production-proven; EVO will patch the same trap primitive rather than add a parallel trap system.',
  },
  {
    familyId: 'mage_pyrelance',
    classId: 'mage',
    baseAbilityId: 'pyroblast',
    baseName: 'Lanza Pírica',
    evolutionAbilityId: null,
    evolutionName: 'Lanza del Fénix',
    state: 'EVO_ADAPT_NEXT',
    authority: 'CLAUDE_SIM',
    notes: 'Base heavy projectile, DoT and Hot Streak spender seam are production-proven.',
  },
  {
    familyId: 'priest_psalm',
    classId: 'priest',
    baseAbilityId: 'power_word_shield',
    baseName: 'Salmo Protector',
    evolutionAbilityId: null,
    evolutionName: 'Pacto Viviente',
    state: 'EVO_ADAPT_NEXT',
    authority: 'CLAUDE_SIM',
    notes: 'Base absorb and Doctrine link are production-proven; EVO refill will remain inside Doctrine ownership.',
  },
  {
    familyId: 'druid_moonseed',
    classId: 'druid',
    baseAbilityId: 'moonseed',
    baseName: 'Semilla Lunar',
    evolutionAbilityId: 'moonlash',
    evolutionName: 'Oleada Lunar',
    state: 'RUNTIME_EVO_READY',
    authority: 'CLAUDE_SIM',
    notes: 'One persistent hotbar id transforms through the existing Moontide action-replacement runtime.',
  },
] as const;
""")

write("tests/highfly_production_pack01.test.ts", """import { describe, expect, it } from 'vitest';
import { HIGHFLY_PRODUCTION_PACK_01 } from '../src/highfly/production_pack01';
import { ABILITIES } from '../src/sim/data';

describe('HIGHFLY Production Pack 01', () => {
  it('freezes five different class families on Claude sim authority', () => {
    expect(HIGHFLY_PRODUCTION_PACK_01).toHaveLength(5);
    expect(new Set(HIGHFLY_PRODUCTION_PACK_01.map((f) => f.classId)).size).toBe(5);
    expect(HIGHFLY_PRODUCTION_PACK_01.every((f) => f.authority === 'CLAUDE_SIM')).toBe(true);
    expect(HIGHFLY_PRODUCTION_PACK_01.every((f) => ABILITIES[f.baseAbilityId])).toBe(true);
  });

  it('freezes the approved Spanish base/evolution names without changing stable donor ids', () => {
    expect(ABILITIES.heroic_leap.name).toBe('Salto Heroico');
    expect(ABILITIES.hf_jump_smash_01.name).toBe('Salto Demoledor');
    expect(ABILITIES.frostjaw_trap.name).toBe('Trampa Colmillo Helado');
    expect(ABILITIES.pyroblast.name).toBe('Lanza Pírica');
    expect(ABILITIES.power_word_shield.name).toBe('Salmo Protector');
    expect(ABILITIES.moonseed.name).toBe('Semilla Lunar');
    expect(ABILITIES.moonlash.name).toBe('Oleada Lunar');
  });

  it('keeps Warrior EVO fully authored and Druid EVO on the native replacement runtime', () => {
    const warrior = HIGHFLY_PRODUCTION_PACK_01.find((f) => f.classId === 'warrior')!;
    const druid = HIGHFLY_PRODUCTION_PACK_01.find((f) => f.classId === 'druid')!;
    expect(warrior.state).toBe('PRODUCTION_READY');
    expect(warrior.evolutionAbilityId).toBe('hf_jump_smash_01');
    expect(druid.state).toBe('RUNTIME_EVO_READY');
    expect(druid.evolutionAbilityId).toBe('moonlash');
    expect(ABILITIES.moonseed.actionReplacement).toMatchObject({
      abilityId: 'moonlash',
      auraKind: 'moontide',
      minStacks: 3,
    });
  });

  it('marks Hunter, Mage and Priest for same-runtime EVO adaptation, not duplicate systems', () => {
    const next = HIGHFLY_PRODUCTION_PACK_01.filter((f) => f.state === 'EVO_ADAPT_NEXT');
    expect(next.map((f) => f.classId).sort()).toEqual(['hunter', 'mage', 'priest']);
    expect(next.every((f) => f.evolutionAbilityId === null)).toBe(true);
  });

  it('retains each donor mechanic that Validation Pack 01 proved', () => {
    expect(ABILITIES.frostjaw_trap.effects.some((e) => e.type === 'frostjawTrap')).toBe(true);
    expect(ABILITIES.pyroblast.projectileFx).toBe('heavyBolt');
    expect(ABILITIES.pyroblast.effects.some((e) => e.type === 'dot')).toBe(true);
    expect(ABILITIES.power_word_shield.effects.some((e) => e.type === 'absorb')).toBe(true);
  });
});
""")

print("HIGHFLY_PRODUCTION_PACK01_RUN0A=1")
