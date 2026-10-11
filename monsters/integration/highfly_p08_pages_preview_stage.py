#!/usr/bin/env python3
"""Prepare an ISOLATED GitHub Pages subpath preview from already QA'd P08 dist.

This DOES NOT deploy, edit main, update Pages, or claim to preserve a live site.
The source WebGL candidate targets /cobalt-hollow-lab/; rebase text references
for /cobalt-hollow-lab/v4-03-preview/, keep every binary untouched, and fail on
any escaped origin-root URL. Verify with REAL browser smoke after repackaging.

Pages deployment replaces the whole site. This isolated artifact MUST NOT be
fed to actions/deploy-pages without first restoring the CURRENT production
snapshot and comparing SHA-256 for every pre-existing file.
"""
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

OLD=b'/cobalt-hollow-lab/'
NEW=b'/cobalt-hollow-lab/v4-03-preview/'
UNREBASED=re.compile(rb'/cobalt-hollow-lab/(?!v4-03-preview/)')
TEXT={'.html','.js','.mjs','.css','.json','.webmanifest','.xml','.svg','.txt','.map'}
ROOT=Path('v403-p08-pages-preview-only')
PREVIEW=ROOT/'cobalt-hollow-lab'/'v4-03-preview'
SOURCE=Path('upstream/dist')

def main():
    if not (SOURCE/'index.html').is_file():
        raise RuntimeError('P08_DIST_MISSING_STOP')
    if ROOT.exists():
        raise RuntimeError('PREVIEW_ALREADY_PRESENT_STOP')
    PREVIEW.mkdir(parents=True)
    count=0
    transformed=0
    total=0
    hashes=[]
    for src in SOURCE.rglob('*'):
        if src.is_symlink():
            raise RuntimeError('PAGES_PREVIEW_SYMLINK_REFUSED:'+str(src))
        if not src.is_file():
            continue
        rel=src.relative_to(SOURCE)
        if '..' in rel.parts:
            raise RuntimeError('PATH_ESCAPE_REFUSED')
        dest=PREVIEW/rel
        dest.parent.mkdir(parents=True,exist_ok=True)
        if src.suffix.lower() in TEXT:
            data=src.read_bytes()
            revised=data.replace(OLD,NEW)
            if UNREBASED.search(revised):
                raise RuntimeError('UNREBASED_PUBLIC_ROOT:'+str(rel))
            if revised!=data:
                transformed+=1
            dest.write_bytes(revised)
        else:
            shutil.copyfile(src,dest)
        if rel.as_posix()=='index.html' and NEW not in dest.read_bytes():
            raise RuntimeError('PREVIEW_ENTRY_DID_NOT_REFERENCE_PREVIEW_BASE')
        h=hashlib.sha256()
        with dest.open('rb') as stream:
            while True:
                part=stream.read(1<<20)
                if not part:break
                h.update(part)
        size=dest.stat().st_size
        hashes.append({'path':rel.as_posix(),'sha256':h.hexdigest(),'bytes':size})
        total+=size
        count+=1
    if not (PREVIEW/'index.html').is_file() or not (PREVIEW/'media').is_dir():
        raise RuntimeError('PREVIEW_CONTENT_MISSING')
    if count<100 or total<100_000_000:
        raise RuntimeError('PREVIEW_BUILD_SUSPICIOUSLY_SMALL')
    (ROOT/'NO_DEPLOY_NO_PUBLIC_ROOT_OVERWRITE.txt').write_text(
        'P08 preview-only ZIP. This is not a complete Pages deployment.\\n'
        'Never upload it alone to deploy-pages: that would erase the existing site.\\n'
        'Before any Pages deploy, restore the current public site from a verified\\n'
        'complete snapshot and validate SHA256 of EVERY pre-existing file.\\n',
        encoding='utf-8')
    (ROOT/'preview_file_manifest.json').write_text(
        json.dumps({'target':'/cobalt-hollow-lab/v4-03-preview/',
                    'commit':'P08_CANDIDATE_BEFORE_PAGES_DEPLOY',
                    'files':count,'bytes':total,'transformedTextAssets':transformed,
                    'entries':hashes},separators=(',',':')),encoding='utf-8')
    print('HF_P08_PAGES_SUBPATH_PREVIEW_STAGED='+json.dumps({
        'files':count,'bytes':total,'transformedTextAssets':transformed,
        'entry':(PREVIEW/'index.html').as_posix()}))
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('HF_P08_PAGES_SUBPATH_PREVIEW_BLOCKED='+str(e),file=sys.stderr)
        raise
