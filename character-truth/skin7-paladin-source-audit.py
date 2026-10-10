#!/usr/bin/env python3
"""Read-only ORIGINAL ClaudeCraft Paladin source-truth, never Nightfall overlays.
Verifies pinned source git blob hash, native rig and slot inventory straight
from source GLB's glTF2 JSON metadata. No Blender, no unverified screenshots.
Do NOT claim geometric clipping/animation acceptance from JSON metadata.
"""
import pathlib,json,hashlib,struct,sys
SOURCE_SHA="e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2"
UPSTREAM_SHA="9b57e49c9676d75962700f828cc00a50a9a988b5"
SLOTS={
 "head":["Armor_paladin_Head"],
 "chest":["Armor_paladin_Chest"],
 "arms":["Armor_paladin_ArmL","Armor_paladin_ArmR"],
 "hands":["Armor_paladin_HandL","Armor_paladin_HandR"],
 "legs":["Armor_paladin_LegL","Armor_paladin_LegR"],
 "feet":["Armor_paladin_FootL","Armor_paladin_FootR"],
 "back":["Armor_paladin_Back"]
}
BODY={
 "male":["M_Head","M_Torso","M_ArmL","M_ArmR","M_HandL","M_HandR","M_LegL","M_LegR","M_FootL","M_FootR","M_Loin"],
 "female":["F_Head","F_Torso","F_ArmL","F_ArmR","F_HandL","F_HandR","F_LegL","F_LegR","F_FootL","F_FootR","F_Loin","F_Top"]
}
def parse(f):
 blob=f.read_bytes()
 gitsha=hashlib.sha1(b"blob "+str(len(blob)).encode()+b"\x00"+blob).hexdigest()
 if gitsha!=SOURCE_SHA:raise ValueError("PINNED_SOURCE_BLOB_DRIFT "+gitsha)
 if len(blob)<1000 or blob[:4]!=b"glTF" or struct.unpack_from("<I",blob,4)[0]!=2 or struct.unpack_from("<I",blob,8)[0]!=len(blob):
  raise ValueError("NOT_ORIGINAL_GLTF2_BINARY")
 jlen,jtype=struct.unpack_from("<II",blob,12)
 if jtype!=0x4e4f534a or jlen>len(blob)-20:raise ValueError("INVALID_JSON_CHUNK")
 return json.loads(blob[20:20+jlen]),hashlib.sha256(blob).hexdigest()
def node_info(doc,n,index):
 mesh=doc.get("meshes",[])[n["mesh"]]
 primitives=[]
 for primitive in mesh.get("primitives",[]):
  attrs=primitive.get("attributes",{})
  ai=attrs.get("POSITION")
  pos=doc["accessors"][ai] if ai is not None else {}
  mats=doc.get("materials",[])
  midx=primitive.get("material")
  primitives.append({
   "vertices":pos.get("count"),"positionMin":pos.get("min"),"positionMax":pos.get("max"),
   "skinWeights":all(k in attrs for k in ("WEIGHTS_0","JOINTS_0")),
   "material":mats[midx].get("name","") if midx is not None and midx<len(mats) else None,
   "triangleIndexCount":doc["accessors"][primitive["indices"]]["count"] if "indices" in primitive else None
  })
 return {"nodeIndex":index,"name":n["name"],"mesh":n["mesh"],"skin":n.get("skin"),
         "translation":n.get("translation"),"scale":n.get("scale"),
         "primitives":primitives}
def main(src,out):
 doc,sha=parse(src);nodes=doc.get("nodes",[])
 byname={}
 for i,n in enumerate(nodes):
  if "name" in n:byname.setdefault(n["name"],[]).append((i,n))
 allnames={k for k in byname}
 required={nm for values in SLOTS.values() for nm in values}
 for body in BODY.values():required.update(body)
 absent=sorted(required-allnames)
 if absent:raise ValueError("PALADIN_OR_BODY_ORIGINAL_NODES_MISSING "+",".join(absent))
 if len({nm for items in SLOTS.values() for nm in items})!=11:raise ValueError("EXPECTED_EXACT_NATIVE_11_PALADIN_PARTS")
 nativeRig=byname.get("Rig_Medium")
 if not nativeRig:raise ValueError("RIG_MEDIUM_MISSING")
 joints=set()
 for skin in doc.get("skins",[]):
  for idx in skin.get("joints",[]):joints.add(nodes[idx].get("name"))
 if len(joints)!=23 or "head" not in joints or "upperarm.l" not in joints or "upperarm.r" not in joints:
  raise ValueError("AUTHENTIC_NATIVE_23_JOINT_NAMES_DRIFT "+str(len(joints)))
 paladin={}
 for slot,values in SLOTS.items():
  parts=[]
  for name in values:
   found=byname[name]
   if len(found)!=1:raise ValueError("DUPLICATE_PALADIN_NODE_"+name)
   i,n=found[0]
   if "mesh" not in n:raise ValueError("PALADIN_REAL_MESH_MISSING_"+name)
   item=node_info(doc,n,i)
   if not item["primitives"]:raise ValueError("PALADIN_EMPTY_GEOMETRY_"+name)
   if not all(p["skinWeights"] for p in item["primitives"]) or item["skin"] is None:
    raise ValueError("PALADIN_NATIVE_SKIN_MISSING_"+name)
   parts.append(item)
  paladin[slot]=parts
 report={"schema":"highfly.skin7.paladin-original-truth/1","status":"ORIGINAL_ONLY_NOT_REFORGED",
  "upstreamCommit":UPSTREAM_SHA,"sourcePath":"public/models/chars/modular/warrior_modular.glb",
  "originalGitBlobSha1":SOURCE_SHA,"originalSha256":sha,
  "originalRig":"Rig_Medium","uniqueNativeJoints":sorted(joints),"jointCount":len(joints),
  "maleBodyNodes":[{"name":x,"exists":x in allnames} for x in BODY["male"]],
  "femaleBodyNodes":[{"name":x,"exists":x in allnames} for x in BODY["female"]],
  "originalPaladinSlotParts":paladin,"paladinPartCount":sum(map(len,SLOTS.values())),
  "sourceMatCount":len(doc.get("materials",[])),"sourceSkinCount":len(doc.get("skins",[])),
  "sourceMeshesCount":len(doc.get("meshes",[])),
  "principles":[
   "Keep original body visible under plate at neck/wrist/gaps: upstream modularPartNames says so",
   "Replace equipment nodes BY SLOT, never stack another full armor on Nightfall",
   "Native full helm hides ears and hair/beard, but leaves eyes brows mouth",
   "M_Loin and F_Loin hidden only when legs slot covered; F_Top remains",
   "No game deployment, no artistic approval, no reforge performed in this audit"
  ],
  "limitations":["Geometry bounds may be quantized accessor metadata, not proof of visible fit",
   "Raw GLB contains EXT_meshopt_compression: Blender reforge requires verified decoded SCRATCH copy",
   "No image-to-3D or model training performed","Neither clip collision nor in-game Unity import was tested"]
 }
 out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print("SKIN7_ORIGINAL_CLAUDECRAFT_PALADIN_11_PARTS_7_SLOTS_NATIVE_23_GREEN=1 SHA256="+sha)
 print("SKIN7_ACTUAL_PALADIN_INVENTORY="+json.dumps({k:[p["name"] for p in v] for k,v in paladin.items()}))
if __name__=="__main__":
 if len(sys.argv)!=3:raise SystemExit("usage: python3 skin7-paladin-source-audit.py original.glb report.json")
 main(pathlib.Path(sys.argv[1]),pathlib.Path(sys.argv[2]))
