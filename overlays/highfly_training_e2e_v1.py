from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

main = Path("src/main.ts")
entity = Path("src/sim/entity.ts")

# Shared stat engine seam: Claude computes the full donor baseline first, then
# HIGHFLY applies only to the explicitly bound local Hunter.
entity_text = entity.read_text(encoding="utf-8")
combat_import = "import { applyActiveTrainingBridgeToEntity } from '../highfly/training/combat_runtime';\n"
if combat_import not in entity_text:
    entity.write_text(combat_import + entity_text, encoding="utf-8")

replace_once(
    entity,
    """  } else {
    e.resourceType = def.resourceType;
    e.maxResource = 100; // rage, energy, and Focus all cap at 100
    e.resource = Math.min(e.resource, 100);
  }
}
""",
    """  } else {
    e.resourceType = def.resourceType;
    e.maxResource = 100; // rage, energy, and Focus all cap at 100
    e.resource = Math.min(e.resource, 100);
  }

  // HIGHFLY RUN1-H: read-only TrainingBridge AFTER Claude's complete baseline.
  // The adapter is inert unless this exact entity was bound by offline main.ts.
  applyActiveTrainingBridgeToEntity(e);
}
""",
    "entity TrainingBridge seam",
)

replace_once(
    main,
    """import { installHighflyTrainingUi } from './highfly/training/ui';
""",
    """import { installHighflyTrainingUi } from './highfly/training/ui';
import {
  applyActiveTrainingBridgeToEntity,
  bindActiveTrainingCombatEntity,
  setActiveTrainingBridgeFlags,
} from './highfly/training/combat_runtime';
""",
    "combat runtime imports",
)

replace_once(
    main,
    """  const loadedTrainingProfile = getActiveHighflyHunterProfile();
  if (loadedTrainingProfile) {
    setActiveHighflyHunterProfile(
      applyHunterProgression(loadedTrainingProfile, {
        level: sim.player.level,
        xp: sim.xp,
        classId: playerClass,
      }),
    );
  }
""",
    """  const loadedTrainingProfile = getActiveHighflyHunterProfile();
  if (loadedTrainingProfile) {
    setActiveHighflyHunterProfile(
      applyHunterProgression(loadedTrainingProfile, {
        level: sim.player.level,
        xp: sim.xp,
        classId: playerClass,
      }),
    );
  }

  // Bind ONLY the local offline Hunter. Multiplayer/server entities never see
  // this global profile binding. Movement/INT bridges remain separately gated;
  // STR/VIT and PER-derived crit are active after a real calibrated gain.
  bindActiveTrainingCombatEntity(sim.player);
  setActiveTrainingBridgeFlags({
    enabled: true,
    applyMovement: false,
    applyPerception: true,
    applyIntelligence: false,
  });
  applyActiveTrainingBridgeToEntity(sim.player);
""",
    "bind local Training combat bridge",
)

print("HIGHFLY_TRAINING_E2E_V1_APPLIED=1")
