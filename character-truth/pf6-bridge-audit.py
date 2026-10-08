#!/usr/bin/env python3
"""HIGHFLY SKIN3: audit FROZEN PF6 clean source and browser diagnostic artifacts.
An unmodified CLEAN source delta is not proof of final bundled runtime equivalence.
"""
from pathlib import Path
import argparse,hashlib,json

def check(test,message):
 if not test:raise AssertionError(message)

def main():
 p=argparse.ArgumentParser()
 p.add_argument('--delta',type=Path,required=True)
 p.add_argument('--browser',type=Path,required=True)
 p.add_argument('--source',type=Path,required=True)
 p.add_argument('--out',type=Path,required=True)
 a=p.parse_args()
 a.out.mkdir(parents=True,exist_ok=True)
 prov=(a.delta/'provenance.txt').read_text()
 check('UPSTREAM=9b57e49c9676d75962700f828cc00a50a9a988b5' in prov,'PF6 upstream pin differs')
 check('CLEAN_HEAD=7e2e5d3a3f8cf6c708ddb5a5a39571b6cf493d63' in prov,'Canonical clean SHA differs')
 check(not (a.delta/'replay-diff.txt').read_text().strip(),'CLEAN replay mismatch')
 changed=set(x.split('\t',1)[1] for x in (a.delta/'changed-paths.txt').read_text().splitlines() if '\t' in x)
 patch=(a.delta/'highfly-clean-v1.patch').read_text()
 assert len(changed)>100
 critical=['modular.ts','rig_merge.ts','rig_shared_skeleton.ts','player_look_core.ts','weapon_grip.ts','held_item_grips.ts','back_grips.ts']
 check(not any('src/render/characters/'+n in changed for n in critical),'CLEAN modified original anatomy/sockets')
 for n in ['assets.ts','manifest.ts','preview.ts']:
  check('src/render/characters/'+n in changed,'Missing CLEAN delta for '+n)
 for token in ['previewVisualReady(', 'highflyPreviewVisual = visualKey','highflyPreviewFrame',
               'highfly_basic_1','highfly_basic_4_air']:
  check(token in patch,'Missing characteristic of known PF6 CLEAN patch: '+token)
 pins={
  'modular.ts':'d2ad732114b01a0aa9de5a882e0a6980d54225fb',
  'underhair.generated.ts':'630408c0ffbffb61d06e1a398f28b0d89f820dfe',
  'rig_shared_skeleton.ts':'f65ede57d226f7c134976341e539fc2c1c990248',
  'weapon_grip.ts':'dc6cfb3f28164722415ddd8b80e9a80deddf09a6',
  'held_item_grips.ts':'06ea93d00490b1c397dcb14442de98ed8a730dbf',
  'back_grips.ts':'a3a3672c86cbdaefe98d17f28d8c4263586aa30a',
  'player_look_core.ts':'c20da88f6c9e56c1df5d452fb88a76c5b2721666',
  'preview_appearance.ts':'574c4ded4a8df3261ca8708dd625cf43ebaf0868',
  'assets.ts':'836769f9ccd5db9ea5d076a2181a0354318a203d',
  'manifest.ts':'0cb0b39fde840a5555318ffe30747a74d51544bd',
 }
 for name,expected in pins.items():
  data=(a.source/name).read_bytes()
  sha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\x00'+data).hexdigest()
  check(sha==expected,'Unpinned original '+name)
 modular=(a.source/'modular.ts').read_text()
 look=(a.source/'player_look_core.ts').read_text()
 assets=(a.source/'assets.ts').read_text()
 check('modularPartNames' in modular and 'CLASS_ARMOR_SETS' in modular,'Original compositor missing')
 check('inWorldLookFor' in look and 'charselectLook' in look,'Original player composition gates missing')
 check('mergeSkinnedParts' in assets and 'modularPartNames' in assets,'Original runtime composition gate missing')
 rep=json.loads((a.browser/'run0-browser-report.json').read_text())
 check(rep.get('gameBooted')==True and rep.get('offlineSelectorVisible')==True,'PF6 never entered browser world')
 check(rep.get('gameplay',{}).get('movement',{}).get('passed')==True,'PF6 movement failed')
 check(rep.get('gameplay',{}).get('combat',{}).get('passed')==True,'PF6 combat failed')
 check(not rep.get('static404s'),'PF6 static 404 present')
 check(not rep.get('doubleBaseRequests'),'PF6 path duplicate')
 bad=rep.get('badRequests',[]);errors=rep.get('consoleErrors',[])
 warnings=[str(e)[:180] for e in errors if 'character visual unavailable' in str(e)]
 result={'run':37770166898,'pf6Head':'312fe2e67219415a73a56303fcbd3b0bd9f62273',
 'upstream':'9b57e49c9676d75962700f828cc00a50a9a988b5','canonicalClean':'7e2e5d3a3f8cf6c708ddb5a5a39571b6cf493d63',
 'changedPaths':len(changed),'untouchedInCLEANOnly':critical,'verifiedOriginalModules':pins,
 'cleanPreviewHooksPresent':True,'cleanCombatAnimationAliasesPresent':True,
 'pf6BrowserEntry':{'gameBooted':True,'movement':True,'combat':True,'static404s':0,
                    'requestFailuresAndAnomalies':len(bad),'consoleErrors':len(errors),
                    'missingVisualWarnings':warnings},
 'limits':{'thisCleanPatchIsNotTheFinalPF6Build':True,'inGameCreatorRendererNotProvenEquivalent':True,
  'weaponSocketsNeedLiveGameplayTesting':True,'fullNineClassesAndBothBodiesPending':True,
  'legendarySkinApproval':False},
 'verdict':'PF6_FROZEN_SOURCE_BRIDGE_GREEN_RUNTIME_EQUIVALENCE_PENDING'}
 (a.out/'pf6-bridge.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
 md=['# HIGHFLY SKIN3 Phase5 — read-only PF-6 source bridge','',
 'Frozen PF6 RUN 37770166898 and pinned ClaudeCraft source. No game or GLB modified.','',
 '## Verified',
 '- Clean replay provenance preserved; '+str(len(changed))+' paths recorded in its delta.',
 '- Original modular composer, shared skeleton, grip and look modules untouched in the CLEAN delta.',
 '- Native preview resource hooks and animation aliases are present in the CLEAN changes.',
 '- PF6 browser evidence booted, entered game, moved and fought.',
 '','## Limitations',
 '- The CLEAN delta precedes other steps in the PF6 workflow; no final bundle equivalence certified.',
 '- Original browser warning counts retained: '+str(len(bad))+' anomalous requests, '+str(len(errors))+' console entries, '+str(len(warnings))+' missing-visual warnings.',
 '- Real M/F in-game creator, equipped weapons, sockets, all classes and S23 landscape still require testing.',
 '','Result: PF6_FROZEN_SOURCE_BRIDGE_GREEN_RUNTIME_EQUIVALENCE_PENDING']
 (a.out/'PF6_BRIDGE_REPORT.md').write_text('\n'.join(md)+'\n')
 print('HIGHFLY_SKIN3_PF6_SOURCE_BRIDGE_GREEN=1 PATHS='+str(len(changed))+' ERRORS_RETAINED='+str(len(errors)))
 print('PF6_BROWSER_MOVEMENT_COMBAT_VERIFIED=1 RUNTIME_VISUAL_EQUIVALENCE_PENDING=1')
if __name__=='__main__':main()
