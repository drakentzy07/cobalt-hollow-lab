import test from 'node:test';
import assert from 'node:assert/strict';
import {R39_ACTIONS,R39_BRANCHES,R39InputBuffer,R39_BUFFER_MS,
selectR39Attack,r39Phase,r39CanConnect,r39BreakPreview} from './highfly_combat_supreme_r39_p0.mjs';

test('single Hunter contextual attack: no class/character swapping',()=>{
 const c={unlockedMoves:['running_attack','dash_attack','air_attack','plunge','back_attack','parry_counter','dodge_counter','down_execution'],enemyInReach:true,enemyHostile:true};
 assert.equal(selectR39Attack({...c,running:true}).id,'running_attack');
 assert.equal(selectR39Attack({...c,running:true,dashWindow:true}).id,'dash_attack');
 assert.equal(selectR39Attack({...c,running:true,airborne:true}).id,'air_attack');
 assert.equal(selectR39Attack({...c,airborne:true,falling:true}).id,'plunge');
 assert.equal(selectR39Attack({...c,running:true,behindEnemy:true}).id,'back_attack');
 assert.equal(selectR39Attack({...c,parryCounterOpen:true}).id,'parry_counter');
 assert.equal(selectR39Attack({...c,dodgeCounterOpen:true}).id,'dodge_counter');
 assert.equal(selectR39Attack({...c,enemyDowned:true,parryCounterOpen:true}).id,'down_execution');
});
test('no automatic unique or execution from unavailable mastery/hostile target',()=>{
 assert.equal(selectR39Attack({running:true,enemyDowned:true}).id,'basic1');
 assert.equal(selectR39Attack({enemyInReach:true,enemyHostile:false,enemyDowned:true,unlockedMoves:['down_execution']}).id,'basic1');
 assert.equal(selectR39Attack({dead:true}).id,null);
 assert.equal(selectR39Attack({inputLocked:true,unlockedMoves:['running_attack'],running:true}).id,null);
 assert.equal(selectR39Attack({basicStep:3}).id,'basic3');
});
test('startup active connect recovery are bounded; only connect can branch',()=>{
 const a=R39_ACTIONS.basic1;
 assert.equal(r39Phase('basic1',a.startup-1),'startup');
 assert.equal(r39Phase('basic1',a.startup),'active');
 assert.equal(r39Phase('basic1',a.startup+a.active),'connect');
 assert.equal(r39Phase('basic1',a.startup+a.active+a.connect),'recovery');
 assert.equal(r39Phase('basic1',a.startup+a.active+a.connect+a.recovery),'finished');
 assert.equal(r39CanConnect('basic1','basic2',a.startup+a.active+1),true);
 assert.equal(r39CanConnect('basic1','basic2',a.startup+1),false);
 assert.equal(r39CanConnect('basic1','down_execution',a.startup+a.active+1),false);
 assert.equal(r39CanConnect('basic1','skill:meteor',a.startup+a.active+1),false);
 assert.equal(r39CanConnect('basic1','skill:meteor',a.startup+a.active+1,{skillAuthorized:true}),true);
 assert.equal(r39CanConnect('basic1','basic2',a.startup+a.active+1,{hitRequired:true,hitConfirmed:false}),false);
});
test('buffer is finite, once-only, expiry-safe and does not manufacture attacks',()=>{
 const b=new R39InputBuffer();
 assert.equal(b.push({receipt:'touch-13',kind:'attack',atMs:100}),true);
 assert.equal(b.push({receipt:'touch-13',kind:'attack',atMs:101}),false);
 assert.equal(b.push({receipt:'click-dupe',kind:'invalid',atMs:100}),false);
 assert.equal(b.take(101,()=>false),null);
 assert.equal(b.size(),1);
 assert.equal(b.take(101,()=>true)?.receipt,'touch-13');
 assert.equal(b.take(102,()=>true),null);
 assert.equal(b.push({receipt:'exp',kind:'skill',atMs:1000}),true);
 assert.equal(b.take(1000+R39_BUFFER_MS+1,()=>true),null);
 assert.equal(b.size(),0);
 b.push({receipt:'new',kind:'attack',atMs:3000});
 b.clear();
 assert.equal(b.take(3001,()=>true),null);
});
test('mobility remains an explicit per-action flag; no unapproved frame reset',()=>{
 assert.equal(R39_ACTIONS.running_attack.moving,true);
 assert.equal(R39_ACTIONS.air_attack.moving,true);
 assert.equal(R39_ACTIONS.plunge.moving,false);
 assert.equal(R39_BRANCHES.down_execution.length,0);
});
test('Break is independent of HP and temporary, cannot create damage event',()=>{
 const before={phase:'guarded',max:100,remaining:40,breakWindowMs:600};
 const broken=r39BreakPreview(before,45,16);
 assert.deepEqual(broken,{phase:'broken',max:100,remaining:0,punishMs:600});
 const still=r39BreakPreview(broken,999,300);
 assert.equal(still.punishMs,300);
 const recovered=r39BreakPreview(still,0,300);
 assert.equal(recovered.phase,'guarded');
 assert.equal(recovered.remaining,100);
 assert.equal('hp' in recovered,false);
});
