#!/usr/bin/env python3
"""HIGHFLY PartCrafter safe raw-GLB package intake, NO false wearable claim.
Strictly verify user-supplied multipart 3D result before ANY Blender rebind.
Uses trimesh offline (CPU); never calls external APIs or uploads user artwork.
"""
import argparse, hashlib, json, math, re, sys, zipfile
from pathlib import Path
from io import BytesIO
import trimesh
SCHEMA='highfly.partcrafter.raw-3d/v1'
PART_RE=re.compile(r'^part_(\d\d)\.glb$')
TOTAL_CAP=100_000_000
FILE_CAP=45_000_000
class GateError(Exception): pass
def require(test,why):
    if not test:raise GateError(why)
def load_json(raw,label):
    try:obj=json.loads(raw)
    except Exception as e:raise GateError('INVALID_JSON_'+label) from e
    require(isinstance(obj,dict),'INVALID_JSON_OBJECT_'+label)
    return obj
def glb_mesh(raw,name):
    require(len(raw)>=40 and len(raw)<=FILE_CAP,'GLB_SIZE_INVALID_'+name)
    require(raw[:4]==b'glTF' and int.from_bytes(raw[4:8],'little')==2 and int.from_bytes(raw[8:12],'little')==len(raw),
      'GLB_SIGNATURE_OR_SIZE_INVALID_'+name)
    try:scene=trimesh.load(BytesIO(raw),file_type='glb',force='scene',process=False)
    except Exception as e:raise GateError('GLB_IMPORT_FAILURE_'+name+':'+str(e)[:220]) from e
    require(isinstance(scene,trimesh.Scene) and len(scene.geometry)>0,'NOT_A_3D_SCENE_'+name)
    nfaces=0,nverts=0
    for key,geo in scene.geometry.items():
        require(isinstance(geo,trimesh.Trimesh),'NON_TRIANGULATED_MESH_'+name)
        v,f=geo.vertices,geo.faces
        require(len(v)>=20 and len(f)>=10,'EMPTY_OR_DUMMY_MESH_'+name)
        require(bool(__import__('numpy').isfinite(v).all()),'NONFINITE_POSITION_'+name)
        size=v.max(axis=0)-v.min(axis=0)
        require(float(size.max())>0.005 and float(size.max())<1000,'BAD_GEOMETRY_BOUNDS_'+name)
        nverts+=len(v);nfaces+=len(f)
    return {'name':name,'meshCount':len(scene.geometry),'vertices':nverts,'triangles':nfaces,
      'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
def inspect_bundle(bundle):
    p=Path(bundle)
    require(p.is_file() and p.stat().st_size<=TOTAL_CAP,'ZIP_ABSENT_OR_TOO_LARGE')
    try:z=zipfile.ZipFile(p)
    except Exception as e:raise GateError('INVALID_ZIP') from e
    with z:
        entries=z.infolist()
        require(len(entries)>=5 and len(entries)<=20,'ZIP_FILE_COUNT_INVALID')
        require(all(not x.is_dir() and not x.filename.startswith(('/','\\')) and
          '/' not in x.filename and '\\' not in x.filename and x.file_size<=FILE_CAP
          and x.compress_size<=FILE_CAP for x in entries),'ZIP_UNSAFE_PATH_OR_BYTES')
        require(sum(x.file_size for x in entries)<=TOTAL_CAP,'ZIP_EXPANDED_LIMIT')
        names=[e.filename for e in entries]
        require(len(names)==len(set(names)),'ZIP_DUPLICATE_NAMES')
        require(set(['object.glb','manifest.json','highfly-provenance.json']).issubset(names),'MISSING_GENERATOR_EXPORTS')
        manifest=load_json(z.read('manifest.json'),'manifest')
        prov=load_json(z.read('highfly-provenance.json'),'provenance')
        require(prov.get('schema')==SCHEMA and prov.get('provider','').startswith('PartCrafter'),'PROVENANCE_MODEL_NOT_CONFIRMED')
        require(prov.get('riggedToClaudeCraft') is False and prov.get('artApproved') is False,
          'RAW_3D_CANNOT_CLAIM_WEARABLE_OR_ART_APPROVAL')
        n=manifest.get('num_parts')
        require(type(n) is int and 2<=n<=16,'INVALID_PART_COUNT')
        parts=[f'part_{i:02}.glb' for i in range(n)]
        require(set(names)==set([*parts,'object.glb','manifest.json','highfly-provenance.json']),
          'INCOMPLETE_OR_EXTRA_EXPORTS')
        require(prov.get('generatedParts')==n,'PROVENANCE_PART_COUNT_MISMATCH')
        require(manifest.get('composite_file')=='object.glb','COMPOSITE_FILE_WRONG')
        require([x.get('file') for x in manifest.get('parts',[])]==parts,
          'PART_FILENAME_MAPPING_MISMATCH')
        digests=prov.get('fileSha256',{})
        mesh_stats=[]
        for name in ['object.glb',*parts]:
            raw=z.read(name)
            sha=hashlib.sha256(raw).hexdigest()
            require(digests.get(name)==sha,'MODEL_SHA256_CHANGED_'+name)
            mesh_stats.append(glb_mesh(raw,name))
        # Empty/dummy geometry from a generative decoder is rejected.
        total=sum(x['triangles'] for x in mesh_stats[1:])
        require(total>=120,'PARTS_NOT_SUBSTANTIVE_3D')
        return {'schema':'highfly.partcrafter.intake-qa/v1','source':'real PartCrafter generated bundle',
          'stage':'raw-unrigged','parts':n,'meshSummaries':mesh_stats,
          'totalPartTriangles':total,'licenseReviewRequired':True,
          'bodySlotsMapped':False,'fittingCompleted':False,'rigged':False,
          'faithfulToReference':False,'readyForGameplay':False,
          'nextAction':'Inspect whole object and part coverage; assign human-approved slots before adapting into original Warrior rig'}
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('zipfile',type=Path)
    parser.add_argument('--report',type=Path)
    args=parser.parse_args()
    try:
        report=inspect_bundle(args.zipfile)
        if args.report:
            args.report.parent.mkdir(parents=True,exist_ok=True)
            args.report.write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
        print('HIGHFLY_PARTCRAFTER_REAL_MULTIPART_INTAKE_GREEN '+json.dumps(
           {'parts':report['parts'],'tris':report['totalPartTriangles']},ensure_ascii=False))
    except Exception as e:
        print('HIGHFLY_PARTCRAFTER_RAW_3D_REJECTED '+str(e),file=sys.stderr)
        sys.exit(1)
if __name__=='__main__':main()
