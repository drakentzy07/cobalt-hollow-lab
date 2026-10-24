// G0 integration contract. Run AFTER apply_candidate.mjs on an exact v0.44.7 checkout.
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(p,'utf8');
const root=JSON.parse(read('package.json'));
assert.equal(root.version,'0.44.7','wrong donor version');
const main=read('src/main.ts');
const offline=read('src/game/offline_world_config.ts');
const html=read('index.html');
const classes=read('src/sim/content/classes.ts');
const world=read('src/sim/world.ts');
assert.ok(world.includes('export '),'native terrain engine missing');
assert.ok(main.includes("startupParams.get('hfWorld') === '1'"),'G0 entry gate missing');
assert.ok(main.includes("startOffline('warrior', 'WorldTester', 0)"),'G0 world boot missing');
assert.ok(offline.includes("VITE_HIGHFLY_WORLD_GENESIS === '1'"),'G0 tutorial override missing');
assert.ok(html.includes('id="hf-world-gate"'),'HIGHFLY intro missing');
assert.ok(html.includes('id="hf-world-enter"'),'HIGHFLY entry missing');
assert.ok(html.includes('HIGHFLY WORLD'),'branding missing');
assert.ok(html.includes('html.hf-world-genesis #start-screen'),'original home not hidden');
for(const id of ['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid']){
  assert.match(classes,new RegExp('^  '+id+': \\{','m'),'lost donor identity '+id);
}
// Underlying warrior is NOT a claim of a real classless character: a G0
// fixture only, replaced during G1 character/universal progression work.
console.log('HIGHFLY_WORLD_G0_CLEAN_UPSTREAM_OFFLINE_MAP_CONTRACT=PASS');
