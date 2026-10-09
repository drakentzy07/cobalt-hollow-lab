#!/usr/bin/env python3
"""HIGHFLY V8 original Nightfall armor: six weighted visual slots on TRUE Rig_Medium.
Creates genuinely new geometry; never exports the original character meshes.
This is a TECHNICAL RIGGED ARMOR PROOF, not a visually approved AAA skin.
"""
import bpy,math,json,hashlib,sys
from mathutils import Vector
from mathutils.kdtree import KDTree
from pathlib import Path

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def flag(k):
    if k not in args or args.index(k)+1>=len(args):raise RuntimeError('MISSING '+k)
    return Path(args[args.index(k)+1]).resolve()
src=flag('--native'); out=flag('--out')
if not src.is_file():raise RuntimeError('NATIVE_REFERENCE_NOT_FOUND')
out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(src))
rig=bpy.data.objects.get('Rig_Medium')
if not rig or rig.type!='ARMATURE' or len(rig.data.bones)<20:
    raise RuntimeError('TRUE_RIG_MEDIUM_WITH_NATIVE_BONES_REQUIRED')
bones={b.name for b in rig.data.bones}
required={'root','hips','spine','chest','head','upperarm.l','lowerarm.l',
          'upperarm.r','lowerarm.r','upperleg.l','lowerleg.l','upperleg.r','lowerleg.r'}
if not required.issubset(bones):raise RuntimeError('NATIVE_BONE_MAP_MISMATCH')
original_names={o.name for o in bpy.data.objects}
made=[];transfers={};materials=[]
def material(name,color,metal=0.5,rough=0.45,emit=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    if emit:
      p.inputs['Emission Color'].default_value=(*color,1)
      p.inputs['Emission Strength'].default_value=emit
    materials.append(m);return m
obsidian=material('HIGHFLY_NIGHTFALL_OBSIDIAN',(.035,.036,.062),.72,.25)
platinum=material('HIGHFLY_NIGHTFALL_TITANIUM',(.46,.52,.68),.87,.21)
violet=material('HIGHFLY_NIGHTFALL_VIOLET',(.29,.065,.69),.29,.19,.8)
leather=material('HIGHFLY_NIGHTFALL_LEATHER',(.060,.045,.085),.09,.70)
gold=material('HIGHFLY_NIGHTFALL_GOLD',(.60,.35,.13),.74,.32)

def native(name):
    o=bpy.data.objects.get(name)
    if not o or o.type!='MESH' or o.parent!=rig or not o.vertex_groups:
      raise RuntimeError('EXPECTED_SKINNED_NATIVE_MESH_'+name)
    return o
def size_box(donor):
    a=[min(v.co[k] for v in donor.data.vertices) for k in range(3)]
    b=[max(v.co[k] for v in donor.data.vertices) for k in range(3)]
    return a,b,[(a[i]+b[i])/2 for i in range(3)],[(b[i]-a[i])/2 for i in range(3)]

def weights_from_native(target,donor):
    """Neighbor-based, normalized real donor vertex-group weights; cap 4 influences.
    No generated bones, fake skeleton or copied donor triangles."""
    tree=KDTree(len(donor.data.vertices))
    for v in donor.data.vertices:tree.insert(v.co,v.index)
    tree.balance()
    source=[g.name for g in donor.vertex_groups]
    if not set(source).intersection(bones):raise RuntimeError('NO_TRUE_DONOR_BONE_WEIGHTS_'+donor.name)
    groups={name:target.vertex_groups.new(name=name) for name in source if name in bones}
    zeros=0;maxin=0
    for v in target.data.vertices:
        accum={}
        neighbors=tree.find_n(v.co,4)
        for co,idx,dist in neighbors:
            inv=1.0/(.00001+dist*dist)
            for group in donor.data.vertices[idx].groups:
                name=source[group.group]
                if name in groups:
                  accum[name]=accum.get(name,0)+inv*group.weight
        best=sorted(accum.items(),key=lambda kv:-kv[1])[:4]
        total=sum(w for k,w in best)
        if total<1.e-7:
            zeros+=1;continue
        maxin=max(maxin,len(best))
        for name,value in best:
            if value/total>.000001:groups[name].add([v.index],value/total,'REPLACE')
    if zeros:raise RuntimeError('UNWEIGHTED_FORGED_VERTICES_'+target.name+'_'+str(zeros))
    arm=target.modifiers.new('TRUE_RIG_MEDIUM_SKINNING','ARMATURE');arm.object=rig
    target.matrix_world=donor.matrix_world.copy()
    transfers[target.name]={'donor':donor.name,'vertices':len(target.data.vertices),'zeroWeight':zeros,'maxInfluences':maxin}
    return target

def mesh(name,donor,vertices,faces,mat):
    # Build one geometrically ORIGINAL polygon mesh, bind only to original rig.
    if len(vertices)<4 or not faces:raise RuntimeError('EMPTY_FORGED_MESH_'+name)
    m=bpy.data.meshes.new(name);m.from_pydata(vertices,[],faces);m.update()
    o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    for poly in o.data.polygons:poly.use_smooth=True
    weights_from_native(o,donor)
    made.append(o)
    return o

def surface(name,donor,rows,cols,fn,mat,thickness=.016):
    """Raised armor panels, front/back actual thickness and connected rims."""
    vertices=[fn(v/(rows-1),i/(cols-1)) for v in range(rows) for i in range(cols)]
    # Mild thickness away from native body surface; reflected rear shell.
    back=[(x,y+thickness,z) for x,y,z in vertices]
    allverts=vertices+back
    n=len(vertices);faces=[]
    for a in range(rows-1):
     for b in range(cols-1):
      q=a*cols+b;faces.extend([(q,q+1,q+cols+1,q+cols),
                               (n+q+cols,n+q+cols+1,n+q+1,n+q)])
    for i in range(cols-1):
      top=i;bottom=(rows-1)*cols+i
      faces.extend([(top,n+top,n+top+1,top+1),
                    (bottom,bottom+1,n+bottom+1,n+bottom)])
    for j in range(rows-1):
      a=j*cols;b=(j+1)*cols
      faces.extend([(a,b,n+b,n+a),
                    (a+cols-1,n+a+cols-1,n+b+cols-1,b+cols-1)])
    return mesh(name,donor,allverts,faces,mat)

def toroidal(name,donor,axis,along,radii,mat,ends=6,sides=16,flare=1):
    verts=[];faces=[]
    center=(along[0]+along[1])*0.5
    for i in range(ends):
      t=i/(ends-1);pos=along[0]*(1-t)+along[1]*t
      f=1+(.13*math.sin(math.pi*t))*flare
      for j in range(sides):
       ang=2*math.pi*j/sides
       if axis=='x':
        x=pos;y=radii['center_y']+radii['ry']*f*math.cos(ang)
        z=radii['center_z']+radii['rz']*f*math.sin(ang)
       else:
        z=pos;x=radii['center_x']+radii['rx']*f*math.cos(ang)
        y=radii['center_y']+radii['ry']*f*math.sin(ang)
       verts.append((x,y,z))
    for i in range(ends-1):
     for j in range(sides):
      a=i*sides+j;b=i*sides+(j+1)%sides
      faces.append((a,b,b+sides,a+sides))
    for j in range(1,sides-1):
      faces.append((0,j+1,j))
      p=(ends-1)*sides
      faces.append((p,p+j,p+j+1))
    return mesh(name,donor,verts,faces,mat)

def blade(name,donor,vertices,mat):
    """Pyramidlike decorative steel plate with raised central ridge."""
    # Given convex ordered outline; center is outward along y/front axis.
    center=Vector((sum(p[i] for p in vertices)/len(vertices) for i in range(3)))
    center.y-=.045
    n=len(vertices);v=list(vertices)+[tuple(center)]
    faces=[(j,(j+1)%n,n) for j in range(n)]
    return mesh(name,donor,v,faces,mat)

for gender in ('M','F'):
    torso=native(gender+'_Torso')
    lo,hi,c,half=size_box(torso)
    width=half[0]*1.18;depth=half[1]*1.20
    low=lo[2]+(hi[2]-lo[2])*.27
    high=hi[2]-(hi[2]-lo[2])*.07
    def chestplate(t,u):
        angle=(u-.5)*2.5
        z=low+(high-low)*t
        taper=.91+.08*math.sin(t*math.pi)
        return (c[0]+width*taper*math.sin(angle),
                c[1]-depth*taper*math.cos(angle)-.025,z)
    surface('HFV8_'+gender+'_CHEST_NIGHTFALL',torso,9,19,chestplate,obsidian,.025)
    def chest_trim(t,u):
        p=chestplate(t,u)
        return (p[0]*1.01,p[1]-.015,p[2])
    surface('HFV8_'+gender+'_CHEST_EDGE_PLATINUM',torso,3,19,
            lambda t,u:chest_trim(.88+.065*t,u),platinum,.009)
    # Original dragon-shaped three-dimensional angular sternum emblem.
    emblem=[
       (0,c[1]-depth-.067,high-.095),
       (-width*.12,c[1]-depth-.062,high-.23),
       (0,c[1]-depth-.093,high-.32),
       (width*.12,c[1]-depth-.062,high-.23)]
    blade('HFV8_'+gender+'_CHEST_VIOLET_RUNE',torso,emblem,violet)
    # Segmented metallic waist faulds, each independently weighted.
    for i in range(3):
      base=lo[2]+.13+i*.095
      surface('HFV8_'+gender+'_BACK_WAIST_FAULD_'+str(i),torso,3,17,
        lambda t,u,base=base:(c[0]+width*1.07*math.sin((u-.5)*2.65),
          c[1]+depth*1.16*math.cos((u-.5)*2.65)+.035,base+.10*t),
          obsidian if i%2==0 else platinum,.014)
    # Two broad rear spine plates, skinned from the true torso.
    for side in (-1,1):
      surface('HFV8_'+gender+'_BACK_KABUTO_WING_'+('L' if side>0 else 'R'),torso,9,5,
       lambda t,u,side=side:(
        c[0]+side*width*(.07+.72*u)+side*.045*(1-t),
        c[1]+depth*.96+.035+.10*(1-t)**2,
        hi[2]-.04-(hi[2]-lo[2])*.73*t),leather,.015)
    for side,letter in ((1,'L'),(-1,'R')):
       arm=native(gender+'_Arm'+letter)
       a,b,ac,ar=size_box(arm)
       local_center={'center_y':ac[1],'center_z':ac[2],'ry':ar[1]*1.23+.023,'rz':ar[2]*1.20+.024}
       x0=a[0]+(b[0]-a[0])*.13
       x1=a[0]+(b[0]-a[0])*.49
       if side<0:x0,x1=b[0]-(b[0]-a[0])*.49,b[0]-(b[0]-a[0])*.13
       toroidal('HFV8_'+gender+'_ARMS_PAULDRON_'+letter,arm,'x',(x0,x1),local_center,obsidian,5,20,2)
       # Forearm cuff
       x0=a[0]+(b[0]-a[0])*.60
       x1=a[0]+(b[0]-a[0])*.94
       toroidal('HFV8_'+gender+'_ARMS_BRACER_'+letter,arm,'x',(x0,x1),local_center,platinum,6,16,.7)
       hand=native(gender+'_Hand'+letter)
       hmin,hmax,hc,hr=size_box(hand)
       toroidal('HFV8_'+gender+'_HANDS_GAUNTLET_'+letter,hand,'x',
          (hmin[0]+.012,hmax[0]-.012),
          {'center_y':hc[1],'center_z':hc[2],'ry':hr[1]*1.18+.018,'rz':hr[2]*1.21+.018},
          obsidian,6,14,.2)
       leg=native(gender+'_Leg'+letter)
       lmin,lmax,lc,lr=size_box(leg)
       toroidal('HFV8_'+gender+'_LEGS_GREAVE_'+letter,leg,'z',
        (lmin[2]+.035,lmax[2]-.025),
        {'center_x':lc[0],'center_y':lc[1],'rx':lr[0]*1.18+.025,'ry':lr[1]*1.20+.025},
        obsidian,8,16,0.8)
       foot=native(gender+'_Foot'+letter)
       fmin,fmax,fc,fr=size_box(foot)
       toroidal('HFV8_'+gender+'_FEET_SABATON_'+letter,foot,'z',
        (fmin[2]+.01,fmax[2]+.016),
        {'center_x':fc[0],'center_y':fc[1],'rx':fr[0]*1.2+.017,'ry':fr[1]*1.16+.024},
        platinum,6,16,.3)

if len(made)<30:raise RuntimeError('ORIGINAL_ARMOR_PARTS_INCOMPLETE_'+str(len(made)))
# Each required slot must have original independently named meshes per gender.
for g in ('M','F'):
 for slot in ('CHEST','ARMS','HANDS','LEGS','FEET','BACK'):
    if not any(o.name.startswith('HFV8_'+g+'_'+slot+'_') for o in made):
        raise RuntimeError('ARMOR_SLOT_MISSING_'+g+'_'+slot)
# Do not use export selection on any original body meshes.
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for o in made:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',
 use_selection=True,export_yup=True,export_apply=False)
if not out.is_file() or out.stat().st_size<10000:raise RuntimeError('GLB_OUTPUT_EMPTY')
record={
 'kind':'HIGHFLY_V8_ORIGINAL_WEIGHTED_ARMOR_TECH_PROOF',
 'rig':'Rig_Medium',
 'original_bones':len(rig.data.bones),
 'genders':['M','F'],'slots':['CHEST','ARMS','HANDS','LEGS','FEET','BACK'],
 'head_source':'V6 KAGE ONI rigid head GLB separate',
 'forged_meshes':len(made),
 'mesh_names':[m.name for m in made],
 'weights':transfers,'materials':[m.name for m in materials],
 'original_meshes_included':False,
 'licensing':'Only derived bind rig skeleton, no source character meshes/textures',
 'skinning':'VERTEX GROUPS FROM NEAREST FOUR TRUE NATIVE BODY VERTICES',
 'limitations':['Automated visual clipping test pending','Professional visual QA pending',
                'Kage Oni V6 helmet packaged separately','Physical S23 test pending'],
 'original_source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),
 'bytes':out.stat().st_size,'glb_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),
}
out.with_suffix('.json').write_text(json.dumps(record,indent=2,ensure_ascii=False))
print('HIGHFLY_V8_WEIGHTED_ORIGINAL_ARMOR_EXPORTED '+json.dumps({
 'mesh_count':len(made),'genders':record['genders'],
 'slots':record['slots'],'original_bones':record['original_bones'],
 'bytes':record['bytes']}))
