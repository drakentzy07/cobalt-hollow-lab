// G5 source-by-source license preservation contract. Run inside the candidate
// after the surgical sanitizer, before manifest generation.
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {strict as assert} from 'node:assert';
const sha=b=>createHash('sha256').update(b).digest('hex');
const original=file=>execFileSync('git',['show','HEAD:public/'+file],{maxBuffer:64*1024*1024});
const current=file=>readFileSync('public/'+file);
const kept=[
 'models/chars/modular/warrior_modular.glb',
 'models/weapons/sword_1handed.glb','models/weapons/axe_1handed.glb',
 'models/weapons/dagger.glb','models/weapons/staff.glb',
 'models/weapons/shield_round.glb','models/weapons/skeleton_blade.glb',
 'models/props/column.glb','models/props/mushroom_red.glb',
 'models/props/dock_platform.glb','ui/items/backpack.webp',
 'ui/mobs/bogtoad.webp','textures/loading/eastbrook-square.webp',
 'map_art/eastbrook_vale.png','map_art/mirefen_marsh.png',
 'ui/weapons/axe_a.jpg'
];
for(const f of kept){
 assert.ok(existsSync('public/'+f),'G5_KNOWN_GOOD_MISSING_'+f);
 assert.equal(sha(current(f)),sha(original(f)),'G5_WRONGLY_REPLACED_FREE_ASSET_'+f);
}
const replaced=[
 'models/chars/npc_gear/harbormaster_tricorne.glb',
 'models/chars/npc_gear/harbormaster_spyglass.glb',
 'models/weapons/emberfang_sword.glb',
 'models/weapons/purple_sword.glb',
 'models/weapons/guildmark_arming_sword.glb',
 'models/weapons/ashspark_shiv.glb',
 'models/weapons/cinderbrand.glb',
 'models/weapons/forgeheart_stave.glb',
 'ui/chrome/character.webp','ui/skills/mage/fireball.webp',
 'map_art/world_overview.webp','ui/store/season-01-armory-promo.webp',
 'ui/weapons/emberfang_sword.jpg',
 'ui/weapons/ashspark_shiv.jpg'
];
for(const f of replaced){
 assert.ok(existsSync('public/'+f),'G5_REQUIRED_RESTRICTED_PATH_MISSING_'+f);
 assert.notEqual(sha(current(f)),sha(original(f)),'G5_RESTRICTED_ART_STILL_ORIGINAL_'+f);
}
const a=JSON.parse(readFileSync('public/highfly-license-audit.json','utf8'));
assert.ok(a.replacedPaths.includes('models/chars/npc_gear/harbormaster_spyglass.glb'));
assert.ok(a.replacedPaths.includes('models/weapons/emberfang_sword.glb'));
assert.ok(!a.replacedPaths.includes('models/weapons/sword_1handed.glb'));
assert.ok(!a.replacedPaths.includes('ui/mobs/bogtoad.webp'));
assert.ok(!a.replacedPaths.includes('ui/items/backpack.webp'));
assert.equal(new Set(a.replacedPaths).size,a.replacedPaths.length,'G5_DUPLICATED_ASSET_AUDIT_ENTRIES');
// Every upstream media file changed MUST be in the license ledger.
const diff=execFileSync('git',['diff','--name-only','--','public'],{maxBuffer:32*1024*1024}).toString('utf8').trim();
const changed=diff?diff.split('\n').map(x=>x.replace(/^public\//,'')):[];
assert.deepEqual(changed.sort(),a.replacedPaths.slice().sort(),'G6_UNDECLARED_SOURCE_ASSET_MUTATION');
for(const p of ['map_art/eastbrook_vale.png','ui/weapons/axe_a.jpg']){
 assert.ok(!a.replacedPaths.includes(p),'G6_ALLOWED_ART_WRONGLY_SCRUBBED_'+p);
}
for(const p of ['map_art/world_overview.webp','ui/weapons/emberfang_sword.jpg']){
 assert.ok(a.replacedPaths.includes(p),'G6_RIGHTS_RESERVED_ART_NOT_REPLACED_'+p);
}
assert.equal(a.stats.removed,0,'G5_DELETED_MEDIA_FORBIDDEN');
assert.ok(a.stats.weapons>0&&a.stats.weapons<65,'G5_LICENSE_WEAPON_WHITELIST_SCOPE_BROKEN');
console.log('HIGHFLY_G5_CC0_AND_FORK_ASSET_PRESERVATION=PASS count='+kept.length+' selective_replacements='+a.replacedPaths.length+' oldG2Weapons=110 now='+a.stats.weapons);
