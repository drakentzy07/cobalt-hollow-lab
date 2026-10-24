import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const candidate=resolve(process.argv[2]||'candidate');
const dir=join(candidate,'src/highfly/training');
const src=resolve('../tools/highfly-genesis-clean');
const patterns=[
 ['c2_universal_stats.ts','universal_stats.ts'],
 ['c204_training_journal.ts','training_journal.ts'],
 ['c204_training_panel.ts','training_panel.ts'],
];
for(const [from,to] of patterns){
  if(!existsSync(join(src,from)))throw Error('C204_SOURCE_MISSING '+from);
  if(existsSync(join(dir,to)))throw Error('C204_WONT_OVERWRITE '+to);
}
mkdirSync(dir,{recursive:true});
for(const [from,to] of patterns){
  let value=readFileSync(join(src,from),'utf8');
  value=value.replaceAll("'./c2_universal_stats.ts'","'./universal_stats'")
             .replaceAll("'./c204_training_journal.ts'","'./training_journal'");
  writeFileSync(join(dir,to),value,'utf8');
}
console.log('HIGHFLY_C204_TRAINING_MODULES_STAGED=3');
