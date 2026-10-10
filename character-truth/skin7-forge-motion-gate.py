"""SKIN7 Blender real exported GLB QA: 54 new parts, true original Rig_Medium,
weights and motion, and genuine geometry differences beyond material or node scale.
"""
import bpy,sys,json,hashlib,math
from pathlib import Path
from mathutils import Vector
a=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def flag(x):
 if x not in a:raise RuntimeError('SKIN7_QA_MISSING_'+x)
 return Path(a[a.index(x)+1]).resolve()
src=flag('--input');other=flag('--other');out=flag('--out')
out.parent.mkdir(parents=True,exist_ok=True)
def load(path):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(path))
 rig=bpy.data.objects.get('Rig_Medium')
 if not rig or rig.type!='ARMATURE' or len(rig.data.bones)!=23:
  raise RuntimeError('SKIN7_QA_MISSING_AUTHENTIC_23_BONES_'+str(path))
 armor=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('HF7_')]
 if len(armor)!=54:raise RuntimeError('SKIN7_QA_AUTHORED_MESH_COUNT_'+str(len(armor)))
 original=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith(('HFV8_','HFV12_','M_','F_'))]
 if original:raise RuntimeError('SKIN7_OVERLAY_ACCIDENTALLY_EXPORTED_OLD_BODY_'+str(len(original)))
 bones={b.name for b in rig.data.bones}
 for o in armor:
  if not o.vertex_groups or not any(mod.type=='ARMATURE' and mod.object==rig for mod in o.modifiers):
   raise RuntimeError('SKIN7_QA_MESH_NOT_SKINNED_'+o.name)
  if not {g.name for g in o.vertex_groups}.issubset(bones):raise RuntimeError('SKIN7_FAKE_BONES_'+o.name)
  for v in o.data.vertices:
   total=sum(x.weight for x in v.groups)
   if not math.isfinite(total) or abs(total-1)>.05 or len(v.groups)>4:
    raise RuntimeError('SKIN7_BAD_SKINWEIGHT_'+o.name)
 for g in ('M','F'):
  for part in ('CHEST','SHOULDER_L','SHOULDER_R','WAIST','BACK','ARM_L','ARM_R','LEG_L','LEG_R'):
   if not any(x.name.startswith('HF7_'+g+'_'+part) for x in armor):
    raise RuntimeError('SKIN7_MISSING_COMPLETE_ARMOR_'+g+'_'+part)
 return rig,armor
def shot(armor):
 bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();out={}
 for o in armor:
  ob=o.evaluated_get(deps);mesh=ob.to_mesh()
  try:
   mx=ob.matrix_world
   out[o.name]=[tuple(mx@mesh.vertices[i].co) for i in range(0,len(mesh.vertices),
    max(1,len(mesh.vertices)//12))]
  finally:ob.to_mesh_clear()
 return out
rig,objs=load(src);before=shot(objs)
for name,axis,rotation in [('upperarm.l',1,.77),('upperarm.r',1,-.66),
 ('chest',1,.2),('spine',1,-.17),('upperleg.l',1,.25),('upperleg.r',1,-.22)]:
 bone=rig.pose.bones.get(name)
 if not bone:raise RuntimeError('SKIN7_NATIVE_SOURCE_POSE_BONE_MISSING_'+name)
 bone.rotation_mode='XYZ';bone.rotation_euler[axis]=rotation
after=shot(objs);deltas={}
for name,a in before.items():
 deltas[name]=max(math.dist(u,v) for u,v in zip(a,after[name]))
for gender in ('M','F'):
 for group in ('CHEST','SHOULDER_L','SHOULDER_R','WAIST','BACK','ARM_L','ARM_R','LEG_L','LEG_R'):
  ds=[v for k,v in deltas.items() if k.startswith('HF7_'+gender+'_'+group)]
  if not ds or max(ds)<.000005:raise RuntimeError('SKIN7_GENUINE_BONE_DOES_NOT_MOVE_'+gender+'_'+group)
# Distinct geometry proof: compare actual local-space vertices after imports, not materials.
shapes={o.name:tuple(tuple(round(c,6) for c in v.co) for v in o.data.vertices) for o in objs}
_,other_objs=load(other)
changed=[]
for o in other_objs:
 old=shapes.get(o.name)
 new=tuple(tuple(round(c,6) for c in v.co) for v in o.data.vertices)
 if old is None or new!=old:changed.append(o.name)
if len(changed)<20:raise RuntimeError('SKIN7_SHAPE_PROFILES_ONLY_RECOLOR_'+str(len(changed)))
# Asymmetric left/right shoulders must have geometrically different authored shell dimensions.
profiles={}
for g in ('M','F'):
 for side in ('L','R'):
  ob=next(o for o in other_objs if o.name=='HF7_'+g+'_SHOULDER_'+side+'_PAGODA_0')
  xs=[v.co.x for v in ob.data.vertices]
  profiles[g+side]=max(xs)-min(xs)
 if not profiles[g+'L']>profiles[g+'R']*1.20:
  raise RuntimeError('SKIN7_CRIMSON_LEFT_SHOULDER_NOT_DOMINANT_'+g)
proof={'green':True,'sourceOverlay':src.name,'contrastOverlay':other.name,
 'authoredMeshCount':len(objs),'originalBones':23,'sourceNativeRig':'Rig_Medium',
 'boneDrivenMeshGroupsAllTwoGenders':True,'genuineNewGeometryChanged':len(changed),
 'asymmetryMeasured':profiles,'sourceBodyMeshBundled':False,
 'certifiedZeroClipping':False,'physicalS23':False,'unityEditor':False,'artistApproved':False}
out.write_text(json.dumps(proof,indent=2))
print('HIGHFLY_SKIN7_TRUE_BLENDER_NEW_MESH_TOPOLOGY_NATIVE_23_BONES_AND_DEFORMATION_GREEN=1 NEW_CHANGED='+str(len(changed)))
