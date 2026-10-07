from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

mobile = Path("src/game/mobile_controls.ts")
replace_once(
    mobile,
    """    this.bindButton('mobile-bar-editor', () => this.callbacks.onMenu());""",
    """    this.bindButton('mobile-bar-editor', () => {
      this.closeMoreModal();
      window.dispatchEvent(new CustomEvent('highfly:mobile-settings'));
    });""",
    "C2.8 mobile HIGHFLY settings route",
)

print("HIGHFLY_GAME_C28_MOBILE_HUD_EDITOR_APPLIED=1")
