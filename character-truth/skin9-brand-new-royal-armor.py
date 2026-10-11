#!/usr/bin/env python3
"""HIGHFLY SKIN9-B: new authored mesh set, NOT the old Paladin geometry recolored.
Separate 11 original-weight-compatible source-bounded meshes, Royal Dark example.
No production game modifications. User artistic review still required.
"""
import bpy, sys, json, hashlib, math
from pathlib import Path
arg=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def flag(k):
 assert k in arg and arg.index(k)+1<len(arg), 'FLAG_MISSING_'+k
 return Path(arg[arg.index(k)+1]).resolve()
src=flag('--source');out=flag('--out');reportfile=flag('--report')
out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(src))
rig=bpy.data.objects.get('Rig_Medium')
assert rig and rig.type=='ARMATURE' and len(rig.data.bones)==23, 'ORIGINAL_RIG_MISSING'
BONES={b.name for b in rig.data.bones}
PIECES={'Head':'head','Chest':'chest','ArmL':'arms','ArmR':'arms','HandL':'hands',
 'HandR':'hands','LegL':'legs','LegR':'legs','FootL':'feet','FootR':'feet','Back':'back'}
# Polygons in original-armor-local x/z envelope: axial u in [-1,+1], v in [0,1].
# Not source triangle copying: brand-new crown, faceplate, wings and relief.
FORM={
'head':[
 ('shell',[(-.86,.18),(-.9,.68),(-.53,.96),(0,1.05),(.53,.96),(.9,.68),(.86,.18),(.44,.04),(-.44,.04)],0),
 ('crown',[(-.86,.81),(-.70,1.39),(-.39,1.05),(-.12,1.47),(0,1.05),(.12,1.47),(.39,1.05),(.70,1.39),(.86,.81)],1),
 ('visor',[(-.87,.61),(-.42,.65),(0,.46),(.42,.65),(.87,.61),(.5,.35),(0,.3),(-.5,.35)],2),
 ('face',[(-.38,.37),(0,.41),(.38,.37),(.24,.05),(0,-.13),(-.24,.05)],1),
 ('crest',[(-.1,1.22),(0,1.64),(.1,1.22),(0,.96)],2)],
'chest':[
 ('body',[(-.98,.75),(-.72,1.05),(0,.90),(.72,1.05),(.98,.75),(.73,.11),(0,-.13),(-.73,.11)],0),
 ('breast',[(-.87,.78),(-.49,.87),(0,.70),(.49,.87),(.87,.78),(.44,.39),(0,.27),(-.44,.39)],1),
 ('heart',[(-.18,.82),(0,1.04),(.18,.82),(.12,.49),(0,.28),(-.12,.49)],2),
 ('lower',[(-.6,.31),(0,.19),(.6,.31),(.41,-.09),(0,-.22),(-.41,-.09)],1)],
'arms':[
 ('pauldron',[(-1.45,.46),(-1.30,.95),(-.82,1.25),(-.37,1.12),(0,.9),(.37,1.12),(.82,1.25),(1.30,.95),(1.45,.46),(.84,.29),(0,.4),(-.84,.29)],0),
 ('gold-rim',[(-1.49,.72),(-1.13,1.02),(-.75,1.13),(0,.83),(.75,1.13),(1.13,1.02),(1.49,.72),(1.1,.63),(0,.72),(-1.1,.63)],1),
 ('talonL',[(-1.24,.89),(-1.45,1.52),(-.88,1.15),(-.65,.79)],2),
 ('talonR',[(1.24,.89),(1.45,1.52),(.88,1.15),(.65,.79)],2)],
'hands':[
 ('gauntlet',[(-1.0,.75),(-.67,1.02),(0,.81),(.67,1.02),(1,.75),(.78,.11),(0,-.10),(-.78,.11)],0),
 ('plate',[(-.58,.61),(0,.83),(.58,.61),(.39,.13),(-.39,.13)],1),
 ('claw',[(-.2,.19),(0,-.34),(.2,.19)],2)],
'legs':[
 ('greave',[(-.91,.91),(-.53,1.02),(0,.91),(.53,1.02),(.91,.91),(.63,.19),(0,-.13),(-.63,.19)],0),
 ('ridge',[(-.13,.93),(0,1.08),(.13,.93),(.26,.12),(0,-.22),(-.26,.12)],1),
 ('knee',[(-.76,.80),(0,1.19),(.76,.80),(0,.58)],2)],
'feet':[
 ('boot',[(-.97,.79),(-.46,1.08),(0,.95),(.46,1.08),(.97,.79),(.87,.07),(0,-.18),(-.87,.07)],0),
 ('toecap',[(-.78,.34),(0,.55),(.78,.34),(.41,-.15),(0,-.30),(-.41,-.15)],1),
 ('claw',[(-.17,.30),(0,-.5),(.17,.30)],2)],
'back':[
 ('spinal',[(-.8,.82),(-.5,1.09),(0,.93),(.5,1.09),(.8,.82),(.62,.06),(0,-.17),(-.62,.06)],0),
 ('wingL',[(-.32,.77),(-.78,1.36),(-1.74,1.73),(-1.35,1.17),(-1.91,1.03),(-1.15,.73),(-.62,.46)],1),
 ('wingR',[(.32,.77),(.78,1.36),(1.74,1.73),(1.35,1.17),(1.91,1.03),(1.15,.73),(.62,.46)],1),
 ('spine',[(-.15,.89),(0,1.42),(.15,.89),(.1,.10),(0,-.1),(-.1,.10)],2)]
}
def mat(name,color,metal,rough):
 m=bpy.data.materials.new(name)
 m.diffuse_color=(*[int(color[i:i+2],16)/255 for i in (1,3,5)],1)
 m.use_nodes=True
 bsdf=m.node_tree.nodes.get('Principled BSDF')
 bsdf.inputs['Base Color'].default_value=m.diffuse_color
 bsdf.inputs['Metallic'].default_value=metal
 bsdf.inputs['Roughness'].default_value=rough
 return m
MATS=[
 mat('HF9_BLACK_ROYAL_PLATE','#151a29',.81,.32),
 mat('HF9_FORGED_ROYAL_GOLD','#cc9d50',.86,.27),
 mat('HF9_CRIMSON_GEM','#a53543',.53,.20)]
details={};output=[]
def add_panel(verts,faces,mats,p,kind,cx,xspan,ybase,zbase,zspan,depth,back):
  label,outline,material=p
  sf=1.0 if kind!='arms' else .94
  if kind=='head':sf=.81
  if kind=='back':sf=.75
  if kind=='chest':sf=.85
  s=1 if back else -1
  y_front=ybase+s*depth
  n=len(outline);index=len(verts)
  verts.extend([(cx+u*xspan*.5*sf,y_front,zbase+v*zspan) for u,v in outline])
  central=(sum(u for u,v in outline)/n,sum(v for u,v in outline)/n)
  verts.append((cx+central[0]*xspan*.5*sf,y_front+s*depth*.32,zbase+central[1]*zspan))
  verts.extend([(cx+u*xspan*.5*sf,ybase-s*depth*.45,zbase+v*zspan) for u,v in outline])
  for k in range(n):
   nxt=(k+1)%n
   faces.append((index+n,index+k,index+nxt) if back else (index+n,index+nxt,index+k));mats.append(material)
   faces.append((index+k,index+n+1+k,index+n+1+nxt,index+nxt));mats.append(1)
  faces.append(tuple(index+n+1+i for i in reversed(range(n))));mats.append(0)
for part,kind in PIECES.items():
 donor=bpy.data.objects.get('Armor_paladin_'+part)
 assert donor and donor.type=='MESH' and donor.vertex_groups, 'SOURCE_MISSING_'+part
 assert any(m.type=='ARMATURE' and m.object==rig for m in donor.modifiers), 'RIG_NOT_NATIVE_'+part
 points=[v.co.copy() for v in donor.data.vertices]
 weights=[[(g.group,g.weight) for g in v.groups if g.weight>0] for v in donor.data.vertices]
 assert all(weights) and len(points)>20, 'DONOR_WEIGHTS_BAD_'+part
 lo=[min(v[k] for v in points) for k in range(3)]
 hi=[max(v[k] for v in points) for k in range(3)]
 span=[max(hi[k]-lo[k],.04) for k in range(3)]
 centerX=(lo[0]+hi[0])*.5
 # Source-space silhouette is intentionally newly generated, not recolored
 # or re-scaled triangles. Each slot gets separate folded polygons + ridges.
 vx=[];faces=[];indices=[]
 for panel in FORM[kind]:
  add_panel(vx,faces,indices,panel,kind,centerX,span[0],
      (hi[1] if kind=='back' else lo[1]),lo[2],span[2],max(.018,span[1]*.15),kind=='back')
 mesh=bpy.data.meshes.new('HF9_ARMOR_NEW_'+part);mesh.from_pydata(vx,[],faces);mesh.update()
 for material in MATS:mesh.materials.append(material)
 for face,material in zip(mesh.polygons,indices):face.material_index=material
 created=donor.copy();created.data=mesh;created.name='HF9NEW_PALADIN_'+part.upper()
 bpy.context.collection.objects.link(created)
 # Blender does not guarantee vertex_group containers survive replacing Mesh data.
 # Re-create each genuine donor bone group before transferring donor influences.
 if len(created.vertex_groups)==0:
  for g in donor.vertex_groups:created.vertex_groups.new(name=g.name)
 assert len(created.vertex_groups)==len(donor.vertex_groups), 'SKIN9_GROUP_MAP_LOST_'+part
 assert all(created.vertex_groups[g.index].name==g.name for g in donor.vertex_groups), 'SKIN9_BONE_GROUP_DRIFT_'+part
 # The new faces borrow WEIGHT INFLUENCES only — none of the old triangle
 # positions/faces/materials are used. Every new vertex must have real weights.
 for index,v in enumerate(mesh.vertices):
  nearest=min(range(len(points)),key=lambda i:(points[i]-v.co).length_squared)
  w=weights[nearest];norm=sum(weight for group,weight in w)
  assert norm>0,'SKIN9_EMPTY_WEIGHT'
  for group,weight in w:created.vertex_groups[group].add([index],weight/norm,'REPLACE')
 assert all(vertex.groups for vertex in mesh.vertices),'UNSKINNED_NEW_VERTEX'
 details[part]={'sourceVertices':len(donor.data.vertices),'brandNewVertices':len(vx),
  'brandNewFaces':len(faces),'shapePanels':[x[0] for x in FORM[kind]],
  'sourceTriangleReuse':False,'allVerticesWeighted':True}
 output.append(created)
assert len(output)==11 and sum(v['brandNewFaces'] for v in details.values())>110, 'TOPOLOGY_UNDERBUILT'
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for obj in output:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_apply=False,export_yup=True)
data=out.read_bytes()
assert data[:4]==b'glTF' and len(data)>17000, 'INVALID_NEW_GLTF'
report={'schema':'highfly.skin9.real-new-independent-armor/1',
 'name':'REY OSCURO · Primera Armadura Propia · PROTOTIPO',
 'rig':'Rig_Medium','bones':len(rig.data.bones),'newSkinnedMeshCount':len(output),
 'newVertexCount':sum(x['brandNewVertices'] for x in details.values()),
 'newFaceCount':sum(x['brandNewFaces'] for x in details.values()),
 'donorSourceOnlyForWeightAndFit':True,'reusedPaladinTriangles':False,
 'originalReforgeUntouched':True,'originalClaudeCraftUntouched':True,
 'headCrownNewMesh':True,'backWingsNewMesh':True,'shoulderSpikesNewMesh':True,
 'gameDeployed':False,'artApproved':False,'collisionQAPending':True,
 'pieces':details,'glbSha256':hashlib.sha256(data).hexdigest()}
reportfile.write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('HIGHFLY_SKIN9_TRUE_NEW_11_SKINNED_ARMOR_OBJECTS_FROM_ZERO_GEOMETRY_GREEN=1')
