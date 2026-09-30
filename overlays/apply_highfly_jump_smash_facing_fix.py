from pathlib import Path

ROOT = Path(".")

def rep(path: str, old: str, new: str) -> None:
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected 1 anchor, found {count}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")

# HIGHFLY Jump Smash owns its travel facing: turn toward the resolved landing
# point before takeoff and preserve that facing through touchdown.
rep(
    "src/sim/combat/heroic_leap.ts",
    """  const landing = sweptLanding(ctx, entity, aim);
  entity.chargeTargetId = null;
""",
    """  const landing = sweptLanding(ctx, entity, aim);
  if (ability.id === 'hf_jump_smash_01') {
    const dx = landing.x - entity.pos.x;
    const dz = landing.z - entity.pos.z;
    if (Math.hypot(dx, dz) > 1e-6) entity.facing = Math.atan2(dx, dz);
  }
  entity.chargeTargetId = null;
""",
)

rep(
    "tests/highfly_jump_smash_full.test.ts",
    """import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
""",
    """import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { Entity, SimEvent } from '../src/sim/types';
""",
)

anchor = """  it('keeps the FULL presentation layer free of damage authority', () => {
"""
addition = """  it('faces the resolved travel direction and applies landing damage only inside the 6m AoE', () => {
    type TestSim = Sim & { nextId: number; addEntity(entity: Entity): void };
    const sim = new Sim({
      seed: 27,
      playerClass: 'warrior',
      autoEquip: true,
      world: EMPTY_TEST_WORLD,
    }) as TestSim;
    sim.setPlayerLevel(20);
    const p = sim.player;
    p.resource = p.maxResource;
    p.gcdRemaining = 0;
    p.facing = 0; // north before a deliberate eastward leap

    const aim = { x: p.pos.x + 8, z: p.pos.z };
    const spawn = (id: number, x: number, z: number): Entity => {
      const mob = createMob(id, MOBS.forest_wolf, 1, sim.groundPos(x, z));
      mob.maxHp = 50000;
      mob.hp = 50000;
      mob.hostile = true;
      mob.aiState = 'idle';
      sim.addEntity(mob);
      return mob;
    };
    sim.castAbility(ID, p.id, aim);
    expect(p.leap).toBeTruthy();
    expect(p.facing).toBeCloseTo(Math.PI / 2, 5);

    // Spawn around the RESOLVED landing, not the raw aim point: the swept leap
    // is allowed to clamp against terrain/colliders, and AoE authority belongs
    // to the actual touchdown position.
    const landing = { ...p.leap!.to };
    const inside = spawn(sim.nextId++, landing.x + 5.5, landing.z);
    const outside = spawn(sim.nextId++, landing.x + 6.5, landing.z);
    const insideHp = inside.hp;
    const outsideHp = outside.hp;

    for (let i = 0; i < 40 && p.leap; i++) sim.tick();

    expect(p.leap).toBeNull();
    expect(p.facing).toBeCloseTo(Math.PI / 2, 5);
    expect(inside.hp).toBeLessThan(insideHp);
    expect(outside.hp).toBe(outsideHp);
  });

"""
rep("tests/highfly_jump_smash_full.test.ts", anchor, addition + anchor)

print("HIGHFLY_JUMP_SMASH_FACING_AOE_FIX=1")
