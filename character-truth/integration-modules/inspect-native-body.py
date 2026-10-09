"""HIGHFLY authentic body/Rig_Medium inspection. Inspection is NOT a game build."""
import bpy,sys,json,pathlib
source=pathlib.Path(sys.argv[sys.argv.index('--')+1])
bpy.ops.import_scene.gltf(filepath=str(source))
result=[]
for o in bpy.data.objects:
 if o.type not in ('MESH','ARMATURE'):continue
 item={'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None,
       'modifiers':[(m.name,m.type,m.object.name if m.type=='ARMATURE' and m.object else '') for m in o.modifiers]}
 if o.type=='MESH':
  item.update(verts=len(o.data.vertices),polys=len(o.data.polygons),
     groups=[g.name for g in o.vertex_groups][:30],
     bounds_min=[min(v.co[i] for v in o.data.vertices) for i in range(3)] if o.data.vertices else [],
     bounds_max=[max(v.co[i] for v in o.data.vertices) for i in range(3)] if o.data.vertices else [])
 if o.type=='ARMATURE':item.update(bones=[bone.name for bone in o.data.bones])
 result.append(item)
armatures=[a for a in result if a['type']=='ARMATURE']
skinned=[o for o in bpy.data.objects if o.type=='MESH' and len(o.vertex_groups)>0]
if not armatures or not skinned:raise RuntimeError('AUTHENTIC_BLENDER_SKIN_AND_ARMATURE_MISSING')
bones=set(bone for a in armatures for bone in a['bones'])
if len(bones)<20:raise RuntimeError('AUTHENTIC_RIG_HAS_TOO_FEW_BONES')
names={x['name'] for x in result}
if not any(n.startswith('M_') for n in names) or not any(n.startswith('F_') for n in names):
 raise RuntimeError('AUTHENTIC_MALE_FEMALE_NATIVE_PARTS_MISSING')
out=source.with_name('blender-rig-inspection.json')
out.write_text(json.dumps({'source':str(source),'objects':result,
 'armatures':len(armatures),'bones':sorted(bones),'nativeSkinnedMeshes':len(skinned)},indent=2))
print('HIGHFLY_V7_REAL_BLENDER_RIG_IMPORT_GREEN=1 BONES='+str(len(bones))+
 ' SKINNED='+str(len(skinned))+' ARMATURES='+str(len(armatures))+
 ' MALE_AND_FEMALE=1')
print('HIGHFLY_V7_RIG_AUDIT_JSON='+str(out))
