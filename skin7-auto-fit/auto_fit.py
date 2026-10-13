#!/usr/bin/env python3
"""HIGHFLY SKIN7 Auto-Fit experimental mesh-to-Rig_Medium converter.
Not an art-approved armor, not a female fit, and not a certified collision solver.
Requires numpy and scipy. Never modifies the original input files.
"""
import argparse, copy, hashlib, json, struct
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

def load(path):
 b=Path(path).read_bytes()
 assert b[:4]==b'glTF' and struct.unpack_from('<I',b,4)[0]==2
 n,k=struct.unpack_from('<II',b,12);assert k==0x4e4f534a
 j=json.loads(b[20:20+n]);off=20+n;ln,typ=struct.unpack_from('<II',b,off)
 assert typ==0x004e4942 and off+8+ln<=len(b)
 return j,b[off+8:off+8+ln],hashlib.sha256(b).hexdigest()

def get(j,b,i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']]
 assert v['buffer']==0 and 'extensions' not in v
 d=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']])
 width={'SCALAR':1,'VEC3':3}[a['type']]
 assert v.get('byteStride',d.itemsize*width)==d.itemsize*width
 pos=v.get('byteOffset',0)+a.get('byteOffset',0)
 return np.frombuffer(b,d,count=a['count']*width,offset=pos).reshape(-1,width).copy()

def components(j,b):
 assert len(j.get('meshes',[]))==1 and len(j['meshes'][0]['primitives'])==1
 p=j['meshes'][0]['primitives'][0]
 v=get(j,b,p['attributes']['POSITION']).astype(np.float64)
 f=get(j,b,p['indices']).ravel().reshape(-1,3).astype(np.int64)
 assert np.isfinite(v).all() and f.min()>=0 and f.max()<len(v)
 a=np.r_[f[:,0],f[:,1],f[:,2]]
 z=np.r_[f[:,1],f[:,2],f[:,0]]
 adjacency=coo_matrix((np.ones(2*len(a),dtype=np.uint8),(np.r_[a,z],np.r_[z,a])),shape=(len(v),len(v))).tocsr()
 count,labels=connected_components(adjacency,directed=False)
 sizes=np.bincount(labels)
 chosen=sorted(np.argsort(sizes)[-3:],key=lambda c:v[labels==c,0].mean())
 if count<3 or min(sizes[chosen])<1000:raise ValueError('Triptych not recognized; require manual source preparation.')
 return v,f,labels,count,chosen,sizes

def labels_for_faces(v,center):
 x=v[:,0]-center;y=v[:,1]
 regions=np.full(len(v),'Chest',dtype=object)
 regions[y>.14]='Head'
 regions[(y<=-.17)&(y>-.43)&(x<0)]='LegL'
 regions[(y<=-.17)&(y>-.43)&(x>=0)]='LegR'
 regions[(y<=-.43)&(x<0)]='FootL'
 regions[(y<=-.43)&(x>=0)]='FootR'
 arms=(abs(x)>.175)&(y<.17)&(y>-.38)
 hands=(abs(x)>.19)&(y<=-.30)&(y>-.47)
 regions[arms&(x<0)]='ArmL';regions[arms&(x>=0)]='ArmR'
 regions[hands&(x<0)]='HandL';regions[hands&(x>=0)]='HandR'
 return regions

def reduce(v,faces,limit):
 edge=float(max(np.ptp(v,axis=0)))
 for pitch in np.linspace(edge/220,edge/12,32):
  _,mapping=np.unique(np.rint(v/pitch).astype(np.int32),axis=0,return_inverse=True)
  counts=np.bincount(mapping)
  new=np.column_stack([np.bincount(mapping,weights=v[:,i])/counts for i in range(3)]).astype('<f4')
  f=mapping[faces]
  f=f[(f[:,0]!=f[:,1])&(f[:,1]!=f[:,2])&(f[:,0]!=f[:,2])]
  if not len(f):continue
  _,first=np.unique(np.sort(f,axis=1),axis=0,return_index=True)
  f=f[np.sort(first)]
  if len(f)<=limit:break
 used=np.unique(f)
 remap=np.full(len(new),-1,dtype=np.int32);remap[used]=np.arange(len(used))
 return new[used],remap[f].astype('<u4'),pitch

def bones_world(j):
 nodes=j['nodes'];parent={c:i for i,n in enumerate(nodes) for c in n.get('children',[])};cache={}
 def matrix(i):
  if i in cache:return cache[i]
  n=nodes[i];x,y,z,w=n.get('rotation',[0,0,0,1])
  rot=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
    [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
    [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]],dtype=float)
  m=np.eye(4);m[:3,:3]=rot*np.asarray(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0])
  cache[i]=matrix(parent[i])@m if i in parent else m
  return cache[i]
 return {nodes[i].get('name'):matrix(i)[:3,3] for i in range(23)}

JOINTS={
 'Head':['head'],'Chest':['chest','spine','hips'],
 'ArmL':['upperarm.l','lowerarm.l','wrist.l'],'ArmR':['upperarm.r','lowerarm.r','wrist.r'],
 'HandL':['hand.l','wrist.l'],'HandR':['hand.r','wrist.r'],
 'LegL':['upperleg.l','lowerleg.l','foot.l'],'LegR':['upperleg.r','lowerleg.r','foot.r'],
 'FootL':['foot.l','toes.l'],'FootR':['foot.r','toes.r']}

def weights(v,part,names,locations):
 keys=[key for key in JOINTS[part] if key in names]
 assert keys
 ids=np.array([names.index(key) for key in keys])
 anchors=np.array([locations[key] for key in keys])
 d=np.maximum(np.linalg.norm(v[:,None,:]-anchors[None,:,:],axis=-1),.035)
 w=d**(-3);w/=w.sum(axis=1,keepdims=True)
 best=np.argsort(-w,axis=1)[:,:min(4,len(keys))]
 ww=np.take_along_axis(w,best,axis=1);ww/=ww.sum(axis=1,keepdims=True)
 ji=np.zeros((len(v),4),dtype=np.uint8);jw=np.zeros((len(v),4),dtype='<f4')
 ji[:,:len(keys)]=ids[best];jw[:,:len(keys)]=ww
 return ji,jw

def build(j,original,parts,path):
 j=copy.deepcopy(j);bin=bytearray(original);audit=[]
 def access(data,target,kind,code,with_bounds=False):
  while len(bin)%4:bin.append(0)
  raw=np.ascontiguousarray(data).tobytes();offset=len(bin);bin.extend(raw)
  vi=len(j['bufferViews']);j['bufferViews'].append(dict(buffer=0,byteOffset=offset,byteLength=len(raw),target=target))
  ai=len(j['accessors']);a=dict(bufferView=vi,componentType=code,count=len(data),type=kind)
  if with_bounds:a.update(min=np.min(data,axis=0).astype(float).tolist(),max=np.max(data,axis=0).astype(float).tolist())
  j['accessors'].append(a);return ai
 material=len(j['materials'])
 j['materials'].append(dict(name='HIGHFLY_AutoFit_material_placeholder',pbrMetallicRoughness=dict(baseColorFactor=[.085,.072,.14,1],metallicFactor=.7,roughnessFactor=.35),doubleSided=True))
 native=next(n for n in j['nodes'] if n.get('name')=='M_Torso')
 rig_index=native['skin'];names=[j['nodes'][i]['name'] for i in j['skins'][rig_index]['joints']]
 assert len(names)==23
 root=next(n for n in j['nodes'] if n.get('name')=='Rig_Medium' and 'children' in n)
 loc=bones_world(j)
 for part,(v,f,pitch) in parts.items():
  normals=np.zeros_like(v,dtype='<f4')
  triangles=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
  triangles/=np.maximum(np.linalg.norm(triangles,axis=1)[:,None],1e-9)
  for i in range(3):np.add.at(normals,f[:,i],triangles)
  normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-9)
  js,ws=weights(v,part,names,loc)
  attrs=dict(POSITION=access(v,34962,'VEC3',5126,True),NORMAL=access(normals,34962,'VEC3',5126),
       JOINTS_0=access(js,34962,'VEC4',5121),WEIGHTS_0=access(ws,34962,'VEC4',5126))
  ix=access(f.reshape(-1),34963,'SCALAR',5125)
  mi=len(j['meshes']);j['meshes'].append(dict(name='HIGHFLY_AUTO_FIT_'+part,primitives=[dict(attributes=attrs,indices=ix,material=material,mode=4)]))
  ni=len(j['nodes']);j['nodes'].append(dict(name='HIGHFLY_AUTO_FIT_'+part,mesh=mi,skin=rig_index,extras=dict(proofOnly=True)))
  root['children'].append(ni)
  audit.append(dict(part=part,vertices=len(v),triangles=len(f),pitch=round(float(pitch),5),hasSkin=True))
 j['buffers'][0]['byteLength']=len(bin)
 payload=json.dumps(j,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4)
 bin.extend(b'\0'*((-len(bin))%4))
 chunks=struct.pack('<I4s',len(payload),b'JSON')+payload+struct.pack('<I4s',len(bin),b'BIN\0')+bin
 Path(path).write_bytes(struct.pack('<4sII',b'glTF',2,12+len(chunks))+chunks)
 return audit

def main():
 p=argparse.ArgumentParser()
 for field in ['source','rig','output','report']:p.add_argument('--'+field,required=True)
 p.add_argument('--target',type=int,default=22000)
 a=p.parse_args()
 source,sdata,source_sha=load(a.source);base,bdata,rig_sha=load(a.rig)
 v,f,region,num,top,sizes=components(source,sdata)
 chosen=top[0];fg=f[region[f[:,0]]==chosen]
 cx=(v[region==chosen,0].min()+v[region==chosen,0].max())/2
 floor=v[region==chosen,1].min()
 posed=v.copy();posed[:,0]-=cx;posed[:,1]-=floor;posed*=1.26
 face_parts=labels_for_faces(v[fg].mean(axis=1),cx)
 parts={}
 for part in JOINTS:
  faces=fg[face_parts==part]
  if len(faces)<10:continue
  indices=np.unique(faces);relabel=np.full(len(v),-1,dtype=np.int32);relabel[indices]=np.arange(len(indices))
  parts[part]=reduce(posed[indices],relabel[faces],max(300,a.target//10))
 audit=build(base,bdata,parts,a.output)
 output,_,_=load(a.output);tris=sum(x['triangles'] for x in audit)
 assert len(audit)>=7 and tris<=a.target*1.4 and len(output['animations'])==22 and len(output['skins'])==len(base['skins'])
 report=dict(source_sha256=source_sha,rig_sha256=rig_sha,component_count=int(num),
   triptych=[dict(vertices=int(sizes[i]),bounds=np.round([v[region==i].min(axis=0),v[region==i].max(axis=0)],4).tolist()) for i in top],
   used='leftmost front component',parts=audit,triangle_count=tris,animation_count=22,joint_count=23,
   status='EXPERIMENTAL_UNAPPROVED',gates=dict(skinned=True,visual_fit=False,collision=False,female=False,android=False))
 Path(a.report).write_text(json.dumps(report,indent=2))
 print(json.dumps(report,indent=2))
if __name__=='__main__':main()
