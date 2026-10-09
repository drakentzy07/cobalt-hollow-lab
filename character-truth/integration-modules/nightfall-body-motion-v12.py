"""V12 original Blender body armor deformation proof: rigid? NO — weighted armor must genuinely deform."""
import bpy,sys,json,math
from mathutils import Vector
source=sys.argv[sys.argv.index('--')+1]
bpy.ops.import_scene.gltf(filepath=source)
rig=bpy.data.objects.get('Rig_Medium')
if not rig or rig.type!='ARMATURE':raise RuntimeError('NATIVE_RIG_NOT_IN_EXPORTED_FORGE')
meshes=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith(('HFV8_','HFV12_'))]
if len(meshes)<80:raise RuntimeError('MISSING_NEW_RIGGED_ARMOR_OBJECTS_'+str(len(meshes)))
for o in meshes:
 if not o.vertex_groups:raise RuntimeError('FORGED_ARMOR_WITHOUT_SKIN_WEIGHTS_'+o.name)
 if not any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers):
  raise RuntimeError('FORGED_ARMOR_HAS_NO_TRUE_ARMATURE_'+o.name)
def snapshot():
 bpy.context.view_layer.update()
 dep=bpy.context.evaluated_depsgraph_get()
 output={}
 for o in meshes:
  evalobj=o.evaluated_get(dep);mx=evalobj.matrix_world
  m=evalobj.to_mesh()
  try:output[o.name]=[(mx@v.co).copy() for v in (m.vertices[i] for i in range(0,len(m.vertices),max(1,len(m.vertices)//50)))]
  finally:evalobj.to_mesh_clear()
 return output
start=snapshot()
for name,value in [('lowerarm.l',.8),('upperarm.r',-.6),
                   ('lowerleg.l',.7),('upperleg.r',-.5),('spine',.23),('chest',-.2),('hips',.18)]:
 p=rig.pose.bones.get(name)
 if not p:raise RuntimeError('MISSING_REQUIRED_NATIVE_POSE_BONE_'+name)
 p.rotation_mode='XYZ';p.rotation_euler[1]=value
end=snapshot()
changed={}
nonfinite=0
for name,a in start.items():
 b=end[name]
 if len(a)!=len(b):raise RuntimeError('VERTEX_SNAPSHOT_COUNT_CHANGED')
 delta=max((p-q).length for p,q in zip(a,b)) if a else 0
 changed[name]=delta
 for p in b:
  if not all(math.isfinite(z) for z in p):nonfinite+=1
if nonfinite:raise RuntimeError('DEFORMED_ARMOR_CONTAINS_NONFINITE_'+str(nonfinite))
for gender in ('M','F'):
 for slot in ('CHEST','ARMS','HANDS','LEGS','FEET','BACK'):
  if not any(v>.00001 for k,v in changed.items() if k.startswith('HFV8_'+gender+'_'+slot+'_')):
   raise RuntimeError('RIGGED_ARMOR_SLOT_DID_NOT_DEFORM_'+gender+'_'+slot)
print('HIGHFLY_V12_PREMIUM_ARMOR_BONE_DEFORMATION_GREEN=1 BONES='+str(len(rig.data.bones))+
 ' MESHES='+str(len(meshes))+' MAX_DELTA='+str(round(max(changed.values()),5)))

premium=[o for o in meshes if o.name.startswith('HFV12_')]
if len(premium)<50:raise RuntimeError('V12_ADDED_MESHES_INSUFFICIENT')
for gender in ('M','F'):
 for key in ('CHEST_ABDOMINAL_CUIRASS','CHEST_FAULD_CENTER','BACK_RAISED_SPINE',
             'ARMS_PAULDRON_WING_L','ARMS_PAULDRON_WING_R',
             'LEGS_UPPER_CUISSE_L','LEGS_UPPER_CUISSE_R'):
  targets=[o for o in premium if o.name.startswith('HFV12_'+gender+'_'+key)]
  if not targets:raise RuntimeError('PREMIUM_MESH_MISSING_'+gender+'_'+key)
  if not any(changed.get(o.name,0)>.00001 for o in targets):
   raise RuntimeError('PREMIUM_MESH_DID_NOT_DEFORM_'+gender+'_'+key)
print('HIGHFLY_V12_ALL_PREMIUM_PARTS_DEFORM_WITH_SOURCE_RIG_GREEN=1 PREMIUM='+str(len(premium)))
