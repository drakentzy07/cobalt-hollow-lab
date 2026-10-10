#!/usr/bin/env python3
"""P02-J scoped hotfix on TOP of the approved deployed PASS02-I site.
Adds only opt-in real-device FPS overlay; does not rebuild or alter the Sim,
loot, world, cosmetics, Training, V4, static media, or any original route.
Sha256 enforces zero changes to every existing file outside /monster-lab/.
"""
from pathlib import Path
import hashlib, json, shutil

LIVE = Path("approved-live-pages")
OUT = Path("composed-pages")
REPORT = Path("highfly-p02j-integrity.json")
KEEP_CHANGED = {"monster-lab/game.html", "monster-lab/hunts.html"}
NEW_FILE = "monster-lab/monster-device-fps.js"

def sha(p:Path)->str:
    h=hashlib.sha256()
    with p.open("rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""):
            h.update(block)
    return h.hexdigest()

def hashes(root:Path)->dict[str,str]:
    return {p.relative_to(root).as_posix():sha(p) for p in root.rglob("*") if p.is_file()}

def once(src:str, needle:str, val:str, what:str)->str:
    if src.count(needle)!=1:
        raise SystemExit("HF_P02J_HTML_ANCHOR_DRIFT_"+what+":"+str(src.count(needle)))
    return src.replace(needle,val,1)

def main():
    if OUT.exists():
        raise SystemExit("HF_P02J_REFUSE_EXISTING_OUTPUT")
    for name in ["index.html","v4-02/index.html","monster-lab/index.html",
                 "monster-lab/game.html","monster-lab/hunts.html",
                 "monster-lab/monster-media-sw.js"]:
        if not (LIVE/name).is_file():
            raise SystemExit("HF_P02J_APPROVED_LIVE_BASE_MISSING:"+name)
    script=Path("game/monster_device_fps.js")
    if not script.is_file() or script.stat().st_size<700:
        raise SystemExit("HF_P02J_PERF_SCRIPT_MISSING")
    before=hashes(LIVE)
    if NEW_FILE in before:
        raise SystemExit("HF_P02J_MONITOR_ALREADY_PUBLISHED")
    shutil.copytree(LIVE,OUT)
    game=OUT/"monster-lab/game.html"
    src=game.read_text(encoding="utf-8")
    src=once(src,"</body>",
             '<script src="./monster-device-fps.js" defer></script></body>',
             "WEBGL")
    game.write_text(src,encoding="utf-8")
    (OUT/NEW_FILE).write_bytes(script.read_bytes())

    index=OUT/"monster-lab/hunts.html"
    s=index.read_text(encoding="utf-8")
    if "Ocho biomas" not in s:
        raise SystemExit("HF_P02J_EXPECTS_CERTIFIED_P02I_SELECTOR")
    chooser='''<aside id="hf-lab-fps-help" style="border-left:3px solid #60e0b5;padding:12px;margin:24px 0;background:#122333;border-radius:8px">
<strong>¿Se frena el juego? Medilo en tu teléfono.</strong>
<p>Activá el modo FPS, elegí una zona y mandá una captura después de caminar
unos segundos cerca del fuego y otra lejos del fuego. El panel muestra FPS reales
del navegador, p95 y porcentaje de tirones. No cambia stats, loot ni combate.</p>
<a href="./hunts.html?hfPerf=1">Activar medición FPS</a>
<a href="./hunts.html">Modo normal (sin panel)</a>
</aside>
<script>
/* Passive opt-in: add hfPerf to ALL normal/elite/captain choices. */
if (new URLSearchParams(location.search).get('hfPerf') === '1') {
  const heading=document.getElementById('hf-lab-fps-help');
  heading.querySelector('strong').textContent='Medición FPS ACTIVADA';
  for (const a of document.querySelectorAll('article nav a')) {
    const u=new URL(a.href);
    u.searchParams.set('hfPerf','1');
    a.href=u.href;
  }
}
</script>
'''
    s=once(s,"</main>",chooser+"</main>","SELECTOR")
    index.write_text(s,encoding="utf-8")

    after=hashes(OUT)
    changed=sorted(k for k,v in before.items() if after.get(k)!=v)
    added=sorted(k for k in after if k not in before)
    if set(changed)!=KEEP_CHANGED or added!=[NEW_FILE]:
        raise SystemExit("HF_P02J_UNEXPECTED_CHANGED_FILES:"+repr((changed,added)))
    untouched={k:v for k,v in before.items() if k not in KEEP_CHANGED}
    if any(after.get(k)!=v for k,v in untouched.items()):
        raise SystemExit("HF_P02J_MAIN_V4_MEDIA_HASH_DRIFT")
    if not (OUT/"monster-lab/monster-media-sw.js").is_file():
        raise SystemExit("HF_P02J_MEDIA_SW_MISSING")
    result={
       "release":"HIGHFLY P02-J opt-in real S23 FPS",
       "previous_unchanged_files":len(untouched),
       "exactly_changed_existing_files":changed,
       "exactly_added_file":added,
       "root_sha256":sha(OUT/"index.html"),
       "v4_sha256":sha(OUT/"v4-02/index.html"),
       "static_media_reused":True,
       "fps_panel_opt_in_only":True,
       "site_bytes":sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file()),
       "deployment":"NO - protected Pages action must succeed",
    }
    if result["site_bytes"]>1_900_000_000:
       raise SystemExit("HF_P02J_EXCEEDS_APPROVED_SITE_BYTES")
    REPORT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False))
    print("HF_P02J_SITE_SHA256_ROOT_V4_LOOT_ENGINE_100_PERCENT_PRESERVED=1")

if __name__=="__main__":
    main()
