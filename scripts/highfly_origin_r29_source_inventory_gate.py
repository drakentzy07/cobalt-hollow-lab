#!/usr/bin/env python3
"""R29 source+vendor-asset provenance/inventory. Non-playable gate, not a release."""
from pathlib import Path
import re,json
root=Path('donor/src/sim/content')
required=[
 ('classes.ts',r"(?m)^  ([a-z][\w]+): \{",327,True),
 ('paladin_core_abilities.ts',r"(?m)^    id: '([\w]+)',",35,False),
 ('priest.ts',r"(?m)^  ([a-z][\w]+): \{",7,False),
 ('talent_abilities_v2_a.ts',r"(?m)^  ([a-z][\w]+): \{",28,False),
 ('talent_abilities_v2_b.ts',r"(?m)^  ([a-z][\w]+): \{",14,False),
]
allids=[]
school={}
passives=[]
hidden=[]
for path,pattern,want,segment in required:
    src=(root/path).read_text(encoding='utf8')
    if segment:
        src=src[src.index('export const ABILITIES:'):]
        src=src[:src.index('\n};\n')]
    matches=list(re.finditer(pattern,src))
    if len(matches)!=want:
        raise SystemExit(f'R29_SOURCE_COUNT_DRIFT {path}: {len(matches)} != {want}')
    for i,m in enumerate(matches):
        end=matches[i+1].start() if i+1<len(matches) else len(src)
        text=src[m.start():end]
        key=m.group(1)
        allids.append(key)
        cl=re.search(r"\bclass: '([a-z]+)'",text)
        if not cl:raise SystemExit('R29_MISSING_CLASS_'+key)
        meta=school.setdefault(cl.group(1),{'total':0,'passive':0,'hidden':0,'active_candidate':0})
        passive=bool(re.search(r'\bpassive: true',text))
        retired=bool(re.search(r'\bhiddenFromPlayer: true',text))
        meta['total']+=1;meta['passive']+=int(passive);meta['hidden']+=int(retired)
        meta['active_candidate']+=int(not(passive or retired))
        if passive:passives.append(key)
        if retired:hidden.append(key)
if len(set(allids))!=411:raise SystemExit('R29_REGISTRY_DUPLICATE')
active=411-len(passives)-len(hidden)
if not (len(passives)==21 and len(hidden)==2 and active==388 and len(school)==9):
    raise SystemExit(f'R29_CATEGORY_DRIFT: {active} {len(passives)} {len(hidden)}')
vendors={
 'casting6':('LinearAbiltyCastingThreeJS',[
   ('ice','IceAbility.js'),('thunder','ThunderAbility.js'),('meteor','MeteorAbility.js'),
   ('beam','BeamAbility.js'),('snare','SnareAbility.js'),('glacier','GlacierAbility.js')]),
 'effects7':('LinearAbilityExtThreeJS',[
   ('pyre','PyreAbility.js'),('kraken','KrakenAbility.js'),
   ('electrical','ElectricalSphereAbility.js'),('earth','EarthAbility.js'),
   ('portal','PortalAbility.js'),('aether','AetherRingAbility.js'),
   ('firePortal','FirePortalAbility.js')]),
 'advanced10':('LinearAbiltyCastingExtendedThreeJS',[
   ('ward','WardAbility.js'),('acid','AcidAbility.js'),('growth','ArborBloomAbility.js'),
   ('cyber','CyberSerpentAbility.js'),('venom','VenomSurgeAbility.js'),
   ('quake','MonolithRiftAbility.js'),('ink','SumiTideAbility.js'),
   ('astral','AstralVoidAbility.js'),('cascade','BalefulCascadeAbility.js'),
   ('rend','CelestialRendAbility.js')])
}
for key,(base,abilities) in vendors.items():
    license_text=(Path('vendor')/base/'LICENSE').read_text()
    if 'MIT License' not in license_text:raise SystemExit('R29_SOURCE_LICENSE_MISSING_'+key)
    for source,module in abilities:
        path=Path('vendor')/base/'src/abilities'/module
        code=path.read_text()
        if len(code)<1000 or 'export class' not in code:
            raise SystemExit('R29_MISSING_REAL_VFX_MODULE_'+str(path))
catalog=Path('game/c1/highfly_origin_r27_premium23_catalog.ts').read_text()
ids=re.findall(r"id:'(hf_vfx23_[\w]+)'",catalog)
if len(ids)!=23 or len(set(ids))!=23:
    raise SystemExit('R29_PREMIUM_REGISTRY_DRIFT')
for key,(_,abilities) in vendors.items():
    for source,_ in abilities:
        if f"sourceId:'{source}',source:'{key}'" not in catalog:
            raise SystemExit('R29_PREMIUM_MAPPING_MISSING_'+key+'_'+source)
assert sum(len(x[1]) for x in vendors.values())==23
print('HIGHFLY_R29_SOURCE_INVENTORY_GREEN='+json.dumps({
 'original_total_definitions':411,'active_candidate_originals':388,
 'native_passives':len(passives),'native_hidden_retired':len(hidden),
 'school_breakdown':school,'premium_mit_source_modules':23,
 'premium_catalog_ids':len(ids),
 'potential_active_total':411,
 'warning':'SOURCE_INVENTORY_ONLY; neither 23/23 source VFX nor all native casts are yet hooked to HIGHFLY Sim',
 'release_ready':False},sort_keys=True))
