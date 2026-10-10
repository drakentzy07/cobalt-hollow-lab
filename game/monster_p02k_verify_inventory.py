#!/usr/bin/env python3
"""HIGHFLY P02K fail-closed snapshot audit: 80 monster records, 8 biomes, exact loot.
Reads pinned P02I authoring and pinned donor files. No dependency install, no deploy.
Does not claim physical S23 proof or probabilistic drop-rate trials.
"""
from __future__ import annotations
import csv, hashlib, json, re
from decimal import Decimal, ROUND_FLOOR
from pathlib import Path

P = Path("source/monsters/lv99")
D = Path("donor/src/sim/content")
CSV = Path("docs/HIGHFLY_MONSTRUOS6_INVENTARIO_VERIFICADO_80.csv")
EXPECTED_COLUMNS = [
    "tipo", "ubicado_en_mapa", "nivel", "mapa", "zoneId", "bioma",
    "familia", "monstruo", "templateId", "cobre_garantizado",
    "loot_material_nativo", "reactivo_adicional", "tags_recoleccion", "donante",
]


def must(test: bool, message: str) -> None:
    if not test:
        raise AssertionError("HF_P02K_INVENTORY_AUDIT_FAIL:" + message)


def extract_text(path: Path) -> str:
    must(path.is_file(), "missing " + str(path))
    return path.read_text(encoding="utf-8")


def quoted(text: str) -> list[str]:
    return re.findall(r"'([^']+)'", text)


def source_block(text: str, key: str) -> str:
    match = re.search(r"^  " + re.escape(key) + r": \{$", text, re.M)
    must(match is not None, "missing pinned donor " + key)
    end = re.search(r"^  [A-Za-z_]\w*:\s*\{$", text[match.end():], re.M)
    must(end is not None, "unexpected donor block shape " + key)
    return text[match.start():match.end() + end.start()]


def chance_str(item: str, chance: Decimal) -> str:
    return item + " (" + str(int(chance * 100)) + "%)"


def native_chance(raw: str, allowed: list[str]) -> str:
    items = re.findall(r"\{\s*itemId:\s*'([^']+)',\s*chance:\s*([\d.]+)\s*\}", raw)
    return "; ".join(chance_str(item, Decimal(pct)) for item, pct in items if item in allowed) or "—"


def extra_for(family: str, level: int, reag: dict[str, list[str]]) -> str:
    phase = 0 if level < 40 else 1 if level < 80 else 2
    mat = reag[family][phase]
    if mat == "arcane_shard":
        pct = 2 if level >= 90 else 3
    elif mat == "arcane_essence":
        pct = 6
    elif mat == "arcane_dust":
        pct = 9
    else:
        pct = min(18, 10 + ((level - 21) // 20) * 2)
    return mat + " (" + str(pct) + "%)"


def copper_amount(original: int, level: int) -> str:
    result = Decimal(original) * (Decimal(1) + Decimal(level - 20) * Decimal("0.075"))
    return str(max(1, int((result + Decimal("0.5")).to_integral_value(rounding=ROUND_FLOOR))))


def verify() -> None:
    monsters = extract_text(P / "highfly_monster_content.ts")
    scenarios = extract_text(P / "highfly_hunt_scenarios.ts")
    rewards = extract_text(P / "highfly_hunt_rewards.ts")
    encounters = extract_text(P / "highfly_hunt_encounters.ts")

    ds = re.findall(r"\{\s*key:\s*'([^']+)',\s*sourceId:\s*'([^']+)',\s*materialIds:\s*\[([^\]]*)\]\s*\}", monsters)
    ms = re.findall(
        r"\{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*minLevel:\s*(\d+),"
        r"\s*maxLevel:\s*(\d+),\s*biome:\s*'([^']+)',\s*tierLabel:\s*'([^']+)',"
        r"\s*families:\s*\[([^\]]+)\],\s*populationBudget:\s*(\d+)", scenarios,
    )
    must(len(ds) == len(ms) == 8, "not exactly 8 donors and 8 scenarios")

    reagent_body = re.search(r"export const HIGHFLY_HUNT_FAMILY_REAGENTS=\{([\s\S]+?)\}\s+as const", rewards)
    must(reagent_body is not None, "reagent contract absent")
    reagent_map = dict((family, quoted(values)) for family, values in
                       re.findall(r"^\s*([a-z]+):\s*\[([^\]]+)\],", reagent_body.group(1), re.M))
    must(len(reagent_map) == 8 and all(len(x) == 3 for x in reagent_map.values()), "reagent phases changed")
    must("loot:source.loot.map(entry=>({...entry}))" in encounters, "special loot no longer inherited")
    must("for(const mode of ['elite','captain'] as const)" in encounters, "special kinds changed")
    must("populationBudget: 8" in scenarios and "highflyMonsterId(c.family, scenario.minLevel)" in scenarios, "camp generator drift")
    must("buildHighflyMonsterRoster" in monsters and "nativeMaterialLoot" in monsters, "normal loot source drift")
    must("Math.round(originalCopper * (1 + (low - 20) * 0.075))" in monsters, "copper formula drift")
    must("if(material==='arcane_shard')return minLevel>=90?0.02:0.03" in rewards, "shard chance formula drift")
    must("if(material==='arcane_essence')return 0.06" in rewards, "essence chance formula drift")
    must("if(material==='arcane_dust')return 0.09" in rewards, "dust chance formula drift")
    must("return Math.min(0.18,0.10+Math.floor((minLevel-21)/20)*0.02)" in rewards, "normal chance formula drift")

    donor_code = "\n".join(extract_text(D / p) for p in ("zone1.ts", "zone3.ts", "drakelands.ts"))
    orig: dict[str, dict] = {}
    for family, donor_id, allowed in ds:
        m = source_block(donor_code, donor_id)
        name = re.search(r"\n\s*name:\s*'([^']+)'", m)
        copper = re.search(r"\{\s*copper:\s*(\d+),\s*chance:\s*1\s*\}", m)
        harvest = re.search(r"componentTags:\s*\[([^\]]*)\]", m)
        must(name is not None and copper is not None, "native monster missing name or guaranteed copper " + donor_id)
        orig[family] = {
            "name": name.group(1), "id": donor_id, "coin": int(copper.group(1)),
            "native": native_chance(m, quoted(allowed)),
            "harvest": ", ".join(quoted(harvest.group(1))) if harvest else "—",
        }

    expected = {}
    kind_counts = {"Normal": 0, "Élite": 0, "Capitán": 0}
    active_normals = 0
    for zone_id, title, low_s, high_s, biome, tier, families_s, pop_s in ms:
        low, high, families = int(low_s), int(high_s), quoted(families_s)
        must(len(families) == 4 and int(pop_s) == 8, "unexpected camp cardinality " + title)
        for family, donor_id, allowed in ds:
            d = orig[family]
            tid = f"hf_hunt_{family}_{low}"
            yes = family in families
            base = {
                "ubicado_en_mapa": "SI" if yes else "NO",
                "nivel": f"{low}–{high}", "mapa": title, "zoneId": zone_id + "_playtest",
                "bioma": biome, "familia": family, "monstruo": d["name"],
                "cobre_garantizado": copper_amount(d["coin"], low),
                "loot_material_nativo": d["native"],
                "reactivo_adicional": extra_for(family, low, reagent_map),
                "tags_recoleccion": d["harvest"], "donante": d["id"],
            }
            expected[tid] = dict(base, tipo="Normal", templateId=tid)
            kind_counts["Normal"] += 1
            active_normals += yes

        for mode, family in (("elite", families[1]), ("captain", families[0])):
            base = expected[f"hf_hunt_{family}_{low}"].copy()
            sp = "Élite" if mode == "elite" else "Capitán"
            tid = f"hf_enc_{mode}_{low}"
            expected[tid] = dict(base, tipo=sp, templateId=tid,
                                 ubicado_en_mapa="SI",
                                 monstruo=("Élite del territorio" if mode == "elite" else "Capitán de la región") + " — " + title)
            kind_counts[sp] += 1

    must(kind_counts == {"Normal": 64, "Élite": 8, "Capitán": 8}, "not 64+8+8")
    must(active_normals == 32 and len(expected) == 80, "placements or template IDs drift")
    must(CSV.is_file(), "published snapshot absent")
    with CSV.open(encoding="utf-8-sig", newline="") as f:
        rdr = csv.DictReader(f)
        must(rdr.fieldnames == EXPECTED_COLUMNS, "report columns drift")
        actual = list(rdr)
    must(len(actual) == 80, "report no longer contains 80 templates")
    for row in actual:
        tid = row["templateId"]
        must(tid in expected, "unknown or duplicate row " + tid)
        must(row == expected.pop(tid), "source mismatch in " + tid)
    must(not expected, "missing templates " + repr(list(expected)))

    proof = {
        "status": "PASS", "normal_templates": 64, "active_normal_templates": 32,
        "unplaced_normal_templates": 32, "optional_elites": 8,
        "optional_captains": 8, "total_unique_ids": 80, "instance_count": 8,
        "per_instance_max_enemies": 8,
        "scope": "static code and registry source snapshot; no real phone or RNG empirical test",
        "csv_sha256": hashlib.sha256(CSV.read_bytes()).hexdigest(),
    }
    Path("monster-p02k-audit-proof.json").write_text(json.dumps(proof, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(proof, ensure_ascii=False))
    print("HF_P02K_80_MONSTERS_8_SCENARIOS_AND_ACTUAL_LOOT_SOURCE_AUDIT_GREEN=1")


if __name__ == "__main__":
    verify()
