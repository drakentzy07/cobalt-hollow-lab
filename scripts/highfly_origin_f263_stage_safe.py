#!/usr/bin/env python3
"""HIGHFLY F2.6.3: strict additive deployment atop last certified F2.6.2 Pages."""
import hashlib, json, re, shutil, sys, tarfile, urllib.request
from pathlib import Path, PurePosixPath

if len(sys.argv) != 5:
    raise SystemExit('usage: stage.py baseline/artifact.tar candidate/dist site source_sha')
archive, srcdir, outdir, source_sha = sys.argv[1:]
candidate, site = Path(srcdir), Path(outdir)
source_sha = source_sha.strip()
if len(source_sha) != 40 or not re.fullmatch('[a-f0-9]{40}', source_sha):
    raise SystemExit('F263_SOURCE_SHA_INVALID')
if not (candidate/'index.html').is_file() or not (candidate/'assets').is_dir():
    raise SystemExit('F263_CANDIDATE_MISSING')
site.mkdir(parents=True, exist_ok=False)
with tarfile.open(archive, 'r:') as tar:
    for m in tar.getmembers():
        p = PurePosixPath(m.name)
        if (p.is_absolute() or '..' in p.parts or m.issym() or m.islnk()
                or not (m.isfile() or m.isdir())):
            raise SystemExit('F263_UNSAFE_PAGES_BASELINE')
    tar.extractall(site, filter='data')
lab = site/'lab/f263-combat-beta'
if lab.exists():
    raise SystemExit('F263_DESTINATION_ALREADY_EXISTS_STOP')
expected = {
    'highfly-origin-f12-qa.json': '7518c22c11ff5ddffe09bb7792f8d67bb9e82038',
    'lab/f2-combat-beta/f2-beta-qa.json': 'f969ddfab1a120b54bf8b91db76f6d27cbe08e8d',
    'lab/f22-combat-beta/f22-beta-qa.json': 'd7098417925310862b22a3bcaf4bd862515ef61c',
    'lab/f23-combat-beta/f23-beta-qa.json': 'd3fa189b086b4c38d48aa770415de6cb2c5dcdc6',
    'lab/f24-combat-beta/f24-beta-qa.json': 'ac83147195b924fa65d587c71ff03bf879879774',
    'lab/f26-combat-beta/f26-beta-qa.json': '2fcc8857d140860129dcfaeb3c7862667e09b089',
    'lab/f261-combat-beta/f261-beta-qa.json': '0b80d0d4926441c4cff14f4893193d96e713cc43',
    'lab/f262-combat-beta/f262-beta-qa.json': '550e9df755b24061aaff7fe70573b863f14ee6b9',
}
for relative, sha in expected.items():
    f = site/relative
    if not f.is_file() or json.loads(f.read_text()).get('sourceCommit') != sha:
        raise SystemExit('F263_STALE_OR_MISSING_PAGES_BASELINE_'+relative)
if json.loads((site/'highfly-origin-f12-qa.json').read_text()).get('cleanFoundation') is not True:
    raise SystemExit('F263_ROOT_FOUNDATION_NOT_CLEAN')
def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()
# Compare current LIVE site with the certified baseline before replacing Pages.
live = 'https://drakentzy07.github.io/cobalt-hollow-lab/'
for rel in ('index.html','highfly-origin-f12-qa.json',
            'lab/f2-combat-beta/index.html',
            'lab/f23-combat-beta/index.html',
            'lab/f24-combat-beta/index.html',
    'lab/f26-combat-beta/index.html',
    'lab/f26-combat-beta/f26-beta-qa.json',
    'lab/f261-combat-beta/index.html',
    'lab/f261-combat-beta/f261-beta-qa.json',
    'lab/f262-combat-beta/index.html',
    'lab/f262-combat-beta/f262-beta-qa.json',
            'lab/f24-combat-beta/f24-beta-qa.json'):
    file = site/rel
    if not file.is_file():
        raise SystemExit('F263_PROTECTED_MISSING_'+rel)
    req = urllib.request.Request(live+rel+'?f263_protection='+source_sha[:12],
        headers={'Cache-Control':'no-cache', 'User-Agent':'HIGHFLY-F263-PAGES-SAFE'})
    with urllib.request.urlopen(req, timeout=65) as response:
        if response.status != 200 or hashlib.sha256(response.read()).hexdigest() != sha(file):
            raise SystemExit('F263_LIVE_PAGES_BASELINE_DRIFT_'+rel)
# Protect EVERY existing file, not just known lab paths.
before = {str(p.relative_to(site)):sha(p) for p in site.rglob('*') if p.is_file()}
skip = {'index.html','highfly-origin-sw.js','highfly-origin.webmanifest',
        'highfly-origin-appshell.json','.nojekyll'}
added = reused = 0
for file in sorted(candidate.rglob('*')):
    if not file.is_file(): continue
    rel = file.relative_to(candidate)
    if rel.parts[0] == '.vite' or rel.suffix == '.html' or rel.name in skip or rel.name.endswith('-qa.json'):
        continue
    dest = site/rel
    if dest.exists():
        if not dest.is_file() or sha(dest) != sha(file):
            raise SystemExit('F263_CONTENT_ADDRESSED_ASSET_COLLISION_'+str(rel))
        reused += 1
    else:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, dest)
        added += 1
lab.mkdir(parents=True)
html = (candidate/'index.html').read_text()
refs = re.findall(r"""(?:src|href)=["'](/cobalt-hollow-lab/assets/[^"']+)""", html)
if not refs or 'highfly-origin.webmanifest' not in html:
    raise SystemExit('F263_BAD_ENTRY_HTML')
for asset in refs:
    rel = asset.removeprefix('/cobalt-hollow-lab/')
    if not (site/rel).is_file():
        raise SystemExit('F263_MISSING_ENTRY_ASSET_'+rel)
for name in ('highfly-origin-icon-192.png','highfly-origin-icon-512.png'):
    if not (candidate/name).is_file():
        raise SystemExit('F263_MISSING_ICON_'+name)
    shutil.copy2(candidate/name,lab/name)
mf = json.loads((candidate/'highfly-origin.webmanifest').read_text())
mf.update({
    'name': 'HIGHFLY F2.6.3 S23 Combat Stability (online beta)',
    'short_name': 'HF F263 Beta',
    'id': '/cobalt-hollow-lab/lab/f263-combat-beta/',
    'start_url': '/cobalt-hollow-lab/lab/f263-combat-beta/',
    'scope': '/cobalt-hollow-lab/lab/f263-combat-beta/',
})
(lab/'highfly-origin.webmanifest').write_text(json.dumps(mf,indent=2)+'\n')
html = html.replace('<meta name="robots" content="index, follow, max-image-preview:large" />',
                    '<meta name="robots" content="noindex, nofollow" />')
html = html.replace('<title>HIGHFLY —', '<title>HIGHFLY F2.6.3 BETA —')
(lab/'index.html').write_text(html)
(lab/'f263-beta-qa.json').write_text(json.dumps({
    'edition':'HIGHFLY F2.6.3 S23 Combat Stability Android online beta',
    'sourceCommit':source_sha,
    'parentF262Commit':'550e9df755b24061aaff7fe70573b863f14ee6b9',
    'noPublicReplace':True,
    'offline':'NOT TESTED',
    'physicalS23':'PENDING USER TEST',
    'saves':'isolated IndexedDB and localStorage, use private tab to avoid old root SW',
    'url':live+'lab/f263-combat-beta/',
    'newFiles':added, 'reusedAssets':reused,
},indent=2)+'\n')
(site/'.nojekyll').touch()
for rel,digest in before.items():
    if sha(site/rel) != digest:
        raise SystemExit('F263_MUTATED_PRIOR_SITE_'+rel)
if any(p.is_symlink() for p in site.rglob('*')):
    raise SystemExit('F263_SYMLINK_NOT_ALLOWED')
total = sum(p.stat().st_size for p in site.rglob('*') if p.is_file())
# GitHub Pages' 1 GiB upper bound: 1,055,000,000 bytes stays well below
# 1,073,741,824 bytes. This does NOT delete or mutate any prior lab.
if total >= 1_055_000_000:
    raise SystemExit('F263_PAGES_EXCEEDS_SAFE_SIZE_'+str(total))
print('HIGHFLY_F263_ADDITIVE_PAGES_STAGE_GREEN=1 '+json.dumps({
    'bytes':total,'newFiles':added,'reusedAssets':reused,
    'priorFilesPreserved':len(before),'labUrl':live+'lab/f263-combat-beta/'
}),flush=True)
