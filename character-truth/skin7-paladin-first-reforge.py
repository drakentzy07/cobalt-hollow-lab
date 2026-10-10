#!/usr/bin/env python3
"""HIGHFLY SKIN7 — FIRST REAL PALADIN REFORGE, NOT PREMIUM ART APPROVAL.

Input is a READ-ONLY decoded copy of original ClaudeCraft warrior_modular.glb,
source SHA pinned in preceding audit. Reuses ALL 11 actual Armor_paladin_*
weight-mapped meshes and original Rig_Medium without inventing a replacement
body. Produces 2 separate GLBs: intact 11 piece Paladin armor as baseline
and one modified prototype of those SAME source meshes, per true seven slots.
These are legitimate mesh shape modifications but not a finished legendary skin.
"""
import bpy,sys,math,json,hashlib
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def flag(name):
 if name not in args or args.index(name)+1>=len(args):raise RuntimeError("MISSING_ARG_"+name)
 return Path(args[args.index(name)+1]).resolve()
src=flag('--source');base=flag('--baseline');reforge=flag('--reforge');out=flag('--report')
for p in (base,reforge,out):p.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(src))
rig=bpy.data.objects.get('Rig_Medium')
if not rig or rig.type!='ARMATURE' or len(rig.data.bones)!=23:raise RuntimeError("AUTHENTIC_RIG_MEDIUM_23_ONLY")
BONES={b.name for b in rig.data.bones}
SLOTS={
 'head':['Armor_paladin_Head'],
 'chest':['Armor_paladin_Chest'],
 'arms':['Armor_paladin_ArmL','Armor_paladin_ArmR'],
 'hands':['Armor_paladin_HandL','Armor_paladin_HandR'],
 'legs':['Armor_paladin_LegL','Armor_paladin_LegR'],
 'feet':['Armor_paladin_FootL','Armor_paladin_FootR'],
 'back':['Armor_paladin_Back']
}
# Two independent source-derived outputs, NEVER two suits stacked in one GLB.
objects=[(slot,n,bpy.data.objects.get(n)) for slot,names in SLOTS.items() for n in names]
if len(objects)!=11 or any(o is None or o.type!='MESH' for _,_,o in objects):
 raise RuntimeError('CLAUDECRAFT_TRUE_NATIVE_PALADIN_MESHES_NOT_LOADED')
def is_original_skinned(o):
 return o.vertex_groups and set(x.name for x in o.vertex_groups).intersection(BONES) and any(
  m.type=='ARMATURE' and m.object==rig for m in o.modifiers)
for slot,name,o in objects:
 if not is_original_skinned(o):raise RuntimeError('PALADIN_SOURCE_SKIN_INCOMPATIBLE_'+name)
def export_glb(path,selection):
 bpy.ops.object.select_all(action='DESELECT')
 rig.select_set(True)
 for mesh in selection:mesh.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',
  use_selection=True,export_apply=False,export_yup=True)
 if path.stat().st_size<18000:raise RuntimeError('PALADIN_REFORGE_GLB_EMPTY_'+str(path))
export_glb(base,[x[2] for x in objects])
# True authored SOURCE vertex edits, no new body, no overlay duplicate Nightfall.
PROFILE={
 'head':(1.075,1.06,1.055),
 'chest':(1.16,1.10,1.055),
 'arms':(1.24,1.09,1.07),
 'hands':(1.085,1.075,1.045),
 'legs':(1.09,1.085,1.07),
 'feet':(1.08,1.055,1.045),
 'back':(1.08,1.06,1.055)
}
blue=bpy.data.materials.new('HF7RF_PALADIN_SACRED_ENAMEL')
blue.use_nodes=True
shader=blue.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value=(.12,.20,.34,1)
shader.inputs['Metallic'].default_value=.74
shader.inputs['Roughness'].default_value=.27
made=[];partProof={}
for slot,name,donor in objects:
 copy=donor.copy();copy.data=donor.data.copy()
 copy.name='HF7RF_'+name.replace('Armor_','').upper()
 bpy.context.collection.objects.link(copy)
 oldcoords=[tuple(v.co) for v in copy.data.vertices]
 lo=[min(v[i] for v in oldcoords) for i in range(3)]
 hi=[max(v[i] for v in oldcoords) for i in range(3)]
 center=[(a+b)*.5 for a,b in zip(lo,hi)]
 scale=PROFILE[slot]
 for vertex in copy.data.vertices:
  for axis in range(3):
   vertex.co[axis]=center[axis]+(vertex.co[axis]-center[axis])*scale[axis]
 # Reuse TRUE original vertex groups and pose bound; never distribute donor body.
 if not is_original_skinned(copy):raise RuntimeError('SOURCE_WEIGHTS_NOT_PRESERVED_'+name)
 changes=sum(1 for v,b in zip(copy.data.vertices,oldcoords)
  if any(abs(v.co[k]-b[k])>1.e-5 for k in range(3)))
 if changes<len(copy.data.vertices)*.6:raise RuntimeError('REFORGE_VERTICES_WERE_NOT_EDITED_'+name)
 # Simple PBR initial pass; MATERIAL WORK is NOT user-approved premium quality.
 copy.data.materials.clear();copy.data.materials.append(blue)
 for face in copy.data.polygons:face.material_index=0
 partProof[slot+'::'+name]={'sourceNode':name,'reforgedNode':copy.name,
  'nativeWeightGroups':sorted(g.name for g in copy.vertex_groups),
  'sourceVertices':len(oldcoords),'changedVertices':changes,
  'sourceLocalMin':lo,'sourceLocalMax':hi,'localScaleAroundOriginalCenter':scale}
 made.append(copy)
export_glb(reforge,made)
report={'schema':'highfly.skin7.original-paladin-reforge-first-pass/1',
 'status':'TECHNICAL_PROTOTYPE_NOT_LEGENDARY_APPROVED',
 'sourcePath':'public/models/chars/modular/warrior_modular.glb',
 'nativeRig':'Rig_Medium','nativeJoints':len(BONES),'paladinSourceMeshes':11,
 'reforgedMeshes':len(made),'sourcePaladinSlots':list(SLOTS),
 'sourceOriginalGeometryReused':True,'originalBodyMeshesExported':False,
 'otherClassArmorExported':False,'NightfallOverlaid':False,
 'nativeSourceFilesModified':False,'artReviewed':False,'unityImportValidated':False,
 'sourceBasedModifiedMeshes':partProof,
 'baselineSha256':hashlib.sha256(base.read_bytes()).hexdigest(),
 'reforgeSha256':hashlib.sha256(reforge.read_bytes()).hexdigest(),
 'limitations':[
  'Only bounded geometric first-pass reshaping, not completed premium Paladin artwork',
  'Palette is a development PBR material; source GLB remained untouched',
  'Native character base body must be separately composed using original modularPartNames',
  'Collision/fit and animations on real complete player require visual QA and end-to-end staging',
  'No arbitrary image-to-mesh learning or automated quality improvement is claimed'
 ]}
out.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('SKIN7_REAL_CLAUDECRAFT_PALADIN_11_MESHES_REFORGED_FROM_NATIVE_SOURCE_GREEN=1')
print('SKIN7_SOURCE_7_SLOTS_NEW_VERTICES='+str(sum(v['changedVertices'] for v in partProof.values())))
