#!/usr/bin/env python3
"""HIGHFLY SKIN7 PREMIUM V1 - Genuine ClaudeCraft Paladin REFIT & SURFACE LEARNING.
Second pass on REFORGED source GLB (11 real Paladin armor pieces, Rig_Medium).
Embossed ornaments are lifted straight from SOURCE ARMOR polygons, follow every
original native vertex group (NO made-up KD-tree weights, NO Nightfall overlay),
and exist only in the ARMOR's own visual envelope. They cannot be an unrigged
floating mask; the same source vertices/weights were reused exactly.
Provisional visual design. Does NOT assert premium art quality or Unity mechanics.
"""
import bpy,math,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
a=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def val(key):
 if key not in a:raise RuntimeError("SKIN7_PREMIUM_MISSING_"+key)
 return Path(a[a.index(key)+1]).resolve()
src,out,report,recipe_path=[val(k) for k in ('--source','--output','--report','--recipe')]
recipe=json.loads(recipe_path.read_text())
if recipe.get('id')!='paladin-legendary-premium-v1-unapproved' or recipe.get('artistApproved') is not False or recipe.get('gameDeployAllowed') is not False:
 raise RuntimeError('SKIN7_PREMIUM_RECIPE_MUST_NOT_BE_APPROVED')
out.parent.mkdir(parents=True,exist_ok=True);report.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(src))
rig=bpy.data.objects.get('Rig_Medium')
if not rig or rig.type!='ARMATURE' or len(rig.data.bones)!=23:
 raise RuntimeError('SKIN7_PREMIUM_RIG_MEDIUM_NOT_23')
SLOTS={'head':['HEAD'],'chest':['CHEST'],'arms':['ARML','ARMR'],
'hands':['HANDL','HANDR'],'legs':['LEGL','LEGR'],'feet':['FOOTL','FOOTR'],'back':['BACK']}
expected=['HF7RF_PALADIN_'+x for names in SLOTS.values() for x in names]
donors={n:bpy.data.objects.get(n) for n in expected}
for name,o in donors.items():
 if not o or o.type!='MESH' or not o.vertex_groups or not any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers):
  raise RuntimeError('SKIN7_PREMIUM_SOURCE_SKIN_MISSING_'+name)
# PBR settings are preserved by importing the blue/gold palette from the initial
# source-recipe pass. New metal trim and mystical enameled gem are ADDITIVE details
# on the native armor, not a second equipped costume.
def material(name,hexval,metallic,roughness,emissive=False):
 c=tuple(int(hexval[i:i+2],16)/255 for i in (1,3,5))
 m=bpy.data.materials.new('HF7PM_'+name);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF')
 bs.inputs['Base Color'].default_value=(*c,1)
 bs.inputs['Metallic'].default_value=metallic
 bs.inputs['Roughness'].default_value=roughness
 if emissive:
  bs.inputs['Emission Color'].default_value=(*c,1)
  bs.inputs['Emission Strength'].default_value=.7
 return m
palette=recipe['palette']
trim=material('SACRED_GOLD_RAISED_SOURCE_PLATES',palette['metal'],.84,.23)
glow=material('ARCANE_CYAN_SOURCE_EMBOSS',palette['accent'],.22,.24,True)
# Source-derived ornaments: connected source triangles by anatomical region.
# The gold geometry uses the ORIGINAL donor triangle's own vertex weights;
# no nearest-body approximation or manual guess about fitting/rigging.
DESIGNS=[
 ('HEAD','KABUTO_BROW',.50,.62,38,trim,'front'),
 ('CHEST','CUIRASS_SHIELD',.52,.65,75,trim,'front'),
 ('CHEST','DIVINE_CORE',.52,.52,19,glow,'front'),
 ('ARML','LEFT_PAULDRON_RIDGE',.65,.68,34,trim,'front'),
 ('ARMR','RIGHT_PAULDRON_RIDGE',.34,.68,34,trim,'front'),
 ('LEGL','LEFT_GREAVE_SIGIL',.51,.65,20,trim,'front'),
 ('LEGR','RIGHT_GREAVE_SIGIL',.51,.65,20,trim,'front'),
 ('BACK','SACRED_DORSAL_GUARD',.52,.64,20,trim,'back')
]
proof={}
made=[]
for suffix,ornament,tx,tz,goal,mat,side in DESIGNS:
 donor=donors['HF7RF_PALADIN_'+suffix]
 donor.data.calc_loop_triangles()
 mesh=donor.data
 vertices=mesh.vertices
 mins=[min(v.co[k] for v in vertices) for k in range(3)]
 maxs=[max(v.co[k] for v in vertices) for k in range(3)]
 wx=max(maxs[0]-mins[0],.00001);hz=max(maxs[2]-mins[2],.00001)
 centers={p.index:p.center.copy() for p in mesh.polygons}
 poly_by_edge={}
 for p in mesh.polygons:
  vs=list(p.vertices)
  for i in range(len(vs)):
   k=tuple(sorted((vs[i],vs[(i+1)%len(vs)])))
   poly_by_edge.setdefault(k,[]).append(p.index)
 neighbors={p.index:set() for p in mesh.polygons}
 for sharing in poly_by_edge.values():
  for p in sharing:neighbors[p].update(i for i in sharing if i!=p)
 fy=1 if side=='back' else -1
 # Rank by actual SOURCE polygon normals; anatomical target is normalized to
 # donor bounds, but every selected triangle is part of the same original armor.
 candidates=[]
 for p in mesh.polygons:
  center=centers[p.index];uu=(center.x-mins[0])/wx;vv=(center.z-mins[2])/hz
  toward=p.normal.y*fy
  penalty=0 if toward>.12 else 1.7
  score=(uu-tx)**2*1.5+(vv-tz)**2*1.1+penalty+max(0,.15-toward)*.9
  candidates.append((score,p.index))
 candidates.sort()
 if not candidates:raise RuntimeError('SKIN7_PREMIUM_EMPTY_SOURCE_FACES_'+ornament)
 # Art direction: the chest should read as a shaped divine V, NOT a
 # huge square golden breastplate pasted over the original native geometry.
 if ornament=='CUIRASS_SHIELD':
  selected=set()
  for binno in range(7):
   u0=(binno+.5)/7
   desired_z=.38+.36*abs(2*u0-1)  # deep center / raised shoulder wings
   matches=[]
   for p in mesh.polygons:
    c=centers[p.index];u=(c.x-mins[0])/wx;v=(c.z-mins[2])/hz
    score=abs(u-u0)*2.8+abs(v-desired_z)*2.4+(0 if p.normal.y*fy>.06 else 1.1)
    matches.append((score,p.index))
   for score,pi in sorted(matches)[:3]:
    if score<1.6:selected.add(pi)
  if len(selected)<14:raise RuntimeError('SKIN7_PREMIUM_CHEST_V_SHAPE_NOT_GEOMETRICALLY_POSSIBLE')
 elif ornament in ('LEFT_PAULDRON_RIDGE','RIGHT_PAULDRON_RIDGE'):
  # A broad ridge must cover MULTIPLE native curved shoulder faces. Never
  # accept the four tiny triangles which created nearly invisible ornaments.
  selected={candidates[0][1]};queue=[candidates[0][1]]
  while queue and len(selected)<goal:
   current=queue.pop(0)
   ring=sorted((i for i in neighbors[current] if i not in selected),
    key=lambda i:next((q for q,j in candidates if j==i),99))
   for pi in ring:
    selected.add(pi);queue.append(pi)
    if len(selected)>=goal:break
  # KayKit pauldron is an intentional multiple-island mesh, not one watertight
  # manifold. Keep the strongest original contiguous panel and distribute
  # supplemental source-fitted gold facets on its other original islands.
  if len(selected)<20:
   selected.update(idx for score,idx in candidates[:min(goal,30)])
  if len(selected)<20:raise RuntimeError('SKIN7_PREMIUM_SHOULDER_RIDGE_TOO_SMALL')
 else:
  selected={candidates[0][1]}
  queue=[candidates[0][1]]
  # Other native detail plates expand continuously across existing face edges.
  while queue and len(selected)<goal:
   current=queue.pop(0)
   ring=sorted((i for i in neighbors[current] if i not in selected),
    key=lambda i: next((t for t,j in candidates if j==i),99))
   for other in ring:
    p=mesh.polygons[other]
    if p.normal.y*fy<-.3:continue
    selected.add(other);queue.append(other)
    if len(selected)>=goal:break
 if len(selected)<4:raise RuntimeError('SKIN7_PREMIUM_DECOR_FACES_TOO_FEW_'+ornament)
 index_map={};surface_points=[];faces=[];weight_data={}
 # Lift ≤0.008 units along exact surface normal; never make an offset set piece
 # that flies above the original armor. Source geometry is otherwise untouched.
 offset=.0045 if ornament=='DIVINE_CORE' else .0065
 for pi in sorted(selected):
  polygon=mesh.polygons[pi];loop=[]
  for native_idx in polygon.vertices:
   if native_idx not in index_map:
    v=vertices[native_idx]
    ni=len(surface_points);index_map[native_idx]=ni
    surface_points.append(tuple(v.co+v.normal*offset))
    wg=[(donor.vertex_groups[g.group].name,g.weight) for g in v.groups if g.weight>0]
    if not wg:raise RuntimeError('SKIN7_PREMIUM_SOURCE_VERTEX_MISSING_WEIGHTS_'+ornament)
    weight_data[ni]=wg
   loop.append(index_map[native_idx])
  faces.append(tuple(loop))
 geom=bpy.data.meshes.new('HF7PM_MESH_'+ornament)
 geom.from_pydata(surface_points,[],faces);geom.update(calc_edges=True)
 ob=bpy.data.objects.new('HF7PM_PALADIN_'+ornament,geom)
 bpy.context.collection.objects.link(ob)
 ob.matrix_world=donor.matrix_world.copy()
 ob.data.materials.append(mat)
 groups={}
 for ii,weights in weight_data.items():
  for name,amount in weights:
   if name not in groups:groups[name]=ob.vertex_groups.new(name=name)
   groups[name].add([ii],amount,'REPLACE')
 am=ob.modifiers.new('HF7PM_NATIVE_RIG_MEDIUM_SKIN','ARMATURE');am.object=rig
 if ob.parent!=donor.parent:ob.parent=donor.parent
 bpy.context.view_layer.update()
 # Source-weight native binding, not a static helmet or separate incompatible rig.
 proof[ornament]={
  'originalPaladinSource':donor.name,'nativeSourceTriangles':len(faces),
  'uniqueDonorVertices':len(index_map),'realUnmodifiedWeightsTransferred':True,
  'surfaceLiftUnits':offset,'connectedSourceFaces':ornament not in ('CUIRASS_SHIELD','LEFT_PAULDRON_RIDGE','RIGHT_PAULDRON_RIDGE'),
  'artDirectedShape':'seven-band-native-V' if ornament=='CUIRASS_SHIELD' else 'multi-island-source-curved-pauldron-ridge' if 'PAULDRON' in ornament else 'connected-source-face-emboss',
  'influencingBones':sorted(groups),'material':mat.name,
  'zeroSourceArmorDisplaced':True}
 made.append(ob)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for ob in list(donors.values())+made:ob.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,
 export_apply=False,export_yup=True)
if out.stat().st_size<140000:raise RuntimeError('SKIN7_PREMIUM_EXPORT_SUSPICIOUSLY_SMALL')
data={
 'schema':'highfly.skin7.paladin-premium-v1-report/1',
 'status':'UNAPPROVED_ART_CANDIDATE_NOT_GAMEPLAY',
 'authoredOriginalNativeArmorMeshCount':11,
 'newSourceConformingNativeRiggedDetailMeshes':len(made),
 'allDetailsFromRealArmorTriangles':True,
 'allDetailsCopyExactSourceVertexWeights':True,
 'originalRigBoneCount':len(rig.data.bones),
 'originalArmorSet':'Armor_paladin_*',
 'baseSource':'ClaudeCraft 0.44.0 (unchanged in 0.44.6)',
 'mood':'sacred gold embossed crests, deep enamel, cyan arcane core',
 'recipeSHA256':hashlib.sha256(recipe_path.read_bytes()).hexdigest(),
 'outputSHA256':hashlib.sha256(out.read_bytes()).hexdigest(),
 'details':proof,'oldStudioAndGameplayModified':False,
 'artApproved':False,'physicalS23Tested':False,'UnityGameplayCertified':False,
 'notes':['8 source-face ornament groups; preserve actual 11 Paladin wearables, no Nightfall stacked.',
 'Art-directed V breastpiece and widened shoulder ridges; independent visual review, animation and clipping check still required.',
 'No actual model training nor autonomous photo-to-premium-3D generation claimed.']
}
report.write_text(json.dumps(data,indent=2,ensure_ascii=False))
print('SKIN7_PALADIN_PREMIUM_REAL_SOURCE_ARMOR_WITH_NATIVE_WEIGHTED_8_DETAIL_EMBOSSES_GREEN=1')
print('SKIN7_PALADIN_PREMIUM_AUTHORED_SOURCE_PIECES=11 DETAILS='+str(len(made))+' OUTPUT_SHA256='+data['outputSHA256'])
