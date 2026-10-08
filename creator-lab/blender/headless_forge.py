#!/usr/bin/env python3
"""HIGHFLY Blender Forge R0: actual Blender CPU headless, native Rig_Medium bind.
Produces one ORIGINAL curved/biselled 3D accessory and GLB, never edits donor.
"""
import bpy, sys, json, math, hashlib, os
from pathlib import Path
from mathutils import Vector

# Blender is Z-up, Three.js/glTF is Y-up. These are inverse rotations:
# glTF(x,y,z) -> Blender(x,-z,y) -> export_yup=True -> glTF(x,y,z).
def gltf_to_blender(v):
    return Vector((v.x,-v.z,v.y))
def blender_to_gltf(v):
    return Vector((v.x,v.z,-v.y))

def arg(name, fallback=None):
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    if name in args and args.index(name)+1<len(args): return args[args.index(name)+1]
    if fallback is not None: return fallback
    raise ValueError(f"Missing {name}")

def material(name, rgba, metallic, rough):
    mat=bpy.data.materials.new(name)
    mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value=tuple(rgba)
    bsdf.inputs["Metallic"].default_value=metallic
    bsdf.inputs["Roughness"].default_value=rough
    return mat

def mesh_object(name,vertices,faces,mat):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([gltf_to_blender(Vector(v))[:] for v in vertices],[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

def forge_beak(center, size, graphite, ivory):
    x,y,z=center.x,center.y,center.z
    w,h,d=size.x,size.y,size.z
    # Cross section segments describe a curved, decreasing avian beak.
    rings=[]
    points=[
      (0.02, .10, .57, .145, .105),
      (0.05, .05, .67, .130, .100),
      (0.07, -.03, .78, .105, .082),
      (0.08, -.12, .89, .075, .056),
      (0.06, -.23, .93, .041, .036),
      (0.025,-.30, .92, .011, .010),
    ]
    segments=12
    for offset,up,forward,rx,ry in points:
        ring=[(x+w*(offset+rx*math.cos(2*math.pi*j/segments)),
               y+h*(up+ry*math.sin(2*math.pi*j/segments)),z+d*forward)
              for j in range(segments)]
        rings+=ring
    faces=[]
    for i in range(len(points)-1):
        for j in range(segments):
            a=i*segments+j;b=i*segments+(j+1)%segments
            faces.append((a,b,b+segments,a+segments))
    faces.extend([tuple(reversed(range(segments))),
                  tuple((len(points)-1)*segments+j for j in range(segments))])
    obj=mesh_object("HF_BLENDER_CurvedRavenBeak",rings,faces,ivory)
    bevel=obj.modifiers.new("REAL_BEVEL","BEVEL")
    bevel.width=min(w,h,d)*.008
    bevel.segments=2
    if hasattr(bevel,"affect"): bevel.affect="EDGES"
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.select_set(False)
    for poly in obj.data.polygons: poly.use_smooth=True
    return obj

def curve_feather(name,center,size,side,layer,mat):
    w,h,d=size.x,size.y,size.z
    curve=bpy.data.curves.new(name,"CURVE");curve.dimensions="3D"
    curve.resolution_u=18
    curve.bevel_depth=min(w,h,d)*.009
    curve.bevel_resolution=3
    spline=curve.splines.new("BEZIER");spline.bezier_points.add(2)
    points=[
        Vector((center.x+side*w*(.25+.04*layer),
                center.y+h*(.34-.10*layer),
                center.z-d*.04)),
        Vector((center.x+side*w*(.40+.06*layer),
                center.y+h*(.47-.05*layer),
                center.z-d*(.27+.05*layer))),
        Vector((center.x+side*w*(.49+.08*layer),
                center.y+h*(.60-.04*layer),
                center.z-d*(.50+.07*layer)))
    ]
    for bp,co in zip(spline.bezier_points,points):
        bp.co=gltf_to_blender(co)
        bp.handle_left_type="AUTO";bp.handle_right_type="AUTO"
    ob=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True);bpy.context.view_layer.objects.active=ob
    bpy.ops.object.convert(target="MESH")
    return bpy.context.view_layer.objects.active

def main():
    source=Path(arg("--native")).resolve()
    output=Path(arg("--out")).resolve()
    output.parent.mkdir(parents=True,exist_ok=True)
    if not source.is_file(): raise ValueError("Missing native bind-head reference GLB")
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
    target=next((o for o in bpy.data.objects if o.name=="M_Head" and o.type=="MESH"),None)
    if target is None: raise ValueError("No TRUE M_Head mesh in provided GLB (NO PROXY ALLOWED)")
    # Importer has already rotated the native glTF to Blender's Z-up.
    # Convert native bbox corners BACK to glTF Y-up before head measurement.
    corners=[blender_to_gltf(target.matrix_world@Vector(v)) for v in target.bound_box]
    minima=Vector((min(x[i] for x in corners) for i in range(3)))
    maxima=Vector((max(x[i] for x in corners) for i in range(3)))
    size=maxima-minima
    center=(maxima+minima)/2
    if min(size)<.02: raise ValueError("Native head dimensions invalid")
    ivory=material("HF_IVORY_HERO",[.54,.49,.38,1],.65,.28)
    violet=material("HF_DEEP_VIOLET",[.12,.04,.30,1],.32,.42)
    result=[forge_beak(center,size,None,ivory)]
    for side in (-1,1):
        for layer in range(3):
            result.append(curve_feather(f"HF_BezierPlume_{side}_{layer}",center,size,side,layer,violet))
    # Blender exports only newly fabricated objects; source is purely reference.
    bpy.ops.object.select_all(action="DESELECT")
    for ob in result: ob.select_set(True)
    bpy.context.view_layer.objects.active=result[0]
    bpy.ops.export_scene.gltf(filepath=str(output),export_format="GLB",
        use_selection=True,export_apply=True,export_yup=True)
    # The target glTF/Three.js coordinate system is Y-up. Blender's Z-up
    # internal edit space must be exported with the GLTF Y-up conversion.
    # Roundtrip check: imported exported GLB must occupy the same Blender
    # world region as the original generated geometry.
    def world_bounds(objects):
        corners=[ob.matrix_world@Vector(v) for ob in objects for v in ob.bound_box if ob.type=="MESH"]
        lo=Vector((min(q[i] for q in corners) for i in range(3)))
        hi=Vector((max(q[i] for q in corners) for i in range(3)))
        return lo,hi
    original_min,original_max=world_bounds(result)
    existing=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(output))
    imported=[o for o in bpy.data.objects if o not in existing and o.type=="MESH"]
    if len(imported)<7: raise ValueError("Blender exported geometry lost parts on GLB reload")
    recovered_min,recovered_max=world_bounds(imported)
    drift=max(abs(original_min[i]-recovered_min[i]) for i in range(3))
    drift=max(drift,max(abs(original_max[i]-recovered_max[i]) for i in range(3)))
    if drift>max(size)*.02:
        raise ValueError(f"Blender/GLB Y-up roundtrip drift {drift:.6f} > tolerance")
    # Independent semantic gate: roundtrip may be perfect while an exported
    # bird beak is a HORN. Check against ORIGINAL GLTF head coordinates.
    beak_in=next((o for o in imported if o.name.startswith('HF_BLENDER_CurvedRavenBeak')),None)
    if beak_in is None: raise ValueError("Export lost native-forward raven beak")
    beak_gl=[blender_to_gltf(beak_in.matrix_world @ Vector(v)) for v in beak_in.bound_box]
    beak_lo=Vector((min(p[k] for p in beak_gl) for k in range(3)))
    beak_hi=Vector((max(p[k] for p in beak_gl) for k in range(3)))
    if (beak_lo.z<center.z+size.z*.40 or
        beak_hi.z<center.z+size.z*.85 or
        beak_hi.y>center.y+size.y*.35 or
        beak_lo.y>center.y-size.y*.19):
        raise ValueError("ORIENTATION_GATE: beak is not below eye and pointing forward in glTF Y-up: "+
          str({"min":list(beak_lo),"max":list(beak_hi),"head_center":list(center)}))
    plumes=[o for o in imported if o.name.startswith('HF_BezierPlume_')]
    if len(plumes)!=6: raise ValueError("Fewer than six real Blender plume meshes")
    for plume in plumes:
        bb=[blender_to_gltf(plume.matrix_world @ Vector(v)) for v in plume.bound_box]
        if min(p.z for p in bb)>=center.z-size.z*.22 or max(p.y for p in bb)>center.y+size.y*.85:
            raise ValueError("ORIENTATION_GATE: plume is not flowing toward rear of native head: "+plume.name)
    print("HIGHFLY_GLTF_SEMANTIC_ORIENTATION_GREEN forward_beak="+str(round(beak_hi.z-center.z,4))+
          " beak_low="+str(round(beak_lo.y-center.y,4))+" six_backward_plumes=TRUE")
    output_data=output.read_bytes()
    if len(output_data)<1000: raise ValueError("Blender wrote an empty model")
    report={
      "engine":"Blender bpy CPU headless",
      "blender_version":bpy.app.version_string,
      "source_reference_sha256":hashlib.sha256(source.read_bytes()).hexdigest(),
      "native_reference":"M_Head",
      "native_bounds_xyz":list(size),
      "exports":[o.name for o in result],
      "geometry_objects":len(result),
      "bevel_applied":True,
      "bezier_curves_converted":True,
      "gltf_y_up_export":True,
      "roundtrip_world_space_error":drift,
      "semantic_forward_beak_checked":True,
      "beak_gltf_bbox_min":list(beak_lo),
      "beak_gltf_bbox_max":list(beak_hi),
      "head_bounds_space":"gltf_y_up",
      "six_backward_plumes_checked":True,
      "glb_bytes":len(output_data),
      "glb_sha256":hashlib.sha256(output_data).hexdigest(),
      "output":"RIGID HEAD ACCESSORY ONLY — not skinned clothing, no imported native figure"
    }
    report_file=output.with_suffix(".json")
    report_file.write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print("HIGHFLY_BLENDER_FORGE_OK "+json.dumps(report))

if __name__=="__main__":
    main()
