import bpy,sys,json
src=sys.argv[sys.argv.index('--')+1]
bpy.ops.import_scene.gltf(filepath=src)
out=[]
for o in bpy.data.objects:
 if o.type not in ('MESH','ARMATURE'):continue
 data={'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None,
       'matrix_world':[list(row) for row in o.matrix_world],
       'mods':[(m.name,m.type,m.object.name if m.type=='ARMATURE' and m.object else '') for m in o.modifiers]}
 if o.type=='MESH':
  data.update(verts=len(o.data.vertices),polys=len(o.data.polygons),groups=[g.name for g in o.vertex_groups][:28],
              bounds_min=[min(v.co[i] for v in o.data.vertices) for i in range(3)],
              bounds_max=[max(v.co[i] for v in o.data.vertices) for i in range(3)])
 if o.type=='ARMATURE':data.update(bones=[x.name for x in o.data.bones][:35])
 out.append(data)
print('HIGHFLY_V7_NATIVE_RIG_BLENDER_INSPECTION '+json.dumps(out))
