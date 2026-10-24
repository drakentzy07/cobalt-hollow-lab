// G1 static contracts, execute against a patched v0.44.7 candidate after G0 then G1.
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
assert.equal(JSON.parse(read('package.json')).version,'0.44.7');
const main=read('src/main.ts'),html=read('index.html'),assets=read('src/render/characters/assets.ts');
const sim=read('src/sim/sim.ts'),modular=read('src/render/characters/modular.ts');
for(const s of ['HF_GENESIS_G1','highflyWornSlots','sim.unequipItem(\'mainhand\'','sim.unequipItem(\'offhand\'','sim.unequipItem(\'chest\'','hf-world-lab','highfly.world.genesis.g1.profile.v1'])
  assert.ok(main.includes(s),'missing G1 entry/visual contract: '+s);
for(const s of ['hf-hunter-name','hf-hunter-gender','hf-world-lab','hf-world-enter'])
  assert.ok(html.includes('id="'+s+'"'),'missing creator control: '+s);
assert.ok(assets.includes('!weaponItemId && !weaponSkinId) return null'),'phantom sword fallback remains');
assert.ok(assets.includes('if (!att) continue;'),'null weapon swap is not safe');
assert.ok(sim.includes('mainhand: classDef.startWeapon'),'donor sim starter was unexpectedly changed');
assert.ok(modular.includes('worn: KNIGHT_FULL'),'donor DEFAULT_LOOK unexpectedly changed');
assert.ok(main.includes("startOffline('warrior', name, 0)"),'G1 temporary internal class fixture missing');
assert.ok(!main.includes('HIGHFLY_G0_WORLD_BOOT_FAILED'),'obsolete G0 path still used');
console.log('HIGHFLY_G1_BARE_MODULAR_AND_TWO_ENTRIES_CONTRACT=PASS');
