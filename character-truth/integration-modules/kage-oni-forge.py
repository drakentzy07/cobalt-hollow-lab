#!/usr/bin/env python3
"""HIGHFLY KAGE-ONI R1: ORIGINAL procedurally modeled samurai-inspired HELMET/MASK.
Reference is the pinned real M_Head in native Rig_Medium head-bone bind frame.
The authored GLB is one RIGID head accessory, NOT body armor / auto-skinning.
"""
import bpy, math, json, sys, hashlib
from pathlib import Path
from mathutils import Vector

def args(key):
    a=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    if key not in a or a.index(key)+1>=len(a): raise RuntimeError("MISSING_ARG "+key)
    return Path(a[a.index(key)+1]).resolve()
def to_blender(p): return (p[0],-p[2],p[1])
def to_gltf(p): return (p[0],p[2],-p[1])
def mat(name,color,metal,rough,emission=None):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=(*color,1)
    bs.inputs["Metallic"].default_value=metal
    bs.inputs["Roughness"].default_value=rough
    if emission:
        bs.inputs["Emission Color"].default_value=(*color,1)
        bs.inputs["Emission Strength"].default_value=emission
    return m
def mesh(name,vs,fs,m,bevel=0):
    d=bpy.data.meshes.new(name);d.from_pydata([to_blender(v) for v in vs],[],fs);d.update()
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.data.materials.append(m)
    if bevel:
        mod=o.modifiers.new("HARD_SURFACE_BEVEL","BEVEL");mod.width=bevel;mod.segments=2
        bpy.ops.object.select_all(action="DESELECT");o.select_set(True);bpy.context.view_layer.objects.active=o
        bpy.ops.object.modifier_apply(modifier=mod.name);o.select_set(False)
    return o
def prism(name,poly,depth,m):  # thickness along native GLTF z, triangulated fan cap
    # Polygon is ordered around the face in XY, and sits toward native forward +Z.
    n=len(poly);back=[(x,y,z-depth) for x,y,z in poly]
    vs=poly+back;fs=[]
    fs.append(tuple(range(n)));fs.append(tuple(range(2*n-1,n-1,-1)))
    for i in range(n):
        j=(i+1)%n;fs.append((i,j,n+j,n+i))
    return mesh(name,vs,fs,m)
def tube(name,points,radius,m):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D'
    curve.resolution_u=12;curve.bevel_depth=radius;curve.bevel_resolution=2
    sp=curve.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
    for b,p in zip(sp.bezier_points,points):
        b.co=to_blender(p);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o)
    curve.materials.append(m)
    bpy.ops.object.select_all(action="DESELECT");o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH');return bpy.context.view_layer.objects.active
def horn(name,c,s,side,m):
    x,y,z=c;w,h,d=s;steps=11;radial=12
    vs=[];fs=[]
    for k in range(steps):
        t=k/(steps-1)
        cx=x+side*w*(.385+.055*t+.08*t*t)
        cy=y+h*(.32+.72*t)
        cz=z+d*(-.13+.18*t*t)
        radius=w*(.096*(1-t)**.95+.009)
        for j in range(radial):
            angle=2*math.pi*j/radial
            vs.append((cx+radius*math.cos(angle),cy,cz+radius*math.sin(angle)))
    for k in range(steps-1):
        for j in range(radial):
            a=k*radial+j;b=k*radial+(j+1)%radial
            fs.append((a,b,b+radial,a+radial))
    fs.append(tuple(reversed(range(radial))))
    fs.append(tuple((steps-1)*radial+j for j in range(radial)))
    return mesh(name,vs,fs,m)
def shell(c,s,m):
    x,y,z=c;w,h,d=s
    rings=[(-.10,.49,.48),(.08,.525,.51),(.30,.48,.49),(.52,.32,.34),(.64,.065,.09)]
    n=32;v=[];f=[]
    for height,rx,rz in rings:
        for j in range(n):
            a=2*math.pi*j/n
            v.append((x+w*rx*math.cos(a),y+h*height,z+d*rz*math.sin(a)))
    for k in range(len(rings)-1):
        for j in range(n):
            a=k*n+j;b=k*n+(j+1)%n
            # Keep the frontal lower region above both real eye shapes open.
            front=math.sin((j+.5)*2*math.pi/n)>.55
            if not (k==0 and front):
                f.append((a,b,b+n,a+n))
    for j in range(1,n-1):f.append(((len(rings)-1)*n,(len(rings)-1)*n+j,(len(rings)-1)*n+j+1))
    return mesh("KO_01_ARTICULATED_CROWN",v,f,m)
def assemble(c,s):
    x,y,z=c;w,h,d=s
    coal=mat("KAGE_OBSIDIAN_IRON",(.045,.052,.075),.83,.28)
    steel=mat("KAGE_BRIGHT_STEEL",(.49,.57,.66),.82,.23)
    purple=mat("KAGE_VIOLET_ESSENCE",(.28,.065,.72),.20,.20,1.9)
    leather=mat("KAGE_BLACK_LEATHER",(.055,.039,.055),.10,.72)
    output=[shell(c,s,coal)]
    for side,tag in [(-1,"L"),(1,"R")]:
        output.append(horn("KO_02_ONI_HORN_"+tag,c,s,side,steel))
        # Angled cheek armor shields: build on authentic native head proportions.
        output.append(prism("KO_03_CHEEK_"+tag,[
            (x+side*w*.43,y+h*.10,z+d*.36),
            (x+side*w*.53,y-h*.02,z+d*.24),
            (x+side*w*.44,y-h*.40,z+d*.37),
            (x+side*w*.19,y-h*.52,z+d*.48),
            (x+side*w*.22,y-h*.10,z+d*.55)],d*.038,coal))
        # Separate bright metallic cheek spine.
        output.append(tube("KO_04_CHEEK_EDGE_"+tag,[
            (x+side*w*.40,y+h*.09,z+d*.41),
            (x+side*w*.44,y-h*.17,z+d*.42),
            (x+side*w*.21,y-h*.49,z+d*.51)],w*.015,steel))
        # Rear neck / kabuto skirt with segmented independent plates.
        for layer in range(3):
            a=layer*.105
            output.append(prism("KO_05_NECK_"+tag+"_"+str(layer),[
                (x+side*w*(.17+a),y-h*(.16+layer*.09),z-d*.35),
                (x+side*w*(.39+a*.45),y-h*(.15+layer*.10),z-d*.30),
                (x+side*w*(.51+a*.16),y-h*(.41+layer*.085),z-d*.33),
                (x+side*w*(.21+a),y-h*(.48+layer*.07),z-d*.46)],d*.028,coal))
        # Silver vertical crest rivets, source-symmetric.
        for j in range(3):
            output.append(tube("KO_06_RIVET_"+tag+"_"+str(j),[
                (x+side*w*(.14+.12*j),y+h*.40,z+d*(.38-.04*j)),
                (x+side*w*(.15+.12*j),y+h*.46,z+d*(.37-.04*j))],w*.009,steel))
    # Forehead guard (curved brow), angular central nose and separate lower mask.
    output.append(tube("KO_07_BROW_FRAME",[
        (x-w*.47,y+h*.20,z+d*.30),(x-w*.24,y+h*.28,z+d*.51),
        (x,y+h*.315,z+d*.60),(x+w*.24,y+h*.28,z+d*.51),
        (x+w*.47,y+h*.20,z+d*.30)],w*.025,steel))
    output.append(prism("KO_08_ONI_FACEPLATE",[
        (x-w*.20,y+h*.06,z+d*.56),
        (x+w*.20,y+h*.06,z+d*.56),
        (x+w*.32,y-h*.25,z+d*.49),
        (x+w*.20,y-h*.47,z+d*.49),
        (x,y-h*.54,z+d*.61),
        (x-w*.20,y-h*.47,z+d*.49),
        (x-w*.32,y-h*.25,z+d*.49)],d*.08,leather))
    output.append(prism("KO_09_NOSE_BRIDGE",[
        (x-w*.055,y+h*.19,z+d*.67),
        (x+w*.055,y+h*.19,z+d*.67),
        (x+w*.10,y-h*.21,z+d*.65),
        (x,y-h*.29,z+d*.73),
        (x-w*.10,y-h*.21,z+d*.65)],d*.065,steel))
    for row in range(4):
        yy=y-h*(.30+.055*row)
        output.append(tube("KO_10_MOUTH_GUARD_"+str(row),[
            (x-w*.165,yy,z+d*.618),
            (x,yy-h*.012,z+d*.675),
            (x+w*.165,yy,z+d*.618)],w*.011,steel))
    output.append(prism("KO_11_VIOLET_GEM",[
        (x,y+h*.52,z+d*.465),
        (x+w*.09,y+h*.36,z+d*.55),
        (x,y+h*.24,z+d*.62),
        (x-w*.09,y+h*.36,z+d*.55)],d*.041,purple))
    output.append(tube("KO_12_CENTER_CREST",[
        (x,y+h*.62,z+d*.04),(x,y+h*.48,z+d*.48),
        (x,y+h*.27,z+d*.61)],w*.020,steel))
    return output

def main():
    source=args('--native');dest=args('--out')
    if not source.is_file():raise RuntimeError('NATIVE_REFERENCE_MISSING')
    dest.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
    head=next((o for o in bpy.data.objects if o.name=='M_Head' and o.type=='MESH'),None)
    if not head:raise RuntimeError('REAL_NATIVE_M_HEAD_MISSING')
    corners=[to_gltf(head.matrix_world @ Vector(p)) for p in head.bound_box]
    minimum=[min(p[i] for p in corners) for i in range(3)]
    maximum=[max(p[i] for p in corners) for i in range(3)]
    size=[maximum[i]-minimum[i] for i in range(3)]
    center=[(minimum[i]+maximum[i])/2 for i in range(3)]
    if not all(math.isfinite(k) and .02<k<5 for k in size):raise RuntimeError('NATIVE_HEAD_BOUNDS_INVALID')
    creations=assemble(center,size)
    if len(creations)<25:raise RuntimeError('FORGE_GEOMETRY_INCOMPLETE')
    # Export new geometry only; never export native M_Head or frozen rig.
    bpy.ops.object.select_all(action='DESELECT')
    for ob in creations:ob.select_set(True)
    bpy.context.view_layer.objects.active=creations[0]
    bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',
        use_selection=True,export_apply=True,export_yup=True)
    encoded=dest.read_bytes()
    if len(encoded)<5000:raise RuntimeError('GLB_TOO_SMALL')
    previous=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(dest))
    imported=[o for o in bpy.data.objects if o not in previous and o.type=='MESH']
    if len(imported)<len(creations):raise RuntimeError('EXPORT_DROPPED_NATIVE_FORGED_MESH')
    if any(o.name.startswith('M_Head') or o.name.startswith('Rig_Medium') for o in imported):
        raise RuntimeError('UNAUTHORIZED_CHARACTER_EXPORT')
    horns=[o for o in imported if o.name.startswith('KO_02_ONI_HORN_')]
    if len(horns)!=2:raise RuntimeError('FORGE_SYMMETRY_HORNS_MISSING')
    horns_box=[[to_gltf(o.matrix_world @ Vector(v)) for v in o.bound_box] for o in horns]
    if not all(max(p[1] for p in b)>center[1]+size[1]*.85 for b in horns_box):
        raise RuntimeError('FORGE_HORNS_NOT_ABOVE_HEAD')
    face=next((o for o in imported if o.name.startswith('KO_08_ONI_FACEPLATE')),None)
    if face is None:raise RuntimeError('FACEPLATE_MISSING')
    facebox=[to_gltf(face.matrix_world @ Vector(v)) for v in face.bound_box]
    if min(q[2] for q in facebox)<center[2]+size[2]*.30:
        raise RuntimeError('FACEPLATE_NOT_FACING_NATIVE_FORWARD')
    result={
      'engine':'Blender bpy CPU','design':'HIGHFLY KAGE-ONI ORIGINAL R1',
      'native_reference':'M_Head','rig':'Rig_Medium','attachment':'head',
      'source_reference_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
      'head_size_gltf_y_up':size,'head_center_gltf_y_up':center,
      'object_count':len(creations),'mesh_roundtrip_count':len(imported),
      'authored_objects':[o.name for o in creations],
      'head_skinning':'RIGID BONE ATTACHMENT ONLY',
      'gltf_y_up':True,'horn_height_semantic_gate':True,
      'face_forward_semantic_gate':True,'character_mesh_copied':False,
      'glb_bytes':len(encoded),'glb_sha256':hashlib.sha256(encoded).hexdigest()}
    dest.with_suffix('.json').write_text(json.dumps(result,indent=2))
    print('HIGHFLY_KAGE_ONI_BLENDER_FORGE_GREEN '+json.dumps(result))
if __name__=='__main__':main()
