#!/usr/bin/env python3
"""Generate traceable PR19->V4-03 handoff strictly from audited P02L/P02M/P02N inputs.
No runtime modification. Failed source, row count, or timeouts block false certification.
"""
from __future__ import annotations
import csv, hashlib, json, os, pathlib, shutil, sys

root = pathlib.Path(__file__).resolve().parents[2]
source = root / "p02m-source" / "docs"
duels = root / "p02n-source"
dest = root / "docs" / "HIGHFLY_V4_03_PR19_MONSTERS_INTEGRATION"
dest.mkdir(parents=True, exist_ok=True)

base = source / "HIGHFLY_MONSTRUOS6_FULL_LV1_99_AUDIT"
balance = source / "HIGHFLY_MONSTRUOS6_P02M_BALANCE"
data_audit = json.loads((base / "00_RESUMEN_AUDITORIA.json").read_text())
data_balance = json.loads((balance / "00_RESUMEN_BALANCE.json").read_text())
data_duels = json.loads((duels / "HIGHFLY_P02N_SUMMARY_1440.json").read_text())
assert data_audit["nativeTemplates"] == 270
assert data_audit["highflyNormalTemplates"] == 64
assert data_audit["highflyEliteCaptainTemplates"] == 16
assert data_audit["totalTemplateRecords"] == 350
assert data_audit["lootDefinitionRows"] == 988
assert data_balance["combatMatrixRows"] == 21600
assert data_duels["completed"] == 1440 and data_duels["attempted"] == 1440
assert data_duels["atLevel"]["WIN"] + data_duels["atLevel"]["LOSS"] + data_duels["atLevel"]["TIMEOUT"] == 720
assert data_duels["plusFive"]["WIN"] + data_duels["plusFive"]["LOSS"] + data_duels["plusFive"]["TIMEOUT"] == 720
assert data_duels["status"] == "NATIVE_SIM_RUNTIME_GATES_ONLY_NOT_COMBAT_BALANCE_CERTIFIED"

def read_csv(name):
    with (base / name).open(encoding="utf-8-sig", newline="") as inp:
        return list(csv.DictReader(inp))

def write_csv(name, rows):
    if not rows: raise AssertionError("EMPTY_CSV:"+name)
    with (dest / name).open("w", newline="", encoding="utf-8-sig") as out:
        writer=csv.DictWriter(out,fieldnames=list(rows[0]),extrasaction="raise")
        writer.writeheader()
        writer.writerows(rows)

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

best = read_csv("01_MONSTRUOS_TODOS.csv")
assert len(best) == 350 and len({r["id"] for r in best}) == 350
for row in best:
    is_highfly=row["source"] != "CLAUDECRAFT_PINNED"
    has_route=int(row.get("spawnRoutes") or 0)>0
    row["v403_runtime_state"]=(
      "LAB_NATIVE_SPAWN_ONLY" if is_highfly and has_route
      else "HF_REGISTERED_NO_PERSISTENT_ROUTE" if is_highfly
      else "NATIVE_ROUTE_REGISTERED_NOT_HUMAN_VALIDATED" if has_route
      else "NATIVE_REGISTERED_NO_STATIC_ROUTE"
    )
    row["persistent_v4_hunter_link"]="NOT_YET_IMPLEMENTED" if is_highfly else "DONOR_ORIGINAL"
    row["do_not_count_as_350_playable"]="true"
write_csv("HIGHFLY_V4_03_BESTIARY_1_99.csv",best)

spawns = read_csv("02_APARICIONES_CAMPOS_MAZMORRAS_LAB.csv")
for row in spawns:
    row["source_lab_vs_persistent"]="LAB_ONLY_IF_HF_HUNT" if str(row.get("mobId","")).startswith(("hf_hunt_","hf_enc_")) else "DONOR_ORIGINAL_OR_DYNAMIC"
    row["reentry_safe_persistent_bridge"]="NOT_VERIFIED"
write_csv("HIGHFLY_V4_03_WORLD_SPAWN_ACCESS.csv",spawns)

loot = read_csv("03_LOOT_TODAS_LAS_FILAS.csv")
assert len(loot)==988
for row in loot:
    row["entry_chance_not_final_probability"]="true"
    row["group_quest_and_ownership_must_be_checked"]="true"
    row["v403_persistent_crafting_e2e"]="NOT_VERIFIED"
write_csv("HIGHFLY_V4_03_REWARD_LOOT_CRAFTING.csv",loot)

report = {
    "simulation":"CLAUDECRAFT_NATIVE_SIM_8_SECOND_SMOKE",
    "p02m_math":data_balance,
    "p02n_duels":data_duels,
    "full_length_pve_fights_certified":False,
    "verified_win_rates":False,
    "training_profiles_real_evidence":False,
    "gear_tiers_pf9_live":False,
    "human_dodge_parry_dash_and_elemental_combo_tested":False,
    "interpretation":"6 victories and 1434 timeouts in 8-second smoke; NO balance winrate inference. 0 losses in timeout-limited experiment does not mean zero-death gameplay.",
    "status":"GREEN_LAB_RUN_NOT_GAME_BALANCE_GREEN",
}
(dest / "HIGHFLY_V4_03_HUNTER_VS_MOB_BALANCE_REPORT.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")

files={
    "bestiary": "HIGHFLY_V4_03_BESTIARY_1_99.csv",
    "spawns":"HIGHFLY_V4_03_WORLD_SPAWN_ACCESS.csv",
    "loot":"HIGHFLY_V4_03_REWARD_LOOT_CRAFTING.csv",
    "balance":"HIGHFLY_V4_03_HUNTER_VS_MOB_BALANCE_REPORT.json",
}
sources=[
    "P02L: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38094126772",
    "P02M: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38095460400",
    "P02N: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38102239479",
    "PR19: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38085989015",
    "PR19 Pages: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38086619159",
    "V4-03 PR17 combined GREEN (NOT PR19): https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38102162302",
]
manifest={
    "name":"HIGHFLY_V4_03_MONSTERS_INTEGRATION_MANIFEST",
    "as_of":"2026-10-10T22:44:00-03:00",
    "repo":"drakentzy07/cobalt-hollow-lab",
    "branch":"highfly-v4-03-pr19-monsters-handoff-real",
    "pr19_webgl_base_sha":"6de0c95a5eeaba2ce1e37805bf89dd00c6a704e3",
    "pr19_mobile_ui_sha":"f452fa29cd236d2addbef734cb6ee5bf3ad7d546",
    "pr19_published_pages_sha":"e90daec37dcf0778afa374dedd606a54f5696640",
    "donor_claudecraft_sha":"9b57e49c9676d75962700f828cc00a50a9a988b5",
    "p02i_monsters_sha":"e6f59079fdc3f278ef041fbc8354ca837aee42ab",
    "p02m_audit_sha":"402c779c9f2caf2e3c538313ed627d1163792aaf",
    "p02n_green_sha":"0ebb3de9044cd86b47ac4cd9cc2665b47cb85c04",
    "p02n_count":data_duels["completed"],
    "creature_definitions":{"native":270,"hf_normals":64,"hf_elite_captain":16,"all":350,"active_distinct_all":None},
    "scenarios":{"donor_zones":15,"hf_lab":8,"hf_persistent":0},
    "loot_config_rows":988,
    "live_default_player_path":"PR19 ORIGINAL_UNCHANGED",
    "test_only_monster_path":"?hfHunt=(21|30|40|50|60|70|80|90) + optional hfEncounter",
    "test_only_hunter":"NEW_HUNTPILOT_PLUS_3X_HP: MUST_NOT_PROMOTE",
    "same_sim_persistent_hunter_monster_transition":False,
    "same_inventory_xp_save_e2e":False,
    "v403_pr19_source_combined_build_run":"SEE_GITHUB_WORKFLOW_FOR_CURRENT_RESULT",
    "real_trainable_stats_mutated_by_kills":False,
    "lv100_plus_enabled":False,
    "isolated_public_deploy":False,
    "external_source_runs":sources,
    "files":files,
    "states":{
       "PR19_NATIVE_UI":"GREEN_REAL_ORIGINAL",
       "PR19_PROFESSIONS_GEMS_PF6":"GREEN_REAL_ORIGINAL",
       "P02I_LV21_99_HUNT":"GREEN_LAB",
       "P02L_BESTIARY": "GREEN_AUDIT",
       "P02M_HUNTER_MOB":"GREEN_AUDIT_NOT_BALANCE_CERT",
       "P02N_1440_8SEC": "GREEN_LAB_NOT_FULL_FIGHT",
       "V403_PR19_SINGLE_WEBGL":"CI_RESULT_REQUIRED",
       "V403_PERSISTENT_SINGLE_HUNTER":"RED",
       "HUNTER_KILL_TO_LOOT_TO_FORGE_RETURN":"RED",
       "REAL_S23_FPS":"YELLOW",
       "FIVE_LEGENDARY_BOSSES":"FUTURO",
       "EXTENDED_LEVEL_100_PLUS":"FUTURO",
    },
    "safety_gates":[
      "NO_NEW_HUNTER_IN_INSTANCE",
      "NO_TEST_HP_MULTIPLIER_IN_GAME",
      "ONE_REAL_SIM_XP_INVENTORY_SAVE",
      "REAL_ITEM_COMBAT_TRAINING_9_CLASSES",
      "REAL_LOOT_RECIPE_CONSUMPTION",
      "MOBILE_PHYSICAL_S23",
      "NO_PUBLIC_DEPLOY_UNTIL_SHA_GATE_AND_ROLLBACK",
    ],
}
manifest["source_sha256"]={
  "source_bestiary":sha256(base/"01_MONSTRUOS_TODOS.csv"),
  "source_spawns":sha256(base/"02_APARICIONES_CAMPOS_MAZMORRAS_LAB.csv"),
  "source_loot":sha256(base/"03_LOOT_TODAS_LAS_FILAS.csv"),
  "source_p02n":sha256(duels/"HIGHFLY_P02N_SUMMARY_1440.json"),
}
(dest/"HIGHFLY_V4_03_MONSTERS_INTEGRATION_MANIFEST.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n")
shutil.copyfile(duels/"HIGHFLY_P02N_ALL_1440_DUELS.csv",dest/"HIGHFLY_V4_03_P02N_1440_RAW_DUELS.csv")

print(json.dumps({
  "bestiary":len(best),"loot_rows":len(loot),
  "spawn_rows":len(spawns),"native_duels":data_duels["completed"],
  "p02n_wins":data_duels["atLevel"]["WIN"]+data_duels["plusFive"]["WIN"],
  "p02n_timeouts":data_duels["atLevel"]["TIMEOUT"]+data_duels["plusFive"]["TIMEOUT"],
  "dest":str(dest)},ensure_ascii=False))
print("HIGHFLY_PR19_V403_MASTER_DATA_NO_FALSE_BALANCE_OR_PERSISTENCE_GREEN=1")
