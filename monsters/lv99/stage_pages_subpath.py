#!/usr/bin/env python3
"""P02H: immutable, V4-preserving WebGL monster playtest subpath candidate.
Operates only on current CI donor dist and a NEW local staging folder.
No GitHub Pages write, merge, main branch edits or proprietary assets.
Input: frozen donor native WebGL build (green P02G).
Output: monster-pages-candidate/cobalt-hollow-lab/monster-lab/ ready to add
to the existing Pages artifact as one isolated subtree.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
from pathlib import Path

ORIGIN = Path("upstream/dist")
TARGET = Path("monster-pages-candidate/cobalt-hollow-lab/monster-lab")
REPORT = Path("monster-pages-candidate/monster-lab-manifest.json")
OLD = "/cobalt-hollow-lab/"
NEW = "/cobalt-hollow-lab/monster-lab/"
TEXT_EXTS = {".html", ".js", ".css", ".json", ".webmanifest", ".xml",
             ".mjs", ".svg", ".txt", ".map", ".webpmanifest"}


def sha(path: Path) -> str:
    hash_ = hashlib.sha256()
    with path.open("rb") as fd:
        for chunk in iter(lambda: fd.read(1024 * 1024), b""):
            hash_.update(chunk)
    return hash_.hexdigest()


def main() -> None:
    if not (ORIGIN / "index.html").is_file() or not (ORIGIN / "media").is_dir():
        raise SystemExit("HF_P02H_NATIVE_BUILD_NOT_PRESENT")
    if TARGET.exists() or REPORT.exists():
        raise SystemExit("HF_P02H_REFUSE_OVERWRITE_PREVIEW")
    original = {str(p.relative_to(ORIGIN)): sha(p)
                for p in ORIGIN.rglob("*") if p.is_file()}
    if len(original) < 30:
        raise SystemExit("HF_P02H_ORIGINAL_BUNDLE_INCOMPLETE")
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ORIGIN, TARGET, symlinks=False)
    rewritten_files = 0
    replacements = 0
    for file in TARGET.rglob("*"):
        if not file.is_file() or file.suffix.lower() not in TEXT_EXTS:
            continue
        blob = file.read_bytes()
        try:
            src = blob.decode("utf-8")
        except UnicodeDecodeError:
            raise SystemExit(f"HF_P02H_INVALID_TEXT_FILE:{file}")
        count = src.count(OLD)
        if count:
            dst = src.replace(OLD, NEW)
            file.write_text(dst, encoding="utf-8")
            rewritten_files += 1
            replacements += count
    if rewritten_files < 2 or replacements < 3:
        raise SystemExit(f"HF_P02H_NO_MEANINGFUL_PREFIX_REWRITE:{rewritten_files}:{replacements}")
    index = (TARGET / "index.html").read_text(encoding="utf-8")
    if "<html" not in index.lower() or NEW not in index or OLD+"assets/" in index:
        raise SystemExit("HF_P02H_INDEX_PREFIX_NOT_RELOCATABLE")
    if not (TARGET / "media").is_dir() or not list((TARGET / "media").rglob("*.glb")):
        raise SystemExit("HF_P02H_NATIVE_MONSTERS_MEDIA_MISSING")
    # A responsive pure-static menu for human S23 landscape tests; does not
    # rewrite runtime, bypass level locks or add new character mechanics.
    scenarios = [
        (21, "Umbral de los Aullidos", "21–29"),
        (30, "Marisma del Velo", "30–39"),
        (40, "Desfiladero Colmillo", "40–49"),
        (50, "Tundra del Silencio", "50–59"),
        (60, "Yermo de las Escamas", "60–69"),
        (70, "Jardín Marchito", "70–79"),
        (80, "Cresta del Trueno", "80–89"),
        (90, "Orilla del Abismo", "90–99"),
    ]
    from html import escape
    cards = "\\n".join(
        '<article><div class="zone"><strong>' + escape(name) +
        '</strong><small>Hunter LV' + escape(rng) +
        '</small></div><nav aria-label="Opciones de ' + escape(name) +
        '"><a href="./?hfHunt=' + str(level) + '">Normal</a>' +
        '<a href="./?hfHunt=' + str(level) + '&amp;hfEncounter=elite">Élite</a>' +
        '<a href="./?hfHunt=' + str(level) + '&amp;hfEncounter=captain">Capitán</a>' +
        '</nav></article>' for level, name, rng in scenarios
    )
    html = """<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>HIGHFLY — Monster Lab LV21–99</title><style>
:root{color-scheme:dark;font-family:system-ui,-apple-system,sans-serif}
*{box-sizing:border-box}body{margin:0;background:#080e16;color:#eef4fa;padding:24px 16px 60px}
main{max-width:930px;margin:auto}h1{font-size:clamp(28px,4vw,43px);margin:12px 0}
p{color:#b5c9d7;line-height:1.6} .eyebrow{letter-spacing:.17em;color:#60e0b5;font-weight:700}
article{display:flex;align-items:center;justify-content:space-between;gap:16px;
border:1px solid #293e50;background:#13202e;padding:17px 21px;border-radius:15px;margin:10px 0}
.zone{display:flex;flex-direction:column;gap:7px}.zone strong{font-size:17px}
.zone small{color:#90b3c7}nav{display:flex;gap:8px;flex-wrap:wrap}
a{color:#d9eeff;border:1px solid #406079;text-decoration:none;padding:11px 16px;border-radius:9px;font-weight:650}
a:hover,a:focus{border-color:#5de1a9;color:white;background:#19483c}
a:last-child{border-color:#d2a65d}aside{border-left:3px solid #55c5bc;padding-left:15px;margin:25px 0}
@media(max-width:720px){article{align-items:stretch;flex-direction:column}nav a{flex:1;text-align:center;padding:12px 7px}}
</style></head><body><main>
<div class="eyebrow">HIGHFLY · LABORATORIO DE MONSTRUOS</div>
<h1>Ocho biomas. Tres tipos de cacería.</h1>
<p>Instancias de cacería con aspecto propio: bosque maldito, pantano, cañón,
tundra, volcán, jardín, tormenta y abismo. Girá el teléfono horizontalmente
para usar joystick, cámara, habilidades y loot.</p>
<p>Tu Guerrero de <strong>ensayo</strong> tiene vida extra temporal para probar
los combates y poder saquear. En cada cadáver acercate hasta unos cinco pasos,
usá <strong>Usar</strong> o aprovechá el autosaqueo cercano. Mirá la Bolsa
para verificar los materiales. No equivale al equipo ni stats de HIGHFLY V4.</p>
""" + cards + """
<aside><strong>Importante:</strong> cada acceso inicia una partida de ensayo con
un Hunter de nivel apropiado para esa región. No representa todavía los viajes
ni los niveles de tu personaje persistente de HIGHFLY V4.
No se altera el juego público ni los datos de sus personajes.</aside>
<p>Revisá movimiento en 360°, cámara derecha, salto, esquiva, combate, cadáver,
objetos y rendimiento. Para comparar probá la misma región en Normal, Élite y Capitán.</p>
</main></body></html>"""
    (TARGET / "hunts.html").write_text(html, encoding="utf-8")
    # Original build is a reference artifact and MUST remain byte-for-byte.
    after = {str(p.relative_to(ORIGIN)): sha(p)
             for p in ORIGIN.rglob("*") if p.is_file()}
    if original != after:
        raise SystemExit("HF_P02H_CHANGED_ORIGINAL_PAGES_BUNDLE")
    manifest = {
        "product": "HIGHFLY Monstruos P02I — eight native biomes & trial combat",
        "path": "/cobalt-hollow-lab/monster-lab/",
        "built_from": os.environ.get("GITHUB_SHA", "LOCAL_NONDEPLOY_BUILD"),
        "deployment": "NONE — staging artifact only",
        "android": "S23 Ultra emulated; physical handset validation pending",
        "files": len(original),
        "bytes": sum(p.stat().st_size for p in TARGET.rglob("*") if p.is_file()),
        "rewritten_files": rewritten_files,
        "rewritten_references": replacements,
        "original_reference_sha256": hashlib.sha256(json.dumps(original, sort_keys=True).encode()).hexdigest(),
        "entry_sha256": sha(TARGET / "index.html"),
        "allowed_modes": ["normal", "elite", "captain"],
        "level_starts": [21, 30, 40, 50, 60, 70, 80, 90],
        "biomes": ["haunt","marsh","peaks","frost","volcano","garden","gale","cave"],
        "trial_only_survival_hp_multiplier": 3,
        "default_public_pages_untouched": True,
        "v4_02_untouched": True,
    }
    REPORT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False))
    print("HF_P02I_ISOLATED_MONSTER_PAGES_PACKAGE_GREEN=1")


if __name__ == "__main__":
    main()
