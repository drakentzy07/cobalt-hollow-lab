"""V19 prove all brand-new ornament meshes are actual weighted geometry on native rig."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if '--source' not in args:raise RuntimeError('V19_REQUIRED_FILE')
src=Path(args[args.index('--source')+1])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(src))
rig=bpy.data.objects.get('Rig_Medium')
if not rig or rig.type!='ARMATURE' or len(rig.data.bones)!=23:
 raise RuntimeError('V19_ARMATURE_MISSING')
armor=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('HFV19_')]
if len(armor)!=32:raise RuntimeError('V19_OVERLAY_MESHES_NOT_32_'+str(len(armor)))
for o in armor:
 if not o.vertex_groups or not any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers):
  raise RuntimeError('V19_UNBOUND_ORNAMENT_'+o.name)
 groups={g.name for g in o.vertex_groups}
 if not groups.issubset({b.name for b in rig.data.bones}):
  raise RuntimeError('V19_NONORIGINAL_BONE_'+o.name)
 for v in o.data.vertices:
  sw=sum(a.weight for a in v.groups)
  if not math.isfinite(sw) or abs(sw-1)>.04:raise RuntimeError('V19_SKIN_WEIGHTS_INVALID_'+o.name)
def snap():
 bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();d={}
 for o in armor:
  ev=o.evaluated_get(dg);mesh=ev.to_mesh()
  try:
   m=ev.matrix_world
   d[o.name]=[tuple(m@v.co) for v in (mesh.vertices[i] for i in range(0,len(mesh.vertices),max(1,len(mesh.vertices)//18)))]
  finally:ev.to_mesh_clear()
 return d
base=snap()
for bone,amount in [('upperarm.l',.8),('upperarm.r',-.7),('chest',.3),('spine',-.23)]:
 b=rig.pose.bones.get(bone)
 if not b:raise RuntimeError('V19_MISSING_ORIGINAL_POSE_'+bone)
 b.rotation_mode='XYZ';b.rotation_euler[1]=amount
after=snap()
changed={}
for k in base:
 changed[k]=max(math.dist(a,b) for a,b in zip(base[k],after[k]))
for g in ('M','F'):
 for slot in ('CHEST','ARMS','BACK'):
  values=[v for k,v in changed.items() if k.startswith('HFV19_'+g+'_'+slot+'_')]
  if not values or max(values)<.000005:
   raise RuntimeError('V19_ORIGINAL_RIG_NOT_DRIVING_'+g+'_'+slot+'_'+str(values))
if any(not math.isfinite(v) for v in changed.values()):
 raise RuntimeError('V19_NONFINITE_TRANSFORM')
print('HIGHFLY_V19_REAL_RIG_MEDIUM_ORIGINAL_ANIMATION_AND_WEIGHTS_GREEN=1 MESHES='+str(len(armor))+' MAX_DELTA='+str(round(max(changed.values()),5)))