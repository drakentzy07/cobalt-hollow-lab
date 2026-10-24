#!/usr/bin/env python3
"""HIGHFLY C1: READ-ONLY, provenance-first licensing inventory.
Scans the pristine pinned World of ClaudeCraft donor. Does NOT change any
asset or compile/publish the game. Source of truth is v0.44.7 CREDITS.md.
Every unclear media file is tagged NEEDS_REVIEW, never assumed CC0.
"""
import fnmatch
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
import re
import subprocess

ROOT=Path("public")
PRESERVED_SAMPLES=(
 "models/chars/modular/warrior_modular.glb",
 "models/weapons/sword_1handed.glb",
 "models/weapons/axe_1handed.glb",
 "models/weapons/dagger.glb",
 "models/weapons/shield_round.glb",
 "ui/mobs/bogtoad.webp",
 "ui/items/backpack.webp",
 "map_art/eastbrook_vale.png",
 "map_art/mirefen_marsh.png",
 "textures/loading/eastbrook-square.webp",
)
FORK_BAG_IDS={"backpack","linen_pouch","travelers_knapsack",
              "wolfhide_satchel","gravewoven_bag","mistcallers_duffel"}
FORK_MOB_IDS=set("bogtoad breach_wretch castaway_navigator cindraleth_maw_matriarch downs_bandit drowsy_croaker fen_sprite fisher_bram gravedigger_mosley grubjaw harvest_sprite hedge_gnome mere_lurker the_meredark the_wreck_warden training_dummy willow_sprite wreck_thief ignivar_cinder_artificer ignivar_crucible_warden ignivar_ember_sentinel ignivar_heart_of_the_end ignivar_herald_of_the_last_flame varkhul_forgefather_of_the_last_flame".split())
PROHIBITED_WEAPON_NAMES=set("emberfang_sword purple_sword purple_dagger purple_axe purple_wand purple_staff redskull_dagger redskull_hammer redskull_staff redskull_sword redskull_wand tome_silverleaf tome_goldleaf tome_sunpetal tome_voidbound ashspark_shiv brasscap_hatchet brasscrown_walking_staff cinderbrand cinderlatch emberbite fletcher_s_guild_bow forgeheart_stave frostbite glaciersplit ice_fang lacquered_rod rimecrusher shard_of_everwinter smoulderfall tempered_flanged_mace winterbite".split())
PROHIBITED_WEAPON_PREFIX=("guildmark_","emberwrought_","hoarfrost_","astravyr_","cosmarch_","encore_","starfall_","skyrender_","meteorlatch_","solheim_","emberwish_")
PROHIBITED_PROP_NAMES=set("reeds eastbrook_ferry harbor_route_marker wyrmwatch_harbor wickharbor_wharf wickharbor_harbor".split())
PROHIBITED_MOUNTS=set("terrorspark_groundshaker goblin_rocket_sled lanternback_troll chimeglass_tortoise".split())
PROHIBITED_ROOTS=(
 "ui/skills/","ui/deeds/","ui/chrome/","ui/auras/",
 "ui/professions/","ui/map-markers/","ui/currency/",
 "ui/delve-affixes/","ui/fiesta/","ui/crests/"
)
SITE_RESTRICTED=[
 "website-fractured-portal-v1.svg","website-fractured-portal-v2.svg",
 "website-fractured-portal-v3.svg","website-fractured-portal-v4.webp",
 "website-fractured-portal-v5.webp","website-feature-classes-v1.webp",
 "website-feature-open-v1.webp","website-stone-gateway-v2.svg",
 "website-parchment-scroll-v1.svg","website-parchment-scroll-v2.svg",
 "website-hero-eastbrook-v1.webp","website-hero-galecrest-v1.webp",
 "website-hero-drakelands-v1.webp","website-hero-thornpeak-v1.webp",
]
OTHER_EXPLICIT={
 "ui/ranks/elite-dragon-frame.webp":143,
 "ui/leaderboard/medal_gold.webp":144,
 "ui/leaderboard/medal_silver.webp":144,
 "ui/leaderboard/medal_bronze.webp":144,
 "ui/reliquary/perfect_specimen.webp":171,
 "map_art/world_overview.webp":192,
 "audio/sfx/temporal_clock.mp3":196,
}
OTHER_EXPLICIT.update({x:135 for x in SITE_RESTRICTED})
# Items: treat unknown entries as unverified, not banned by blanket rule.
ITEM_MAPPING=ROOT/"ui/items/mapping.json"
item_restricted={}
if ITEM_MAPPING.is_file():
    mapping=json.loads(ITEM_MAPPING.read_text())
    for batch in mapping.get("generatedBatches",[]):
        for item in batch.get("itemIds",[]):
            item_restricted[item]=159
    for ent in mapping.get("entries",[]):
        item=ent.get("itemId")
        if not item:continue
        if ent.get("source")=="woc_professions_art":
            item_restricted[item]=155
        elif item not in FORK_BAG_IDS:
            item_restricted[item]=159
    for item in "wayfarers_backpack burlap_reagent_pouch necromancers_reagent_satchel duskweave_bag resonant_weave_bag foragers_haversack loombound_reagent_satchel field_kit reins_goblin_rocket_sled reins_lanternback_troll reins_chimeglass_tortoise".split():
        item_restricted[item]=157
credits=Path("CREDITS.md").read_text()
rows=[(i+1,l) for i,l in enumerate(credits.splitlines())
      if l.startswith("|") and "No, permission required" in l]
art_rows=[(line, val.split("|")[1].strip()) for line,val in rows
          if line > 100 and not val.startswith("| Value")]
assert len(rows)==70 and len(art_rows)==69,(len(rows),len(art_rows))
records=[]

def classify(rel):
    stem=Path(rel).stem
    suffix=Path(rel).suffix.lower()
    if suffix in (".json",".md",".txt",".html",".js",".ts"):
        return None
    if rel in OTHER_EXPLICIT:
        return ("RESTRICTED",OTHER_EXPLICIT[rel],"Named restricted media in CREDITS")
    if rel.startswith("models/chars/npc_gear/") and stem in ("harbormaster_tricorne","harbormaster_spyglass"):
        return ("RESTRICTED",215,"Harbormaster accessories; do not delete/preload must parse")
    if rel.startswith("models/weapons/") and suffix==".glb":
        if stem in PROHIBITED_WEAPON_NAMES or stem.startswith(PROHIBITED_WEAPON_PREFIX):
            return ("RESTRICTED",173,"Restricted prototype, Season 1 Armory or inscription tome")
    if rel.startswith("models/props/") and suffix==".glb" and stem in PROHIBITED_PROP_NAMES:
        return ("RESTRICTED",174 if stem=="reeds" else 213,"Specifically restricted vegetation/harbor prop")
    if rel.startswith("models/mounts/") and suffix==".glb" and stem in PROHIBITED_MOUNTS:
        return ("RESTRICTED",204,"Named project-only rights-reserved mount")
    if rel.startswith("audio/voice/ignivar/") or rel.startswith("audio/voice/varkhul/"):
        return ("RESTRICTED",266,"Project-only rights-reserved encounter voice")
    if rel.startswith("claudium/") and suffix in (".png",".webp",".jpg",".jpeg",".svg"):
        return ("RESTRICTED",175,"Claudium branded graphics rights reserved; brand-logo exceptions separately reviewed")
    if rel.startswith("ui/items/") and suffix==".webp":
        if stem in FORK_BAG_IDS: return ("FORK_ONLY",153,"Six fork-allowed bag icons")
        if stem in item_restricted:return ("RESTRICTED",item_restricted[stem],"Documented item icon from mapping/batch")
        return ("NEEDS_REVIEW",None,"Other inventory icon not shown to be CC0")
    if rel.startswith("ui/mobs/") and suffix==".webp":
        if stem in FORK_MOB_IDS:return ("FORK_ONLY",188,"Corrected/re-rendered monster portrait allowed in fork")
        return ("NEEDS_REVIEW",None,"Monster art must be traced to original texture/model attribution")
    if rel.startswith("ui/store/armory/") and suffix in (".webp",".png",".jpg"):
        return ("RESTRICTED",173,"Named Season 1 Armory store catalog")
    if rel=="ui/store/season-01-armory-promo.webp":
        return ("RESTRICTED",173,"Reserved Season 1 promotional painting")
    if rel.startswith("ui/weapons/") and suffix in (".jpg",".jpeg",".png",".webp"):
        if stem in PROHIBITED_WEAPON_NAMES or stem.startswith(PROHIBITED_WEAPON_PREFIX):
            return ("RESTRICTED",152,"Named rights-reserved weapon render")
        return ("NEEDS_REVIEW",None,"Original weapon render provenance must be identified; do not blanket erase")
    if rel.startswith("ui/specs/") and suffix==".webp":
        cls=rel.split("/")[2] if len(rel.split("/"))>2 else ""
        if cls in ("paladin","hunter","rogue","priest","shaman","warlock","druid"):
            return ("RESTRICTED",186,"Explicit rights-reserved specialization emblem")
        return ("NEEDS_REVIEW",None,"Mage/Warrior emblems lack this exact group attribution")
    if any(rel.startswith(root) for root in PROHIBITED_ROOTS) and suffix in (".webp",".jpg",".png",".jpeg"):
        return ("RESTRICTED",161,"Restricted UI icon family described in credits")
    if rel.startswith("map_art/") and suffix==".png":
        return ("FORK_ONLY",222,"Zone map overlays permitted only with this fork")
    if rel.startswith("textures/loading/") and suffix==".webp":
        return ("FORK_ONLY",134,"Loading art usable in a ClaudeCraft fork")
    if rel.startswith("ui/minigames/") and suffix==".webp":
        return ("FORK_ONLY",229,"Minigame UI credits state with-project-only")
    if rel.startswith("models/weapons/") and stem in ("sword_1handed","axe_1handed","dagger","staff","shield_round","skeleton_blade"):
        return ("YES",99,"KayKit/Quaternius family; preserve original")
    if rel.startswith("models/chars/modular/warrior_modular.glb"):
        return ("YES",99,"KayKit modular warrior; preserve")
    if rel.startswith("models/props/") and stem in ("column","mushroom_red","dock_platform"):
        return ("YES",103,"Quaternius or Kenney original prop; preserve")
    return ("NEEDS_REVIEW",None,"No explicit asset-level match in this audit; do not change")

public_files=[p for p in ROOT.rglob("*") if p.is_file()]
for p in sorted(public_files):
    rel=p.relative_to(ROOT).as_posix()
    val=classify(rel)
    if val is None:continue
    status,line,rationale=val
    records.append({"path":rel,"status":status,"creditsLine":line,"reason":rationale,"bytes":p.stat().st_size})
counts=Counter(x["status"] for x in records)
groups=defaultdict(lambda:Counter())
for x in records:
    pieces=x["path"].split("/")
    bucket="/".join(pieces[:2]) if len(pieces)>2 else pieces[0]
    groups[bucket][x["status"]]+=1
for name in PRESERVED_SAMPLES:
    p=ROOT/name
    if not p.is_file():raise SystemExit("C1_CRITICAL_ORIGINAL_MISSING: "+name)
    if name not in [x["path"] for x in records]:raise SystemExit("C1_CRITICAL_ORIGINAL_NOT_IN_INVENTORY: "+name)
source_status=subprocess.check_output(["git","status","--porcelain","--untracked-files=no","--","public"],text=True).strip()
assert not source_status,"C1 must not change donor public files"
out=Path("../audit-output");out.mkdir(exist_ok=True)
report={
 "title":"HIGHFLY C1 - licencias por archivo, SIN cambios ni eliminación",
 "upstream":"levy-street/world-of-claudecraft@493c35a108cef6c8aa290e8793107b1cd117886e",
 "creditsSource":"v0.44.7 CREDITS.md",
 "restrictedMediaRows":len(art_rows),
 "legendRowNotAsset":True,
 "recordsByStatus":dict(counts),
 "classificationConservative":True,
 "zeroFilesChanged":True,
 "zeroFilesDeleted":True,
 "pagesPublished":False,
 "groups":[{"folder":k,"countByStatus":dict(v)} for k,v in sorted(groups.items())],
 "records":records,
}
(out/"highfly-c1-asset-license-inventory.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
lines=[
 "# HIGHFLY C1 — Auditoría de licencias (solo lectura)",
 "",
 "Basada en ClaudeCraft v0.44.7 original. **0 archivos borrados, 0 archivos sustituidos, 0 cambios en Pages.**",
 "",
 "Importante: el registro original tiene **69 filas de medios con prohibición**",
 "más **1 fila explicativa** en la leyenda; antes habíamos contado 70",
 "porque sumábamos ambas. Cada fila puede abarcar múltiples archivos.",
 "",
 "| Clasificación | Archivos |",
 "|---|---:|",
]
for cat in ("YES","FORK_ONLY","RESTRICTED","NEEDS_REVIEW"):
    lines.append(f"| {cat} | {counts[cat]} |")
lines.extend(["","## Carpetas","", "| Carpeta | Libre | En fork | Restringido | Por revisar |", "|---|---:|---:|---:|---:|"])
for key,val in sorted(groups.items()):
    lines.append(f"| \`{key}\` | {val['YES']} | {val['FORK_ONLY']} | {val['RESTRICTED']} | {val['NEEDS_REVIEW']} |")
lines.extend([
 "",
 "## Regla de seguridad",
 "",
 "- **RESTRICTED** = reemplazar únicamente tras verificar el nombre y el permiso; nunca eliminar directamente.",
 "- **FORK_ONLY** = conservar en HIGHFLY como fork, con créditos originales.",
 "- **YES** = recurso con familia de licencia libre identificada; conservar.",
 "- **NEEDS_REVIEW** = NO se considera libre; requiere verificar origen antes de publicar.",
 "",
 "Un RUN verde de inventario no significa que todos los archivos tengan licencia",
 "ni que la app haya pasado una prueba Android.",
])
(out/"highfly-c1-audit-summary.md").write_text("\n".join(lines)+"\n")
print("HIGHFLY_C1_MEDIA_LICENSE_INVENTORY_GREEN=PASS")
print("HIGHFLY_C1_69_RESTRICTED_MEDIA_ROWS_PLUS_LEGEND=PASS")
print("HIGHFLY_C1_FILES_NOT_TOUCHED=PASS")
print("HIGHFLY_C1_ASSET_COUNTS="+json.dumps(dict(counts),sort_keys=True))
print("HIGHFLY_C1_UNKNOWN_NOT_ASSUMED_FREE="+str(counts["NEEDS_REVIEW"]))
print("HIGHFLY_C1_REPORT_JSON=../audit-output/highfly-c1-asset-license-inventory.json")
