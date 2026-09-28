from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

main = Path("src/main.ts")
i18n = Path("src/ui/i18n.ts")

replace_once(
    i18n,
    "let currentLanguage: SupportedLanguage = 'en';",
    "let currentLanguage: SupportedLanguage = 'es_ES';",
    "Spanish fallback",
)

replace_once(
    main,
    "    let serverMode: ServerMode = 'online';",
    "    let serverMode: ServerMode = 'offline';",
    "offline-first mode state",
)

replace_once(
    main,
    "    applyServerMode('online');",
    "    applyServerMode('offline');",
    "offline-first initial mode",
)

anchor = """    // Production builds hide the Offline dropdown option outright, so it can
    // neither be selected by mouse/keyboard nor land in serverOptions below.
    if (!offlineAvailable) {
      $('#server-opt-offline')?.setAttribute('hidden', '');
    }
"""
replacement = """    // HIGHFLY RUN0.7 is offline-first until our own backend exists.
    // Keep ClaudeCraft online code intact but remove it from the entry choice.
    $('#server-opt-online')?.setAttribute('hidden', '');
    onlineBtn.setAttribute('hidden', '');
    if (!offlineAvailable) {
      $('#server-opt-offline')?.setAttribute('hidden', '');
    }
"""
replace_once(main, anchor, replacement, "hide online entry surface")

print("HIGHFLY_ENTRY_ES_APPLIED=1")
