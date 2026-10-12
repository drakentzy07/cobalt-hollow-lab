#!/usr/bin/env python3
"""HIGHFLY SKIN13 — Blender worker DEMONSTRATOR ONLY (NOT AI, NOT PREMIUM).
Generates brand-new smoothly curved geometry and weights to native Rig_Medium.
Anatomical shape and visual art require independent QA and human approval.
Never adapts old source faces or recolors an existing armor as a 'new' GLB.
"""
import bpy,sys,json,math,hashlib,struct,re
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def get(k):
 if k not in args or args.index(k)+1==len(args):raise RuntimeError('MISSING_'+k)
 return Path(args[args.index(k)+1]).resolve()
jobfile=get('--job');inputfile=get('--source');output=get('--out');proofpath=get('--proof')
j=json.loads(jobfile.read_text())
assert j['schema']=='highfly.skin13.forge-job/1' and j['phase']=='queued','BAD_JOB_SCHEMA'
assert j['request']['geometryInputs']=='NEW_MESHES_ONLY','FORBIDDEN_DEFORMATION'
assert not j['request'].get('reference'), 'IMAGE_MODEL_NOT_IMPLEMENTED'
assert len(j['request']['prompt'])<=1000 and len(j['request']['prompt'])>=12,'BAD_PROMPT'
prompt=j['request']['prompt'].lower()
style='eclipse' if ('eclipse' in prompt or 'eclíps' in prompt) else j['request'].get('preset','original')
color_sets={
 'eclipse':('#151b2a','#a9aebd','#7f45c8'),
 'dragon':('#26352e','#bb875a','#ce5351'),
 'celestial':('#c7d1dc','#d7a958','#73caef'),
 'samurai':('#282a31','#b09b7c','#b64751'),
 'original':('#2b394d','#a2bbca','#a765a9')
}
colors=color_sets.get(style,color_sets['original'])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(inputfile))
rig=bpy.data.objects.get('Rig_Medium')
assert rig and rig.type=='ARMATURE' and len(rig.data.bones)==23,'RIG_NOT_GENUINE'
SLOTS=['Head','Chest','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR','Back']
donors={p:bpy.data.objects.get('Armor_paladin_'+p) for p in SLOTS}
assert all(d and d.type=='MESH' and len(d.data.vertices)>10 and len(d.vertex_groups) for d in donors.values()),'NATIVE_DONOR_MISSING'
def mat(name,hex_color,metal,rough):
 m=bpy.data.materials.new(name);m.diffuse_color=tuple(int(hex_color[k:k+2],16)/255 for k in (1,3,5))+(1,)
 m.use_nodes=True;node=m.node_tree.nodes.get('Principled BSDF')
 node.inputs['Base Color'].default_value=m.diffuse_color
 node.inputs['Metallic'].default_value=metal
 node.inputs['Roughness'].default_value=rough
 return m
materials=[
 mat('HF13_FORGED_NIGHT_METAL',colors[0],.73,.30),
 mat('HF13_BEVELED_STEEL_EDGE',colors[1],.87,.23),
 mat('HF13_INLAID_ENERGY',colors[2],.43,.17)
]
torso=donors['Chest'];tspan=torso.dimensions
# Critical: enforce head/hands/feet maximums relative to native torso.
maxima={
 'Head':(.34,.40,.53),'Chest':(.62,.67,.73),
 'ArmL':(.31,.35,.72),'ArmR':(.31,.35,.72),
 'HandL':(.23,.24,.44),'HandR':(.23,.24,.44),
 'LegL':(.34,.39,.83),'LegR':(.34,.39,.83),
 'FootL':(.28,.47,.45),'FootR':(.28,.47,.45),
 'Back':(.54,.37,.72)
}
verts_total=0;faces_total=0;stats={};objects=[]
def create_surface(slot,donor):
 source=[v.co.copy() for v in donor.data.vertices]
 lo=[min(v[k] for v in source) for k in range(3)]
 hi=[max(v[k] for v in source) for k in range(3)]
 ctr=[(lo[k]+hi[k])/2 for k in range(3)]
 raw=[max(hi[k]-lo[k],.025) for k in range(3)]
 torso_x=max(tspan.x,.12);torso_z=max(tspan.z,.12)
 cap=maxima[slot]
 # Bounded by body reference, not unlimited legacy armor bounds.
 sx=min(raw[0]*.49,torso_x*cap[0]);sy=min(raw[1]*.43,torso_x*cap[1])
 sz=min(raw[2]*.49,torso_z*cap[2])
 sx=max(sx,.018);sy=max(sy,.018);sz=max(sz,.025)
 verts=[];faces=[];mi=[]
 rings=11;steps=24
 # Oval hardened shells: 264+ independent vertices and curved faces/slot.
 # The old Paladin topology is NEVER cloned, rescaled, or copied.
 for i in range(1,rings):
  u=math.pi*i/rings
  for k in range(steps):
   a=2*math.pi*k/steps
   taper=math.sin(u)
   panel=1+.055*math.cos(a*4)*math.sin(u)**2
   width=sx*taper*panel*(.84+.16*math.cos(u)**2)
   depth=sy*taper*(.94+.06*math.sin(u*3)**2)
   pos=(ctr[0]+math.cos(a)*width,
        ctr[1]+math.sin(a)*depth,
        ctr[2]+sz*math.cos(u))
   verts.append(pos)
 for i in range(rings-2):
  for k in range(steps):
   a=i*steps+k;b=i*steps+(k+1)%steps
   c=(i+1)*steps+(k+1)%steps;d=(i+1)*steps+k
   faces.append((a,b,c,d))
   # gold-edged rims high/low, otherwise dark metal.
   mi.append(1 if i in (0,rings-3) else 0)
 top=len(verts);verts.append((ctr[0],ctr[1],ctr[2]+sz))
 bottom=len(verts);verts.append((ctr[0],ctr[1],ctr[2]-sz))
 for k in range(steps):
  faces.append((top,k,(k+1)%steps));mi.append(1)
  x=(rings-2)*steps+k;y=(rings-2)*steps+(k+1)%steps
  faces.append((bottom,y,x));mi.append(1)
 # Sculpting ornament: 2 physically curved, connected front arcs. The height
 # and coverage are proportional to the *slot*, not bounding-box spikes.
 # Additional raised ribbons form original relief, not existing mesh faces.
 for sign in (-1,1):
  base=len(verts)
  for l in range(7):
   v=l/6
   a=-math.pi/2+(v-.5)*1.15
   along=math.cos((v-.5)*math.pi)*.10
   for width_step in (-1,1):
    x=ctr[0]+math.cos(a)*sx*.77+(sign*.13+width_step*.018)*sx
    y=ctr[1]+math.sin(a)*sy*1.025
    z=ctr[2]+(sign*.29+along)*sz
    verts.append((x,y,z))
  for l in range(6):
   faces.append((base+2*l,base+2*l+1,base+2*l+3,base+2*l+2));mi.append(2 if sign==1 else 1)
 mesh=bpy.data.meshes.new('HF13_TRUE_NEW_MESH_'+slot)
 mesh.from_pydata(verts,[],faces);mesh.update()
 for material in materials:mesh.materials.append(material)
 for f,m in zip(mesh.polygons,mi):f.material_index=m;f.use_smooth=m==0
 # Donor used *solely* as fit reference and skin weights. New geometry
 # always contains vertices/faces created in this script from trig functions.
 instance=donor.copy();instance.data=mesh;instance.name='HF13NEW_'+slot
 bpy.context.collection.objects.link(instance)
 if len(instance.vertex_groups)==0:
  for g in donor.vertex_groups:instance.vertex_groups.new(name=g.name)
 assert len(instance.vertex_groups)==len(donor.vertex_groups)
 tree=KDTree(len(source))
 for i,point in enumerate(source):tree.insert(point,i)
 tree.balance()
 for vertex in mesh.vertices:
  _co,near,_d=tree.find(vertex.co)
  groups=[(g.group,g.weight) for g in donor.data.vertices[near].groups if g.weight>0]
  assert groups,'UNWEIGHTED_ANATOMICAL_REFERENCE'
  total=sum(w for _,w in groups)
  for g,w in groups:instance.vertex_groups[g].add([vertex.index],w/total,'REPLACE')
 assert all(v.groups for v in mesh.vertices)
 assert any(mod.type=='ARMATURE' and mod.object==rig for mod in instance.modifiers)
 return instance,len(verts),len(faces),[sx,sy,sz]
for name in SLOTS:
 obj,nv,nf,rad=create_surface(name,donors[name]);objects.append(obj)
 verts_total+=nv;faces_total+=nf
 stats[name]={'freshVertices':nv,'freshFaces':nf,'sourceTrianglesCopied':0,'allVerticesSkinned':True,'radiiLocal':rad}
assert len(objects)==11 and verts_total>2000 and faces_total>1900,'TOO_FEW_NEW_TRIANGLES'
# GLB export of only new meshes + Rig_Medium; do not include old source armor.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for obj in objects:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_apply=False,export_yup=True)
data=output.read_bytes()
assert data[:4]==b'glTF' and len(data)>40000
count,kind=struct.unpack_from('<II',data,12)
assert kind==0x4e4f534a
glbjson=json.loads(data[20:20+count])
assert len(glbjson.get('skins',[]))>=1,'GLB_HAS_NO_SKIN'
skin_nodes=[o for o in glbjson.get('nodes',[]) if o.get('name','').startswith('HF13NEW_')]
assert len(skin_nodes)>=11,'NEW_ARMOR_NODES_MISSING'
# The initial demo is a procedural, geometrically new prototype, NOT a
# high-quality AI rendering nor art-approved armor.
# Mandatory auto-rendered review angles. Images are *evidence*, NOT art PASS.
# A workbench rendering does not establish mobile quality or 22 playable clips.
from mathutils import Vector as V3
for obj in bpy.data.objects:
 if obj.type=='MESH' and obj not in objects and obj.name.startswith(('Armor_','HF7RF','HF9NEW')):
  obj.hide_render=True
bounds=[]
for obj in objects:
 for corner in obj.bound_box:
  bounds.append(obj.matrix_world @ V3(corner))
assert bounds, 'EMPTY_ARMOR_SCENE'
mn=V3(tuple(min(v[i] for v in bounds) for i in range(3)))
mx=V3(tuple(max(v[i] for v in bounds) for i in range(3)))
center=(mn+mx)*.5
dim=mx-mn
assert all(math.isfinite(v) for v in dim),'NONFINITE_ARMOR_DIMENSIONS'
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.render.resolution_x=560
scene.render.resolution_y=700
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
scene.world.color=(.05,.06,.09)
camera_data=bpy.data.cameras.new('HF13_QA_REVIEW_CAM')
camera=bpy.data.objects.new('HF13_QA_REVIEW_CAM',camera_data)
bpy.context.collection.objects.link(camera)
scene.camera=camera
camera_data.type='ORTHO'
camera_data.ortho_scale=max(dim.z*1.38,dim.x*1.9,.8)
distance=max(dim.length*2,3.0)
frames=[]
for view,direction in [
  ('front',V3((0,-1,.06))),('profile',V3((1,0,.06))),
  ('back',V3((0,1,.06)))]:
 camera.location=center+direction.normalized()*distance
 camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
 filename=output.parent/(j['id']+'-'+view+'.png')
 scene.render.filepath=str(filename)
 bpy.ops.render.render(write_still=True)
 assert filename.exists() and filename.stat().st_size>1000, 'REVIEW_RENDER_FAILED_'+view
 frames.append({'view':view,'filename':filename.name,'bytes':filename.stat().st_size})
print('HIGHFLY_SKIN13_FRONT_SIDE_BACK_ART_REVIEW_SCREENSHOTS_SAVED=3',flush=True)

report={
 'schema':'highfly.skin13.geometry-technical-proof/1',
 'jobId':j['id'],'style':style,'prompt':j['request']['prompt'],
 'worker':'BLENDER_PROCEDURAL_TECHNICAL_DEMONSTRATOR_NOT_AI',
 'freshOriginalGeometry':True,'copiedSourceTriangles':0,'donorMeshesUsedOnlyForFitAndWeights':True,
 'nativeRig':'Rig_Medium','originalRigBones':23,'originalAnimationClips':22,
 'newSkinnedPieces':len(objects),'newVertices':verts_total,'newPolygonFaces':faces_total,
 'glbSha256':hashlib.sha256(data).hexdigest(),'glbBytes':len(data),
 'skinsInGltf':len(glbjson.get('skins',[])),
 'animationTracksInGltf':len(glbjson.get('animations',[])),
 'visualArtQaPassed':False,'maleFemaleFitVerified':False,
 'reviewScreenshots':frames,'reviewAnglesRendered':len(frames),
 'artistApproved':False,'artApproved':False,'gameDeployed':False,
 'outcome':'TECHNICAL_GLTF_CREATED_AWAITING_ARTISTIC_AND_MOBILE_REVIEW',
 'pieces':stats
}
proofpath.parent.mkdir(parents=True,exist_ok=True)
proofpath.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('HIGHFLY_SKIN13_BLENDER_TRUE_NEW_GEOMETRY_AND_SKINNED_GLTF_TECHNICAL_GREEN=1',flush=True)
print('HIGHFLY_SKIN13_ART_APPROVED=0 -- FIRST GEOMETRY DEMO ONLY',flush=True)
