#!/usr/bin/env python3
"""Read-only baseline audit for HIGHFLY clean restart, donor v0.44.7.
Does not alter, remove, sanitize, or republish any media. Standard library only.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

UPSTREAM_SHA = "493c35a108cef6c8aa290e8793107b1cd117886e"
MUST_PRESERVE = [
    "models/chars/modular/warrior_modular.glb",
    "models/weapons/axe_1handed.glb",
    "models/weapons/sword_1handed.glb",
    "models/weapons/dagger.glb",
    "models/weapons/staff.glb",
    "models/weapons/shield_round.glb",
    "models/props/column.glb",
    "models/props/mushroom_red.glb",
    "models/props/dock_platform.glb",
    "ui/mobs/bogtoad.webp",
    "ui/items/backpack.webp",
    "map_art/eastbrook_vale.png",
    "map_art/mirefen_marsh.png",
    "textures/loading/eastbrook-square.webp",
]
RESTRICTED_SAMPLES = [
    "models/chars/npc_gear/harbormaster_tricorne.glb",
    "models/chars/npc_gear/harbormaster_spyglass.glb",
    "models/weapons/emberfang_sword.glb",
    "models/weapons/purple_sword.glb",
    "models/props/eastbrook_ferry.glb",
    "models/props/reeds.glb",
    "map_art/world_overview.webp",
    "ui/skills/mage/fireball.webp",
    "ui/chrome/character.webp",
]
MEDIA_ROOTS = ("models", "textures", "env", "vfx")
MEDIA_EXT = {".glb", ".fbx", ".hdr", ".jpg", ".jpeg", ".png", ".webp", ".ktx2"}

def call(*args):
    return subprocess.check_output(args, text=True).strip()

def sha256(p: Path):
    h=hashlib.sha256()
    with p.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1<<20), b""):
            h.update(chunk)
    return h.hexdigest()

def original_sample_report(root:Path):
    checks=[]
    for name in MUST_PRESERVE:
        p=root/"public"/name
        if not p.is_file() or p.stat().st_size <= 32:
            raise SystemExit("HIGHFLY_C0_MISSING_PERMITTED_ORIGINAL: "+name)
        checks.append({"path":name,"sizeBytes":p.stat().st_size,"sha256":sha256(p)})
    return checks

def media_inventory(root:Path):
    entries=[]
    for logical_root in MEDIA_ROOTS:
        folder=root/"public"/logical_root
        if not folder.exists():
            continue
        for p in folder.rglob("*"):
            if p.is_file() and p.suffix.lower() in MEDIA_EXT:
                rel=p.relative_to(root/"public").as_posix()
                entries.append({"logical":rel,"sha12":sha256(p)[:12],"bytes":p.stat().st_size})
    return sorted(entries, key=lambda d:d["logical"])

def source_manifest(root:Path):
    raw=(root/"src/render/assets/manifest.generated.ts").read_text()
    found=re.search(r"MEDIA_ASSETS\s*:\s*Record<string,\s*string>\s*=\s*(\{.*?\})\s*as const",raw,re.S)
    if not found:raise SystemExit("HIGHFLY_C0_MANIFEST_UNREADABLE")
    return json.loads(found.group(1))

def run():
    root=Path.cwd()
    commit=call("git","rev-parse","HEAD")
    if commit != UPSTREAM_SHA:
        raise SystemExit("HIGHFLY_C0_UPSTREAM_SHA_MISMATCH:"+commit)
    credits=(root/"CREDITS.md").read_text()
    lines=credits.splitlines()
    restricted_rows=[line.split("|")[1].strip() for line in lines
                     if line.startswith("|") and "No, permission required" in line]
    if len(restricted_rows)!=70:
        raise SystemExit("HIGHFLY_C0_RESTRICTED_CREDITS_RECORD_DRIFT:"+str(len(restricted_rows)))
    all_public=list((root/"public").rglob("*"))
    files=[p for p in all_public if p.is_file()]
    samples=original_sample_report(root)
    originals={x["logical"]:x for x in media_inventory(root)}
    donor_manifest=source_manifest(root)
    missing_in_manifest=sorted(set(originals).difference(donor_manifest))
    manifest_wrong_hashes=[]
    for logical,item in originals.items():
        expected=donor_manifest.get(logical)
        if expected is not None:
            if expected!=f"/media/{os.path.dirname(logical)}/{Path(logical).stem}.{item['sha12']}{Path(logical).suffix}":
                manifest_wrong_hashes.append(logical)
    # Missing mappings are reported; no donor code or art is changed in C0.
    if missing_in_manifest or manifest_wrong_hashes:
        raise SystemExit("HIGHFLY_C0_ORIGINAL_MEDIA_MANIFEST_DRIFT missing="+
                         str(len(missing_in_manifest))+" badhash="+str(len(manifest_wrong_hashes))+
                         " examples="+str((missing_in_manifest+manifest_wrong_hashes)[:8]))
    for name in RESTRICTED_SAMPLES:
        if not (root/"public"/name).is_file():
            raise SystemExit("HIGHFLY_C0_RESTRICTED_SOURCE_ABSENT:"+name)
    # Current original assetUrl uses domain-root URLs; never mistake this
    # baseline test for a Pages project-base correctness certificate.
    media_ts=(root/"src/render/assets/media.ts").read_text()
    absolute_urls="MEDIA_ASSETS[logical]" in media_ts and "import.meta.env.BASE_URL" not in media_ts
    status=call("git","status","--porcelain","--untracked-files=no")
    if status:
        raise SystemExit("HIGHFLY_C0_ORIGINAL_SOURCE_MUTATED: "+status[:500])
    report={
        "project":"HIGHFLY WORLD Clean Genesis C0 (no G0-G6 overlays)",
        "upstream":"levy-street/world-of-claudecraft",
        "pin":"v0.44.7",
        "commitSha":commit,
        "cleanSource":True,
        "publicFileCount":len(files),
        "mediaCatalogCount":len(originals),
        "restrictedCreditsRowCount":len(restricted_rows),
        "restrictedCreditsRows":restricted_rows,
        "restrictedSamplePaths":RESTRICTED_SAMPLES,
        "preservedOriginalSamples":samples,
        "warning":"Media with unknown provenance is NOT automatically relicensed under MIT.",
        "pagesProjectBaseNeedsMediaURLAdapter":absolute_urls,
        "publishedToPages":False,
        "browserAndroidCertified":False,
        "g6CodeImported":False,
    }
    dest=Path("../audit-output")
    dest.mkdir(exist_ok=True)
    (dest/"highfly-clean-c0-baseline.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("HIGHFLY_C0_UPSTREAM_ORIGINAL_SOURCE_VERIFIED=PASS")
    print("HIGHFLY_C0_RESTRICTED_ROWS="+str(len(restricted_rows)))
    print("HIGHFLY_C0_MEDIA_HASHES_VALIDATED="+str(len(originals)))
    print("HIGHFLY_C0_NO_ASSETS_MODIFIED_OR_DELETED=PASS")
    print("HIGHFLY_C0_GITHUB_PAGES_MEDIA_URL_RISK="+str(absolute_urls))
    print("HIGHFLY_C0_JSON_AUDIT_OUTPUT="+str(dest/"highfly-clean-c0-baseline.json"))

if __name__=="__main__":
    run()
