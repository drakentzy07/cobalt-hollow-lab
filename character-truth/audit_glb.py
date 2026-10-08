#!/usr/bin/env python3
"""HIGHFLY OFFICIAL CHARACTER TRUTH audit. Read-only glTF 2.0 GLB parser.
Reports every mesh primitive, node, material, skin joint, weight and animation channel.
Static tests are NOT proof of skinned runtime animation or visual clipping.
"""
import argparse,csv,collections,hashlib,json,struct,pathlib,base64,urllib.parse
TYPES={"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4,"MAT2":4,"MAT3":9,"MAT4":16}
COMP={5120:("b",1,127),5121:("B",1,255),5122:("h",2,32767),5123:("H",2,65535),5125:("I",4,4294967295),5126:("f",4,1)}
def rnd(x):return round(float(x),5)
def parse(path):
    data=path.read_bytes()
    if len(data)<20 or data[:4]!=b"glTF":raise ValueError("GLB signature invalid")
    _,ver,length=struct.unpack_from("<III",data)
    if ver!=2 or length!=len(data):raise ValueError("GLB version or length invalid")
    p=12;chunks={}
    while p<len(data):
        size,kind=struct.unpack_from("<II",data,p);p+=8
        if p+size>len(data):raise ValueError("Truncated GLB")
        chunks[kind]=data[p:p+size];p+=size
    document=json.loads(chunks[0x4e4f534a].decode("utf-8"))
    return document,chunks.get(0x004e4942,b""),data
class Reader:
    def __init__(self,doc,buffer):
        self.doc=doc;self.cache={}
        self.buffers={}
        # GLB binary chunk is buffer[0]; additional buffers are permitted in
        # our legacy donor only when embedded as data URIs. NEVER fetch URLs.
        print("GLB_BUFFER_METADATA",[(i,b.get("byteLength"),str(b.get("uri","<none>"))[:90]) for i,b in enumerate(doc.get("buffers",[]))],flush=True)
        for i,item in enumerate(doc.get("buffers",[])):
            uri=item.get("uri")
            if uri is None and i==0:
                payload=buffer
            elif isinstance(uri,str) and uri.startswith("data:"):
                header,_,encoded=uri.partition(",")
                if ";base64" in header.lower():payload=base64.b64decode(encoded,validate=True)
                else:payload=urllib.parse.unquote_to_bytes(encoded)
            else:
                raise ValueError("External network/file buffer forbidden: index="+str(i))
            if len(payload)<item.get("byteLength",0):
                raise ValueError("GLB buffer smaller than declared byteLength "+str(i))
            self.buffers[i]=payload
        if not self.buffers:self.buffers[0]=buffer
        print("GLTF_BUFFER_LAYOUT",[(i,len(v)) for i,v in sorted(self.buffers.items())])
    def read(self,index):
        if index in self.cache:return self.cache[index]
        a=self.doc["accessors"][index];n=a["count"];dimension=TYPES[a["type"]];comp=a["componentType"]
        fmt,size,div=COMP[comp];norm=a.get("normalized",False);result=[]
        if n>1000000:raise ValueError("Too many accessor records")
        if "bufferView" not in a:result=[(0,)*dimension for _ in range(n)]
        else:
            view=self.doc["bufferViews"][a["bufferView"]]
            bufidx=view.get("buffer",0)
            if bufidx not in self.buffers:raise ValueError("GLB buffer index not present "+str(bufidx))
            blob=self.buffers[bufidx]
            start=view.get("byteOffset",0)+a.get("byteOffset",0)
            stride=view.get("byteStride",size*dimension)
            for j in range(n):
                p=start+j*stride
                if p+size*dimension>len(blob):raise ValueError("Accessor out of range")
                values=struct.unpack_from("<"+fmt*dimension,blob,p)
                if norm and comp!=5126:
                    values=tuple(max(-1,x/div) if comp in (5120,5122) else x/div for x in values)
                result.append(values)
        if "sparse" in a:
            sp=a["sparse"];ind=sp["indices"];vals=sp["values"]
            iv=self.doc["bufferViews"][ind["bufferView"]];vv=self.doc["bufferViews"][vals["bufferView"]]
            if iv.get("buffer",0) not in self.buffers or vv.get("buffer",0) not in self.buffers:
                raise ValueError("Sparse references unavailable buffer")
            ib=self.buffers[iv.get("buffer",0)]
            vb=self.buffers[vv.get("buffer",0)]
            inf,isize,_=COMP[ind["componentType"]]
            for j in range(sp["count"]):
                idx=struct.unpack_from("<"+inf,ib,iv.get("byteOffset",0)+ind.get("byteOffset",0)+j*isize)[0]
                result[idx]=struct.unpack_from("<"+fmt*dimension,vb,vv.get("byteOffset",0)+vals.get("byteOffset",0)+j*size*dimension)
        self.cache[index]=result
        return result
def parents_for(nodes):
    p={}
    for i,n in enumerate(nodes):
        for child in n.get("children",[]):
            if child in p:raise ValueError("Multiple parents for node")
            p[child]=i
    return p
def path_for(i,nodes,parents):
    out=[];visited=set()
    while i not in visited:
        visited.add(i);out.append(nodes[i].get("name","node_"+str(i)))
        if i not in parents:break
        i=parents[i]
    return "/".join(reversed(out))
def group(name):
    n=name.lower()
    if n.startswith("armor_"):return "armour_candidate"
    if "hair" in n or "beard" in n:return "hair_beard_candidate"
    if any(x in n for x in ["eye","ear","brow","mouth"]):return "face_candidate"
    if any(x in n for x in ["head","body","chest","torso","leg","arm","hand","foot"]):return "body_candidate"
    return "other_or_unclassified"
def audit_asset(file,expected):
    doc,buffer,raw=parse(file)
    gitsha=hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\0"+raw).hexdigest()
    if gitsha!=expected:raise ValueError("SOURCE IDENTITY FAILURE "+str(file)+" "+gitsha)
    R=Reader(doc,buffer);nodes=doc.get("nodes",[]);meshes=doc.get("meshes",[])
    skins=doc.get("skins",[]);mats=doc.get("materials",[]);anims=doc.get("animations",[])
    pmap=parents_for(nodes);alljoints=set()
    parts=[];node_rows=[];joint_rows=[];anim_rows=[];mat_rows=[];issues=[]
    for sid,sk in enumerate(skins):
        ibms=R.read(sk["inverseBindMatrices"]) if "inverseBindMatrices" in sk else []
        if ibms and len(ibms)!=len(sk["joints"]):issues.append("Inverse bind count mismatch")
        for jid,ni in enumerate(sk["joints"]):
            if ni>=len(nodes):raise ValueError("Bad joint index")
            alljoints.add(ni);n=nodes[ni]
            joint_rows.append({"file":file.name,"skin":sid,"joint":jid,"node":ni,"name":n.get("name",""),
             "path":path_for(ni,nodes,pmap),"parent":nodes[pmap[ni]].get("name","") if ni in pmap else "",
             "translation":json.dumps(n.get("translation",[0,0,0])),
             "rotation":json.dumps(n.get("rotation",[0,0,0,1])),
             "scale":json.dumps(n.get("scale",[1,1,1])),
             "inverse_bind":json.dumps([rnd(v) for v in ibms[jid]]) if ibms else "NOT_EXPLICIT"})
    for i,n in enumerate(nodes):
        node_rows.append({"file":file.name,"index":i,"name":n.get("name",""),
          "path":path_for(i,nodes,pmap),"mesh":n.get("mesh",""),"skin":n.get("skin",""),
          "parent":pmap.get(i,""),"joint":i in alljoints,
          "translation":json.dumps(n.get("translation",[0,0,0])),
          "rotation":json.dumps(n.get("rotation",[0,0,0,1])),
          "scale":json.dumps(n.get("scale",[1,1,1])),
          "matrix":json.dumps(n.get("matrix",[]))})
        if "mesh" not in n:continue
        sk=n.get("skin");mesh=meshes[n["mesh"]];nm=n.get("name",mesh.get("name",""))
        for pi,prim in enumerate(mesh["primitives"]):
            attrs=prim.get("attributes",{})
            if "POSITION" not in attrs:raise ValueError("Primitive missing position "+nm)
            pos=R.read(attrs["POSITION"])
            if not pos:raise ValueError("Empty primitive "+nm)
            inds=R.read(prim["indices"]) if "indices" in prim else None
            material_index=prim.get("material",-1)
            material=mats[material_index].get("name","") if 0<=material_index<len(mats) else ""
            influencer=collections.Counter();invalid=0;outliers=0;hasweights=False
            if sk is not None and "JOINTS_0" in attrs and "WEIGHTS_0" in attrs:
                joins=[R.read(attrs[k]) for k in ("JOINTS_0","JOINTS_1") if k in attrs]
                weights=[R.read(attrs[k]) for k in ("WEIGHTS_0","WEIGHTS_1") if k in attrs]
                for vi in range(len(pos)):
                    total=0
                    for js,ws in zip(joins,weights):
                        for ji,w in zip(js[vi],ws[vi]):
                            if w>0.000001:
                                hasweights=True;total+=w
                                if ji>=len(skins[sk]["joints"]):invalid+=1
                                else:influencer[nodes[skins[sk]["joints"][int(ji)]].get("name",str(ji))]+=1
                    if total>.000001 and abs(total-1)>.04:outliers+=1
            elif sk is not None:issues.append("Missing skin weights: "+nm)
            parts.append({"file":file.name,"node":i,"path":path_for(i,nodes,pmap),
             "mesh_index":n["mesh"],"primitive":pi,"name":nm,"classification_hint":group(nm),
             "skin_index":sk if sk is not None else "","material":material,
             "vertices":len(pos),"triangles":(len(inds) if inds else len(pos))//3 if prim.get("mode",4)==4 else 0,
             "min_xyz":json.dumps([rnd(min(p[k] for p in pos)) for k in range(3)]),
             "max_xyz":json.dumps([rnd(max(p[k] for p in pos)) for k in range(3)]),
             "morph_targets":len(prim.get("targets",[])),"attributes":json.dumps(sorted(attrs)),
             "has_weights":hasweights,"weight_sum_outliers":outliers,"invalid_joint_refs":invalid,
             "influencing_joints":json.dumps(dict(influencer.most_common())),
             "compatibility":"STATIC_ONLY_NOT_RUNTIME_VERIFIED"})
    for i,mat in enumerate(mats):
        pbr=mat.get("pbrMetallicRoughness",{})
        mat_rows.append({"file":file.name,"material_index":i,"name":mat.get("name",""),
            "baseColor":json.dumps(pbr.get("baseColorFactor",[1,1,1,1])),
            "metallic":pbr.get("metallicFactor",1),"roughness":pbr.get("roughnessFactor",1),
            "has_base_texture":"baseColorTexture" in pbr,"alphaMode":mat.get("alphaMode","OPAQUE"),
            "doubleSided":mat.get("doubleSided",False)})
    for ai,animation in enumerate(anims):
        for channel in animation.get("channels",[]):
            sampler=animation["samplers"][channel["sampler"]]
            keys=R.read(sampler["input"]);t=channel.get("target",{})
            nodeid=t.get("node");nn=nodes[nodeid].get("name","") if nodeid is not None and nodeid<len(nodes) else "UNKNOWN"
            anim_rows.append({"file":file.name,"clip":animation.get("name",str(ai)),"clip_index":ai,
                "target_node":nn,"target_path":t.get("path",""),
                "keyframes":len(keys),"start_s":rnd(keys[0][0]) if keys else "",
                "end_s":rnd(keys[-1][0]) if keys else "",
                "interpolation":sampler.get("interpolation","LINEAR")})
    summ={"file":file.name,"bytes":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),
      "git_sha":gitsha,"nodes":len(nodes),"scene_count":len(doc.get("scenes",[])),
      "meshes":len(meshes),"mesh_primitives":len(parts),
      "triangles":sum(x["triangles"] for x in parts),"materials":len(mats),
      "skins":len(skins),"unique_joint_nodes":len(alljoints),
      "joint_names":sorted(nodes[j].get("name","") for j in alljoints),
      "clips":len(anims),"clip_names":[x.get("name","") for x in anims],
      "animation_channels":len(anim_rows),"morph_targets":sum(x["morph_targets"] for x in parts),
      "weight_sum_outliers":sum(x["weight_sum_outliers"] for x in parts),
      "invalid_joint_refs":sum(x["invalid_joint_refs"] for x in parts),
      "warnings":issues}
    return summ,parts,node_rows,joint_rows,anim_rows,mat_rows

def csvout(p,rows):
    if not rows:return
    with p.open("w",newline="",encoding="utf-8") as f:
        wr=csv.DictWriter(f,fieldnames=list(rows[0]));wr.writeheader();wr.writerows(rows)
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",type=pathlib.Path,required=True)
    ap.add_argument("--out",type=pathlib.Path,required=True)
    ap.add_argument("--manifest",type=pathlib.Path,required=True)
    ar=ap.parse_args();ar.out.mkdir(parents=True,exist_ok=True)
    manifest=json.loads(ar.manifest.read_text());summaries=[]
    collections_all=[[],[],[],[],[]]
    for name,gitsha in manifest.items():
        s,*groups=audit_asset(ar.source/name,gitsha);summaries.append(s)
        for b,new in zip(collections_all,groups):b.extend(new)
        print("OFFICIAL_ASSET_VERIFIED",name,"meshes",s["mesh_primitives"],
          "joints",s["unique_joint_nodes"],"clips",s["clips"],
          "weight_warnings",s["weight_sum_outliers"],"invalid_refs",s["invalid_joint_refs"])
    for name,rows in zip(["all_meshes.csv","all_nodes.csv","all_joints.csv","all_animation_channels.csv","all_materials.csv"],collections_all):
        csvout(ar.out/name,rows)
    modular=next(x for x in summaries if x["file"]=="warrior_modular.glb")
    knight=next(x for x in summaries if x["file"]=="knight.glb")
    common=set(modular["joint_names"])&set(knight["joint_names"])
    diff={"shared_joint_names":sorted(common),"same_joint_name_set":set(modular["joint_names"])==set(knight["joint_names"]),
      "modular_only":sorted(set(modular["joint_names"])-set(knight["joint_names"])),
      "knight_only":sorted(set(knight["joint_names"])-set(modular["joint_names"]))}
    (ar.out/"joint_diff.json").write_text(json.dumps(diff,indent=2,ensure_ascii=False))
    (ar.out/"asset_summary.json").write_text(json.dumps(summaries,indent=2,ensure_ascii=False))
    lines=["# HIGHFLY — OFFICIAL CHARACTER TRUTH: STATIC AUDIT",
     "","SOURCE-ONLY PHASE: original GLBs checked against exact Git blob hashes; absolutely no model edited.",
     "","Source: ClaudeCraft levy-street/world-of-claudecraft @ 9b57e49c9676d75962700f828cc00a50a9a988b5.",
     "Game reference: PF-6 RUN 333 @ 312fe2e67219415a73a56303fcbd3b0bd9f62273.",
     "Foundation C2.8.2 @ 60daa3808573dbd2d05f5ade59fb0fe59254581a.",
     "Creator Lab RUN 33 @ 3945cbec93a8dbfe69e92b5e49613edadc4ed771.",
     "","| Real original | Primitives | Joint nodes | Clips | Materials |",
     "|---|---:|---:|---:|---:|"]
    for s in summaries:lines.append("| "+s["file"]+" | "+str(s["mesh_primitives"])+" | "+str(s["unique_joint_nodes"])+" | "+str(s["clips"])+" | "+str(s["materials"])+" |")
    lines+=["","## Verified structure","",
      "Modular vs Knight identical joint name sets: "+str(diff["same_joint_name_set"])+". Shared names: "+str(len(common))+".",
      "Joint-name matching alone is NOT proof of identical bind-pose, rest axes, skin deformations or sockets.",
      "All native mesh primitives, node hierarchies, inverse bind matrices, materials, morphology, vertex weight influences and animation channels are exported to CSV.",
      "Group classifications are name-based hints only; runtime equip/replace behavior is not verified.",
      "","## Compatibility matrix: current permission BEFORE movement testing",
      "","| Work | Static evidence | Decision |","|---|---|---|",
      "| Read or recolor original material | Indexed, but renderer dye policy must be checked | CONDITIONAL |",
      "| Rigid attachment to verified bone | Joint recorded; clearance not yet proven | REVIEW REQUIRED |",
      "| Replacement of a skinned limb or torso | Weights indexed; joint-motion test pending | BLOCKED |",
      "| Add helmet based only on head bounding box | Insufficient anatomical/visual conformity | BLOCKED |",
      "| Delete/relabel bone, change rig or native animation | Original game must be preserved | FORBIDDEN |",
      "| Modify PF6/Foundation/public Creator Lab | Protected during audit | FORBIDDEN |",
      "","## NOT validated by this read-only report",
      "",
      "Runtime composition by class/gender, armor masking, UV seam aesthetics, LOD, collision, clipping through animations, dash, jump, parry, weapons, performance on S23.",
      "These require a future isolated animation/renderer evaluation, no claim of a full GREEN.",
      ""]
    (ar.out/"TRUTH_REPORT.md").write_text("\n".join(lines),encoding="utf-8")
    for s in summaries:
        if s["invalid_joint_refs"]:raise ValueError("Invalid joint references "+s["file"])
    print("HIGHFLY_CHARACTER_STATIC_AUDIT_GREEN=1",len(collections_all[0]),"primitives",len(collections_all[2]),"skin_joint_rows",len(collections_all[3]),"animation_channels")
if __name__=="__main__":main()
