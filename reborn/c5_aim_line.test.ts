import test from 'node:test';import assert from 'node:assert/strict';
import {lineSkillHit} from './c5_aim_line.ts';
const origin={x:0,z:0};
test('hits first mob physically intersected by aiming corridor, not lowest hp/nearest off-angle',()=>{
  assert.equal(lineSkillHit(origin,{x:0,z:20},[
    {id:1,pos:{x:5,z:3},dead:false,hostile:true},
    {id:2,pos:{x:0.7,z:8},dead:false,hostile:true},
    {id:3,pos:{x:0.2,z:13},dead:false,hostile:true},
  ],18),2);
});
test('free aim can whiff, ignores friendly, dead, out of range and behind',()=>{
  assert.equal(lineSkillHit(origin,{x:0,z:10},[
    {id:1,pos:{x:3,z:9},dead:false,hostile:true},
    {id:2,pos:{x:0,z:22},dead:false,hostile:true},
    {id:3,pos:{x:0,z:-3},dead:false,hostile:true},
    {id:4,pos:{x:0,z:5},dead:true,hostile:true},
    {id:5,pos:{x:0,z:3},dead:false,hostile:false},
  ],18),null);
});
test('diagonal direction and zero aim keep deterministic behavior',()=>{
  assert.equal(lineSkillHit(origin,{x:12,z:12},[
    {id:5,pos:{x:5,z:5},dead:false,hostile:true}
  ],18),5);
  assert.equal(lineSkillHit(origin,origin,[{id:1,pos:{x:1,z:1},dead:false,hostile:true}],18),null);
});
