from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

# ---------------------------------------------------------------------------
# C2.3 A — competitive soft-target hysteresis
# Keep the current soft target for tiny aim jitter, but never let hysteresis
# behave like a hidden lock when a clearly better centred candidate exists.
# ---------------------------------------------------------------------------
main = Path("src/main.ts")

replace_once(
    main,
    """    return dot >= Math.cos((coneDegrees * Math.PI) / 180);
  }

  const padTargetPick = createPadTargetPick({""",
    """    return dot >= Math.cos((coneDegrees * Math.PI) / 180);
  }

  function highflySoftTargetAlignment(id: number | null): number {
    if (id === null) return -1;
    const target = world.entities.get(id);
    if (!target || target.dead) return -1;
    const p = world.player;
    const dx = target.pos.x - p.pos.x;
    const dz = target.pos.z - p.pos.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001) return -1;
    const fx = Math.sin(input.camYaw);
    const fz = Math.cos(input.camYaw);
    return (dx * fx + dz * fz) / distance;
  }

  const padTargetPick = createPadTargetPick({""",
    "C2.3 alignment helper",
)

replace_once(
    main,
    """    // Hysteresis: keep an existing SOFT target while it stays close to camera
    // centre. Small camera/movement jitter must not make the red ring jump.
    if (p.targetId !== null) {
      const current = world.entities.get(p.targetId);
      if (
        current &&
        isAttackableEntity(current, world.playerId, activePvpOpponents) &&
        highflySoftTargetStillAligned(p.targetId)
      ) {
        return;
      }
    }

    const best = bestSoftAutoTarget(
      world.entities.values(),
      p.pos,
      input.camYaw,
      (e) =>
        isAttackableEntity(
          world.entities.get(e.id),
          world.playerId,
          activePvpOpponents,
        ),
    );""",
    """    const best = bestSoftAutoTarget(
      world.entities.values(),
      p.pos,
      input.camYaw,
      (e) =>
        isAttackableEntity(
          world.entities.get(e.id),
          world.playerId,
          activePvpOpponents,
        ),
    );

    // C2.3 competitive hysteresis. The old C2.2 early-return made a target
    // inside ±30° effectively sticky even when another enemy sat on the reticle.
    // Keep the current target only when the challenger is not clearly better.
    if (p.targetId !== null) {
      const current = world.entities.get(p.targetId);
      if (
        current &&
        isAttackableEntity(current, world.playerId, activePvpOpponents) &&
        highflySoftTargetStillAligned(p.targetId)
      ) {
        if (best === null || best === p.targetId) return;
        const currentAlignment = highflySoftTargetAlignment(p.targetId);
        const bestAlignment = highflySoftTargetAlignment(best);
        if (currentAlignment >= bestAlignment - 0.06) return;
      }
    }""",
    "C2.3 competitive hysteresis",
)

# ---------------------------------------------------------------------------
# C2.3 B — Menú > Interfaz > Frames gets a real mobile HUD editor entry.
# Desktop keeps ClaudeCraft's native Unlock Interface unchanged.
# ---------------------------------------------------------------------------
options = Path("src/ui/options_window.ts")
replace_once(
    options,
    """      if (!env.touch && !env.nativeShell) buildInterfaceUnlockRow(body, this.deps);
    }""",
    """      if (!env.touch && !env.nativeShell) buildInterfaceUnlockRow(body, this.deps);
      if (env.touch) {
        const row = document.createElement('div');
        row.className = 'set-row ui-stat-row hf-mobile-hud-editor-row';
        const name = document.createElement('span');
        name.className = 'set-name';
        name.textContent = 'HUD MÓVIL';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn ui-btn ui-btn--plate set-toggle';
        edit.textContent = 'EDITAR HUD MÓVIL';
        edit.addEventListener('click', () => {
          audio.click();
          window.dispatchEvent(new CustomEvent('highfly:mobile-hud-editor'));
        });
        row.append(name, edit);
        body.appendChild(row);
        const note = document.createElement('div');
        note.className = 'set-note hf-mobile-hud-editor-note';
        note.textContent =
          'Mové y escalá S1–S10, especiales, TARGET, ATK/USAR, salto, evasión, utilidades y buffs. La distribución se guarda en este dispositivo.';
        body.appendChild(note);
      }
    }""",
    "C2.3 mobile HUD editor options row",
)

# ---------------------------------------------------------------------------
# C2.3 C — Training keeps its GREEN logic; only mobile presentation changes.
# Remove browser-form feel from calibration/reset controls.
# ---------------------------------------------------------------------------
shell = Path("src/styles/shell.css")
shell.write_text(
    shell.read_text(encoding="utf-8")
    + r"""

/* ==========================================================================
   HIGHFLY GAME-C2.3 — TRAINING MOBILE-NATIVE POLISH
   Presentation only. Training authority / e1RM / cycle logic are untouched.
   ========================================================================== */

body.mobile-touch #highfly-training-window .hf-rm-inputs {
  align-items: end !important;
  gap: 8px !important;
}

body.mobile-touch #highfly-training-window .hf-rm-inputs input,
body.mobile-touch #highfly-training-window .hf-rm-inputs select,
body.mobile-touch #highfly-training-window .hf-athlete-calibration input,
body.mobile-touch #highfly-training-window .hf-athlete-calibration select,
body.mobile-touch #highfly-training-window #hf-cycle-reset-reason {
  min-height: 42px !important;
  border: 1px solid rgba(151, 104, 232, .42) !important;
  border-radius: 9px !important;
  background: linear-gradient(180deg, rgba(19, 14, 32, .98), rgba(11, 8, 21, .98)) !important;
  color: #f1eaff !important;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.025) !important;
}

body.mobile-touch #highfly-training-window button[data-hf-rm-submit],
body.mobile-touch #highfly-training-window #hf-rm-submit-all {
  min-height: 42px !important;
  width: auto !important;
  border: 1px solid rgba(190, 151, 255, .68) !important;
  border-radius: 9px !important;
  background: linear-gradient(180deg, rgba(103, 58, 170, .98), rgba(66, 35, 118, .98)) !important;
  color: #fff7ff !important;
  font-weight: 900 !important;
  letter-spacing: .055em !important;
  box-shadow: 0 7px 18px rgba(31, 14, 58, .34), inset 0 1px rgba(255,255,255,.08) !important;
}

body.mobile-touch #highfly-training-window #hf-rm-submit-all {
  justify-self: start !important;
  margin-top: 12px !important;
  padding-inline: 18px !important;
}

body.mobile-touch #highfly-training-window #hf-cycle-reset-arm {
  min-height: 38px !important;
  width: auto !important;
  padding: 0 14px !important;
  border: 1px solid rgba(226, 111, 132, .38) !important;
  border-radius: 9px !important;
  background: rgba(62, 20, 31, .32) !important;
  color: rgba(255, 190, 202, .92) !important;
  font-weight: 850 !important;
  letter-spacing: .045em !important;
  box-shadow: none !important;
}

body.mobile-touch #highfly-training-window .hf-cycle-reset-confirm {
  margin-top: 10px !important;
  padding: 12px !important;
  border: 1px solid rgba(226, 111, 132, .32) !important;
  border-radius: 10px !important;
  background: linear-gradient(180deg, rgba(39, 14, 23, .68), rgba(16, 9, 17, .72)) !important;
}

body.mobile-touch #highfly-training-window #hf-cycle-reset-cancel,
body.mobile-touch #highfly-training-window #hf-cycle-reset-confirm {
  min-height: 40px !important;
  border-radius: 8px !important;
  font-weight: 850 !important;
}

body.mobile-touch #highfly-training-window #hf-cycle-reset-cancel {
  border: 1px solid rgba(255,255,255,.16) !important;
  background: rgba(255,255,255,.055) !important;
  color: rgba(240,240,245,.88) !important;
}

body.mobile-touch #highfly-training-window #hf-cycle-reset-confirm {
  border: 1px solid rgba(236, 114, 138, .58) !important;
  background: linear-gradient(180deg, rgba(126, 39, 61, .96), rgba(78, 26, 42, .96)) !important;
  color: #fff0f3 !important;
}

body.mobile-touch #highfly-training-window .hf-rm-card {
  border-radius: 11px !important;
  background: linear-gradient(180deg, rgba(18, 15, 30, .84), rgba(10, 9, 18, .9)) !important;
}

@media (max-height: 430px) and (orientation: landscape) {
  body.mobile-touch #highfly-training-window .hf-rm-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
  body.mobile-touch #highfly-training-window .hf-rm-inputs {
    grid-template-columns: minmax(84px, 1fr) 76px auto !important;
  }
}
""",
    encoding="utf-8",
)

print("HIGHFLY_GAME_C23_HUMAN_FIX_APPLIED=1")
