#!/usr/bin/env python3
"""SKIN7 Native Chisel v2. Adds authored hard-surface topology INSIDE each
original skinned Paladin mesh, NOT an extra body, Nightfall layer or new rig.
Relative source bounds keep recipes portable across pinned ClaudeCraft M/F.
No claim that scripted form alone satisfies artistic approval.
"""
import bmesh
from mathutils import Vector

# Polygon coordinates are proportionate to the ORIGINAL native armor envelope:
# x=-1/+1: source left/right edge; z=0/1: source bottom/top.
# Raised crests, segmented plates and swept tips change actual silhouettes.
MOTIFS={
 'head':[
  [(-.94,.69),(-.72,.79),(-.24,.75),(0,.68),(.24,.75),(.72,.79),(.94,.69),(.77,.57),(0,.56),(-.77,.57)],
  [(-.20,.77),(-.25,1.01),(0,1.31),(.25,1.01),(.20,.77),(0,.69)],
  [(-.94,.58),(-.68,.55),(-.43,.24),(-.64,.11),(-.90,.39)],
  [(.94,.58),(.68,.55),(.43,.24),(.64,.11),(.90,.39)]
 ],
 'chest':[
  [(-.99,.76),(-.68,.91),(0,.66),(.68,.91),(.99,.76),(.66,.39),(0,.25),(-.66,.39)],
  [(-.18,.86),(0,1.07),(.18,.86),(.16,.32),(0,.16),(-.16,.32)],
  [(-.92,.47),(-.65,.53),(-.27,.33),(-.39,.15),(-.75,.19)],
  [(.92,.47),(.65,.53),(.27,.33),(.39,.15),(.75,.19)]
 ],
 'arms':[
  [(-1.50,.67),(-1.18,1.05),(-.58,1.20),(0,.99),(.58,1.20),(1.18,1.05),(1.50,.67),(.78,.52),(0,.43),(-.78,.52)],
  [(-1.34,.84),(-.94,1.28),(-.38,1.11),(-.65,.74)],
  [(1.34,.84),(.94,1.28),(.38,1.11),(.65,.74)],
  [(-.65,.42),(0,.62),(.65,.42),(.48,.23),(0,.14),(-.48,.23)]
 ],
 'hands':[
  [(-1.00,.67),(-.55,.82),(0,.70),(.55,.82),(1.00,.67),(.78,.46),(-.78,.46)],
  [(-.35,.46),(0,.69),(.35,.46),(.17,.18),(-.17,.18)]
 ],
 'legs':[
  [(-.95,.76),(0,1.08),(.95,.76),(.74,.50),(0,.29),(-.74,.50)],
  [(-.57,.42),(0,.65),(.57,.42),(.38,.10),(-.38,.10)]
 ],
 'feet':[
  [(-1.08,.42),(-.66,.64),(0,.57),(.66,.64),(1.08,.42),(.78,.16),(-.78,.16)],
  [(-.25,.62),(0,.87),(.25,.62),(.17,.35),(-.17,.35)]
 ],
 'back':[
  [(-1.46,.42),(-1.14,.91),(-.69,1.13),(0,.80),(.69,1.13),(1.14,.91),(1.46,.42),(.86,.55),(0,.61),(-.86,.55)],
  [(-.23,.91),(0,1.18),(.23,.91),(.21,.20),(0,.06),(-.21,.20)],
  [(-1.22,.41),(-.91,.71),(-.46,.54),(-.59,.23)],
  [(1.22,.41),(.91,.71),(.46,.54),(.59,.23)]
 ]
}

def sculpt_native_paladin(obj,slot,intensity):
 if slot not in MOTIFS or not 0.15<=intensity<=1.3:
  raise RuntimeError('SKIN7_V2_UNKNOWN_SCULPT_SLOT_OR_STRENGTH_'+slot)
 if obj.type!='MESH' or not obj.vertex_groups or not any(m.type=='ARMATURE' for m in obj.modifiers):
  raise RuntimeError('SKIN7_V2_REQUIRES_ORIGINAL_SKINNED_ARMOR')
 mesh=obj.data
 before=len(mesh.vertices)
 points=[v.co.copy() for v in mesh.vertices]
 old_weights=[[(g.group,g.weight) for g in v.groups if g.weight>0] for v in mesh.vertices]
 if not all(old_weights):raise RuntimeError('SKIN7_V2_ORIGINAL_WEIGHTS_MISSING_'+slot)
 mins=[min(v[k] for v in points) for k in range(3)]
 maxs=[max(v[k] for v in points) for k in range(3)]
 cx=(mins[0]+maxs[0])*.5
 sx=max(maxs[0]-mins[0],.04)
 sz=max(maxs[2]-mins[2],.05)
 sy=max(maxs[1]-mins[1],.04)
 # Always penetrate a little toward the source shell instead of floating
 # a copied overlaid armor. Front surfaces remain outward of the shell.
 is_back=slot=='back'
 facing=1 if is_back else -1
 front=(maxs[1] if is_back else mins[1])+facing*sy*.035
 thickness=sy*(.12+.04*intensity)
 b=bmesh.new();b.from_mesh(mesh)
 added=[]
 made_faces=[]
 for profile in MOTIFS[slot]:
  # intensity controls hard-surface silhouette, not just texture/scale.
  coords=[(cx+u*sx*.5*(.80+.20*intensity),
           mins[2]+v*sz*(.82+.18*intensity)) for u,v in profile]
  leading=[b.verts.new((x,front+facing*thickness*.32,z)) for x,z in coords]
  trailing=[b.verts.new((x,front-facing*thickness,z)) for x,z in coords]
  added.extend(leading+trailing)
  n=len(profile)
  for ring in (leading,list(reversed(trailing))):
   made_faces.append(b.faces.new(ring))
  for i in range(n):
   j=(i+1)%n
   made_faces.append(b.faces.new((leading[i],trailing[i],trailing[j],leading[j])))
 if len(added)<25:raise RuntimeError('SKIN7_V2_MEANINGLESS_TOPOLOGY_'+slot)
 bmesh.ops.recalc_face_normals(b,faces=made_faces)
 b.verts.index_update()
 ids=[v.index for v in added]
 b.to_mesh(mesh);b.free()
 mesh.update()
 if len(mesh.vertices)!=before+len(added):raise RuntimeError('SKIN7_V2_TOPOLOGY_LOST_'+slot)
 # Original vertex weights are preserved. Assign ONLY newly sculpted vertices
 # to nearest original donor vertex. This is an actual skinned geometry edit,
 # not a new fake rig or loose parenting to world position.
 mapped=0
 for idx in ids:
  p=mesh.vertices[idx].co
  closest=min(range(before),key=lambda k:(points[k]-p).length_squared)
  weightset=old_weights[closest]
  total=sum(w for _,w in weightset)
  if total<=0:raise RuntimeError('SKIN7_V2_UNWEIGHTED_SCULPT_'+slot)
  for group_index,w in weightset:
   obj.vertex_groups[group_index].add([idx],w/total,'REPLACE')
  mapped+=1
 if any(not mesh.vertices[i].groups for i in ids):
  raise RuntimeError('SKIN7_V2_BONE_DEFORM_UNASSIGNED_'+slot)
 return {'newVertices':len(added),'newFaces':len(made_faces),
  'sourceVerticesPreserved':before,'totalVertices':len(mesh.vertices),
  'weightedNewVertices':mapped,'motifPanels':len(MOTIFS[slot]),
  'slotIntensity':intensity,'nativeSkinnedSameMesh':True}
