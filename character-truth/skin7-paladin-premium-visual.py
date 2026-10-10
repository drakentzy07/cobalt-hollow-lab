#!/usr/bin/env python3
"""TRUE ORIGINAL Paladin source body vs SOURCE-REINFORGED armour pose comparators.
Blender CPU Workbench; neutral diagnostic materials NOT source gameplay textures.
Four screenshots: M/F front, side before/after; no publication, no artistic acceptance.
"""
import bpy,sys,json,math
from mathutils import Vector
from pathlib import Path
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def flag(k):
 if k not in argv or argv.index(k)+1>=len(argv):raise RuntimeError('SKIN7_VISUAL_ARG_'+k)
 return Path(argv[argv.index(k)+1]).resolve()
source=flag('--source');reforged=flag('--reforged');out=flag('--out')
out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(source))
originalRig=bpy.data.objects.get('Rig_Medium')
if originalRig is None or len(originalRig.data.bones)!=23:raise RuntimeError('SKIN7_VISUAL_NATIVE_RIG_MISSING')
parts={o.name:o for o in bpy.data.objects if o.type=='MESH'}
originalNames=['Armor_paladin_Head','Armor_paladin_Chest','Armor_paladin_ArmL','Armor_paladin_ArmR',
 'Armor_paladin_HandL','Armor_paladin_HandR','Armor_paladin_LegL','Armor_paladin_LegR',
 'Armor_paladin_FootL','Armor_paladin_FootR','Armor_paladin_Back']
if any(n not in parts for n in originalNames):raise RuntimeError('SKIN7_ORIGINAL_PALADIN_NOT_PRESENT')
bodies={
 'M':['M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR','M_LegL','M_LegR','M_FootL','M_FootR'],
 'F':['F_Head','F_Torso','F_ArmL','F_ArmR','F_HandL','F_HandR','F_LegL','F_LegR','F_FootL','F_FootR','F_Top']
}
if any(n not in parts for names in bodies.values() for n in names):raise RuntimeError('SKIN7_SOURCE_BODY_TRUTH_MISSING')
for o in parts.values():o.hide_render=True
bpy.ops.import_scene.gltf(filepath=str(reforged))
forged=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('HF7RF_PALADIN_')]
if len(forged)!=11:raise RuntimeError('SKIN7_REFORGED_SUIT_NOT_TRUE_ELEVEN_'+str(len(forged)))
details=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('HF7PM_PALADIN_')]
if len(details)!=8:raise RuntimeError('SKIN7_EXPECTED_EIGHT_GENUINE_NATIVE_SURFACE_DETAILS_'+str(len(details)))
if not all(any(m.type=='ARMATURE' for m in ob.modifiers) and ob.vertex_groups for ob in details):
 raise RuntimeError('SKIN7_PREMIUM_DETAILS_NOT_WEIGHTED')
if not all(any(m.type=='ARMATURE' for m in x.modifiers) and x.vertex_groups for x in forged):
 raise RuntimeError('SKIN7_FORGED_WEIGHTS_NOT_IMPORTED')
for x in forged+details:x.hide_render=True
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.color_type='OBJECT'
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type='BOTH'
scene.display.shading.show_shadows=True
scene.render.image_settings.color_mode='RGBA'
world=scene.world or bpy.data.worlds.new('SKIN7_VISUAL_WORLD');scene.world=world
world.color=(.09,.10,.14)
def painted(mesh,rgb):
 mesh.color=(rgb[0],rgb[1],rgb[2],1)
for o in bpy.data.objects:
 if o.type!='MESH':continue
 if o in forged:painted(o,(.12,.19,.37))
 elif o in details:painted(o,(.82,.58,.24) if 'DIVINE_CORE' not in o.name else (.22,.78,.89))
 elif o.name.startswith('Armor_paladin_'):painted(o,(.69,.72,.77))
 else:painted(o,(.46,.40,.35))
for o in forged:
 if '_ARM' in o.name or '_HEAD' in o.name:painted(o,(.23,.41,.65))
 if '_HAND' in o.name or '_LEG' in o.name:painted(o,(.62,.49,.22))
if not scene.camera:
 camdat=bpy.data.cameras.new('SKIN7_COMPARE_CAMERA');camera=bpy.data.objects.new('SKIN7_COMPARE_CAMERA',camdat)
 scene.collection.objects.link(camera);scene.camera=camera
else:camera=scene.camera
camera.data.type='ORTHO';camera.data.lens=50
def measure(objects):
 pts=[]
 for o in objects:
  for corner in o.bound_box:pts.append(o.matrix_world@Vector(corner))
 if not pts:raise RuntimeError('SKIN7_VISIBLE_BODY_EMPTY')
 lo=Vector(tuple(min(x[i] for x in pts) for i in range(3)))
 hi=Vector(tuple(max(x[i] for x in pts) for i in range(3)))
 return (lo+hi)*.5,hi-lo
shots=[]
for g in ('M','F'):
 body=[parts[n] for n in bodies[g]]
 for style in ('original','reforged'):
  for o in bpy.data.objects:
   if o.type=='MESH':o.hide_render=True
  for o in body:o.hide_render=False
  for o in ([parts[n] for n in originalNames] if style=='original' else forged+details):o.hide_render=False
  bpy.context.view_layer.update()
  # Fixed shared framing for original/reforged: union prevents cropped helmet spikes.
  focus,dims=measure(body+[parts[n] for n in originalNames]+forged+details)
  scale=max(dims.z*1.52,dims.x*1.95,dims.y*1.55,3.65)
  for angle in ('front','side'):
   offset=Vector((0,-7,3)) if angle=='front' else Vector((7,0,3))
   camera.location=focus+offset
   camera.rotation_euler=(focus-camera.location).to_track_quat('-Z','Y').to_euler()
   camera.data.ortho_scale=scale
   name=g.lower()+'-'+style+'-'+angle+'.png'
   scene.render.filepath=str(out/name)
   bpy.ops.render.render(write_still=True)
   if not (out/name).is_file() or (out/name).stat().st_size<4000:
    raise RuntimeError('SKIN7_VISUAL_SCREENSHOT_EMPTY_'+name)
   shots.append(name)
(out/'visual-truth.json').write_text(json.dumps({
 'schema':'highfly.skin7.paladin-premium-v1-neutral-visual-review/1',
 'source':'AUTHENTIC_UNMODIFIED_CLAUDECRAFT_MODULAR_BODY',
 'candidate':'ASSISTANT_RECIPE_AUTOMATICALLY_REFORGED_SOURCE_PALADIN',
 'sourceNativeRig':'Rig_Medium','nativeJoints':23,'originalArmorPieces':11,'newWeightedDetailMeshes':len(details),
 'shots':shots,'artApproved':False,'clipQACompleted':False,
 'sourceTextureFaithfulness':False,'prematureArtApproval':False,
 'notes':'CPU Workbench true original+source reforged 11 pieces and 8 source-conforming native weighted ornamentation. Diagnostic viewport is NOT final shader-quality proof.'
},indent=2))
print('SKIN7_REAL_NATIVE_PALADIN_PREMIUM_V1_SOURCE_VS_8_MF_VISUAL_SHOTS_GREEN=1')
