#!/usr/bin/env python3
"""Read-only Pages size/reuse inventory for full-site V4-03.1 QA.
Does NOT unlink, rewrite, copy, symlink, publish, or relax the 995MB gate.
A matching SHA identifies a potential reuse candidate; it does NOT prove
that JS/CSS/GLTF runtime URLs are safely rewritten. That is a later QA gate.
"""
from pathlib import Path
from collections import defaultdict
import hashlib,json
ROOT=Path('golden-publish/cobalt-hollow-lab')
PREVIEW=ROOT/'v4-03-preview'
BUDGET=995_000_000
OUTPUT=Path('highfly-v4031-storage-reuse-audit.json')
def dig(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        while b:=f.read(1048576): h.update(b)
    return h.hexdigest()
def walk(p):
    return sorted((x for x in p.rglob('*') if x.is_file() and not x.is_symlink()),
                  key=lambda p:p.as_posix())
def pretty_top(root,p):
    rel=p.relative_to(root)
    return rel.parts[0] if len(rel.parts)>1 else '(site root)'
def sizes_for(files,root):
    d=defaultdict(int)
    for p in files:d[pretty_top(root,p)]+=p.stat().st_size
    return dict(sorted(d.items(),key=lambda kv:-kv[1]))
def main():
    if not PREVIEW.is_dir() or not (ROOT/'index.html').is_file():
        raise SystemExit('READ_ONLY_AUDIT_MISSING_CURRENT_STAGE')
    allfiles=walk(ROOT)
    candidate=[p for p in allfiles if PREVIEW in p.parents]
    legacy=[p for p in allfiles if p not in candidate]
    legacy_size=defaultdict(list)
    for p in legacy:legacy_size[p.stat().st_size].append(p)
    exact=[]
    for p in candidate:
        size=p.stat().st_size
        if size<100_000:continue
        ph=dig(p)
        for old in legacy_size.get(size,[]):
            if ph==dig(old):
                exact.append({'candidate':p.relative_to(ROOT).as_posix(),
                              'legacy':old.relative_to(ROOT).as_posix(),
                              'bytes':size,'suffix':p.suffix.lower()})
                break
    def count_ext(items):
        d=defaultdict(int)
        for p in items:d[p.suffix.lower() or '(no extension)']+=p.stat().st_size
        return dict(sorted(d.items(),key=lambda kv:-kv[1]))
    total=sum(x.stat().st_size for x in allfiles)
    report={
       'status':'INVENTORY_ONLY_DO_NOT_PUBLISH',
       'totalBytes':total,'budgetBytes':BUDGET,
       'overBudgetBytes':max(0,total-BUDGET),
       'legacyBytes':sum(x.stat().st_size for x in legacy),
       'previewBytes':sum(x.stat().st_size for x in candidate),
       'legacyBuckets':sizes_for(legacy,ROOT),
       'previewBuckets':sizes_for(candidate,PREVIEW),
       'previewSuffixBytes':count_ext(candidate),
       'candidateIdenticalLegacyBigFileCount':len(exact),
       'candidateIdenticalLegacyBigFileBytes':sum(x['bytes'] for x in exact),
       'identicalLegacyMatchesTop40':sorted(exact,key=lambda row:-row['bytes'])[:40],
       'largestPreviewFiles':[
          {'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size}
          for p in sorted(candidate,key=lambda p:-p.stat().st_size)[:30]],
       'warnings':[
          'Identical content alone does not validate URL/GLTF dependency reuse.',
          'No deletions or browser rewrite performed; preserve old site byte-identical.',
          'Do not raise Pages budget or deploy until all safe content-sharing gates pass.',
          'If most media is new or unique, an alternative separately isolated delivery path requires explicit review.'
       ]
    }
    OUTPUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('HF_GOLDEN_REUSE_INVENTORY_ONLY='+json.dumps({
       'total':report['totalBytes'],'over':report['overBudgetBytes'],
       'old':report['legacyBytes'],'preview':report['previewBytes'],
       'identicalBigBytes':report['candidateIdenticalLegacyBigFileBytes'],
       'previewBuckets':report['previewBuckets'],
       'suffixes':report['previewSuffixBytes']
    }))
if __name__=='__main__':main()
