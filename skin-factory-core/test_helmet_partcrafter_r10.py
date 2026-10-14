#!/usr/bin/env python3
"""R1.0 Casco: offline validation; does NOT fake GPU generation or approved helmet."""
import ast,json,hashlib,zipfile,io,tempfile
from pathlib import Path
import numpy as np,trimesh
from partcrafter_bundle_gate import inspect_bundle
HERE=Path(__file__).resolve().parent
PATH=HERE/"HIGHFLY_OBSIDIAN_HELMET_AUTO_R10_FREE.ipynb"

def check_notebook():
    notebook=json.loads(PATH.read_text(encoding='utf-8'))
    assert notebook["nbformat"]==4
    codes=[c for c in notebook["cells"] if c["cell_type"]=="code"]
    assert len(codes)==1,"DO_NOT_SPLIT_USER_ACTIONS"
    code="".join(codes[0]["source"])
    ast.parse(code,filename=str(PATH))
    for marker in (
      'TAG="highfly_obsidian_helmet_only"',
      'HIGHFLY_OBSIDIAN_HELMET_ONLY_RAW3D.zip',
      '"--num_parts","1"', '"--num_tokens","1024"',
      '"--num_inference_steps","50"',
      '[TARGET/"part_00.glb"]',
      'manifest.get("num_parts")!=1',
      'files.upload()', 'files.download(str(ZIP))',
      'PYTHONPATH', 'verify_partcrafter_patches()', 'torch.cuda.is_available()',
      '"intendedSlot":"M_Head"', '"helmetShapeApproved":False',
      '"riggedToClaudeCraft":False'
    ):
      assert marker in code,marker
    invocation=code.split('cmd=[PY,"scripts/inference_partcrafter.py"')[1].split('assert all(flag not in cmd')[0]
    for forbidden in ('--rmbg','--render','--part_suggest','--style_transfer'):
      assert forbidden not in invocation
    assert 'run(["apt-get"' not in code
    assert 'subprocess.Popen' in code
    assert '"torch==2.5.1"' in code and 'diffusers==0.34.0' in code
    print("HIGHFLY_HELMET_R10_NOTEBOOK_ONE_CLICK_CPU_SYNTAX_FREE_SOFTWARE_GREEN")

def check_one_part_validation():
    meshes={}
    m=trimesh.creation.icosphere(subdivisions=3)
    meshes['part_00.glb']=trimesh.Scene(m).export(file_type='glb')
    meshes['object.glb']=trimesh.Scene(m).export(file_type='glb')
    manifest={'num_parts':1,'parts':[{'index':0,'file':'part_00.glb'}],'composite_file':'object.glb'}
    prov={'schema':'highfly.partcrafter.raw-3d/v1',
          'provider':'PartCrafter helmet-only experimental, no credit API',
          'generatedParts':1,'riggedToClaudeCraft':False,'artApproved':False,
          'fileSha256':{k:hashlib.sha256(v).hexdigest() for k,v in meshes.items()}}
    blobs={**meshes,'manifest.json':json.dumps(manifest).encode(),
           'highfly-provenance.json':json.dumps(prov).encode()}
    with tempfile.TemporaryDirectory() as tmp:
      p=Path(tmp)/'synthetic-test.zip'
      with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED) as z:
        for k,v in blobs.items():z.writestr(k,v)
      r=inspect_bundle(p)
      assert r['parts']==1 and r['rigged'] is False and r['readyForGameplay'] is False
      assert r['meshSummaries'][1]['triangles']>100
      print("HIGHFLY_HELMET_R10_SINGLE_PART_INTRODUCTION_GATE_GREEN_TEST_GEOMETRY_ONLY")

if __name__=="__main__":
    check_notebook();check_one_part_validation()
