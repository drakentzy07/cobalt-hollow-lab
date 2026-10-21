#!/usr/bin/env python3
"""Add HIGHFLY UNIFIED 01 candidate to certified Pages snapshot, never mutate older files."""
import hashlib, json, re, shutil, sys, tarfile, urllib.request
from pathlib import Path, PurePosixPath

if len(sys.argv) != 5:
    raise SystemExit('usage: stage.py baseline/artifact.tar candidate/dist site source_sha')
archive, candidate, dest, source_sha = sys.argv[1:]
candidate, site = Path(candidate), Path(dest)
if not re.fullmatch(r'[a-f0-9]{40}', source_sha):
    raise SystemExit('UNIFIED_CANDIDATE_SOURCE_SHA_INVALID')
if not (candidate / 'index.html').is_file() or not (candidate / 'assets').is_dir():
    raise SystemExit('UNIFIED_CANDIDATE_BUILD_MISSING')
if site.exists():
    raise SystemExit('UNIFIED_CANDIDATE_SITE_ALREADY_EXISTS')
site.mkdir(parents=True)
with tarfile.open(archive, 'r:') as tar:
    for member in tar.getmembers():
        p = PurePosixPath(member.name)
        if (p.is_absolute() or '..' in p.parts or member.issym() or member.islnk()
                or not (member.isfile() or member.isdir())):
            raise SystemExit('UNIFIED_CANDIDATE_UNSAFE_BASELINE')
    tar.extractall(site, filter='data')

# The baseline must be the last verified F2.7 additive deployment.
EXPECTED = {
    'highfly-origin-f12-qa.json': '7518c22c11ff5ddffe09bb7792f8d67bb9e82038',
    'lab/f263-combat-beta/f263-beta-qa.json': '3c972dd3dc794a386b4c412f811345a21cc51d6d',
    'lab/f27-combat-beta/f27-beta-qa.json': '4a601df539eef4af3ec731a0934d02c3efa2c4d3',
}
for rel, expected in EXPECTED.items():
    f = site / rel
    if not f.is_file() or json.loads(f.read_text()).get('sourceCommit') != expected:
        raise SystemExit('UNIFIED_CANDIDATE_INVALID_PUBLISHED_SNAPSHOT_'+rel)
if json.loads((site / 'highfly-origin-f12-qa.json').read_text()).get('cleanFoundation') is not True:
    raise SystemExit('UNIFIED_CANDIDATE_ROOT_NOT_CLEAN')

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024*1024), b''):
            h.update(block)
    return h.hexdigest()

LIVE = 'https://drakentzy07.github.io/cobalt-hollow-lab/'
for rel in ['index.html', 'highfly-origin-f12-qa.json',
            'lab/f263-combat-beta/index.html', 'lab/f263-combat-beta/f263-beta-qa.json',
            'lab/f27-combat-beta/index.html', 'lab/f27-combat-beta/f27-beta-qa.json']:
    source = site / rel
    req = urllib.request.Request(LIVE + rel + '?unified_guard=' + source_sha[:12],
        headers={'Cache-Control': 'no-cache', 'User-Agent': 'HIGHFLY-UNIFIED01-CANDIDATE'})
    with urllib.request.urlopen(req, timeout=65) as response:
        if response.status != 200 or hashlib.sha256(response.read()).hexdigest() != sha(source):
            raise SystemExit('UNIFIED_CANDIDATE_LIVE_SITE_DRIFT_'+rel)

# Remember EVERY pre-existing file for an all-files immutability check.
before = {str(p.relative_to(site)):sha(p) for p in site.rglob('*') if p.is_file()}
candidate_rel = Path('candidate/unified-01')
target = site / candidate_rel
if target.exists():
    raise SystemExit('UNIFIED_CANDIDATE_DESTINATION_ALREADY_EXISTS_STOP')

# Do not copy root index/service worker/manifest over the certified world.
skip = {'index.html', 'highfly-origin-sw.js', 'highfly-origin.webmanifest',
        'highfly-origin-appshell.json', '.nojekyll'}
added = reused = 0
for src in sorted(candidate.rglob('*')):
    if not src.is_file(): continue
    rel = src.relative_to(candidate)
    if (rel.parts[0] == '.vite' or rel.suffix == '.html' or rel.name in skip
            or rel.name.endswith('-qa.json')):
        continue
    dst = site / rel
    if dst.exists():
        if not dst.is_file() or sha(src) != sha(dst):
            raise SystemExit('UNIFIED_CANDIDATE_ASSET_COLLISION_'+str(rel))
        reused += 1
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        added += 1

target.mkdir(parents=True)
html = (candidate / 'index.html').read_text()
refs = re.findall(r"""(?:src|href)=["'](/cobalt-hollow-lab/assets/[^"']+)""", html)
if not refs: raise SystemExit('UNIFIED_CANDIDATE_NO_VITE_ASSETS')
for url in refs:
    if not (site / url.removeprefix('/cobalt-hollow-lab/')).is_file():
        raise SystemExit('UNIFIED_CANDIDATE_MISSING_ASSET_'+url)
for name in ('highfly-origin-icon-192.png','highfly-origin-icon-512.png'):
    if not (candidate/name).is_file():raise SystemExit('UNIFIED_CANDIDATE_MISSING_ICON_'+name)
    shutil.copy2(candidate/name, target/name)

manifest = json.loads((candidate/'highfly-origin.webmanifest').read_text())
manifest.update({
    'name':'HIGHFLY ORIGIN — UNIFIED 01 (prueba aislada)',
    'short_name':'HIGHFLY Test',
    'id':'/cobalt-hollow-lab/candidate/unified-01/',
    'start_url':'/cobalt-hollow-lab/candidate/unified-01/',
    'scope':'/cobalt-hollow-lab/candidate/unified-01/',
})
(target/'highfly-origin.webmanifest').write_text(json.dumps(manifest,indent=2)+'\n')
html = html.replace('/cobalt-hollow-lab/highfly-origin.webmanifest',
                    '/cobalt-hollow-lab/candidate/unified-01/highfly-origin.webmanifest')
html = html.replace('<meta name="robots" content="index, follow, max-image-preview:large" />',
                    '<meta name="robots" content="noindex, nofollow" />')
html = html.replace('<title>HIGHFLY —', '<title>HIGHFLY UNIFIED 01 TEST —')
(target/'index.html').write_text(html)
(target/'unified-candidate-qa.json').write_text(json.dumps({
    'edition':'HIGHFLY UNIFIED 01 LV1 LAB + WORLD (isolated candidate)',
    'sourceCommit':source_sha,
    'baseF27Commit':'4a601df539eef4af3ec731a0934d02c3efa2c4d3',
    'noRootChange':True,
    'saves':'isolated candidate-world and candidate-lab IndexedDB + mirrors',
    'physicalS23':'PENDING USER TEST',
    'url':LIVE + 'candidate/unified-01/',
    'addedFiles':added, 'reusedAssets':reused,
},indent=2)+'\n')
(site/'.nojekyll').touch()
for rel,hash_before in before.items():
    if sha(site/rel) != hash_before:
        raise SystemExit('UNIFIED_CANDIDATE_MUTATED_EXISTING_FILE_'+rel)
if any(p.is_symlink() for p in site.rglob('*')):
    raise SystemExit('UNIFIED_CANDIDATE_SYMLINK_NOT_ALLOWED')
size = sum(p.stat().st_size for p in site.rglob('*') if p.is_file())
if size >= 1_055_000_000:
    raise SystemExit('UNIFIED_CANDIDATE_PAGES_SIZE_LIMIT_'+str(size))
print('HIGHFLY_UNIFIED01_ADDITIVE_STAGE_GREEN=1',json.dumps({
    'bytes':size,'added':added,'reused':reused,
    'preservedFiles':len(before),'candidateUrl':LIVE+'candidate/unified-01/'
}),flush=True)
