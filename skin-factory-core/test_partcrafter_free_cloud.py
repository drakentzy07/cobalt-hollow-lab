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
    assert nb['nbformat']==4 and len(nb['cells'])==2
    codes=[''.join(x.get('source',[])) for x in nb['cells'] if x['cell_type']=='code']
    assert len(codes)==1, 'USER_MUST_RUN_ALL_ONCE'
    raw=codes[0]
    ast.parse(raw,filename='highfly_one_click_colab.py')
    for marker in (
        'torch.cuda.is_available', '3d773bf02fad51c7ab31a5615573fec93b287b30',
        'python","install","3.11', 'torch==2.5.1', 'torch-cluster',
        'uploaded=files.upload()', 'optional_imports', 'HIGHFLY_R06_RMBG_DISABLED',
        '--num_inference_steps', '--image_path', 'part_*.glb',
        'highfly-provenance.json', 'files.download(str(ZIP))', 'HIGHFLY ERROR REAL EN ETAPA:'
    ):
        assert marker in raw, marker
    assert 'run(["apt-get"' not in raw, 'FAIL_100_APT_GET_MUST_NOT_RECUR'
    assert 'subprocess.Popen' in raw and 'stderr=subprocess.STDOUT' in raw, 'MUST_SURFACE_HIDDEN_CHILD_ERROR'
    assert 'transformers==4.52.4' in raw and 'diffusers==0.34.0' in raw, 'MUST_PIN_PIP_LIBRARIES'
    assert 'HIGHFLY_R06_NO_RENDER' in raw and 'HIGHFLY_R06_OPTIONAL_IMPORT_DISABLED' in raw, 'OPTIONAL_IMPORTS_STILL_ACTIVE'
    assert "BitImageProcessor, Dinov2Model" in raw, 'NOT_TESTING_REAL_IMPORT'
    assert 'pin_marker' in raw, 'PINNING_MUST_BE_REUSABLE'
    assert 'env["PYTHONPATH"]=str(ROOT)' in raw, 'INFERENCE_NEEDS_REPOSITORY_PYTHONPATH'
    assert 'bash","settings/setup.sh"' not in raw, 'OFFICIAL_SETUP_CONTAINS_APT_GET'
    # Ningún servicio de crédito ni eliminación RMBG se invoca durante la generación.
    segment=raw.split('cmd=[PY,"scripts/inference_partcrafter.py"')[1].split('assert all(flag not in cmd')[0]
    for forbidden in ('--part_suggest','--style_transfer','--rmbg','--render'):
        assert forbidden not in segment, forbidden
    # Repo pinned + semántica real de salida: compuesto + 4 partes + manifest, zip.
    assert 'manifest.get("num_parts")!=4' in raw
    assert 'GEOMETRIA_VACIA_O_DUMMY' in raw
    assert '"riggedToClaudeCraft":False' in raw
    assert 'RMBG-1.4' in raw
    print('HIGHFLY_R06_ONE_CLICK_NOTEBOOK_SYNTAX_STREAMED_ERROR_AND_PINNED_CUDA_GATES_GREEN')
def test_patching_safe():
    # Se prueba de verdad la reescritura del script oficial usando un fixture
    # mínimo de las sentencias que se modifican (sin modelos ni créditos).
    nb=json.loads((ROOT/'HIGHFLY_PartCrafter_Gratis_R04.ipynb').read_text(encoding='utf-8'))
    code=''.join(nb['cells'][1]['source'])
    tree=ast.parse(code)
    fn=next(x for x in tree.body if isinstance(x,ast.FunctionDef) and x.name=='verify_partcrafter_patches')
    func_code=ast.get_source_segment(code,fn)
    with tempfile.TemporaryDirectory() as tmp:
        root=Path(tmp)
        source=root/'scripts'/'inference_partcrafter.py'
        source.parent.mkdir()
        initial='''from src.utils.render_utils import render_views_around_mesh, render_normal_views_around_mesh, make_grid_for_images_or_videos, export_renderings
from src.utils.image_utils import prepare_image
from src.models.briarmbg import BriaRMBG
    snapshot_download(repo_id="briaai/RMBG-1.4", local_dir=rmbg_weights_dir)
    rmbg_net = BriaRMBG.from_pretrained(rmbg_weights_dir).to(device)
    rmbg_net.eval()
    args = parser.parse_args()
    if args.render:
        print("ignored")
'''
        namespace={'ROOT':root}
        exec(func_code,namespace)
        source.write_text(initial,encoding='utf-8')
        namespace['verify_partcrafter_patches']()
        after=source.read_text(encoding='utf-8')
        assert 'from src.utils.render_utils import' in after and 'HIGHFLY_R06_OPTIONAL_IMPORT_DISABLED' in after
        assert 'if False and args.render:  # HIGHFLY_R06_NO_RENDER' in after
        assert 'RMBG_MODEL_DISABLED' in after
        assert 'HIGHFLY gratuito: render, RMBG y servicios VLM deshabilitados' in after
        namespace['verify_partcrafter_patches']()
        assert source.read_text(encoding='utf-8')==after, 'PATCH_NOT_IDEMPOTENT'
        print('HIGHFLY_R06_REAL_SOURCE_PATCH_SIMULATED_IDEMPOTENT_GREEN')

def main():
    test_notebook()
    test_patching_safe()
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
