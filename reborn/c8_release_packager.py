#!/usr/bin/env python3
"""Package HIGHFLY REBORN as standalone /reborn/ Pages non-commercial playtest.
Never edits source saves or source art. Site consists only of new REBORN.
A deployment of this artifact replaces old G6/C204 *live* routes, not repo files.
"""
import json,shutil,sys,hashlib
from pathlib import Path
candidate=Path(sys.argv[1]);site=Path(sys.argv[2])
src=candidate/'dist'
if not (src/'index.html').is_file():raise SystemExit('HIGHFLY_C8_NO_BUILT_INDEX')
index=(src/'index.html').read_text()
for required in ['hf-reborn-entry','hf-reborn-enter-world','hf-reborn-enter-lab','/cobalt-hollow-lab/reborn/assets/']:
 if required not in index:raise SystemExit('HIGHFLY_C8_BAD_ENTRY_BASE '+required)
icon=json.loads((src/'reborn-c6-icon-provenance.json').read_text())
model=json.loads((src/'reborn-c6-model-provenance.json').read_text())
assert len(icon['paths'])>=2500, 'HIGHFLY_C8_ICON_AUDIT_MISSING'
assert len(model['models'])>=50, 'HIGHFLY_C8_MODELS_AUDIT_MISSING'
if icon.get('unresolved') or model.get('missing'):raise SystemExit('HIGHFLY_C8_SUBSTITUTE_GAPS')
site.mkdir(parents=True,exist_ok=True)
shutil.copytree(src,site/'reborn',dirs_exist_ok=False)
(site/'index.html').write_text('''<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=./reborn/">
<title>HIGHFLY RPG Fitness World</title></head><body>
<p>HIGHFLY RPG Fitness World — <a href="./reborn/">Entrar al juego</a></p>
<script>location.replace(new URL('./reborn/', location.href));</script>
</body></html>''')
# Upstream attribution required for some noncommercial CC-BY-NC voices, and
# copy of operative rights ledger and dependent library notices.
(site/'reborn'/'CREDITS.txt').write_bytes((candidate/'CREDITS.md').read_bytes())
(site/'reborn'/'THIRD_PARTY_NOTICES.txt').write_bytes((candidate/'THIRD_PARTY_NOTICES.md').read_bytes())
(site/'reborn'/'HIGHFLY_PLAYTEST_NOTE.txt').write_text('''HIGHFLY RPG Fitness World — early, NON-COMMERCIAL browser playtest.
Based on permitted fork of World of ClaudeCraft v0.44.7 and CC0 KayKit,
Quaternius, Kenney and others under per-asset terms in CREDITS.txt.
Owned HIGHFLY user interface and distinct substitute icons are not upstream art.
Known reserved media were replaced in the build. This is NOT a general media
reuse grant, NOT a complete commercial-license review, and not permission to
extract the fork-only media as asset packs. No payments or ad monetization.
Device QA in Chromium does not certify operation on physical Samsung S23.
The prior G6/C204 live Pages site was retired from the Pages deployment;
source branches and browser localStorage remain untouched.
''')
receipt={'name':'HIGHFLY RPG Fitness World','stage':'REBORN C8 mobile playtest',
 'upstream':'levy-street/world-of-claudecraft@493c35a108cef6c8aa290e8793107b1cd117886e',
 'assetsReviewedAtBuild':len(icon['paths'])+len(model['models']),
 'rebornIcons':len(icon['paths']),'rebornModels':len(model['models']),
 'hunterModelMediaPath':'media/models/chars/players/'+next((site/'reborn'/'media/models/chars/players').glob('knight.*.glb')).name,
 'license':'noncommercial testing only; further audit pending',
 'androidPhysicalApproved':False,'replacedOldPages':True,
 'oldRepositorySourceUntouched':True}
(site/'reborn'/'highfly-reborn-playtest-qa.json').write_text(json.dumps(receipt,indent=2)+'\n')
files=[p for p in site.rglob('*') if p.is_file()]
size=sum(p.stat().st_size for p in files)
print('HIGHFLY_C8_SITE_FILES=',len(files),' BYTES=',size)
if size>=950_000_000:raise SystemExit('HIGHFLY_C8_PAGES_SIZE_EXCEEDS_GUARDRAIL')
required=['reborn/media/models/chars/players/knight.*.glb','reborn/reborn-c6-icon-provenance.json',
 'reborn/reborn-c6-model-provenance.json','reborn/CREDITS.txt']
for q in required:
 if not (list(site.glob(q)) if '*' in q else (site/q).is_file()):raise SystemExit('HIGHFLY_C8_REQUIRED_FILE_MISSING '+q)
print('HIGHFLY_REBORN_C8_PATH_ISOLATED_BUILD_READY=PASS')
