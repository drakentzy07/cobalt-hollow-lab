#!/usr/bin/env python3
"""Verify *notebook code*, not actual Character Factory GPU generation."""
import ast, json, pathlib, re
P=pathlib.Path(__file__).with_name("HIGHFLY_CharacterFactory_AUTO_R01_FREE.ipynb")
def main():
    notebook=json.loads(P.read_text(encoding="utf-8"))
    assert notebook["nbformat"]==4
    cells=[c for c in notebook["cells"] if c["cell_type"]=="code"]
    assert len(cells)==1,"one-click setup cannot require manual patch cells"
    src="".join(cells[0]["source"])
    ast.parse(src,filename=P.name)
    required=[
      "379b59f1b40172aa318cf0f67d3529ded255f8ac",
      '"character-factory/character-factory"',
      "https://github.com/character-factory/character-factory.git",
      'run([uv,"python","install","3.11"]',
      "torch.cuda.is_available()",
      "disk_free<60",
      "remaining<43",
      'env=cleanenv',
      'run([BIN,"preflight"]',
      'run([BIN,"make",PROMPT',
      'files.download(str(ZIP))',
      '"characterFactoryRig":"MHR with 127 joints (NOT ClaudeCraft Rig_Medium)"',
      '"armorWearableGenerated":False',
      '"validatedOnWarrior":False',
      '"commercialCreditAPIUsed":False',
      '"scene.glb"','"character.char.json"','"highfly-probe-report.json"',
      "HIGHFLY FALLÓ EN:"
    ]
    for k in required:
        assert k in src,"MISSING_PROTECTION:"+k
    assert not re.search(r'run\(\[\s*BIN\s*,\s*"serve"',src)
    assert "CHARACTER_FACTORY_INTERPRETER_ENDPOINT" in src
    assert not re.search(r'requests\.post\(',src)
    assert 'No se generó una armadura compatible.' in src
    assert not any("premium" in x.lower() for x in ["".join(c.get("source",[])) for c in cells])
    print("HIGHFLY_CHARACTERFACTORY_R01_ONE_CLICK_FREE_CUDA_DISK_GATE_CPU_GREEN")
    print("HIGHFLY_CHARACTERFACTORY_R01_REAL_GPU_MODEL_DOWNLOAD_AND_GENERATION_NOT_RUN=1")
if __name__=="__main__":main()
