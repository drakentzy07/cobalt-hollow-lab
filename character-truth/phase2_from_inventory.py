#!/usr/bin/env python3
"""Second-stage audit of existing Character Truth artifact. Does not recreate GLB inventories.
Produces a conservative compatibility/cage baseline; visual motion remains unverified."""
import argparse,csv,json,pathlib,collections
P=pathlib.Path
def load(path): return list(csv.DictReader(path.open(encoding="utf-8",newline="")))
def main():
 p=argparse.ArgumentParser();p.add_argument("--inventory",type=P,required=True);p.add_argument("--out",type=P,required=True);a=p.parse_args()
 a.out.mkdir(parents=True,exist_ok=True)
 meshes=load(a.inventory/"all_meshes.csv");nodes=load(a.inventory/"all_nodes.csv")
 clips=load(a.inventory/"all_animation_channels.csv");joints=json.loads((a.inventory/"joint_diff.json").read_text())
 runtime=json.loads((a.inventory/"runtime_provenance.json").read_text())
 base=[x for x in meshes if x["file"]=="warrior_modular.glb"]
 armor=collections.defaultdict(list)
 for m in base:
  name=m["name"]
  if name.startswith("Armor_"):armor[name.split("_")[1]].append(m)
 expected={"barbarian","druid","knight","mage","paladin","ranger","rogue"}
 assert set(armor)==expected, f"Changed original set inventory: {set(armor)^expected}"
 assert joints["same_joint_name_set"] and len(joints["shared_joint_names"])==23
 assert set(runtime["seven_native_armor_slots"])=={"head","chest","arms","hands","legs","feet","back"}
 genders={}
 for prefix in ("M_","F_"):
  items=[m for m in base if m["name"].startswith(prefix)]
  assert items, f"No source geometry for {prefix}"
  genders[prefix[0]]={"primitive_count":len(items),"unique_names":len(set(m["name"] for m in items)),
  "mesh_names":sorted(set(m["name"] for m in items))}
 matrix=[]
 for s in sorted(expected):
  unique=sorted(set(m["name"] for m in armor[s]))
  matrix.append({"set":s,"mesh_primitives":len(armor[s]),"unique_pieces":unique,
  "static":"SOURCE_VERIFIED","runtime_masking":"NOT_VERIFIED",
  "skinning_motion":"NOT_VERIFIED","clip_clearance":"NOT_VERIFIED",
  "sockets_and_grip":"NOT_VERIFIED","skin_factory_approval":"BLOCKED"})
 byfile=collections.defaultdict(set)
 for c in clips:byfile[c["file"]].add(c["clip"])
 status={"source_run":37803666522,"source_artifact":11561419211,
 "type":"NATIVE_EVIDENCE_REUSE_NOT_NEW_INVENTORY",
 "runtime_identity":runtime,"shared_joint_names":joints["shared_joint_names"],
 "body_prefixes":genders,"original_armor_sets":matrix,
 "animation_clips":{k:sorted(v) for k,v in sorted(byfile.items())},
 "dynamic_verification":{"rendered_female_and_male":False,"all_outfits_animation":False,
 "bind_pose_equivalence":False,"jump_dash_parry_clearance":False,"weapon_grips":False,
 "s23_performance":False,"pf6_scene_equivalence":False},
 "decision":"SOURCE_BASELINE_GREEN; DYNAMIC_GATE_PENDING"}
 (a.out/"phase2_truth_baseline.json").write_text(json.dumps(status,indent=2,ensure_ascii=False))
 with (a.out/"armor_compatibility.csv").open("w",newline="",encoding="utf-8") as f:
  w=csv.DictWriter(f,fieldnames=[k for k in matrix[0] if k!="unique_pieces"]+["pieces"])
  w.writeheader()
  for row in matrix:w.writerow({**{k:v for k,v in row.items() if k!="unique_pieces"},"pieces":" | ".join(row["unique_pieces"])})
 lines=["# HIGHFLY Character Truth — Phase 2 baseline","","This is derived from the existing GREEN inventory artifact, NOT a new inventory or a visual certification.",
 "","Source RUN: 37803666522 / artifact 11561419211.","","## Genuine originals"]
 for sex,v in genders.items():lines.append(f"- {sex}: {v['primitive_count']} primitives / {v['unique_names']} named mesh pieces")
 lines+=["","## Seven original armor sets"]
 for row in matrix:lines.append(f"- {row['set']}: {row['mesh_primitives']} primitives; runtime masking and animation fit unverified")
 lines+=["","## Required dynamic acceptance gates",
 "- Compare PF-6 screenshot/runtime composition versus modular and knight (male/female; naked/base and each native set).",
 "- Run real available clips from native sources: idle/walk/run/strafe/jump/attacks/hit/block; mark dash/parry only if actually mapped in game.",
 "- Review 360-degree anatomy, clothing seams, all 7 slots, UV/materials, and joint skin deformation.",
 "- Test both hands, actual sockets, 1H/dual/shield/spear grip, clipping on extreme poses.",
 "- Produce screenshots/video and mesh-specific findings per animation and per gender.",
 "- Compare bind matrices and root transformations before authorizing any skinned replacement.",
 "- Profile performance on Samsung S23 Ultra and PF-6 scene equivalence.",
 "","**DYNAMIC_GATE_PENDING. No skins authorized. No original, rig, gameplay or public deployment changed.**"]
 (a.out/"PHASE2_GATE.md").write_text("\n".join(lines)+"\n")
 print("PHASE2_SOURCE_BASELINE_GREEN")
 print("ORIGINAL_ARMOR_SETS",",".join(sorted(expected)))
 print("DYNAMIC_GATE_PENDING")
if __name__=="__main__":main()
