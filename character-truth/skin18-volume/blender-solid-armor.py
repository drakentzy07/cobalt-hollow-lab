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
designfile=get('--design')
design=json.loads(designfile.read_text())
assert design['schema']=='highfly.skin16.elegant-violet-concept/1' and design.get('source')=='HUMAN_SELECTED_CONCEPT_ART_DIRECTED','NEED_APPROVED_CONCEPT'
assert design['newGeometryOnly'] is True and design['artApproved'] is False and not design.get('imageSemanticsAnalyzed'),'NEED_UNAPPROVED_ORIGINAL_MODEL'

j=json.loads(jobfile.read_text())
assert j['schema']=='highfly.skin13.forge-job/1' and j['phase']=='queued','BAD_JOB_SCHEMA'
assert j['request']['geometryInputs']=='NEW_MESHES_ONLY','FORBIDDEN_DEFORMATION'
assert not j['request'].get('reference'), 'IMAGE_MODEL_NOT_IMPLEMENTED'
assert len(j['request']['prompt'])<=1000 and len(j['request']['prompt'])>=12,'BAD_PROMPT'
prompt=j['request']['prompt'].lower()
assert design['designReference']=='BLACK_SILVER_VIOLET_3_VIEW_APPROVED_VISUAL_REFERENCE','WRONG_CONCEPT'
style='eclipse'
choices={'theme':'eclipse','helmet':'crested','shoulders':'layered','chest':'gem','back':'cape','shape':'angular','metal':'obsidian','accent':'violet'}
colors=('#13131f','#b2aeb9','#963ef0')
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
 mat('HF16_PURPLE_CRYSTAL',colors[2],.43,.17),
 mat('HF16_TABARD_DEEP_PURPLE','#4d2480',.08,.72)
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
BODY_SOURCE={'Head':'M_Head','Chest':'M_Torso','Back':'M_Torso',
 'ArmL':'M_ArmL','ArmR':'M_ArmR','HandL':'M_HandL','HandR':'M_HandR',
 'LegL':'M_LegL','LegR':'M_LegR','FootL':'M_FootL','FootR':'M_FootR'}
# Distinct hard-surface designs, written by the assistant from the user's
# Eclipse Eterno brief. AI assisted artistic *instructions*, no deployed remote
# model inference. Each polygon becomes newly constructed topology.
DETAILS={
 'Head':[
  ('helmet-face-shield',[(-.75,.52),(-.40,.73),(.35,.73),(.76,.52),(.68,-.46),
      (.18,-.93),(-.26,-.91),(-.72,-.42)],1),
  ('helmet-crest',[(-.18,.75),(0,1.13),(.21,.75),(.16,.57),(-.13,.57)],1),
  ('visor-left',[(-.66,.24),(-.08,.16),(-.12,.055),(-.60,.12)],2),
  ('visor-right',[(.08,.16),(.67,.24),(.61,.12),(.12,.055)],2),
  ('brow',[(-.68,.35),(-.1,.28),(.12,.28),(.70,.35),(.48,.45),(-.48,.45)],1)],
 'Chest':[
  ('collar',[(-.92,.7),(-.56,1.05),(0,.72),(.56,1.05),(.92,.7),(.69,.56),(-.69,.56)],1),
  ('upper-v',[(-.77,.44),(-.49,.65),(0,.26),(.49,.65),(.77,.44),(.66,.2),(0,-.16),(-.66,.2)],1),
  ('abdomen',[(-.50,-.26),(0,-.40),(.50,-.26),(.39,-.79),(0,-.90),(-.39,-.79)],1),
  ('eclipse-rune',[(0,.40),(.28,.11),(.15,-.24),(0,-.43),(-.15,-.24),(-.28,.11)],2),
  ('core-diamond',[(0,.27),(.16,.08),(0,-.11),(-.16,.08)],2)],
 'ArmL':[
  ('crescent-pauldrons',[(-1.13,.65),(-.68,1.10),(.1,1.02),(.79,.57),(.45,.33),(-.24,.49),(-.66,.26)],1),
  ('upper-armor',[(-.53,.29),(.48,.31),(.60,-.53),(0,-.87),(-.6,-.53)],0),
  ('edge-rune',[(-.88,.70),(-.51,.94),(.16,.86),(.56,.65),(.31,.62),(-.38,.74)],2)],
 'ArmR':[
  ('crescent-pauldrons',[(-.90,.60),(-.35,.99),(.49,1.06),(1.14,.66),(.66,.28),(.20,.56),(-.51,.41)],1),
  ('upper-armor',[(-.51,.3),(.51,.26),(.57,-.55),(0,-.82),(-.59,-.55)],0),
  ('edge-rune',[(-.53,.74),(.36,.91),(.86,.73),(.58,.58),(.26,.74)],2)],
 'Back':[
  ('back-spine',[(-.22,.87),(0,1.02),(.22,.87),(.19,-.7),(0,-.90),(-.19,-.7)],1),
  ('crystal-one',[(0,.66),(.17,.44),(0,.22),(-.17,.44)],2),
  ('crystal-two',[(0,-.06),(.15,-.28),(0,-.47),(-.15,-.28)],2)],
 'LegL':[('shinguard',[(-.75,.67),(-.24,.9),(.25,.88),(.76,.67),(.63,-.69),(0,-.96),(-.62,-.69)],1),
  ('greave-rune',[(0,.71),(.11,.20),(0,-.31),(-.11,.20)],2)],
 'LegR':[('shinguard',[(-.74,.68),(-.24,.9),(.25,.88),(.75,.68),(.64,-.69),(0,-.96),(-.62,-.69)],1),
  ('greave-rune',[(0,.71),(.11,.20),(0,-.31),(-.11,.20)],2)],
 'HandL':[('gauntlet',[(-.65,.76),(0,.95),(.67,.76),(.52,-.72),(0,-.93),(-.52,-.72)],1)],
 'HandR':[('gauntlet',[(-.65,.76),(0,.95),(.67,.76),(.52,-.72),(0,-.93),(-.52,-.72)],1)],
 'FootL':[('greave-toe',[(-.74,.45),(0,.64),(.75,.45),(.58,-.69),(0,-.86),(-.56,-.69)],1)],
 'FootR':[('greave-toe',[(-.74,.45),(0,.64),(.75,.45),(.58,-.69),(0,-.86),(-.56,-.69)],1)]
}
# Interpret 8 real LLM decisions into genuinely different new mesh silhouettes
# and armor per-slot contour families; never use source armor polygons.
helmet_variants={
 'sealed':[
  ('sealed-visor',[(-.72,.22),(0,.11),(.72,.22),(.58,.05),(-.58,.05)],2)],
 'horned':[
  ('left-horn',[(-.83,.48),(-.99,.88),(-.86,1.18),(-.61,.76),(-.54,.46)],1),
  ('right-horn',[(.53,.46),(.63,.76),(.87,1.18),(1.0,.88),(.83,.48)],1),
  ('dragon-snout',[(-.47,.17),(0,.26),(.49,.17),(.29,-.50),(0,-.70),(-.30,-.50)],1)],
 'crested':[
  ('ducal-crest',[(-.19,.58),(-.12,1.16),(0,1.29),(.15,1.12),(.19,.58)],1)],
 'winged':[
  ('left-wing',[(-.68,.35),(-1.06,.55),(-.95,.99),(-.57,.67)],1),
  ('right-wing',[(.62,.67),(.99,.99),(1.03,.55),(.69,.35)],1)],
 'masked':[
  ('face-mask',[(-.74,.55),(-.55,.8),(0,.62),(.55,.8),(.74,.55),
    (.66,-.56),(0,-.95),(-.66,-.56)],1)]
}
shoulder_variants={
 'scaled':[
  ('scale-upper',[(-.83,.90),(-.11,1.14),(.73,.90),(.54,.67),(-.62,.70)],1),
  ('scale-lower',[(-.84,.54),(0,.79),(.84,.53),(.64,.20),(-.62,.20)],1)],
 'layered':[
  ('plate-one',[(-.86,.79),(.85,.73),(.61,.34),(-.66,.38)],1),
  ('plate-two',[(-.66,.36),(.66,.30),(.46,-.17),(-.39,-.22)],0)],
 'feathered':[
  ('feather-one',[(-.97,.50),(-.76,1.1),(-.36,.80),(-.44,.35)],1),
  ('feather-two',[(-.47,.59),(.11,1.13),(.41,.78),(.02,.21)],1),
  ('feather-three',[(.19,.60),(.76,1.04),(.97,.60),(.63,.30)],1)],
 'spiked':[
  ('spike-center',[(-.36,.42),(-.10,1.22),(.20,1.30),(.37,.4)],1),
  ('spike-outer',[(-.85,.36),(-1.01,.9),(-.69,.70),(-.62,.24)],1)],
 'crescent':[
  ('moon-crescent',[(-1.0,.45),(-.72,1.12),(-.22,1.05),(.75,.66),(.58,.30),(-.29,.66)],1)]
}
chest_variants={
 'gem':[('soul-crystal',[(0,.44),(.23,.10),(0,-.33),(-.23,.10)],2)],
 'crest':[('crest-emblem',[(-.43,.40),(0,.68),(.43,.40),(.40,-.37),(0,-.71),(-.40,-.37)],1)],
 'sun':[('solar-heart',[(-.41,0),(-.27,.32),(0,.52),(.27,.32),(.41,0),(.24,-.36),(0,-.54),(-.24,-.36)],2)],
 'runes':[('left-rune',[(-.49,.43),(-.19,.42),(-.21,-.38),(-.53,-.32)],2),
  ('right-rune',[(.19,.42),(.51,.43),(.52,-.32),(.21,-.38)],2)],
 'plain':[('clean-breastplate',[(-.61,.47),(0,.63),(.61,.47),(.45,-.46),(0,-.65),(-.45,-.46)],1)]
}
back_variants={
 'crystals':[('crystal-top',[(0,.73),(.16,.39),(0,.09),(-.16,.39)],2),
    ('crystal-bottom',[(0,-.04),(.14,-.35),(0,-.63),(-.14,-.35)],2)],
 'spine':[('dragon-spine',[(-.29,.97),(0,1.17),(.29,.97),(.15,-.85),(0,-1.03),(-.15,-.85)],1)],
 'cape':[('cape-anchoring-plates',[(-.68,.88),(0,.98),(.68,.88),(.42,.23),(-.42,.23)],1)],
 'feathers':[('back-wing-left',[(-.26,.76),(-.94,.91),(-.71,.11),(-.20,-.56)],1),
  ('back-wing-right',[(.23,.76),(.94,.91),(.74,.11),(.22,-.56)],1)],
 'plates':[('back-brace',[(-.64,.84),(0,.96),(.64,.84),(.47,-.77),(0,-.91),(-.47,-.77)],1)]
}
# Start every brief with a generic, anatomically constrained shell design.
DETAILS['Head']=[DETAILS['Head'][0]]+helmet_variants[choices['helmet']]
DETAILS['Chest']=[DETAILS['Chest'][0],DETAILS['Chest'][2]]+chest_variants[choices['chest']]
DETAILS['Back']=back_variants[choices['back']]
for limb in ('ArmL','ArmR'):
 DETAILS[limb]=shoulder_variants[choices['shoulders']]+[DETAILS[limb][1]]
# Variant chest forms and render materials determine visible geometry.

# Original three-angle reference sculpted for the genuine ClaudeCraft male modular
# Rig_Medium. Every contour is new authored geometry; original native meshes
# provide ONLY anatomical bbox + reference skinning weights. Neither old armor
# vertices nor old armor faces are used as geometry for this new armor.
DETAILS={
 'Head':[
  ('helmet-brow-chevron',[(-.91,.29),(-.69,.52),(-.19,.49),(0,.30),(.19,.49),(.72,.52),(.91,.29),(.62,.12),(0,.20),(-.62,.12)],1),
  ('faceplate',[(-.80,.15),(-.60,.21),(0,-.04),(.61,.21),(.80,.15),(.66,-.50),(.31,-.82),(0,-1.06),(-.31,-.82),(-.66,-.50)],0),
  ('long-violet-visor',[(-.78,.22),(-.38,.13),(0,.08),(.38,.13),(.78,.22),(.68,.075),(.30,-.045),(0,-.13),(-.30,-.045),(-.68,.075)],2),
  ('visor-keel',[(0,-.09),(.11,-.25),(0,-.79),(-.11,-.25)],2),
  ('silver-nose-bevel',[(-.17,.04),(0,-.13),(.17,.04),(.08,-.43),(0,-.60),(-.08,-.43)],1),
  ('left-helmet-cheek',[(-.88,.12),(-.65,-.13),(-.41,-.69),(-.14,-.91),(-.65,-.73)],1),
  ('right-helmet-cheek',[(.88,.12),(.65,-.13),(.41,-.69),(.14,-.91),(.65,-.73)],1),
  ('forehead-chrome-setting',[(-.33,.62),(0,1.0),(.33,.62),(0,.28)],1),
  ('forehead-violet-crystal',[(-.22,.61),(0,.91),(.22,.61),(0,.36)],2),
  ('crown-black-blade',[(-.22,.91),(-.10,1.09),(.32,1.06),(.52,.79),(.27,.78),(0,.87)],0),
  ('left-silver-ear-wing',[(-.87,.08),(-1.22,.40),(-1.42,.91),(-1.22,.70),(-1.02,.50),(-.82,.47)],1),
  ('left-violet-inner-wing',[(-.92,.22),(-1.21,.50),(-1.33,.76),(-1.10,.58)],2),
  ('right-silver-ear-wing',[(.87,.08),(1.22,.40),(1.42,.91),(1.22,.70),(1.02,.50),(.82,.47)],1),
  ('right-violet-inner-wing',[(.92,.22),(1.21,.50),(1.33,.76),(1.10,.58)],2)],
 'Chest':[
  ('armored-collar',[(-.91,.68),(-.72,.94),(-.30,.75),(0,.59),(.30,.75),(.72,.94),(.91,.68),(.58,.54),(-.58,.54)],1),
  ('chest-left-lamella',[(-.91,.53),(-.26,.54),(-.08,.23),(-.14,-.44),(-.66,-.19)],1),
  ('chest-right-lamella',[(.91,.53),(.26,.54),(.08,.23),(.14,-.44),(.66,-.19)],1),
  ('chest-black-center',[(-.47,.46),(0,.33),(.47,.46),(.39,-.58),(0,-.90),(-.39,-.58)],0),
  ('chest-inner-silver-vee',[(-.55,.31),(-.18,.34),(0,.08),(.18,.34),(.55,.31),(.26,-.14),(0,-.42),(-.26,-.14)],1),
  ('chest-violet-setting',[(-.21,.38),(0,.61),(.21,.38),(0,-.14)],1),
  ('chest-violet-gem',[(-.15,.33),(0,.52),(.15,.33),(0,-.045)],2),
  ('abdominal-silver-lamella',[(-.53,-.47),(-.10,-.59),(.12,-.59),(.53,-.47),(.45,-.72),(0,-.86),(-.45,-.72)],1),
  ('belt-silver',[(-.69,-.75),(0,-.91),(.69,-.75),(.63,-1.03),(0,-1.15),(-.63,-1.03)],1),
  ('belt-violet-clasp',[(-.17,-.79),(0,-.64),(.17,-.79),(0,-1.08)],2),
  ('front-purple-tabard',[(-.49,-.87),(-.36,-1.10),(-.41,-1.67),(0,-1.87),(.42,-1.67),(.36,-1.10),(.49,-.87)],3),
  ('front-tabard-silver-edge',[(-.49,-.97),(-.41,-1.67),(0,-1.87),(.42,-1.67),(.49,-.97),(.42,-1.70),(0,-1.97),(-.42,-1.70)],1),
  ('front-tabard-emblem',[(0,-1.21),(.18,-1.41),(0,-1.65),(-.18,-1.41)],2)],
 'Back':[
  ('dorsal-plate',[(-.72,.83),(0,1.02),(.72,.83),(.60,-.75),(0,-1.03),(-.60,-.75)],0),
  ('back-shoulder-silver-edge',[(-.89,.75),(-.50,1.01),(0,.80),(.50,1.01),(.89,.75),(.68,.52),(0,.72),(-.68,.52)],1),
  ('back-central-chrome-setting',[(-.26,.52),(0,.80),(.26,.52),(0,.15)],1),
  ('back-violet-gem',[(-.16,.48),(0,.65),(.16,.48),(0,.24)],2),
  ('purple-back-cloth',[(-.54,-.36),(-.55,-1.0),(-.58,-1.83),(0,-2.03),(.58,-1.83),(.55,-1.0),(.54,-.36)],3),
  ('cape-bright-border',[(-.57,-1.67),(-.58,-1.83),(0,-2.03),(.58,-1.83),(.57,-1.67),(.48,-1.78),(0,-1.93),(-.48,-1.78)],1),
  ('cape-violet-symbol',[(-.05,-1.0),(0,-.78),(.05,-1.0),(.27,-1.22),(0,-1.44),(-.27,-1.22)],2)],
 'ArmL':[
  ('pauldron-shell',[(-1.02,.29),(-1.15,.80),(-.64,1.01),(0,1.14),(.80,.85),(.98,.40),(.45,.27),(-.33,.41)],0),
  ('pauldron-silver-layer',[(-1.10,.54),(-.80,1.02),(-.31,.92),(.31,.98),(.91,.58),(.54,.45),(-.21,.55)],1),
  ('pauldron-violet-channel',[(-1.04,.40),(-.64,.75),(-.20,.66),(.31,.78),(.70,.49),(.38,.40),(-.27,.46)],2),
  ('pauldron-upper-horn',[(-.30,.89),(.17,1.40),(.48,.91),(.28,.80)],1),
  ('pauldron-wrist',[(-.47,-.34),(.47,-.34),(.63,-.70),(0,-.91),(-.61,-.70)],1)],
 'ArmR':[
  ('pauldron-shell',[(-.94,.31),(-.94,.82),(-.40,1.10),(.22,1.03),(1.12,.73),(1.02,.29),(.35,.43)],0),
  ('pauldron-silver-layer',[(-.84,.55),(-.27,.99),(.28,.86),(.80,.93),(1.13,.52),(.69,.41),(.26,.58)],1),
  ('pauldron-violet-channel',[(-.68,.46),(-.23,.80),(.17,.69),(.73,.77),(1.07,.42),(.64,.37),(.23,.48)],2),
  ('pauldron-upper-horn',[(-.45,.86),(-.12,1.37),(.21,.96),(.07,.79)],1),
  ('pauldron-wrist',[(-.47,-.34),(.47,-.34),(.63,-.70),(0,-.91),(-.61,-.70)],1)],
 'HandL':[
  ('gauntlet-core',[(-.75,.62),(0,.95),(.75,.62),(.51,-.66),(0,-1),(-.51,-.66)],0),
  ('gauntlet-finger-silver',[(-.60,-.18),(-.28,-.36),(.32,-.36),(.63,-.20),(.44,-.76),(0,-.95),(-.45,-.76)],1),
  ('gauntlet-violet-crest',[(0,.72),(.21,.30),(0,-.16),(-.21,.30)],2)],
 'HandR':[
  ('gauntlet-core',[(-.75,.62),(0,.95),(.75,.62),(.51,-.66),(0,-1),(-.51,-.66)],0),
  ('gauntlet-finger-silver',[(-.60,-.18),(-.28,-.36),(.32,-.36),(.63,-.20),(.44,-.76),(0,-.95),(-.45,-.76)],1),
  ('gauntlet-violet-crest',[(0,.72),(.21,.30),(0,-.16),(-.21,.30)],2)],
 'LegL':[
  ('greave-main',[(-.69,.85),(-.26,1.03),(.24,1.0),(.70,.85),(.56,-.76),(0,-1.02),(-.57,-.76)],0),
  ('greave-silver-outer',[(-.74,.63),(-.49,.84),(-.40,-.60),(0,-.86),(.10,-.95),(-.60,-.81)],1),
  ('greave-violet-diamond',[(0,.48),(.19,.21),(0,-.11),(-.19,.21)],2),
  ('knee-chevron',[(-.70,.88),(0,.64),(.70,.88),(.55,.70),(0,.44),(-.55,.70)],1)],
 'LegR':[
  ('greave-main',[(-.69,.85),(-.26,1.03),(.24,1.0),(.70,.85),(.56,-.76),(0,-1.02),(-.57,-.76)],0),
  ('greave-silver-outer',[(.74,.63),(.49,.84),(.40,-.60),(0,-.86),(-.10,-.95),(.60,-.81)],1),
  ('greave-violet-diamond',[(0,.48),(.19,.21),(0,-.11),(-.19,.21)],2),
  ('knee-chevron',[(-.70,.88),(0,.64),(.70,.88),(.55,.70),(0,.44),(-.55,.70)],1)],
 'FootL':[
  ('boot-front-shell',[(-.92,.59),(0,.74),(.92,.59),(.79,-.56),(0,-.78),(-.79,-.56)],0),
  ('boot-chrome-toe',[(-.83,-.12),(0,-.31),(.83,-.12),(.76,-.74),(0,-.92),(-.75,-.74)],1),
  ('boot-violet-line',[(-.78,.26),(0,.02),(.78,.26),(.68,.17),(0,-.09),(-.68,.17)],2)],
 'FootR':[
  ('boot-front-shell',[(-.92,.59),(0,.74),(.92,.59),(.79,-.56),(0,-.78),(-.79,-.56)],0),
  ('boot-chrome-toe',[(-.83,-.12),(0,-.31),(.83,-.12),(.76,-.74),(0,-.92),(-.75,-.74)],1),
  ('boot-violet-line',[(-.78,.26),(0,.02),(.78,.26),(.68,.17),(0,-.09),(-.68,.17)],2)]
}
assert len(DETAILS)==11 and sum(len(x) for x in DETAILS.values())>=60

for k in SLOTS:
 assert len(DETAILS[k])>=1 and all(len(v[1])>=4 for v in DETAILS[k]),'DESIGN_SLOT_INCOMPLETE'
def add_forged_plate(verts,faces,mi,ctr,sx,sy,sz,outline,color,face_side=-1.0):
 # Solid tapered contour with beveled edge: four depth rings and side quads.
 # Faces and vertices are GENERATED from instructions, not donor geometry.
 n=len(outline);base=len(verts)
 cx=sum(x for x,z in outline)/n;cz=sum(z for x,z in outline)/n
 # Project every sculptural panel vertex onto the local volumetric shell.
 # Fixed-Y flat sheets stood a huge distance in front of the helmet in v1.
 # Original geometry is NOT read or reused; only the freshly generated shell
 # equation is used to project the new front/back bevels.
 def surface(x,z,fac,offset):
  nx=(cx+(x-cx)*fac)*.93
  nz=(cz+(z-cz)*fac)*.92
  r2=nx*nx+nz*nz
  curved=max(.07,math.sqrt(max(0.0,1.0-min(.995,r2))))
  # Match shape's *.84..1.0 width correction and variable depth.
  return (ctr[0]+nx*sx,
    ctr[1]+face_side*sy*(curved+offset),
    ctr[2]+nz*sz)
 # Millimetric embossed plate: bevel and rim closely hugging metal base.
 levels=[(1.0,.024),(.93,.078),(.86,.092),(.98,-.013)]
 for fac,offset in levels:
  for x,z in outline:
   verts.append(surface(x,z,fac,offset))
 for band in range(len(levels)-1):
  for i in range(n):
   a=base+band*n+i;b=base+band*n+(i+1)%n
   c=b+n;d=a+n
   faces.append((a,b,c,d));mi.append(1 if band in (0,2) else color)
 # Cap fan is topologically new, all quads/nonconvex outline kept triangulable.
 tip=len(verts)
 verts.append(surface(cx,cz,.88,.104))
 for i in range(n):
  a=base+2*n+i;b=base+2*n+(i+1)%n
  faces.append((tip,a,b));mi.append(color)
 # Close back to avoid paper-thin floating ornaments.
 back=len(verts);verts.append(surface(cx,cz,.99,-.022))
 for i in range(n):
  a=base+3*n+i;b=base+3*n+(i+1)%n
  faces.append((back,b,a));mi.append(color)

# SKIN 18 — original VOLUMETRIC hard-surface blockout. Genuine depth +
# sculpted armor silhouettes, NOT wrapped strips on the body.
# The source BODY gives dimensions, native Paladin only the bind weights.
SCALE={
 'Head':(1.16,1.24,1.13), 'Chest':(1.38,1.47,1.10),
 'ArmL':(1.40,1.40,1.05),'ArmR':(1.40,1.40,1.05),
 'HandL':(1.33,1.34,1.12),'HandR':(1.33,1.34,1.12),
 'LegL':(1.35,1.35,1.08),'LegR':(1.35,1.35,1.08),
 'FootL':(1.42,1.54,1.16),'FootR':(1.42,1.54,1.16),
 'Back':(1.20,1.34,1.12)
}
solid_counts={};fit_data={}
def add_solid_hull(verts,faces,mi,center,hx,hy,hz,material,profile=None):
 """Closed 16-sided armored solid with independent upper/lower beveled rims.
 Every side is actual 3D volume, front/back depth not a decal."""
 cx,cy,cz=center;start=len(verts);sides=16
 if profile is None:profile=[(-1.0,.80),(-.87,1.02),(.58,1.04),(.91,.81)]
 for zscale,r in profile:
  for k in range(sides):
   t=2*math.pi*k/sides
   fac=1+.065*math.cos(t*8)  # embossed armor facets, not a perfect cylinder
   verts.append((cx+hx*r*math.cos(t)*fac,
     cy+hy*r*math.sin(t)*fac,cz+hz*zscale))
 for layer in range(len(profile)-1):
  for k in range(sides):
   nxt=(k+1)%sides
   faces.append((start+layer*sides+k,start+layer*sides+nxt,
     start+(layer+1)*sides+nxt,start+(layer+1)*sides+k))
   mi.append(1 if layer in (0,len(profile)-2) else material)
 bottom=len(verts);verts.append((cx,cy,cz+hz*profile[0][0]))
 top=len(verts);verts.append((cx,cy,cz+hz*profile[-1][0]))
 for k in range(sides):
  nxt=(k+1)%sides
  faces.append((bottom,start+nxt,start+k));mi.append(material)
  last=start+(len(profile)-1)*sides
  faces.append((top,last+k,last+nxt));mi.append(material)
 return 1
def add_solid_plate(verts,faces,mi,ctr,hx,hy,hz,outline,material,side=-1,depth=.55):
 """Closed, genuinely thick beveled frontal plate with full rear cap.
 Depth expressed as fraction of actual BODY half-depth, not 1px offset."""
 cx,cy,cz=ctr;n=len(outline)
 if n<3:raise ValueError('PLATE_NEEDS_3_VERTICES')
 centerx=sum(x for x,z in outline)/n;centerz=sum(z for x,z in outline)/n
 start=len(verts)
 # Inner layer intersects underlying metal shell; outer is in front of it.
 y_back=cy+side*hy*.67
 y_outer=cy+side*hy*(1.07+depth)
 levels=[(.87,y_back),(1.,cy+side*hy*1.035),(.94,y_outer),(.85,y_outer+side*hy*.07)]
 for scale,y in levels:
  for x,z in outline:
   x2=centerx+(x-centerx)*scale
   z2=centerz+(z-centerz)*scale
   verts.append((cx+x2*hx, y,cz+z2*hz))
 for k in range(3):
  for i in range(n):
   j=(i+1)%n
   faces.append((start+k*n+i,start+k*n+j,
     start+(k+1)*n+j,start+(k+1)*n+i))
   mi.append(1 if k in (0,2) else material)
 # Planar capped faces, each decomposed into NEW triangles.
 mid0=len(verts);verts.append((cx+centerx*.87*hx,y_back,cz+centerz*.87*hz))
 mid1=len(verts);verts.append((cx+centerx*.85*hx,levels[-1][1],cz+centerz*.85*hz))
 for i in range(n):
  j=(i+1)%n
  faces.append((mid0,start+j,start+i));mi.append(material)
  faces.append((mid1,start+3*n+i,start+3*n+j));mi.append(material)
 return 1
def add_horn(verts,faces,mi,root,tip,diameter,material):
 """Real-sided conical armor tip with 3D radius, not a single plane."""
 a=Vector(root);b=Vector(tip)
 axis=(b-a).normalized()
 ref=Vector((0,1,0)) if abs(axis.dot(Vector((0,1,0))))<.85 else Vector((1,0,0))
 tangent=axis.cross(ref).normalized();bitangent=axis.cross(tangent).normalized()
 start=len(verts);sides=7
 for pos,rad in [(a,diameter),(a.lerp(b,.25),diameter*.88),
                 (a.lerp(b,.76),diameter*.25)]:
  for k in range(sides):
   theta=2*math.pi*k/sides
   p=pos+(tangent*math.cos(theta)+bitangent*math.sin(theta))*rad
   verts.append(tuple(p))
 for ring in range(2):
  for k in range(sides):
   j=(k+1)%sides
   faces.append((start+ring*sides+k,start+ring*sides+j,
    start+(ring+1)*sides+j,start+(ring+1)*sides+k));mi.append(material)
 tipIdx=len(verts);verts.append(tuple(b))
 centerIdx=len(verts);verts.append(tuple(a))
 for k in range(sides):
  j=(k+1)%sides
  faces.append((tipIdx,start+2*sides+k,start+2*sides+j));mi.append(material)
  faces.append((centerIdx,start+j,start+k));mi.append(material)
 return 1
def create_surface(slot,donor):
 source=[v.co.copy() for v in donor.data.vertices]
 body_obj=bpy.data.objects[BODY_SOURCE[slot]]
 to_local=donor.matrix_world.inverted_safe()
 body=[to_local@(body_obj.matrix_world@v.co) for v in body_obj.data.vertices]
 lo=[min(v[k] for v in body) for k in range(3)]
 hi=[max(v[k] for v in body) for k in range(3)]
 raw=[max(hi[k]-lo[k],.02) for k in range(3)]
 center=Vector([(lo[k]+hi[k])*.5 for k in range(3)])
 ratios=SCALE[slot]
 hx=max(raw[0]*.5*ratios[0],.03)
 hy=max(raw[1]*.5*ratios[1],.03)
 hz=max(raw[2]*.5*ratios[2],.035)
 if slot=='Back':
  center.y+=raw[1]*.25
  hy*=.58 # dorsal only; avoid encasing the body twice
 verts=[];faces=[];mi=[];solids=0
 solids+=add_solid_hull(verts,faces,mi,center,hx,hy,hz,0)
 # Per-slot real solid, multi-layer armor pieces
 if slot=='Head':
  # Closed helmet with full-face 3D cheek shields and protruding brow/visor
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
    [(-.84,.62),(-.40,.82),(.40,.82),(.84,.62),(.78,-.48),
    (.34,-.90),(0,-1.03),(-.34,-.90),(-.78,-.48)],0,depth=.43)
  for side in [-1,1]:
   solids+=add_horn(verts,faces,mi,
    center+Vector((side*hx*.80,0,hz*.28)),
    center+Vector((side*hx*1.28,-hy*.03,hz*.95)),
    min(hx,hy)*.26,1)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
    [(-.68,.33),(-.22,.26),(0,.20),(.22,.26),(.68,.33),
     (.58,.14),(0,.07),(-.58,.14)],2,depth=.71)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
    [(-.23,.64),(0,.94),(.23,.64),(0,.34)],2,depth=.68)
 elif slot=='Chest':
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.94,.61),(-.42,.90),(0,.68),(.42,.90),(.94,.61),
    (.77,-.42),(0,-.86),(-.77,-.42)],0,depth=.70)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.9,.58),(-.38,.70),(-.10,.29),(-.42,-.23),(-.80,-.23)],1,depth=.85)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(.9,.58),(.38,.70),(.10,.29),(.42,-.23),(.80,-.23)],1,depth=.85)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(0,.52),(.26,.10),(0,-.28),(-.26,.10)],2,depth=.95)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.70,-.58),(0,-.85),(.70,-.58),(.59,-.92),
    (0,-1.07),(-.59,-.92)],1,depth=.57)
 elif slot in ('ArmL','ArmR'):
  # Shoulder pauldrons dominate silhouette; elevated 3D volume,
  # distinct from arm tube. Asymmetric far-out solid crescent fins.
  outward=1 if slot=='ArmR' else -1
  upper=center+Vector((outward*hx*.22,0,hz*.67))
  solids+=add_solid_hull(verts,faces,mi,upper,hx*1.28,hy*1.24,hz*.40,1,
       profile=[(-1,.75),(-.6,1.08),(.38,1.06),(.94,.58)])
  solids+=add_solid_plate(verts,faces,mi,upper,hx*1.24,hy*1.20,hz*.44,
    [(-.94,.26),(-.55,.89),(.27,1.10),(.94,.63),(.90,-.13),
     (.26,-.52),(-.51,-.48)],1,depth=.49)
  solids+=add_horn(verts,faces,mi,
    upper+Vector((outward*hx*.65,0,hz*.16)),
    upper+Vector((outward*hx*1.54,-hy*.10,hz*.88)),
    min(hx,hy)*.30,1)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.76,-.25),(0,-.09),(.76,-.25),(.63,-.90),
    (0,-1.02),(-.63,-.90)],0,depth=.55)
 elif slot.startswith('Hand'):
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.88,.75),(-.24,.95),(.50,.82),(.84,.54),(.63,-.68),
    (0,-.92),(-.68,-.67)],1,depth=.52)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.29,.56),(0,.73),(.29,.56),(0,-.30)],2,depth=.62)
 elif slot.startswith('Leg'):
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.87,.75),(0,1.04),(.87,.75),(.78,-.73),
     (.24,-1.06),(-.24,-1.06),(-.78,-.73)],1,depth=.58)
  knee=center+Vector((0,0,hz*.65))
  solids+=add_solid_hull(verts,faces,mi,knee,hx*1.18,hy*1.17,hz*.25,1)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
    [(-.22,.10),(0,.43),(.22,.10),(0,-.35)],2,depth=.73)
 elif slot.startswith('Foot'):
  # Original base boot is visibly larger than a naked foot.
  toe=center+Vector((0,-hy*.24,-hz*.14))
  solids+=add_solid_hull(verts,faces,mi,toe,hx*1.13,hy*1.16,hz*.67,0)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
    [(-.98,.35),(0,.58),(.98,.35),(.82,-.83),
       (0,-.96),(-.82,-.83)],1,depth=.66)
 elif slot=='Back':
  # Full back armor spine; no paper-thin cape posing as heavy plate.
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.83,.69),(0,.92),(.83,.69),(.58,-.78),
    (0,-1.07),(-.58,-.78)],1,side=1,depth=.63)
  solids+=add_solid_plate(verts,faces,mi,center,hx,hy,hz,
   [(-.16,.55),(0,.76),(.16,.55),(0,-.32)],2,side=1,depth=.77)
  for out in [-1,1]:
   solids+=add_horn(verts,faces,mi,
    center+Vector((out*hx*.53,hy*.85,hz*.38)),
    center+Vector((out*hx*1.14,hy*1.03,hz*.87)),
    min(hx,hy)*.25,1)
 assert len(verts)>100 and len(faces)>90 and solids>=2
 mesh=bpy.data.meshes.new('HF18_VOLUME_SOLID_'+slot)
 mesh.from_pydata(verts,[],faces);mesh.update()
 for material in materials:mesh.materials.append(material)
 assert len(faces)==len(mi), 'MATERIAL_FACE_MAP_MISMATCH'
 for p,material_id in zip(mesh.polygons,mi):
  p.material_index=material_id;p.use_smooth=False
 instance=donor.copy();instance.data=mesh;instance.name='HF18NEW_'+slot
 bpy.context.collection.objects.link(instance)
 if len(instance.vertex_groups)==0:
  for group in donor.vertex_groups:instance.vertex_groups.new(name=group.name)
 assert len(instance.vertex_groups)==len(donor.vertex_groups),'NATIVE_RIG_VERTEX_GROUP_COUNT_MISMATCH'
 kdtree=KDTree(len(source))
 for idx,point in enumerate(source):kdtree.insert(point,idx)
 kdtree.balance()
 for vertex in mesh.vertices:
  _nearest,index,_distance=kdtree.find(vertex.co)
  weights=[(v.group,v.weight) for v in donor.data.vertices[index].groups if v.weight>0]
  assert weights, 'ARMOR_VERTEX_WITHOUT_SKIN_WEIGHTS'
  sm=sum(w for _,w in weights)
  for group,w in weights:instance.vertex_groups[group].add([vertex.index],w/sm,'REPLACE')
 assert all(v.groups for v in mesh.vertices),'UNWEIGHTED_VERTEX'
 assert any(m.type=='ARMATURE' and m.object==rig for m in instance.modifiers)
 # Silhouette audit uses BODY dimensions to demonstrate actual volume.
 full=[max(v.co[i] for v in mesh.vertices)-min(v.co[i] for v in mesh.vertices)
        for i in range(3)]
 ratios_out=[full[k]/raw[k] for k in range(3)]
 assert ratios_out[0]>=1.10, 'ARMOR_NOT_WIDER_THAN_NATIVE_BODY_'+slot
 assert ratios_out[1]>=1.12, 'ARMOR_STILL_BODYPAINT_DEPTH_'+slot
 assert ratios_out[2]>=1.04, 'ARMOR_NOT_THICK_IN_VERTICAL_'+slot
 solid_counts[slot]=solids
 fit_data[slot]={'bodyLocalAxes':raw,'armorLocalAxes':full,
  'armorToBodyAxes':ratios_out,'closedArmorSolids':solids}
 return instance,len(verts),len(faces),[hx,hy,hz]
for name in SLOTS:
 obj,nv,nf,rad=create_surface(name,donors[name]);objects.append(obj)
 verts_total+=nv;faces_total+=nf
 stats[name]={'freshVertices':nv,'freshFaces':nf,'sourceTrianglesCopied':0,'allVerticesSkinned':True,'radiiLocal':rad,
  'closedSolids':solid_counts[name]}
assert len(objects)==11 and verts_total>2000 and faces_total>1900,'TOO_FEW_NEW_TRIANGLES'
# GLB export of only new meshes + Rig_Medium; do not include old source armor.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for obj in objects:obj.select_set(True)
# The same native hunter is included in the GLB for the live lab, with
# exactly one armature; old armor / spare facial catalogs are not exported.
BODY_ONLY={'M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR',
 'M_LegL','M_LegR','M_FootL','M_FootR','M_Loin'}
base_parts=[bpy.data.objects.get(n) for n in BODY_ONLY]
assert all(o and o.type=='MESH' for o in base_parts),'MISSING_MODULAR_NATIVE_BODY'
for obj in base_parts:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_apply=False,export_yup=True)
data=output.read_bytes()
assert data[:4]==b'glTF' and len(data)>40000
count,kind=struct.unpack_from('<II',data,12)
assert kind==0x4e4f534a
glbjson=json.loads(data[20:20+count])
assert len(glbjson.get('skins',[]))>=1,'GLB_HAS_NO_SKIN'
skin_nodes=[o for o in glbjson.get('nodes',[]) if o.get('name','').startswith('HF18NEW_')]
assert len(skin_nodes)>=11,'NEW_ARMOR_NODES_MISSING'
assert all(any(n.get('name')==body for n in glbjson['nodes']) for body in BODY_ONLY),'HUNTER_BODY_MISSING_IN_GLTF'
assert len(glbjson.get('animations',[]))==22,'NATIVE_ANIMATIONS_CHANGED'
# The initial demo is a procedural, geometrically new prototype, NOT a
# high-quality AI rendering nor art-approved armor.
# Mandatory auto-rendered review angles. Images are *evidence*, NOT art PASS.
# A workbench rendering does not establish mobile quality or 22 playable clips.
from mathutils import Vector as V3
# ClaudeCraft contains HUNDREDS of mutually exclusive hair, face, eye, mask
# and armor variants. Showing all at once was the source of misleading QA
# images (massive grey hair obscured the new armor).
BODY_ONLY={'M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR',
 'M_LegL','M_LegR','M_FootL','M_FootR','M_Loin'}
qa_hidden=[]
qa_body=[]
for obj in bpy.data.objects:
 if obj.type!='MESH' or obj in objects:continue
 if obj.name in BODY_ONLY:
  obj.hide_render=False;qa_body.append(obj.name)
 else:
  obj.hide_render=True;qa_hidden.append(obj.name)
assert len(qa_hidden)>30 and len(qa_body)>=9,'CLAUDECRAFT_VARIANT_FILTER_BAD'
assert all(o.hide_render or o in objects or o.name in BODY_ONLY for o in bpy.data.objects if o.type=='MESH')
print('HIGHFLY_SKIN13_QA_SHOWS_ONLY_BASE_BODY_AND_FRESH_SKIN_HIDDEN_VARIANTS='+str(len(qa_hidden)),flush=True)
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
 'schema':'highfly.skin18.volumetric-armor-proof/1',
 'jobId':j['id'],'style':style,'prompt':j['request']['prompt'],
 'designBlueprintName':design['name'],'designBlueprintSource':design['source'],
 'designReference':design['designReference'],'originalArtworkAdaptation':'UNAPPROVED_GEOMETRY_INTERPRETATION',
 'worker':'BLENDER_SKIN18_REAL_VOLUMETRIC_SOLID_ARMOR_BOUND_TO_NATIVE_RIG',
 'freshOriginalGeometry':True,'copiedSourceTriangles':0,'donorMeshesUsedOnlyForFitAndWeights':True,
 'nativeRig':'Rig_Medium','originalRigBones':23,'originalAnimationClips':22,
 'newSkinnedPieces':len(objects),'newVertices':verts_total,'newPolygonFaces':faces_total,
 'newSculpturalDetails':sum(solid_counts.values()),'nativeBodyParts':len(base_parts),
 'closedArmorSolids':sum(solid_counts.values()),'anatomicalVolumeEvidence':fit_data,
 'glbSha256':hashlib.sha256(data).hexdigest(),'glbBytes':len(data),
 'skinsInGltf':len(glbjson.get('skins',[])),
 'animationTracksInGltf':len(glbjson.get('animations',[])),
 'visualArtQaPassed':False,'maleFemaleFitVerified':False,
 'reviewScreenshots':frames,'reviewAnglesRendered':len(frames),
 'qaHiddenOriginalVariants':len(qa_hidden),'qaVisibleBodyPieces':qa_body,
 'artistApproved':False,'artApproved':False,'gameDeployed':False,
 'outcome':'TECHNICAL_GLTF_CREATED_AWAITING_ARTISTIC_AND_MOBILE_REVIEW',
 'anatomyReferenceBodyMeshes':BODY_SOURCE,'pieces':stats
}
proofpath.parent.mkdir(parents=True,exist_ok=True)
proofpath.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('HIGHFLY_SKIN18_REAL_THICK_SOLID_ARMOR_SILHOUETTE_11_SLOTS_22_CLIPS_GREEN=1',flush=True)
print('HIGHFLY_SKIN13_ART_APPROVED=0 -- FIRST GEOMETRY DEMO ONLY',flush=True)
