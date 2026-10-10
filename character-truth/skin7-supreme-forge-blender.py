#!/usr/bin/env python3
"""SKIN 7 — genuinely NEW procedural hero armor on original 23-bone Rig_Medium.
DO NOT export original KayKit body or duplicate skeleton. Geometry is source-bounds
driven, not simple recolor/scale of Nightfall/V19. Deterministic 2 design profiles.
Blender CLI: --source verified-Nightfall.glb --overlay out.glb --combined out.glb
             --manifest out.json --profile crimson|guardian
"""
import bpy,math,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def arg(name):
 if name not in argv or argv.index(name)+1>=len(argv):raise RuntimeError('SKIN7_ARG_MISSING_'+name)
 return argv[argv.index(name)+1]
source=Path(arg('--source')).resolve();overlay=Path(arg('--overlay')).resolve()
combined=Path(arg('--combined')).resolve();manifest=Path(arg('--manifest')).resolve()
profile=arg('--profile')
STYLES={
 'crimson':{'left':1.68,'right':1.06,'chest':1.14,'skirts':1.18,
  'red':(.54,.026,.065),'gold':(.73,.48,.15),'accent':(.06,.62,.75)},
 'guardian':{'left':1.13,'right':1.13,'chest':1.05,'skirts':.88,
  'red':(.045,.055,.085),'gold':(.47,.56,.67),'accent':(.44,.12,.65)}
}
if profile not in STYLES:raise RuntimeError('SKIN7_PROFILE_NOT_VERIFIED')
p=STYLES[profile]
if not source.exists():raise RuntimeError('SKIN7_NIGHTFALL_REFERENCE_MISSING')
for path in (overlay,combined,manifest):path.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(source))
rig=bpy.data.objects.get('Rig_Medium')
if not rig or rig.type!='ARMATURE' or len(rig.data.bones)!=23:
 raise RuntimeError('SKIN7_MUST_USE_EXISTING_NATIVE_RIG_MEDIUM_23')
BONES={b.name for b in rig.data.bones}
assert {'root','hips','spine','chest','head','upperarm.l','upperarm.r','lowerleg.l','lowerleg.r'}.issubset(BONES)
original=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith(('HFV8_','HFV12_'))]
if len(original)!=92:raise RuntimeError('SKIN7_EXPECTS_EXACT_92_ORIGINAL_NIGHTFALL_PARTS_'+str(len(original)))
made=[];reports={}
def mat(name,color,metal=.75,rough=.3,emit=0):
 m=bpy.data.materials.new('HF7_'+name);m.use_nodes=True
 sh=m.node_tree.nodes.get('Principled BSDF')
 sh.inputs['Base Color'].default_value=(*color,1)
 sh.inputs['Metallic'].default_value=metal
 sh.inputs['Roughness'].default_value=rough
 if emit:
  sh.inputs['Emission Color'].default_value=(*color,1)
  sh.inputs['Emission Strength'].default_value=emit
 return m
iron=mat('SCULPTED_ENAMEL',p['red'],.73,.26)
trim=mat('SILVER_GOLD_TRIM',p['gold'],.87,.19)
glow=mat('ENERGY_NUCLEUS',p['accent'],.26,.25,1.1)
dark=mat('MANTLE_INTERLAYER',(.018,.020,.035),.18,.72)
def donor(name):
 d=bpy.data.objects.get(name)
 if not d or d.type!='MESH' or not d.vertex_groups:raise RuntimeError('SKIN7_MISSING_SKIN_DONOR_'+name)
 if not any(m.type=='ARMATURE' and m.object==rig for m in d.modifiers):
  raise RuntimeError('SKIN7_DONOR_HAS_NO_TRUE_NATIVE_RIG_'+name)
 return d
def bounds(d):
 vertices=d.data.vertices
 a=[min(v.co[i] for v in vertices) for i in range(3)]
 b=[max(v.co[i] for v in vertices) for i in range(3)]
 return a,b,[(x+y)/2 for x,y in zip(a,b)],[(y-x)/2 for x,y in zip(a,b)]
def skin(target,d):
 """Transfer max four original native-bone vertex weights via KD4, normalize."""
 tree=KDTree(len(d.data.vertices))
 for v in d.data.vertices:tree.insert(v.co,v.index)
 tree.balance()
 all_names=[g.name for g in d.vertex_groups]
 target_groups={}
 for g in d.vertex_groups:
  if g.name in BONES:target_groups[g.name]=target.vertex_groups.new(name=g.name)
 if not target_groups:raise RuntimeError('SKIN7_NO_TRUE_BONE_WEIGHTS_'+d.name)
 for v in target.data.vertices:
  sums={}
  for _,idx,dist in tree.find_n(v.co,4):
   wt=1/(.00001+dist*dist)
   for source_group in d.data.vertices[idx].groups:
    name=all_names[source_group.group]
    if name in target_groups:sums[name]=sums.get(name,0)+wt*source_group.weight
  winners=sorted(sums.items(),key=lambda x:x[1],reverse=True)[:4]
  total=sum(w for _,w in winners)
  if total<1.e-9:raise RuntimeError('SKIN7_UNWEIGHTED_AUTHORED_VERTEX_'+target.name)
  for name,w in winners:
   if w/total>1.e-8:target_groups[name].add([v.index],w/total,'REPLACE')
 target.matrix_world=d.matrix_world.copy()
 mod=target.modifiers.new('SKIN7_NATIVE_BONE_DEFORMATION','ARMATURE');mod.object=rig
 reports[target.name]={'donor':d.name,'newVertices':len(target.data.vertices),
                       'weighted':True,'maxInfluences':4}
def author(name,d,vs,faces,material):
 if len(vs)<6 or len(faces)<4:raise RuntimeError('SKIN7_NEW_TOPOLOGY_REQUIRED_'+name)
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],faces);me.update()
 o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o)
 o.data.materials.append(material)
 skin(o,d);made.append(o);return o
def shell(name,d,rows,cols,fn,material,thickness=.023):
 """Parametric sculpted convex 3D panel with connected front/rear, not a 2D decal."""
 front=[tuple(fn(i/(rows-1),j/(cols-1))) for i in range(rows) for j in range(cols)]
 # Native outward normal for chest/pauldron sits along negative Y.
 back=[(x,y+thickness,z) for x,y,z in front]
 vertices=front+back;n=len(front);faces=[]
 for i in range(rows-1):
  for j in range(cols-1):
   a=i*cols+j;b=a+1;c=a+cols;dd=c+1
   faces.extend([(a,b,dd,c),(n+c,n+dd,n+b,n+a)])
 for j in range(cols-1):
  a=j;b=(rows-1)*cols+j
  faces.extend([(a,n+a,n+a+1,a+1),(b,b+1,n+b+1,n+b)])
 for i in range(rows-1):
  a=i*cols;b=(i+1)*cols
  faces.extend([(a,b,n+b,n+a),(a+cols-1,n+a+cols-1,n+b+cols-1,b+cols-1)])
 return author(name,d,vertices,faces,material)
def plated(name,d,poly,material,thickness=.025):
 """High-volume extruded polygon original authored topology."""
 n=len(poly);back=[(x,y+thickness,z) for x,y,z in poly]
 vs=list(poly)+back
 faces=[tuple(range(n)),tuple(reversed(range(n,2*n)))]
 faces.extend((i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n))
 return author(name,d,vs,faces,material)
def ring(name,d,c,rx,ry,z0,z1,mat0,segments=18):
 verts=[];faces=[]
 for i in range(3):
  t=i/2;z=z0+(z1-z0)*t
  for j in range(segments):
   ang=2*math.pi*j/segments
   verts.append((c[0]+rx*(1+.10*math.sin(math.pi*t))*math.cos(ang),
      c[1]+ry*(1+.10*math.sin(math.pi*t))*math.sin(ang),z))
 for i in range(2):
  for j in range(segments):
   a=i*segments+j;b=i*segments+(j+1)%segments
   faces.append((a,b,b+segments,a+segments))
 return author(name,d,verts,faces,mat0)
for gender in ('M','F'):
 torso=donor('HFV12_'+gender+'_CHEST_ABDOMINAL_CUIRASS')
 low,hi,c,r=bounds(torso);w=max(r[0],.13);h=max(r[2],.16)
 front=low[1]-.038
 # Broader armored torso with original curves, raised edges and actual concave detail.
 def cuirass(t,u):
  dx=(u-.5)*2
  z=low[2]+(hi[2]-low[2])*(.06+.90*t)
  taper=.88+.16*math.sin(math.pi*(t*.8+.08))
  x=c[0]+w*p['chest']*.96*dx*taper
  y=front+.095*(dx*dx)-.038*(1-dx*dx)*math.sin(t*math.pi)
  return (x,y,z)
 shell('HF7_'+gender+'_CHEST_HERO_CUIRASS',torso,10,20,cuirass,iron,.029)
 def chest_trim(t,u):
  x,y,z=cuirass(.82+t*.14,u)
  return (x,y-.018,z)
 shell('HF7_'+gender+'_CHEST_GOLD_COLLAR_TRIM',torso,3,20,chest_trim,trim,.010)
 plated('HF7_'+gender+'_CHEST_ENERGY_FRAME',torso,[
   (c[0],front-.11,c[2]+h*.49),
   (c[0]-w*.23,front-.067,c[2]+h*.11),
   (c[0],front-.12,c[2]-h*.46),
   (c[0]+w*.23,front-.067,c[2]+h*.11)],trim,.019)
 plated('HF7_'+gender+'_CHEST_CYAN_CORE',torso,[
   (c[0],front-.137,c[2]+h*.32),
   (c[0]-w*.09,front-.122,c[2]+h*.09),
   (c[0],front-.139,c[2]-h*.19),
   (c[0]+w*.09,front-.122,c[2]+h*.09)],glow,.012)
 # Sculpted paired front flank plates, not painted texture on source torso.
 for side,tag in [(-1,'L'),(1,'R')]:
  plated('HF7_'+gender+'_CHEST_FLANK_RIDGE_'+tag,torso,[
    (c[0]+side*w*.53,front-.036,c[2]+h*.74),
    (c[0]+side*w*.88,front+.022,c[2]+h*.38),
    (c[0]+side*w*.62,front-.035,c[2]-h*.53),
    (c[0]+side*w*.43,front-.061,c[2]-h*.16)],trim,.015)
 # Original left-dominant and right-medium broad pagoda-like pauldron SHELLS.
 for letter in ('L','R'):
  arm=donor('HFV8_'+gender+'_ARMS_PAULDRON_'+letter)
  amin,amax,ac,ar=bounds(arm)
  span=max(amax[0]-amin[0],.10)
  big=p['left'] if letter=='L' else p['right']
  # one three-layer articulated shell; each layer geometry is differently curved.
  for layer in range(3):
   local_width=span*(.59+.13*layer)*big
   ybase=amin[1]-.056-.035*layer
   zbase=ac[2]+max(ar[2],.04)*(.75-.31*layer)
   def wing(t,u,local_width=local_width,ybase=ybase,zbase=zbase,layer=layer):
    xx=(u-.5)*2
    return (ac[0]+xx*local_width*.50,
     ybase-.052*(1-xx*xx)*math.sin(math.pi*t),
     zbase+(.14+.055*big)*math.sin(math.pi*u)-(.11+.08*layer)*t+
     (.06+.015*big)*(1-abs(xx))*math.sin(math.pi*t))
   shell('HF7_'+gender+'_SHOULDER_'+letter+'_PAGODA_'+str(layer),arm,7,13,wing,
     iron if layer!=1 else trim,.024)
  # The shell must be volume rather than two knife spikes.
  ring('HF7_'+gender+'_SHOULDER_'+letter+'_BINDING',arm,ac,
   max(ar[0],.06)*1.12,max(ar[1],.055)*1.15,ac[2]-.055,ac[2]+.07,dark,20)
 # Moveable short samurai kusazuri faulds, using torso donor hips skin influence.
 for k,tag in [(-1,'L'),(0,'CENTER'),(1,'R')]:
  for layer in range(2):
   xbase=c[0]+k*w*.52
   ztop=low[2]+.14-.035*layer
   width=w*(.24 if k else .36)*p['skirts']
   def fauld(t,u,xbase=xbase,ztop=ztop,width=width,k=k,layer=layer):
    xx=(u-.5)*2
    return (xbase+xx*width*(1+.11*t),
       front-.06-.028*layer +.064*(xx*xx)+.012*abs(k),
       ztop-(.14+.06*layer)*t-.027*(1-xx*xx))
   shell('HF7_'+gender+'_WAIST_KUSAZURI_'+tag+'_'+str(layer),torso,5,7,fauld,
      iron if layer==0 else trim,.019)
 # A real rear cuirass derived from existing Nightfall rear geometry, not a floating fin.
 rear=donor('HFV12_'+gender+'_BACK_RAISED_SPINE')
 rlo,rhi,rc,rr=bounds(rear)
 def rearplate(t,u):
  xx=(u-.5)*2
  return (c[0]+w*.92*xx*(.85+.13*t),
    max(rhi[1],rc[1])+.065+.035*(1-xx*xx),
    low[2]+(hi[2]-low[2])*(.12+.78*t))
 shell('HF7_'+gender+'_BACK_GUARD_CUIRASS',rear,10,16,rearplate,iron,.027)
 for side,tag in [(-1,'L'),(1,'R')]:
  x=c[0]+side*w*.48
  plated('HF7_'+gender+'_BACK_GOLD_SPINE_'+tag,rear,[
   (x, rhi[1]+.126,c[2]+h*.65),
   (x+side*w*.10,rhi[1]+.127,c[2]+h*.30),
   (x+side*w*.13,rhi[1]+.131,c[2]-h*.51),
   (x-side*w*.07,rhi[1]+.124,c[2]-h*.36)],trim,.011)
 # Bracers / knees both genders, anchor to donor's genuine arm / leg deformation.
 for letter in ('L','R'):
  br=donor('HFV8_'+gender+'_ARMS_BRACER_'+letter)
  a,b,bc,rr=bounds(br)
  ring('HF7_'+gender+'_ARM_'+letter+'_BROAD_BRACER',br,bc,
    max(rr[0],.05)*1.07,max(rr[1],.045)*1.14,
    a[2]+.010,b[2]-.010,iron,16)
  leg=donor('HFV8_'+gender+'_LEGS_GREAVE_'+letter)
  a,b,lc,lr=bounds(leg)
  ring('HF7_'+gender+'_LEG_'+letter+'_SCULPTED_GREAVE',leg,lc,
    max(lr[0],.06)*1.13,max(lr[1],.045)*1.12,
    a[2]+.026,b[2]-.026,iron,16)
if len(made)!=54:raise RuntimeError('SKIN7_PREMIUM_PARTS_COUNT_'+str(len(made)))
verts=sum(len(x.data.vertices) for x in made)
tris=sum(sum(max(0,len(f.vertices)-2) for f in o.data.polygons) for o in made)
if verts>17000 or tris>15000:raise RuntimeError('SKIN7_MOBILE_ADDED_GEOMETRY_TOO_HEAVY')
def export(path,include_legacy):
 bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
 for o in made:o.select_set(True)
 if include_legacy:
  for o in original:o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',
   use_selection=True,export_yup=True,export_apply=False)
 if path.stat().st_size<15000:raise RuntimeError('SKIN7_NEW_3D_GLB_EMPTY_'+str(path))
export(overlay,False);export(combined,True)
report={'schema':'highfly.skin7.forge-evidence/1','profile':profile,'source':source.name,
 'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'rig':'Rig_Medium',
 'nativeJointCount':len(rig.data.bones),'newMeshCount':len(made),'newVertices':verts,'newTriangles':tris,
 'newNames':[o.name for o in made], 'weightedDonors':reports,
 'originalBodyMeshesExported':False,'originalSourceFilesModified':False,
 'combinedIncludesOriginalNightfall':True,'overlaySha256':hashlib.sha256(overlay.read_bytes()).hexdigest(),
 'combinedSha256':hashlib.sha256(combined.read_bytes()).hexdigest(),'texturesReused':False,
 'humanArtistApproved':False,'unityImportTested':False,'physicalS23Tested':False,
 'maxClippingCertified':False,'geometryParamSet':p}
manifest.write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('HIGHFLY_SKIN7_NEW_REAL_SCULPTED_NATIVE_3D_ARMOR_GREEN=1 PROFILE='+profile+
 ' PARTS='+str(len(made))+' VERTS='+str(verts)+' TRI='+str(tris))
