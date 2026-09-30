from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

main = Path("src/main.ts")
css = Path("src/styles/shell.css")

replace_once(
    main,
    """import {
  getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from './highfly/training/profile_store';
""",
    """import {
  getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from './highfly/training/profile_store';
import { installHighflyTrainingUi } from './highfly/training/ui';
""",
    "training ui import",
)

replace_once(
    main,
    """  setActiveHighflyHunterProfile(
    applyHunterProgression(baseTrainingProfile, { classId: playerClass }),
  );

  const offlineCfg = offlineWorldConfig({
""",
    """  setActiveHighflyHunterProfile(
    applyHunterProgression(baseTrainingProfile, { classId: playerClass }),
  );
  installHighflyTrainingUi();

  const offlineCfg = offlineWorldConfig({
""",
    "install training ui",
)

css_append = r"""

/* ==========================================================================
   HIGHFLY TRAINING RUN1-G — playable Training Core window
   ========================================================================== */
body.mobile-touch #highfly-training-window {
  /* ClaudeCraft's managed-window runtime writes a desktop z-index inline
     (typically 51). Mobile modal sheets such as Bags/Talents intentionally
     override that inline band with !important. Training reuses that exact
     mobile-sheet rule: above backdrop 85 / raised #ui 90, below More 100. */
  z-index: 95 !important;
}

#highfly-training-window .highfly-training-shell {
  display: grid;
  gap: 18px;
  padding: 16px 18px 22px;
  overflow: auto;
  max-height: min(72vh, 620px);
}
#highfly-training-window .hf-training-header,
#highfly-training-window .hf-section-title,
#highfly-training-window .hf-exercise__head,
#highfly-training-window .hf-training-actions,
#highfly-training-window .hf-core-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
#highfly-training-window h3,
#highfly-training-window h4,
#highfly-training-window p {
  margin: 0;
}
#highfly-training-window .hf-eyebrow,
#highfly-training-window .hf-section-title span,
#highfly-training-window small,
#highfly-training-window .hf-core-meta,
#highfly-training-window .hf-training-result__meta {
  opacity: .74;
  font-size: 12px;
}
#highfly-training-window .hf-training-controls {
  display: flex;
  gap: 10px;
  align-items: end;
}
#highfly-training-window label {
  display: grid;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
}
#highfly-training-window input,
#highfly-training-window select,
#highfly-training-window button {
  font: inherit;
}
#highfly-training-window input[type="number"],
#highfly-training-window select {
  width: 76px;
  min-height: 34px;
}
#highfly-training-window .hf-core-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(112px, 1fr));
  gap: 8px;
  margin-top: 8px;
}
#highfly-training-window .hf-core-card,
#highfly-training-window .hf-exercise,
#highfly-training-window .hf-training-result {
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 12px;
  background: rgba(6, 13, 20, .72);
}
#highfly-training-window .hf-core-card {
  padding: 10px;
}
#highfly-training-window .hf-core-current {
  font-size: 24px;
  font-weight: 900;
  margin: 6px 0;
}
#highfly-training-window .hf-core-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 7px;
}
#highfly-training-window .hf-core-badge,
#highfly-training-window .hf-intent {
  font-size: 9px;
  line-height: 1;
  padding: 5px 6px;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
}
#highfly-training-window .hf-core-badge.is-ready {
  background: rgba(95, 211, 122, .18);
}
#highfly-training-window .hf-training-days {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin: 8px 0 10px;
}
#highfly-training-window .hf-training-day {
  display: grid;
  gap: 2px;
  padding: 8px;
  min-height: 48px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
}
#highfly-training-window .hf-training-day.is-selected {
  border-color: rgba(255,255,255,.42);
  background: rgba(255,255,255,.10);
}
#highfly-training-window .hf-training-day span {
  font-size: 10px;
  opacity: .7;
}
#highfly-training-window .hf-exercise-list {
  display: grid;
  gap: 8px;
}
#highfly-training-window .hf-exercise {
  padding: 10px;
}
#highfly-training-window .hf-exercise__head small {
  display: block;
  margin-top: 2px;
}
#highfly-training-window .hf-exercise__inputs {
  display: grid;
  grid-template-columns: repeat(6, minmax(72px, 1fr));
  gap: 7px;
  margin-top: 9px;
}
#highfly-training-window .hf-exercise__inputs input {
  width: 100%;
  box-sizing: border-box;
}
#highfly-training-window #hf-training-register {
  min-height: 38px;
  padding: 0 16px;
  font-weight: 800;
}
#highfly-training-window .hf-training-result {
  padding: 12px;
  margin-top: 8px;
}
#highfly-training-window .hf-training-result__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
#highfly-training-window .hf-training-result__grid > div {
  display: grid;
  gap: 3px;
  text-align: center;
  padding: 8px;
  border-radius: 9px;
  background: rgba(255,255,255,.05);
}
#highfly-training-window .hf-training-result__grid b {
  font-size: 18px;
}
#highfly-training-window .hf-training-result__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 10px;
}
#highfly-training-window .hf-training-empty {
  padding: 10px;
  opacity: .8;
}

@media (max-width: 900px) {
  #highfly-training-window .highfly-training-shell {
    gap: 12px;
    padding: 10px;
    max-height: calc(100vh - 76px);
  }
  #highfly-training-window .hf-training-header {
    align-items: flex-start;
  }
  #highfly-training-window .hf-core-grid {
    grid-template-columns: repeat(5, minmax(90px, 1fr));
  }
  #highfly-training-window .hf-core-card {
    padding: 7px;
  }
  #highfly-training-window .hf-core-current {
    font-size: 19px;
  }
  #highfly-training-window .hf-core-meta {
    grid-template-columns: 1fr;
    font-size: 10px;
  }
  #highfly-training-window .hf-training-days {
    grid-template-columns: repeat(5, minmax(90px, 1fr));
    overflow-x: auto;
  }
  #highfly-training-window .hf-exercise__inputs {
    grid-template-columns: repeat(3, minmax(68px, 1fr));
  }
  #highfly-training-window .hf-training-actions {
    align-items: flex-start;
  }
}
"""
css.write_text(css.read_text(encoding="utf-8") + css_append, encoding="utf-8")

print("HIGHFLY_TRAINING_UI_V1_APPLIED=1")
