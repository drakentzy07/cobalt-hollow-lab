/**
 * Stage ONLY the FURY portable TypeScript modules into an already materialized
 * ClaudeCraft v0.44.7 candidate. Never touches game sources, the entry/login,
 * UI, character/save systems, assets or workflows.
 *
 * Default is DRY RUN. --apply is explicit and only writes src/highfly/fury/*.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE=dirname(fileURLToPath(import.meta.url));
const SOURCE=resolve(HERE,'../src');
export const FURY_SOURCE_FILES=Object.freeze([
  'fury_core.ts','skill_preview.ts','skill_gestures.ts',
  'native_visual_registry.ts','native_class_catalog.ts',
  'three_ground_overlay.ts','physical_combat.ts','rebirth_adapter.ts',
]);
function normalizeForVite(s){
  // Node's isolated contract tests use explicit .ts; ClaudeCraft uses the
  // TypeScript Bundler module resolver (extensionless relative imports).
  return s.replace(/(from\s+['"]\.\/?[^'"]+)\.ts(['"])/g,'$1$2');
}
export function stageFuryCandidate(candidatePath,{
  apply=false,sourceDir=SOURCE,
}={}){
  if(typeof candidatePath!=='string'||!candidatePath.trim())
    throw Error('FURY_CANDIDATE_MISSING');
  const candidate=resolve(candidatePath);
  for(const rel of ['src/main.ts','src/sim/types.ts','src/sim/content/classes.ts']){
    if(!existsSync(join(candidate,rel)))throw Error('FURY_NOT_MATERIALIZED_CLAUDECRAFT: '+rel);
  }
  const dst=join(candidate,'src/highfly/fury');
  const operations=[];
  for(const name of FURY_SOURCE_FILES){
    const from=join(sourceDir,name),to=join(dst,name);
    if(!existsSync(from))throw Error('FURY_SOURCE_MISSING: '+name);
    const content=normalizeForVite(readFileSync(from,'utf8'));
    if(existsSync(to)&&readFileSync(to,'utf8')!==content)
      throw Error('FURY_CONFLICT_WILL_NOT_OVERWRITE: '+name);
    operations.push({name,to,content,exists:existsSync(to)});
  }
  if(apply){
    mkdirSync(dst,{recursive:true});
    for(const op of operations){
      if(!op.exists)writeFileSync(op.to,op.content,'utf8');
    }
  }
  return {mode:apply?'applied':'dry-run',candidate,files:operations.map(op=>op.name),
    newFiles:operations.filter(op=>!op.exists).length,
    unchangedExisting:operations.filter(op=>op.exists).length,
    protectedPathsModified:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),cIndex=args.indexOf('--candidate');
  const candidate=cIndex>=0?args[cIndex+1]:null;
  const result=stageFuryCandidate(candidate,{apply:args.includes('--apply')});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
