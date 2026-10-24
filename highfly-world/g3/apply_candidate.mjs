// HIGHFLY GENESIS G3: root-aware WebGL media URL resolution.
import {readFileSync,writeFileSync} from 'node:fs';
const file='src/render/assets/media.ts';
const before="  if (import.meta.env.DEV) return `/${logical}`;\n  return MEDIA_ASSETS[logical] ?? `/${logical}`;";
const after="  const mapped = import.meta.env.DEV ? `/${logical}` : (MEDIA_ASSETS[logical] ?? `/${logical}`);\n  // G3: GitHub project-pages assets are served below /cobalt-hollow-lab/.\n  const base = import.meta.env.BASE_URL ?? '/';\n  return base === '/' ? mapped : `${base.replace(/\\/$/, '')}${mapped}`;";
const src=readFileSync(file,'utf8');
const count=src.split(before).length-1;
if(count!==1) throw Error('HIGHFLY_G3_MEDIA_URL_UPSTREAM_DRIFT_'+count);
writeFileSync(file,src.replace(before,after),'utf8');
console.log('HIGHFLY_G3_PROJECT_PAGES_MEDIA_URL_FIXED=PASS');
