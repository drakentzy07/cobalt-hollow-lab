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
choices=design['decisions']
assert set(choices)=={'theme','helmet','shoulders','chest','back','shape','metal','accent'},'INVALID_DESIGN_SCHEMA'

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

def create_surface(slot,donor):
 source=[v.co.copy() for v in donor.data.vertices]
 # Critical SKIN13-C improvement: use the *body itself*, not any previous
 # armor's bounding box, to position and proportion the freshly-made mesh.
 # These body positions are measurement-only, not vertices for topology.
 ref=bpy.data.objects.get(BODY_SOURCE[slot])
 assert ref and ref.type=='MESH' and ref.data.vertices,'NATIVE_BODY_SLOT_MISSING_'+slot
 into_donor=donor.matrix_world.inverted_safe()
 body=[into_donor@(ref.matrix_world @ v.co) for v in ref.data.vertices]
 lo=[min(v[k] for v in body) for k in range(3)]
 hi=[max(v[k] for v in body) for k in range(3)]
 ctr=[(lo[k]+hi[k])/2 for k in range(3)]
 raw=[max(hi[k]-lo[k],.025) for k in range(3)]
 torso_ref=bpy.data.objects['M_Torso']
 torso_width=max(torso_ref.dimensions.x,.15)
 torso_height=max(torso_ref.dimensions.z,.20)
 cap=maxima[slot]
 if slot=='Head':
  # This must fully encompass the actual native head: no tiny crown perched
  # above a visible naked face, as happened in the previous technical prototype.
  sx=raw[0]*.59;sy=raw[1]*.61;sz=raw[2]*.59
 else:
  sx=min(raw[0]*.57,torso_width*cap[0])
  sy=min(raw[1]*.55,torso_width*cap[1])
  sz=min(raw[2]*.55,torso_height*cap[2])
 sx=max(sx,.022);sy=max(sy,.022);sz=max(sz,.028)
 if slot=='Chest':
  ctr[1]-=raw[1]*.20
  sy*=.82
 if slot=='Back':
  ctr[1]+=raw[1]*.34
  sy*=.54
 verts=[];faces=[];mi=[]
 rings=12
 steps=20
 # Oval hardened shells: 264+ independent vertices and curved faces/slot.
 # The old Paladin topology is NEVER cloned, rescaled, or copied.
 for i in range(1,rings):
  u=math.pi*i/rings
  for k in range(steps):
   a=2*math.pi*k/steps
   taper=math.sin(u)
   panel=1+.06*math.cos(a*6)*math.sin(u)**2
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
 # Hard-surface, per-slot contours are deliberately asymmetrical and
 # different from the base ellipsoids. Distinct visor, crest, core, pauldrons.
 for plate_name,outline,material_id in DETAILS[slot]:
  add_forged_plate(verts,faces,mi,ctr,sx,sy,sz,outline,material_id)
 mesh=bpy.data.meshes.new('HF13_TRUE_NEW_MESH_'+slot)
 mesh.from_pydata(verts,[],faces);mesh.update()
 for material in materials:mesh.materials.append(material)
 for f,m in zip(mesh.polygons,mi):f.material_index=m;f.use_smooth=False
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
 stats[name]={'freshVertices':nv,'freshFaces':nf,'sourceTrianglesCopied':0,'allVerticesSkinned':True,'radiiLocal':rad,
  'sculpturalPanels':[panel[0] for panel in DETAILS[name]]}
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
skin_nodes=[o for o in glbjson.get('nodes',[]) if o.get('name','').startswith('HF13NEW_')]
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
 'schema':'highfly.skin13.geometry-technical-proof/1',
 'jobId':j['id'],'style':style,'prompt':j['request']['prompt'],
 'designBlueprintName':design['name'],'designBlueprintSource':design['source'],
 'designReference':design['designReference'],'originalArtworkAdaptation':'UNAPPROVED_GEOMETRY_INTERPRETATION',
 'worker':'BLENDER_AUTHOR_DIRECTED_ECLIPSE_CONCEPT_RIGGED',
 'freshOriginalGeometry':True,'copiedSourceTriangles':0,'donorMeshesUsedOnlyForFitAndWeights':True,
 'nativeRig':'Rig_Medium','originalRigBones':23,'originalAnimationClips':22,
 'newSkinnedPieces':len(objects),'newVertices':verts_total,'newPolygonFaces':faces_total,
 'newSculpturalDetails':sum(len(v) for v in DETAILS.values()),'nativeBodyParts':len(base_parts),
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
print('HIGHFLY_SKIN16_REAL_CLAUDECRAFT_BODY_PLUS_NEW_ECLIPSE_ARMOR_22_CLIPS_GREEN=1',flush=True)
print('HIGHFLY_SKIN13_ART_APPROVED=0 -- FIRST GEOMETRY DEMO ONLY',flush=True)
