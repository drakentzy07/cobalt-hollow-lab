import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,mkdirSync,writeFileSync,existsSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {stageFuryCandidate,FURY_SOURCE_FILES} from '../tools/stage_in_candidate.mjs';
test('staging is dry run by default and protects native entry/save/class code',()=>{
  const root=mkdtempSync(join(tmpdir(),'fury-'));
  try{
    for(const p of ['src','src/sim','src/sim/content'])mkdirSync(join(root,p),{recursive:true});
    writeFileSync(join(root,'src/main.ts'),'// protected native entry\n');
    writeFileSync(join(root,'src/sim/types.ts'),'// protected native save types\n');
    writeFileSync(join(root,'src/sim/content/classes.ts'),'// protected nine classes\n');
    const before=['src/main.ts','src/sim/types.ts','src/sim/content/classes.ts']
      .map(p=>readFileSync(join(root,p),'utf8'));
    const dry=stageFuryCandidate(root);
    assert.equal(dry.mode,'dry-run');
    assert.equal(dry.newFiles,FURY_SOURCE_FILES.length);
    assert.equal(existsSync(join(root,'src/highfly/fury/fury_core.ts')),false);
    const applied=stageFuryCandidate(root,{apply:true});
    assert.equal(applied.newFiles,FURY_SOURCE_FILES.length);
    assert.equal(applied.protectedPathsModified,0);
    assert.equal(readFileSync(join(root,'src/highfly/fury/rebirth_adapter.ts'),'utf8')
      .includes("from './fury_core.ts'"),false);
    const twice=stageFuryCandidate(root,{apply:true});
    assert.equal(twice.unchangedExisting,FURY_SOURCE_FILES.length);
    assert.deepEqual(before,['src/main.ts','src/sim/types.ts','src/sim/content/classes.ts']
      .map(p=>readFileSync(join(root,p),'utf8')));
    writeFileSync(join(root,'src/highfly/fury/fury_core.ts'),'// local changes: do not destroy');
    assert.throws(()=>stageFuryCandidate(root,{apply:true}),/FURY_CONFLICT_WILL_NOT_OVERWRITE/);
  } finally {rmSync(root,{recursive:true,force:true});}
});
test('non-game path and absent native class schema fail closed',()=>{
  const root=mkdtempSync(join(tmpdir(),'fury-bad-'));
  try{
    assert.throws(()=>stageFuryCandidate(root,{apply:true}),
      /FURY_NOT_MATERIALIZED_CLAUDECRAFT/);
    assert.equal(existsSync(join(root,'src/highfly/fury')),false);
  } finally {rmSync(root,{recursive:true,force:true});}
});
