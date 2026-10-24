#!/usr/bin/env python3
"""C2-04 narrowly guarded offline training integration with original v0.44.7.
Writes ONLY main.ts, sim/entity.ts, sim/sim.ts; never deletes donor media.
"""
from pathlib import Path
def swap(path, old, new, label):
    p=Path(path);s=p.read_text()
    if s.count(old)!=1:raise SystemExit(f'C204_SEAM_MISMATCH {label}: {s.count(old)}')
    p.write_text(s.replace(old,new,1))
MAIN="src/main.ts"
SIM="src/sim/sim.ts"
ENTITY="src/sim/entity.ts"
header="""import { activateHunterTrainingJournal } from './highfly/training/training_journal';
import { mountHighflyTrainingPanel } from './highfly/training/training_panel';
"""
p=Path(MAIN);p.write_text(header+p.read_text())
swap(MAIN,
"""  const sim = loadSpan(
    'sim-build',
""",
"""  // HIGHFLY C2-04: offline Hunter identity is name-scoped, not class-scoped.
  // Never touch native saves; World and LAB Training diaries remain isolated.
  const highflyWorldMode = new URLSearchParams(location.search).has('hfLab') ? 'lab' : 'world';
  let highflyStorage: Storage | null = null;
  try { highflyStorage = window.localStorage; } catch { /* offline/private mode */ }
  const trainingJournal = activateHunterTrainingJournal(name, highflyWorldMode, highflyStorage);
  const sim = loadSpan(
    'sim-build',
""","native game entry")
swap(MAIN,
"""  sim.setPlayerSkin(sim.playerId, skin);
""",
"""  sim.setPlayerSkin(sim.playerId, skin);
  // Native DerivedStats still owns equipment, buffs and resource formulas.
  // New Training points modify only local primary stats, then recalc ONCE.
  mountHighflyTrainingPanel(trainingJournal, () => sim.refreshHighflyLocalStats(sim.playerId));
""","native training More UI and authority recalc")

p=Path(ENTITY)
p.write_text("import { resolveHunterTrainingPrimary } from '../highfly/training/training_journal';\n"+p.read_text())
swap(ENTITY,
"""  const def = CLASSES[cls];
  const lvl = e.level;
  const s: Stats = {
    str: def.baseStats.str + def.statsPerLevel.str * (lvl - 1),
    agi: def.baseStats.agi + def.statsPerLevel.agi * (lvl - 1),
    sta: def.baseStats.sta + def.statsPerLevel.sta * (lvl - 1),
    int: def.baseStats.int + def.statsPerLevel.int * (lvl - 1),
    spi: def.baseStats.spi + def.statsPerLevel.spi * (lvl - 1),
""",
"""  const def = CLASSES[cls];
  const lvl = e.level;
  // Single additive permanent Training source. Never alter item stats.
  // Name binding plus offline-only activation keeps NPCs unmodified.
  const highflyCore = e.kind === 'player' ? resolveHunterTrainingPrimary(e.name) : null;
  const s: Stats = {
    str: def.baseStats.str + def.statsPerLevel.str * (lvl - 1) + (highflyCore?.STR ?? 0),
    agi: def.baseStats.agi + def.statsPerLevel.agi * (lvl - 1) + (highflyCore?.AGI ?? 0),
    sta: def.baseStats.sta + def.statsPerLevel.sta * (lvl - 1) + (highflyCore?.VIT ?? 0),
    int: def.baseStats.int + def.statsPerLevel.int * (lvl - 1) + (highflyCore?.INT ?? 0),
    spi: def.baseStats.spi + def.statsPerLevel.spi * (lvl - 1) + (highflyCore?.PER ?? 0),
""","native stat seed")

swap(SIM,
"""  private recalcPlayer(target: Entity): void {
""",
"""  /** HIGHFLY C2-04: refresh ONLY local offline Hunter after Training allocation.
   * Native stat pipeline remains the single authority for gear/buffs/resources.
   */
  public refreshHighflyLocalStats(entityId: number): void {
    if (entityId !== this.playerId) return;
    const entity = this.entities.get(entityId);
    if (entity?.kind === 'player') this.recalcPlayer(entity);
  }

  private recalcPlayer(target: Entity): void {
""","native recalc wrapper")
print('HIGHFLY_C204_OFFLINE_TRAINING_WIRED=PASS')
