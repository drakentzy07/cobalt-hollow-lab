#!/usr/bin/env python3
"""HIGHFLY REAL WEARABLE REBIND proof: Blender transfer weights from ACTUAL
ClaudeCraft M_* native body to independent unrigged Blender-generated V19 mesh.
NOT a text/image generator or artistic matching. Never changes original donor.
The real production fit/retopology and human visual review remain future gates.
"""
import bpy,json,sys,hashlib,math
from pathlib import Path
from mathutils import Vector
def args():
    arr=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    opts={}
    for i in range(0,len(arr),2):
        if i+1>=len(arr):raise ValueError('BAD_ARGUMENT_PAIR')
        opts[arr[i]]=arr[i+1]
    for a in ('--native','--raw','--out','--report'):
        if a not in opts:raise ValueError('MISSING_'+a)
    return opts
def weighted_groups(obj):
    result=0
    for v in obj.data.vertices:
        groups=[x.weight for x in v.groups if x.weight>1e-5]
        if groups:result+=1
    return result
def get_donor(part,all_meshes):
    chunk=part.name.upper()
    side=None
    if '_L_' in chunk or chunk.endswith('_L'):side='L'
    elif '_R_' in chunk or chunk.endswith('_R'):side='R'
    if '_CHEST_' in chunk or '_BACK_' in chunk:return all_meshes['M_Torso']
    if '_ARMS_' in chunk:return all_meshes['M_Arm'+(side or 'L')]
    if '_HANDS_' in chunk:return all_meshes['M_Hand'+(side or 'L')]
    if '_LEGS_' in chunk:return all_meshes['M_Leg'+(side or 'L')]
    if '_FEET_' in chunk:return all_meshes['M_Foot'+(side or 'L')]
    if '_HEAD_' in chunk:return all_meshes['M_Head']
    raise ValueError('RAW_3D_NEEDS_SEMANTIC_ARMOR_SLOT '+part.name)
def main():
    o=args()
    native=Path(o['--native']).resolve()
    raw=Path(o['--raw']).resolve()
    out=Path(o['--out']).resolve()
    report=Path(o['--report']).resolve()
    assert native.is_file() and raw.is_file()
    assert native!=out and raw!=out
    out.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(native))
    native_objs=list(bpy.data.objects)
    required=['M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR','M_LegL','M_LegR','M_FootL','M_FootR']
    ref={k:bpy.data.objects.get(k) for k in required}
    for k,v in ref.items():
        if v is None or v.type!='MESH' or not v.vertex_groups:
            raise ValueError('SOURCE_BODY_MESH_OR_WEIGHTS_MISSING '+k)
    rigs=[x for x in bpy.data.objects if x.type=='ARMATURE' and len(x.data.bones)==23]
    if len(rigs)!=1:raise ValueError('EXACT_ONE_CLAUDECRAFT_23_BONE_ARMATURE_REQUIRED '+str(len(rigs)))
    rig=rigs[0]
    bone_names={x.name for x in rig.data.bones}
    if len(bone_names)!=23:raise ValueError('SOURCE_23_BONE_NAMES_NOT_UNIQUE')
    bpy.ops.import_scene.gltf(filepath=str(raw))
    incoming=[x for x in bpy.data.objects if x not in native_objs and x.type=='MESH']
    if len(incoming)!=32:raise ValueError('TEST_EXPECTS_32_UNRIGGED_V19_NEW_MESHES_'+str(len(incoming)))
    if any(x.modifiers.get('HF_CLAUDECRAFT_RIG') for x in incoming):
        raise ValueError('RAW_PIECES_ARE_ALREADY_RIGGED')
    all_weights=0
    transfers=[]
    for dst in incoming:
        donor=get_donor(dst,ref)
        bpy.ops.object.select_all(action='DESELECT')
        dst.select_set(True)
        bpy.context.view_layer.objects.active=dst
        # For consistent nearest-face mapping, match the ORIGINAL native donor's
        # vertex-group names. Both imported GLBs are in the SAME Blender frame.
        for g in donor.vertex_groups:
            if g.name not in bone_names:continue
            if g.name not in dst.vertex_groups:dst.vertex_groups.new(name=g.name)
        modifier=dst.modifiers.new('HF_CLAUDECRAFT_NEAREST_FACE_WEIGHT_TRANSFER','DATA_TRANSFER')
        modifier.object=donor
        modifier.use_vert_data=True
        modifier.data_types_verts={'VGROUP_WEIGHTS'}
        modifier.vert_mapping='POLYINTERP_NEAREST'
        modifier.layers_vgroup_select_src='ALL'
        modifier.layers_vgroup_select_dst='NAME'
        modifier.use_object_transform=True
        modifier.mix_mode='REPLACE'
        modifier.mix_factor=1.0
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        # Normalized <= 4 bone influences per vertex for mobile-compatible skin.
        verts=dst.data.vertices
        valid=0
        for v in verts:
            weights=sorted([(g.group,g.weight) for g in v.groups if g.weight>1e-7],key=lambda q:-q[1])
            if not weights:
                raise ValueError('NO_TRANSFER_WEIGHTS_FROM_REAL_BODY '+dst.name+' v'+str(v.index))
            keep=weights[:4]
            total=sum(w for _,w in keep)
            if total<1e-8:raise ValueError('ZERO_RIG_WEIGHT')
            for g in list(v.groups):dst.vertex_groups[g.group].remove([v.index])
            for gi,wt in keep:dst.vertex_groups[gi].add([v.index],wt/total,'REPLACE')
            valid+=1
        if valid!=len(verts):raise ValueError('UNWEIGHTED_VERTEX')
        # Strip inert empty groups, preserve native bone names only.
        for group in list(dst.vertex_groups):
            if group.name not in bone_names:dst.vertex_groups.remove(group)
        arm=dst.modifiers.new('HF_CLAUDECRAFT_RIG','ARMATURE')
        arm.object=rig
        # Blender's glTF exporter requires armature PARENT, not only modifier.
        # Preserve exact original world matrix, with no surprising offset/scale.
        preserved_world=dst.matrix_world.copy()
        dst.parent=rig
        dst.matrix_world=preserved_world
        if dst.parent!=rig or arm.object!=rig:
            raise ValueError('EXPORT_NATIVE_PARENT_OR_MODIFIER_LOST '+dst.name)
        all_weights+=valid
        transfers.append({'part':dst.name,'donor':donor.name,'vertices':valid,'groups':len(dst.vertex_groups)})
    if any(mesh.parent != rig for mesh in incoming):\n        raise ValueError('EXPORTED_SKIN_NO_ACTUAL_RIG_PARENT')\n    # Only the new mesh pieces and the *original* armature will be exported.
    # Source body meshes are never bundled in a wearable; source remains separate.
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for dst in incoming:dst.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',
        use_selection=True,export_yup=True,export_animations=False,
        export_skins=True,export_morph=False,export_apply=False)
    if out.stat().st_size<15000:raise ValueError('BLENDER_OUTPUT_IS_EMPTY')
    summary={'schema':'highfly.blender.rebind/v0.2','source':'original ClaudeCraft M_* body + Rig_Medium',
        'source_sha256':hashlib.sha256(native.read_bytes()).hexdigest(),
        'raw_sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),
        'originalSourceMutated':False,'generatedFromTextAI':False,
        'method':'Blender Data Transfer POLYINTERP_NEAREST, 4 normalized groups, original 23 bones',
        'authenticSkeletonBones':len(bone_names),'armatureParentedMeshes':sum(x.parent == rig for x in incoming),
        'newMeshesWeighted':len(incoming),'newVerticesWeighted':all_weights,
        'parts':transfers,'visualArtApproved':False,'physicalAndroidTested':False,
        'semanticFitApproval':False,'outBytes':out.stat().st_size}
    report.write_text(json.dumps(summary,indent=2))
    print('HIGHFLY_BLENDER_GENUINE_NEW_3D_MESHES_RIGGED_TO_23_ORIGINAL_BONES',len(incoming),all_weights)
if __name__=='__main__':
    main()
