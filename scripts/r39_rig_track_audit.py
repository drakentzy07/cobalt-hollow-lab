#!/usr/bin/env python3
"""R39A preparatory read-only rig/animation track audit. No visual modifications."""
import json,struct,sys
from pathlib import Path

def inspect(path:Path):
    raw=path.read_bytes()
    if len(raw)<20:raise ValueError(f"R39_GLB_TOO_SMALL:{path}")
    magic,version,length=struct.unpack_from("<4sII",raw,0)
    if magic!=b"glTF" or version!=2 or length!=len(raw):
        raise ValueError(f"R39_NOT_GLB2:{path}")
    offset=12;doc=None
    while offset+8<=len(raw):
        size,kind=struct.unpack_from("<II",raw,offset);offset+=8
        if size<0 or offset+size>len(raw):raise ValueError(f"R39_GLB_CHUNK:{path}")
        if kind==0x4E4F534A:
            doc=json.loads(raw[offset:offset+size].decode("utf8"))
        offset+=size
    if doc is None:raise ValueError("R39_NO_GLTF_JSON")
    nodes=doc.get("nodes",[])
    animations=doc.get("animations",[])
    track_nodes=set()
    tracks=[]
    for anim in animations:
        for channel in anim.get("channels",[]):
            target=channel.get("target",{})
            i=target.get("node")
            if isinstance(i,int) and 0<=i<len(nodes):
                track_nodes.add(i)
                tracks.append((nodes[i].get("name",f"#{i}"),target.get("path","?")))
    names=[str(n.get("name","")) for n in nodes]
    return {
        "file":path.name,
        "bytes":len(raw),
        "skinCount":len(doc.get("skins",[])),
        "animationCount":len(animations),
        "animationNames":[str(a.get("name","")) for a in animations],
        "nodeCount":len(nodes),
        "sampleNodeNames":names[:35],
        "rigMediumPresent":any("Rig_Medium" in n for n in names),
        "animatedNodeNames":sorted({names[i] for i in track_nodes}),
        "trackTargets":len(tracks),
        "sampleTrackPaths":[f"{n}.{t}" for n,t in tracks[:35]],
    }

def main():
    paths=[Path(x) for x in sys.argv[1:]]
    if not paths:raise SystemExit("R39_NO_FILES")
    data=[inspect(p) for p in paths]
    base=next((v for v in data if v["file"]=="warrior_modular.glb"),None)
    if not base:raise SystemExit("R39_NO_CORE_MODULAR")
    if base["skinCount"]<1 or base["animationCount"]<18 or not base["rigMediumPresent"]:
        raise SystemExit("R39_ORIGINAL_KAYKIT_RIG_OR_CLIPS_DRIFT")
    for d in data:
        if d["animationCount"]<1:raise SystemExit("R39_DONOR_ANIMATIONS_MISSING:"+d["file"])
    coreTrackNames=set(base["animatedNodeNames"])
    for d in data:
        if d is base:continue
        d["trackNodeOverlapCore"]=len(coreTrackNames.intersection(d["animatedNodeNames"]))
        d["trackNodeUnknown"]=[x for x in d["animatedNodeNames"] if x not in coreTrackNames][:40]
    Path("r39-rig-track-inventory.json").write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n")
    for x in data:
        print("HIGHFLY_R39_RIG_TRACK_AUDIT",x["file"],
              "skins",x["skinCount"],"anims",x["animationCount"],
              "tracks",x["trackTargets"],
              "commonNodes",x.get("trackNodeOverlapCore","base"))
    print("HIGHFLY_R39_CORE_TRACK_NODES="+",".join(base["animatedNodeNames"]))
    print("HIGHFLY_R39_CORE_CLIPS="+",".join(base["animationNames"]))
    print("HIGHFLY_R39_CORE_TRACK_SAMPLES="+",".join(base["sampleTrackPaths"]))
    print("HIGHFLY_R39_A_RIG_TRACK_PREAUDIT_GREEN=1")
if __name__=="__main__":main()
