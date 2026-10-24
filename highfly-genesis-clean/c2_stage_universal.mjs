/**
 * HIGHFLY C2-01: stage ONLY the new classless Training stat contract into
 * a temporary donor checkout. Does not touch Sim, input, HUD, saves or GLBs.
 * FURY's own guarded stage script runs separately.
 */
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const own=dirname(fileURLToPath(import.meta.url));
const source=join(own,'c2_universal_stats.ts');
const candidate=resolve(process.argv[2]||'candidate');
const target=join(candidate,'src/highfly/training/universal_stats.ts');
const checks=['src/main.ts','src/game/input.ts','src/sim/player_motion.ts'];
for(const p of checks)if(!existsSync(join(candidate,p)))throw Error('HIGHFLY_C2_ORIGINAL_ENGINE_MISSING_'+p);
const v=readFileSync(source,'utf8');
if(existsSync(target)&&readFileSync(target,'utf8')!==v)
  throw Error('HIGHFLY_C2_EXISTING_TRAINING_MODULE_CONFLICT');
const apply=process.argv.includes('--apply');
if(apply){
  mkdirSync(dirname(target),{recursive:true});
  if(!existsSync(target))writeFileSync(target,v,'utf8');
}
console.log(JSON.stringify({
  phase:'C2-01',
  mode:apply?'apply':'dry-run',
  target:'src/highfly/training/universal_stats.ts',
  classless:true,
  maxLevel:20,
  gameEngineFilesChanged:0,
  mediaFilesChanged:0,
  runtimeWired:false,
}));
