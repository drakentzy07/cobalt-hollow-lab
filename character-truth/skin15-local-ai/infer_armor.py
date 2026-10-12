#!/usr/bin/env python3
"""HIGHFLY SKIN15: genuine local inference for text → armor design on GitHub CPU.
Qwen2.5 0.5B Q4_K_M Apache 2.0, llama-cpp-python. Not a full 3D AI model.
A model must actually load and generate a design, otherwise fail. No faux AI.
"""
import argparse, hashlib, json, os, re
from pathlib import Path
SCHEMA="highfly.skin15.local-ai-design/1"
OPTIONS={
 "theme":{"eclipse","dragon","celestial","samurai","nature","mechanical","shadow","royal"},
 "helmet":{"sealed","horned","crested","winged","masked"},
 "shoulders":{"crescent","scaled","layered","feathered","spiked"},
 "chest":{"gem","crest","sun","runes","plain"},
 "back":{"crystals","spine","cape","feathers","plates"},
 "shape":{"angular","curved","segmented"},
 "metal":{"obsidian","silver","gold","bronze","ivory"},
 "accent":{"violet","red","blue","cyan","green","gold"}
}
DEFAULT={
 "theme":"shadow","helmet":"sealed","shoulders":"layered","chest":"crest",
 "back":"plates","shape":"angular","metal":"obsidian","accent":"violet"
}
ALIASES={
 "dragonic":"dragon","draconic":"dragon","draconic horns":"horned",
 "horns":"horned","horn":"horned","black":"obsidian","dark":"obsidian",
 "blackmetal":"obsidian","no wings":"plates","wings":"feathers","wing":"winged",
 "crescent-shaped":"crescent","moon":"crescent","crystal":"crystals",
 "crystalline":"crystals","purple":"violet","electric":"cyan",
 "swordsman":"samurai","holy":"celestial","fantasy":"royal",
 "elegant":"curved","sacred":"sun","frost":"celestial",
}
def normalize_choice(key,value):
 if not isinstance(value,str):raise ValueError("NON_STRING_DECISION:"+key)
 v=value.strip().lower().replace("_"," ").replace("-"," ")
 v=ALIASES.get(v,v)
 if v not in OPTIONS[key]:
  # Reject invalid categorical model answers instead of inventing success.
  raise ValueError("UNKNOWN_MODEL_DECISION:"+key+":"+str(value))
 return v
def validate_decisions(result,expected_prompt):
 if not isinstance(result,dict):raise ValueError("NOT_AN_OBJECT")
 if not isinstance(expected_prompt,str) or len(expected_prompt.strip())<12:raise ValueError("BAD_USER_TEXT")
 out={}
 for key in OPTIONS:
  if key not in result:raise ValueError("MISSING_AI_DECISION:"+key)
  out[key]=normalize_choice(key,result[key])
 return out
def hashfile(path):
 h=hashlib.sha256()
 with open(path,'rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def build_design(parsed,prompt,model_path,raw):
 model_path=Path(model_path)
 actual=model_path.open('rb').read(4)
 if actual!=b"GGUF" or model_path.stat().st_size<300_000_000:
  raise RuntimeError("GGUF_MODEL_NOT_LOADED")
 choices=validate_decisions(parsed,prompt)
 return {
  "schema":SCHEMA,"name":"HIGHFLY · "+choices["theme"].upper()+" ORIGINAL",
  "source":"LOCAL_QWEN2_5_0_5B_REAL_INFERENCE",
  "model": "Qwen/Qwen2.5-0.5B-Instruct-GGUF:q4_k_m",
  "modelSizeBytes":model_path.stat().st_size,
  "modelSHA256":hashfile(model_path),
  "userPromptSHA256":hashlib.sha256(prompt.encode()).hexdigest(),
  "userPrompt":prompt,"inferenceText":raw,
  "decisions":choices,"newGeometryOnly":True,"artApproved":False,
  "imageSemanticsAnalyzed":False,
  "geometryGenerator":"Blender-parameterized-fresh-11-skinned-slot-armor",
  "humanArtApprovalRequired":True,"gameDeployAllowed":False
 }
def infer(model_path,prompt):
 try:from llama_cpp import Llama
 except ImportError as e:raise RuntimeError("LLAMA_CPP_RUNTIME_NOT_INSTALLED") from e
 engine=Llama(model_path=str(model_path),n_ctx=2048,n_threads=min(4,os.cpu_count() or 2),
    n_gpu_layers=0,verbose=False,seed=42)
 instruction="""You are an equipment design director for HIGHFLY fantasy RPG.
Analyze the user's armor request. Translate all languages, including Spanish.
Select EXACTLY one value from each category. Output a SINGLE valid JSON OBJECT.
Keys and allowed strings:
theme: eclipse, dragon, celestial, samurai, nature, mechanical, shadow, royal
helmet: sealed, horned, crested, winged, masked
shoulders: crescent, scaled, layered, feathered, spiked
chest: gem, crest, sun, runes, plain
back: crystals, spine, cape, feathers, plates
shape: angular, curved, segmented
metal: obsidian, silver, gold, bronze, ivory
accent: violet, red, blue, cyan, green, gold
Do not output explanations, Markdown, extra keys, or colors outside this list.
Prefer matching the actual user's description, not a preset.
Example: "Armadura de dragón rojo, cuernos, escamas de bronce, pecho con runas y espina dorsal" ->
{"theme":"dragon","helmet":"horned","shoulders":"scaled","chest":"runes","back":"spine","shape":"segmented","metal":"bronze","accent":"red"}
"""
 out=engine.create_chat_completion(messages=[
  {"role":"system","content":instruction},
  {"role":"user","content":"Analyze this independent original armor request:\n"+prompt}
 ],temperature=0.1,top_p=0.9,max_tokens=260,
 response_format={"type":"json_object"})
 raw=out["choices"][0]["message"]["content"] or ""
 raw=raw.strip()
 if raw.startswith("'```") or raw.startswith("```"):
  raw=raw.strip("`").strip().removeprefix("json").strip()
 # JSON mode must have produced a real object.
 return json.loads(raw),raw
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--job",required=True);p.add_argument("--model",required=True)
 p.add_argument("--out",required=True)
 args=p.parse_args()
 j=json.loads(Path(args.job).read_text())
 if j["schema"]!="highfly.skin13.forge-job/1" or j["phase"]!="queued":raise ValueError("NOT_AN_AUTHORIZED_JOB")
 if j["request"].get("reference"):raise ValueError("IMAGE_AI_IS_NOT_AVAILABLE_IN_THIS_CPU_MODEL")
 prompt=j["request"]["prompt"]
 parsed,raw=infer(args.model,prompt)
 output=build_design(parsed,prompt,args.model,raw)
 dest=Path(args.out);dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(json.dumps(output,indent=2,ensure_ascii=False))
 print("HIGHFLY_SKIN15_ACTUAL_QWEN_CPU_MODEL_INFERENCE_GREEN=1",flush=True)
 print("HIGHFLY_SKIN15_MODEL_CHOICES="+json.dumps(output["decisions"],sort_keys=True),flush=True)
 print("HIGHFLY_SKIN15_ART_APPROVED=0",flush=True)
if __name__=="__main__":main()
