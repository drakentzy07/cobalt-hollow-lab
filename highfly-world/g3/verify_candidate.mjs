// G3 Pages distribution audit. Run AFTER sanitize -> manifest generate -> Vite -> emit/prune.
import {readFileSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {strict as assert} from 'node:assert';
const s=readFileSync('src/render/assets/manifest.generated.ts','utf8');
const i=s.indexOf('\n{'), j=s.indexOf('} as const;',i);
assert.ok(i>0&&j>i,'MEDIA_ASSETS not generated');
const assets=JSON.parse(s.slice(i+1,j+1));
const keys=Object.keys(assets);
assert.ok(keys.length>1500,'Expected the pinned complete 0.44.7 world media catalogue');
const sample=['models/props/column.glb','models/props/mushroom_red.glb','models/props/mushroom_tan.glb','models/props/dock_platform.glb','models/props/reeds.glb','models/weapons/sword_1handed.glb'];
for(const logical of sample) assert.ok(assets[logical],'Missing G3 visual-test model '+logical);
const mediaSource=readFileSync('src/render/assets/media.ts','utf8');
assert.ok(mediaSource.includes('import.meta.env.BASE_URL'),'Pages base prefix missing from resolver');
let checked=0;let total=0;
for(const [logical,hashed] of Object.entries(assets)){
 assert.ok(typeof hashed==='string' && hashed.startsWith('/media/'),'bad hashed route '+logical);
 const local=path.join('dist',hashed.slice(1));
 const source=path.join('public',logical);
 assert.ok(existsSync(local),'GLB/media missing on public Pages '+hashed);
 assert.ok(existsSync(source),'sanitized source unexpectedly absent '+logical);
 const d=createHash('sha256').update(readFileSync(source)).digest('hex').slice(0,12);
 assert.ok(hashed.endsWith('.'+d+path.extname(logical)),'STALE_HASH_MANIFEST '+logical+' was '+hashed+' expected '+d);
 assert.equal(statSync(local).size,statSync(source).size,'Hash target size mismatch '+logical);
 checked++;total+=statSync(local).size;
}
const html=readFileSync('dist/index.html','utf8');
assert.ok(html.includes('/cobalt-hollow-lab/assets/'),'HTML Vite project base missing');
assert.ok(!html.includes('/HIGHFLY-WORLD/assets/'),'stale lab base found');
console.log('HIGHFLY_G3_ALL_MEDIA_MANIFEST_AND_PAGES_BASE_VALID=PASS files='+checked+' bytes='+total);
