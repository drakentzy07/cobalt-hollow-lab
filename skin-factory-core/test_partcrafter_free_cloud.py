#!/usr/bin/env python3
"""R0.4 Offline safe-package and notebook regression tests. 
Synthetic test meshes are NEVER candidate game armor.
"""
import ast,hashlib,io,json,subprocess,sys,tempfile,zipfile
from pathlib import Path
import trimesh
from partcrafter_bundle_gate import inspect_bundle,GateError
ROOT=Path(__file__).resolve().parent

def part_mesh(i):
    # Test geometry ONLY: cannot be published as actual armor.
    m=trimesh.creation.icosphere(subdivisions=1,radius=1+.12*i)
    m.apply_translation((i*.4,0,0))
    return m
def make_zip(path,alter=None):
    alter=alter or {}
    meshes={f'part_{i:02}.glb':trimesh.Scene(part_mesh(i)).export(file_type='glb') for i in range(4)}
    scene=trimesh.Scene()
    for i in range(4):scene.add_geometry(part_mesh(i),node_name=f'TEST_GENERIC_{i}')
    meshes['object.glb']=scene.export(file_type='glb')
    manifest={'num_parts':4,'parts':[{'index':i,'file':f'part_{i:02}.glb'} for i in range(4)],
              'composite_file':'object.glb'}
    meta={'schema':'highfly.partcrafter.raw-3d/v1','provider':'PartCrafter MIT test fixture',
          'generatedParts':4,'riggedToClaudeCraft':False,'artApproved':False,
          'fileSha256':{name:hashlib.sha256(raw).hexdigest() for name,raw in meshes.items()}}
    data={**meshes,'manifest.json':json.dumps(manifest).encode(),
          'highfly-provenance.json':json.dumps(meta).encode()}
    data.update(alter)
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
        for name,raw in data.items():z.writestr(name,raw)
def reject(path,expected):
    try:inspect_bundle(path)
    except GateError as e:
        assert expected in str(e),(expected,str(e))
        return
    raise AssertionError('BAD_GENERATIVE_PACKAGE_NOT_REJECTED '+expected)
def test_notebook():
    nb=json.loads((ROOT/'HIGHFLY_PartCrafter_Gratis_R04.ipynb').read_text(encoding='utf-8'))
    assert nb['nbformat']==4 and len(nb['cells'])>=7
    codes=[''.join(x.get('source',[])) for x in nb['cells'] if x['cell_type']=='code']
    for n,code in enumerate(codes):ast.parse(code,filename=f'cell_{n}')
    raw='\n'.join(codes)
    for marker in ['torch.cuda.is_available','3d773bf02fad51c7ab31a5615573fec93b287b30',
      'part_*.glb','--num_inference_steps','--image_path','uploaded=files.upload()','new_a','new_b','files.download']:
        assert marker in raw,marker
    # Colab Python 3.13 != Python compatible con PyTorch 2.5.1.
    assert 'uv' in raw and 'python", "install", "3.11' in raw, 'MISSING_COLAB_PY313_ISOLATED_PY311_FIX'
    assert 'pc_python = venv_path / "bin/python"' in raw, 'MISSING_ISOLATED_INFERENCE_RUNTIME'
    assert 'cmd=[str(pc_python)' in raw, 'INFERENCE_MUST_RUN_WITH_PY311'
    assert '"torch==2.5.1"' in raw and 'torch-cluster' in raw, 'WRONG_UPSTREAM_CUDA_STACK'
    assert 'apt-get' not in raw.split('if not root.exists():')[1], 'UNNECESSARY_APT_PACKAGE_INSTALL_BLOCKS_COLAB'
    assert 'from src.pipelines.pipeline_partcrafter import PartCrafterPipeline' in raw, 'NOT_SMOKE_TESTING_REAL_INFERENCE_IMPORT'
    # No llamar cuentas comerciales o VLM durante la generación.
    actual_cmd=raw.split('cmd=[str(pc_python)')[1].split('assert "--rmbg"')[0]
    for forbidden in ('--part_suggest','--style_transfer','--rmbg'):
        assert forbidden not in actual_cmd, forbidden
    print('HIGHFLY_R04_FREE_GPU_NOTEBOOK_SYNTAX_AND_PAYWALL_GATES_GREEN')
def main():
    test_notebook()
    with tempfile.TemporaryDirectory() as d:
        path=Path(d)/'test.zip'
        make_zip(path)
        good=inspect_bundle(path)
        assert good['parts']==4 and good['totalPartTriangles']>120
        assert good['readyForGameplay'] is False and good['rigged'] is False
        print('HIGHFLY_R04_OFFLINE_GOOD_RAW_GEOMETRY_GATE_GREEN')
        make_zip(path,{'../untrusted.bin':b'oops'})
        reject(path,'ZIP_UNSAFE')
        make_zip(path,{'part_01.glb':b'not_glb'})
        reject(path,'MODEL_SHA256_CHANGED')
        make_zip(path,{'extras.txt':b'not authorized'})
        reject(path,'INCOMPLETE_OR_EXTRA')
        print('HIGHFLY_R04_BAD_ZIP_TRAVERSAL_AND_CORRUPTION_REJECTED')
if __name__=='__main__':main()
