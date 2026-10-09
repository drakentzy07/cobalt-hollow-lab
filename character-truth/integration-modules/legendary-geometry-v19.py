#!/usr/bin/env python3
"""HIGHFLY V19 — original premium ornamental armor geometry, weighted to genuine Rig_Medium.
Input is the already independently verified Nightfall V12 BLENDER GLB and ONLY its real donor
skinning. Exported overlay contains newly authored geometry plus the existing native armature,
not copied body or older Nightfall armor meshes. No pretrained generator/paid service.
"""
import bpy,sys,math,hashlib,json
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def flag(name):
 if name not in args: raise RuntimeError('V19_MISSING_'+name)
 return Path(args[args.index(name)+1]).resolve()
source=flag('--source'); output=flag('--out')
if not source.is_file():raise RuntimeError('V19_VERIFIED_NIGHTFALL_SOURCE_MISSING')
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(source))
rig=bpy.data.objects.get('Rig_Medium')
if not rig or rig.type!='ARMATURE' or len(rig.data.bones)!=23:
 raise RuntimeError('V19_TRUE_RIG_MEDIUM_23_BONES_REQUIRED')
bones={x.name for x in rig.data.bones}
if not {'head','chest','spine','upperarm.l','upperarm.r','hips'}.issubset(bones):
 raise RuntimeError('V19_WRONG_NATIVE_BONE_FAMILY')
donors=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith(('HFV8_','HFV12_'))]
if len(donors)<80:raise RuntimeError('V19_EXISTING_PREMIUM_DONORS_MISSING')
new_meshes=[];skin_reports={};mats=[]
def material(name,color,metal,rough,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Metallic'].default_value=metal
 p.inputs['Roughness'].default_value=rough
 if emit:
  p.inputs['Emission Color'].default_value=(*color,1)
  p.inputs['Emission Strength'].default_value=emit
 mats.append(m);return m
obsidian=material('HFV19_OBSIDIAN',(.022,.025,.038),.88,.24)
silver=material('HFV19_EDGE_SILVER',(.55,.65,.79),.85,.20)
red=material('HFV19_SCARLET_RUNE',(.48,.024,.032),.34,.28,.85)
bronze=material('HFV19_DARK_BRONZE',(.28,.16,.10),.78,.34)
def donor(name):
 o=bpy.data.objects.get(name)
 if not o or o.type!='MESH' or not o.vertex_groups:
  raise RuntimeError('V19_REAL_SKIN_DONOR_MISSING_'+name)
 if not any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers):
  raise RuntimeError('V19_DONOR_NOT_NATIVE_RIG_'+name)
 return o
def bounds(o):
 v=o.data.vertices
 lo=[min(x.co[k] for x in v) for k in range(3)]
 hi=[max(x.co[k] for x in v) for k in range(3)]
 return lo,hi,[(a+b)/2 for a,b in zip(lo,hi)],[max((b-a)/2,.015) for a,b in zip(lo,hi)]
def skin(o,d):
 """Source asset has already been normalized to same bone rest/bind frame.
 New ornaments use 4 nearest donor V12 weighted vertices. Nothing touches source bones."""
 groups={}
 for group in d.vertex_groups:
  if group.name in bones:groups[group.name]=o.vertex_groups.new(name=group.name)
 tree=KDTree(len(d.data.vertices))
 for v in d.data.vertices:tree.insert(v.co,v.index)
 tree.balance()
 donor_names=[g.name for g in d.vertex_groups]
 maxgroups=0
 for v in o.data.vertices:
  weights={}
  for _,idx,dist in tree.find_n(v.co,4):
   inv=1/(.00001+dist*dist)
   for g in d.data.vertices[idx].groups:
    name=donor_names[g.group]
    if name in groups:weights[name]=weights.get(name,0)+inv*g.weight
  selected=sorted(weights.items(),key=lambda kv:kv[1],reverse=True)[:4]
  total=sum(w for _,w in selected)
  if total<=1e-9:raise RuntimeError('V19_ZERO_SKIN_'+o.name+'_'+str(v.index))
  maxgroups=max(maxgroups,len(selected))
  for name,w in selected:
   if w/total>1e-8:groups[name].add([v.index],w/total,'REPLACE')
 arm=o.modifiers.new('V19_REAL_RIG_MEDIUM_BIND','ARMATURE');arm.object=rig
 o.matrix_world=d.matrix_world.copy()
 skin_reports[o.name]={'donor':d.name,'vertices':len(o.data.vertices),'maxInfluences':maxgroups}
def make(name,d,vertices,faces,mat):
 if len(vertices)<4 or len(faces)<3:raise RuntimeError('V19_EMPTY_AUTHOR_MESH_'+name)
 me=bpy.data.meshes.new(name)
 me.from_pydata(vertices,[],faces);me.update()
 o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o)
 o.data.materials.append(mat)
 for polygon in o.data.polygons:polygon.use_smooth=False
 skin(o,d);new_meshes.append(o);return o
def bevelled_plate(name,d,points,mat,depth=.021):
 """Closed convex extrusion in locally native X/Y/Z space, no flat transparent art."""
 n=len(points)
 back=[(x,y+depth,z) for x,y,z in points]
 verts=list(points)+back
 faces=[tuple(range(n)),tuple(reversed(range(n,n*2)))]
 for i in range(n):
  j=(i+1)%n
  faces.append((i,j,n+j,n+i))
 return make(name,d,verts,faces,mat)
def spine(name,d,base,tip,radius,mat,segments=9,radial=8,bend=0):
 vs=[];fs=[]
 for i in range(segments):
  t=i/(segments-1);r=radius*(1-t)**.76+.002
  center=Vector(base).lerp(Vector(tip),t)
  center.y-=bend*math.sin(t*math.pi)
  for j in range(radial):
   ang=2*math.pi*j/radial
   vs.append((center.x+r*math.cos(ang),center.y+r*math.sin(ang),center.z))
 for i in range(segments-1):
  for j in range(radial):
   a=i*radial+j;b=i*radial+(j+1)%radial
   fs.append((a,b,b+radial,a+radial))
 fs.append(tuple(reversed(range(radial))))
 fs.append(tuple((segments-1)*radial+i for i in range(radial)))
 return make(name,d,vs,fs,mat)
def rib(name,d,start,end,r,mat,n=9):
 a=Vector(start);b=Vector(end);axis=b-a
 up=Vector((0,0,1))
 tangent=axis.cross(up).normalized()
 if tangent.length<.1:tangent=Vector((1,0,0))
 other=axis.cross(tangent).normalized()
 verts=[];faces=[]
 for i in range(n):
  t=i/(n-1);center=a.lerp(b,t);center.y-=.006*math.sin(t*math.pi)
  for j in range(6):
   angle=2*math.pi*j/6;v=center+r*(tangent*math.cos(angle)+other*math.sin(angle))
   verts.append(tuple(v))
 for i in range(n-1):
  for j in range(6):
   a=i*6+j;b=i*6+(j+1)%6;faces.append((a,b,b+6,a+6))
 return make(name,d,verts,faces,mat)
for sex in ('M','F'):
 torso=donor('HFV12_'+sex+'_CHEST_ABDOMINAL_CUIRASS')
 a,b,c,r=bounds(torso)
 w=max(r[0],.12);d=max(r[1],.08);h=max(r[2],.22)
 # Real sculpted three-dimensional central chest crest, raised above donor armor front.
 forward=a[1]-.065
 bevelled_plate('HFV19_'+sex+'_CHEST_DEMON_HEART',torso,[
   (c[0],forward-.055,c[2]+h*.75),
   (c[0]-w*.26,forward,c[2]+h*.18),
   (c[0],forward-.08,c[2]-h*.68),
   (c[0]+w*.26,forward,c[2]+h*.18)],obsidian,.043)
 bevelled_plate('HFV19_'+sex+'_CHEST_HEART_RUNE',torso,[
   (c[0],forward-.09,c[2]+h*.48),
   (c[0]-w*.10,forward-.086,c[2]+h*.09),
   (c[0],forward-.11,c[2]-h*.38),
   (c[0]+w*.10,forward-.086,c[2]+h*.09)],red,.012)
 for side,tag in [(-1,'L'),(1,'R')]:
  x=c[0]+side*w*.65
  bevelled_plate('HFV19_'+sex+'_CHEST_CRESCENT_'+tag,torso,[
   (x,forward,c[2]+h*.68),
   (x+side*w*.27,forward-.015,c[2]+h*.30),
   (x+side*w*.16,forward-.020,c[2]-h*.48),
   (x-side*w*.12,forward-.023,c[2]-h*.20)],silver,.015)
  # Raised 3D alloy stitch visible in material, not a 2D decal.
  rib('HFV19_'+sex+'_CHEST_STITCH_'+tag,torso,
   (x,forward-.041,c[2]+h*.41),
   (x+side*w*.05,forward-.04,c[2]-h*.25),w*.015,bronze)
  # Segmented rear shadow mantle: no fake cloth simulation and no head skeleton graft.
  back=b[1]+.07
  for layer in range(2):
   zz=c[2]-h*(.11+layer*.24)
   bevelled_plate('HFV19_'+sex+'_BACK_SHADOW_PLATE_'+tag+'_'+str(layer),torso,[
    (c[0]+side*w*.07,back,zz+h*.22),
    (c[0]+side*w*.73,back+.065,zz+h*.04),
    (c[0]+side*w*.96,back+.17,zz-h*.41),
    (c[0]+side*w*.30,back+.13,zz-h*.52)],obsidian,.026)
  # Two true skinned 3D shoulder fins per arm, not recycled source meshes.
  arm=donor('HFV8_'+sex+'_ARMS_PAULDRON_'+tag)
  low,high,ac,ar=bounds(arm)
  reach=high[0]-low[0]
  for tier in range(2):
   rootx=ac[0]+side*reach*(.02+.19*tier)
   spine('HFV19_'+sex+'_ARMS_DRAGON_SPIKE_'+tag+'_'+str(tier),
      arm,(rootx,low[1]-.03,ac[2]+ar[2]*.20),
      (rootx+side*reach*(.10+.16*tier),low[1]-.15,ac[2]+ar[2]*(2.2+.5*tier)),
      max(.015,ar[0]*.20),silver if tier==0 else obsidian,bend=.055)
  rib('HFV19_'+sex+'_ARMS_SILVER_EDGE_'+tag,arm,
   (ac[0]-side*reach*.12,low[1]-.06,ac[2]),
   (ac[0]+side*reach*.12,low[1]-.08,ac[2]+ar[2]*1.20),
   max(.005,ar[0]*.045),red)
if len(new_meshes)!=32:
 raise RuntimeError('V19_SCULPTED_PART_COUNT_CHANGED_'+str(len(new_meshes)))
if any(o.name in {d.name for d in donors} for o in new_meshes):
 raise RuntimeError('V19_REPLACED_ORIGINAL_SOURCE_MESH')
verts=sum(len(o.data.vertices) for o in new_meshes)
if verts>6500:raise RuntimeError('V19_ANDROID_OVERLAY_VERTEX_BUDGET_EXCEEDED_'+str(verts))
# Only select the existing genuine skeleton and authored geometry.
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for o in new_meshes:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',
 use_selection=True,export_yup=True,export_apply=False)
if not output.is_file() or output.stat().st_size<9000:
 raise RuntimeError('V19_REAL_GLB_OUTPUT_EMPTY')
# For the player-ready design authoring pipeline, also write a single GLB with
# Nightfall V12 plus the newly authored V19 geometry, while NEVER exporting body meshes.
if '--full' in args:
 full=Path(args[args.index('--full')+1]).resolve();full.parent.mkdir(parents=True,exist_ok=True)
 bpy.ops.object.select_all(action='DESELECT')
 rig.select_set(True)
 for o in donors+new_meshes:o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(full),export_format='GLB',
  use_selection=True,export_yup=True,export_apply=False)
 if not full.is_file() or full.stat().st_size<output.stat().st_size:
  raise RuntimeError('V19_COMBINED_GLB_INVALID')
 print('HIGHFLY_V19_COMBINED_NIGHTFALL_NEW_GEOMETRY_GLB_GREEN=1 BYTES='+str(full.stat().st_size))

report={
 'schema':'HIGHFLY_LEGENDARY_V19_ORIGINAL_GEOMETRY','source':str(source.name),
 'nativeRig':'Rig_Medium','originalJointCount':len(rig.data.bones),
 'originalBodyMeshesExported':False,'originalArmorMeshesExported':False,
 'forgedMeshCount':len(new_meshes),'forgedVertices':verts,
 'gender':['M','F'],'newMeshNames':[o.name for o in new_meshes],
 'weights':skin_reports,'materials':[m.name for m in mats],
 'technicalAnimationProof':'requires separate V19 motion gate',
 'physicalSamsungVerified':False,'artistApproved':False,
 'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'glbSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size
}
output.with_suffix('.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('HIGHFLY_V19_AUTHORED_NEW_ORIGINAL_WEIGHTED_GEOMETRY_GREEN=1 MESHES='+str(len(new_meshes))+' VERTS='+str(verts)+' BYTES='+str(output.stat().st_size))
