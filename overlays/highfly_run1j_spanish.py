from pathlib import Path
import re

locale = Path("src/ui/i18n.locales/es_ES.ts")
text = locale.read_text(encoding="utf-8")

def upsert(key: str, value: str) -> None:
    global text
    escaped_key = re.escape(key)
    pattern = rf"(^\s*'{escaped_key}':\s*)(?:'[^'\\]*(?:\\.[^'\\]*)*'|\n?\s*'[^']*')(,)"
    replacement = rf"\1{value!r}\2"
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE)
    if count:
        text = updated
        return
    marker = "\n};"
    if marker not in text:
        raise SystemExit(f"cannot insert locale key {key}")
    text = text.replace(marker, f"\n  '{key}': {value!r},\n}};", 1)

entries = {
    "seo.title": "HIGHFLY — Entrena · Asciende · Conquista",
    "seo.description": "HIGHFLY combina entrenamiento real y progresión RPG en una experiencia de cazador. Entrena, progresa y lleva tus avances al mundo del juego.",
    "a11y.githubProject": "Abrir el proyecto HIGHFLY en GitHub",
    "loading.world": "Iniciando HIGHFLY...",
    "loading.worldProgress": "Iniciando HIGHFLY... {done}/{total}",
    "loading.enteringWorld": "Entrando a HIGHFLY...",
    "loading.connectingRealm": "Preparando sesión...",
    "mode.offlineTitle": "Jugar HIGHFLY",
    "mode.offlineAria": "Jugar HIGHFLY: iniciar una sesión local del Hunter",
    "auth.enterRealm": "Entrar a HIGHFLY",
    "auth.enterWorld": "Entrar a HIGHFLY",
    "mobilePreflight.title": "HIGHFLY en pantalla completa horizontal",
    "mobilePreflight.continue": "Continuar a HIGHFLY",
    "mobilePreflight.baseLandscape": "Gira el dispositivo a horizontal antes de entrar a HIGHFLY.",
    "mobilePreflight.iosOpenStep": "Abre HIGHFLY desde el nuevo icono de la pantalla de inicio.",
    "mobilePreflight.androidOpenStep": "Abre HIGHFLY desde el nuevo icono.",
}
for key, value in entries.items():
    upsert(key, value)

# Product-surface donor name must not leak through any remaining Spanish shell copy.
text = text.replace("World of ClaudeCraft", "HIGHFLY")
text = text.replace("Claudemoon", "HIGHFLY")

locale.write_text(text, encoding="utf-8")
print("HIGHFLY_RUN1J_SPANISH_SURFACE_APPLIED=1")
