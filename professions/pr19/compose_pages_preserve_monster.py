#!/usr/bin/env python3
"""PR19 Pages composition. Preserve the LAST actually deployed ROOT and
/monster-lab byte-for-byte. Update ONLY the isolated /v4-02 preview plus
content-addressed *new* aliases. Never overwrite donor or Monster Lab data.
"""
from pathlib import Path
import hashlib, json, shutil

base=Path('approved-live-pages')
src=Path('pr19-candidate/cobalt-hollow-lab')
dst=Path('composed-pages')
assert (base/'index.html').is_file(), 'current approved root missing'
assert (base/'v4-02/index.html').is_file(), 'previous V4 missing'
assert (base/'monster-lab/index.html').is_file(), 'protected Monster Lab missing'
assert (src/'index.html').is_file(), 'certified PR19 WebGL build missing'
assert (src/'media').is_dir(), 'PR19 original donor media missing'
assert not dst.exists(), 'refuse to patch stale output'
def digest(p): return hashlib.sha256(p.read_bytes()).digest()
def files(root): return [p for p in root.rglob('*') if p.is_file()]
protected={
    str(p.relative_to(base)):digest(p)
    for p in files(base) if p.relative_to(base).parts[0]!='v4-02'
}
monster={k:v for k,v in protected.items() if k.startswith('monster-lab/')}
assert len(monster)>10, 'Monster Lab unexpectedly empty'
shutil.copytree(base,dst)
preview=dst/'v4-02'
assert preview.is_dir()
media_count=0
for p in files(src/'media'):
    rel=p.relative_to(src)
    target=dst/rel
    assert target.exists(), 'PR19 requires new donor media not present in approved baseline: '+str(rel)
    assert digest(target)==digest(p), 'MEDIA HASH MISMATCH; refuse to touch original assets: '+str(rel)
    media_count+=1
# Other official ClaudeCraft source folders can be shared with the already
# deployed baseline only if every colliding original file is byte-identical.
shared={'media'}
new_shared=0
for folder in src.iterdir():
    if not folder.is_dir() or folder.name in {'media','assets'}: continue
    paths=files(folder)
    if not paths: continue
    if any((dst/p.relative_to(src)).exists() and digest(dst/p.relative_to(src))!=digest(p) for p in paths):
        continue
    shared.add(folder.name)
    for p in paths:
        target=dst/p.relative_to(src)
        if not target.exists():
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(p,target)
            new_shared+=1
# ClaudeCraft's lazy chunks sometimes resolve under the original app /assets.
# Alias needed immutable JS, not a second runtime/world. No changes to
# existing root assets, no overwritten hash collisions.
alias_count=0
alias_bytes=0
assets=src/'assets'
assert assets.is_dir()
for p in assets.rglob('*.js'):
    n=p.name
    if not (p.stat().st_size<=1_000_000 or n.startswith(('renderer-','main-','es_ES-','es-','data-','ignivar_frontal_telegraph-'))):
        continue
    target=dst/p.relative_to(src)
    if target.exists():
        assert digest(target)==digest(p), 'Existing root JS alias collision: '+str(target)
    else:
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(p,target)
        alias_count+=1
        alias_bytes+=p.stat().st_size
text_extensions={'.html','.js','.mjs','.css','.json','.webmanifest','.xml','.svg','.txt'}
changed=0
added=0
for p in files(src):
    rel=p.relative_to(src)
    if rel.parts[0] in shared: continue
    target=preview/rel
    existed=target.exists()
    target.parent.mkdir(parents=True,exist_ok=True)
    if p.suffix.lower() in text_extensions:
        try: s=p.read_text(encoding='utf-8')
        except UnicodeDecodeError: shutil.copy2(p,target)
        else:
            # Rebase only Vite chunks. Do NOT rebase dynamically resolved
            # donor /media, animations, skins, or original HUD addresses.
            s=s.replace('/cobalt-hollow-lab/assets/','/cobalt-hollow-lab/v4-02/assets/')
            target.write_text(s,encoding='utf-8')
    else: shutil.copy2(p,target)
    if existed: changed+=1
    else: added+=1
# All pre-existing files outside /v4-02 must remain BYTE-IDENTICAL.
for rel,checksum in protected.items():
    target=dst/rel
    assert target.is_file() and digest(target)==checksum, 'PROTECTED ORIGINAL/ MONSTER CHANGED: '+rel
assert (dst/'monster-lab/hunts.html').is_file()
assert (dst/'v4-02/index.html').is_file()
assert (dst/'.nojekyll').exists()
size=sum(p.stat().st_size for p in files(dst))
assert size<=1_450_000_000, f'PR19 combined Pages grew outside approved budget: {size} bytes'
report={
    'approved_live_root_and_monster_files_identical':len(protected),
    'monster_lab_files_identical':len(monster),
    'original_donor_media_identical':media_count,
    'shared_prefixes':sorted(shared),
    'new_shared_immutable_files':new_shared,
    'new_no_overwrite_js_aliases':alias_count,
    'new_alias_bytes':alias_bytes,
    'existing_v4_files_rewritten':changed,
    'new_v4_files_added':added,
    'combined_size_bytes':size,
    'target_url':'/cobalt-hollow-lab/v4-02/',
    'source':'PR19 native touch package, frozen ClaudeCraft',
}
Path('pr19-pages-integrity-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('HIGHFLY_PR19_PAGES_ROOT_MONSTER_BYTE_IDENTICAL_GREEN=1')
print(json.dumps(report,ensure_ascii=False))
