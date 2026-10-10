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
recipe_path=flag('--recipe') if '--recipe' in args else None
def validate_recipe(source):
 if source is None:return None
 obj=json.loads(source.read_text())
 required={'schema','id','title','brief','sourceUpstreamCommit','sourceGlbBlobSha1',
  'sourceRig','palette','slots','artistApproved','automatedForger','gameDeployAllowed'}
 if set(obj)!=required:raise RuntimeError('PALADIN_RECIPE_SCHEMA_FIELD_DRIFT')
 if obj['schema']!='highfly.skin7.paladin-source-reforge-recipe/1' or not isinstance(obj['id'],str):
  raise RuntimeError('PALADIN_RECIPE_IDENTITY_INVALID')
 if obj['sourceUpstreamCommit']!='9b57e49c9676d75962700f828cc00a50a9a988b5' or obj['sourceGlbBlobSha1']!='e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2' or obj['sourceRig']!='Rig_Medium':
  raise RuntimeError('PALADIN_RECIPE_MUST_USE_TRUE_SOURCE')
 if obj['artistApproved'] is not False or obj['gameDeployAllowed'] is not False:
  raise RuntimeError('PALADIN_RECIPE_PREMATURE_ART_OR_GAME_APPROVAL')
 if not isinstance(obj['title'],str) or len(obj['title'])>90 or not isinstance(obj['brief'],str) or len(obj['brief'])>1400:
  raise RuntimeError('PALADIN_RECIPE_DESCRIPTION')
 slots={'head','chest','arms','hands','legs','feet','back'}
 if set(obj['slots'])!=slots:raise RuntimeError('PALADIN_RECIPE_SEVEN_SLOTS_REQUIRED')
 for name,values in obj['slots'].items():
  if not isinstance(values,dict) or set(values)!={'scale','flare','curvature'}:raise RuntimeError('PALADIN_SLOT_CONTROLS_'+name)
  ss=values['scale']
  if not isinstance(ss,list) or len(ss)!=3 or any(type(v) not in (int,float) or not math.isfinite(v) or not .75<=v<=1.3 for v in ss):
   raise RuntimeError('PALADIN_SLOT_UNSAFE_SCALE_'+name)
  for q in ('flare','curvature'):
   v=values[q]
   if type(v) not in (int,float) or not math.isfinite(v) or not -.4<=v<=.4:
    raise RuntimeError('PALADIN_SLOT_UNSAFE_'+q+'_'+name)
 pal=obj['palette']
 if not isinstance(pal,dict) or set(pal)!={'enamel','metal','accent'} or any(
  not isinstance(v,str) or len(v)!=7 or v[0]!='#' or not all(c in '0123456789abcdefABCDEF' for c in v[1:]) for v in pal.values()):
  raise RuntimeError('PALADIN_RECIPE_PALETTE')
 return obj
RECIPE=validate_recipe(recipe_path)
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
def color_hex(value):
 return tuple(int(value[i:i+2],16)/255 for i in (1,3,5))
pal=RECIPE['palette'] if RECIPE else {'enamel':'#314f74','metal':'#d4a953','accent':'#70d5e6'}
blue=bpy.data.materials.new('HF7RF_PALADIN_SACRED_ENAMEL')
blue.use_nodes=True
shader=blue.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value=(*color_hex(pal['enamel']),1)
shader.inputs['Metallic'].default_value=.74
shader.inputs['Roughness'].default_value=.27
metal=bpy.data.materials.new('HF7RF_PALADIN_HAMMERED_METAL')
metal.use_nodes=True
mshader=metal.node_tree.nodes.get('Principled BSDF')
mshader.inputs['Base Color'].default_value=(*color_hex(pal['metal']),1)
mshader.inputs['Metallic'].default_value=.86
mshader.inputs['Roughness'].default_value=.29
made=[];partProof={}
for slot,name,donor in objects:
 copy=donor.copy();copy.data=donor.data.copy()
 copy.name='HF7RF_'+name.replace('Armor_','').upper()
 bpy.context.collection.objects.link(copy)
 oldcoords=[tuple(v.co) for v in copy.data.vertices]
 lo=[min(v[i] for v in oldcoords) for i in range(3)]
 hi=[max(v[i] for v in oldcoords) for i in range(3)]
 center=[(a+b)*.5 for a,b in zip(lo,hi)]
 cfg=RECIPE['slots'][slot] if RECIPE else {'scale':PROFILE[slot],'flare':0,'curvature':0}
 scale=cfg['scale'];flare=cfg['flare'];curve=cfg['curvature']
 zspan=max(hi[2]-lo[2],1.e-6)
 yspan=max(hi[1]-lo[1],1.e-6)
 for vertex in copy.data.vertices:
  x,y,z=vertex.co
  # Shape follows the REAL SOURCE mesh envelope; no guessed model coordinates.
  t=max(0,min(1,(z-lo[2])/zspan))
  rim=math.sin(math.pi*t)
  lateral=abs((x-center[0])/max((hi[0]-lo[0])*.5,1.e-6))
  axialWiden=1+flare*(2*t-1)
  vertex.co.x=center[0]+(x-center[0])*scale[0]*axialWiden
  vertex.co.y=center[1]+(y-center[1])*scale[1]-curve*.08*yspan*rim*(1-min(1,lateral*lateral))
  vertex.co.z=center[2]+(z-center[2])*scale[2]
 # Reuse TRUE original vertex groups and pose bound; never distribute donor body.
 if not is_original_skinned(copy):raise RuntimeError('SOURCE_WEIGHTS_NOT_PRESERVED_'+name)
 changes=sum(1 for v,b in zip(copy.data.vertices,oldcoords)
  if any(abs(v.co[k]-b[k])>1.e-5 for k in range(3)))
 if changes<len(copy.data.vertices)*.6:raise RuntimeError('REFORGE_VERTICES_WERE_NOT_EDITED_'+name)
 # Simple PBR initial pass; MATERIAL WORK is NOT user-approved premium quality.
 copy.data.materials.clear();copy.data.materials.append(metal if slot in ('hands','legs','feet') else blue)
 for face in copy.data.polygons:face.material_index=0
 partProof[slot+'::'+name]={'sourceNode':name,'reforgedNode':copy.name,
  'nativeWeightGroups':sorted(g.name for g in copy.vertex_groups),
  'sourceVertices':len(oldcoords),'changedVertices':changes,
  'sourceLocalMin':lo,'sourceLocalMax':hi,'localScaleAroundOriginalCenter':scale,'curvature':curve,'flare':flare}
 made.append(copy)
export_glb(reforge,made)
report={'schema':'highfly.skin7.original-paladin-reforge-first-pass/1',
 'status':'TECHNICAL_PROTOTYPE_NOT_LEGENDARY_APPROVED',
 'appliedRecipe':RECIPE['id'] if RECIPE else 'legacy-default-first-pass',
 'recipeSha256':hashlib.sha256(recipe_path.read_bytes()).hexdigest() if recipe_path else None,
 'recipeBrief':RECIPE['brief'] if RECIPE else None,
 'recipeDrivenGeometry':RECIPE is not None,
 'recipeControlsActuallyApplied':RECIPE is not None,
 'materialsReplacedOnExportForPrototype':True,
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
