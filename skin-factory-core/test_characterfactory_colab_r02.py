"""HIGHFLY CF R0.2. Code/preflight checks; no claim of a successful T4 inference."""
from pathlib import Path
import json,ast
p=Path(__file__).with_name("HIGHFLY_CharacterFactory_AUTO_R02_FREE.ipynb")
n=json.loads(p.read_text(encoding="utf-8"))
assert n["nbformat"]==4
cell=[x for x in n["cells"] if x["cell_type"]=="code"]
assert len(cell)==1
s="".join(cell[0]["source"])
ast.parse(s)
for k in [
"torch==2.6.0",
"https://download.pytorch.org/whl/cu124",
'constraints.write_text("torch==2.6.0',
"assert hasattr(torch,'accelerator') and torch.accelerator.is_available()",
'"pip","check"',
"import torch,diffusers,transformers",
'run([BIN,"preflight"]',
"disk_free<60","remaining<43",
'characterFactoryRig":"MHR with 127 joints (NOT ClaudeCraft Rig_Medium)"',
'"armorWearableGenerated":False',
'"commercialCreditAPIUsed":False',
"files.download(str(ZIP))",
]:
    assert k in s, f"MISSING {k}"
assert "torch==2.5.1" not in s
print("HIGHFLY_CF_R02_NOTEBOOK_SYNTAX_AND_TORCH_ACCELERATOR_GATE_GREEN")
print("HIGHFLY_CF_R02_CLOUD_GPU_INFERENCE_NOT_TESTED_IN_ACTIONS=1")
