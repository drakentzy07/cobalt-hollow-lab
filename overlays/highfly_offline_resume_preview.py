from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

main = Path("src/main.ts")

# HIGHFLY is offline-first for now: the launcher Play CTA always opens the
# local Hunter flow. Online code remains in the source for a future backend,
# but no stale selector state can route the player into it.
replace_once(
    main,
    """    btnPlay.addEventListener('click', () => {
      if (serverMode === 'offline') handleOfflineSelect();
      else handleOnlineSelect();
    });

    applyServerMode('offline');
""",
    """    btnPlay.addEventListener('click', () => {
      handleOfflineSelect();
    });

    applyServerMode('offline');
""",
    "force launcher Play to offline",
)

# The upstream offline flow always resets to Warrior + blank name. That makes a
# valid persisted save look lost unless the player manually recreates the exact
# class/name identity. HIGHFLY has one primary local Hunter: preselect its
# identity whenever the Offline creator opens, while still leaving the editor
# visible so a fresh install can create normally.
old = """  const handleOfflineSelect = () => {
    // Defensive: inert no-op in production even if some caller reaches this
    // (e.g. a stale E2E script driving the hidden #btn-offline trigger),
    // since the dropdown option and trigger are also not wired below.
    if (!offlineAvailable) return;
    show('#offline-select');

    // Select warrior by default and render details
    const warriorCard = document.querySelector(
      '#offline-select .mini-class[data-class="warrior"]',
    ) as HTMLElement | null;
    if (warriorCard) {
      document.querySelectorAll('#offline-select .mini-class').forEach((c) => {
        c.classList.remove('sel');
        c.setAttribute('aria-pressed', 'false');
      });
      warriorCard.classList.add('sel');
      warriorCard.setAttribute('aria-pressed', 'true');
      renderClassDetails('offline-class-details', 'warrior');
      btnStartOffline.removeAttribute('disabled');
      refreshOfflineSkins('warrior');
    }
  };
"""
new = """  const recoverHighflyOfflinePreview = async (cls: PlayerClass): Promise<void> => {
    try {
      // A cold mobile load can exhaust the preview's first boot retry window.
      // Re-open the character gate on demand when the player actually enters
      // the Offline creator instead of leaving a black stage for the session.
      await charactersReady(5);
      const container = $('#offline-preview-container') as HTMLElement | null;
      const canvas = $('#char-preview-canvas') as HTMLCanvasElement | null;
      if (!container || !canvas) return;
      if (!characterPreview) {
        characterPreview = new CharacterPreview(container, canvas, {
          constrainedMemory: GFX.constrainedMemory,
        });
      } else {
        characterPreview.setContainer(container);
      }
      previewClassBody(cls);
      characterPreview.setSkin(0);
      syncPreviewAfterPanelLayout();
    } catch (err) {
      console.error('[HIGHFLY] offline preview recovery failed', err);
    }
  };

  const selectHighflyOfflineClass = (cls: PlayerClass): void => {
    const card = document.querySelector(
      \`#offline-select .mini-class[data-class="\${cls}"]\`,
    ) as HTMLElement | null;
    if (!card) return;
    document.querySelectorAll('#offline-select .mini-class').forEach((c) => {
      c.classList.remove('sel');
      c.setAttribute('aria-pressed', 'false');
    });
    card.classList.add('sel');
    card.setAttribute('aria-pressed', 'true');
    renderClassDetails('offline-class-details', cls);
    btnStartOffline.removeAttribute('disabled');
    refreshOfflineSkins(cls);
    void recoverHighflyOfflinePreview(cls);
  };

  const handleOfflineSelect = () => {
    if (!offlineAvailable) return;
    show('#offline-select');

    // Restore the primary Hunter's identity before the player presses Enter
    // World. The actual RPG snapshot is restored by startOffline().
    void loadHighflyOfflineSave().then((saved) => {
      const cls = saved?.playerClass ?? 'warrior';
      offlineNameInput.value = saved?.name ?? '';
      selectHighflyOfflineClass(cls);
    });
  };
"""
replace_once(main, old, new, "offline resume and preview recovery")

print("HIGHFLY_OFFLINE_RESUME_PREVIEW_APPLIED=1")
