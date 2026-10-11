/** Schema + offline director POC test ONLY. No GLB, Sim or browser integration. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newHunterState,eligibleRegionVisit,claim} from './unique_director_prototype.mjs';
const p='docs/HIGHFLY_UNIQUE_MONSTERS/';
const read=(n)=>JSON.parse(fs.readFileSync(p+n,'utf8'));
const r=read('HIGHFLY_UNIQUE_MONSTERS_ROSTER.json');
assert.equal(r.enabledByDefault,false);
assert.equal(r.bosses.length,5);
assert.equal(new Set(r.bosses.map(x=>x.id)).size,5);
const ai=read('HIGHFLY_UNIQUE_BOSS_ATTACKS_PHASES_AI.json');
assert.equal(ai.bosses.length,5);
const graph=read('HIGHFLY_UNIQUE_WORLD_UNLOCK_GRAPH.json');
assert.equal(graph.edges.length,15);
const data=fs.readFileSync(p+'HIGHFLY_UNIQUE_BOSS_STATS_LV1_99.csv','utf8').trim().split('\n');
assert.equal(data.length,496,'5 x levels 1..99 + header');
assert.ok(data.slice(1).every(x=>x.includes('UNVERIFIED')));
for(const b of r.bosses){
 assert.equal(b.stages.length,9);assert.equal(b.phaseGraph.length,3);
 assert.ok(b.abilityIds.length>=6);assert.ok(!b.installedGlb&&!b.liveAi&&!b.scenarioRegistered);
 assert.ok(ai.bosses.find(x=>x.bossId===b.id).attacks.every(a=>a.enabled===false));
 const st=newHunterState();
 assert.equal(eligibleRegionVisit(st,'Hunter1',b.id,false).manifested,false);
 let seen=false;
 for(let i=0;i<4;i++){const o=eligibleRegionVisit(st,'Hunter1',b.id,true);seen=seen||o.manifested;}
 assert.equal(seen,true,'guaranteed fourth eligible visit');
 const first=claim(st,'Hunter1',b.id,'enc1','FIRST_CLEAR',true);
 assert.equal(first.ok,true);
 assert.equal(claim(st,'Hunter1',b.id,'enc1','FIRST_CLEAR',true).ok,false);
 assert.equal(claim(st,'Hunter1',b.id,'enc2','FIRST_CLEAR',true).ok,false);
 const restored=JSON.parse(JSON.stringify(st));
 assert.equal(claim(restored,'Hunter1',b.id,'enc3','FIRST_CLEAR',true).ok,false);
 assert.equal(eligibleRegionVisit(restored,'Hunter1',b.id,true).manifested,false);
}
console.log('UE00-UE02 DESIGN SCHEMA & ISOLATED DIRECTOR POC PASS — NOT BOSS RUNTIME');
