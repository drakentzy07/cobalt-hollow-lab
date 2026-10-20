import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {highflyAimShape,highflyWorldAim,highflyAimTarget} from '../src/highfly/combat/f24_aim_core';
const read=(path:string)=>readFileSync(path,'utf8');
describe('HIGHFLY F2.4 directional aiming of acquired skills',()=>{
  it('previews line, cone, area and leap separately',()=>{
    expect(highflyAimShape('fireball')).toBe('line');
    expect(highflyAimShape('charge')).toBe('cone');
    expect(highflyAimShape('frost_nova')).toBe('circle');
    expect(highflyAimShape('heroic_leap')).toBe('leap');
    expect(highflyAimShape('unknown')).toBeNull();
  });
  it('left/right/up camera relative gestures produce distinct world bearings',()=>{
    const a=highflyWorldAim({x:0,z:0},0,0,-94,30);
    const b=highflyWorldAim({x:0,z:0},0,94,0,30);
    expect(a.z).toBeCloseTo(30);expect(a.x).toBeCloseTo(0);
    expect(b.x).toBeCloseTo(30);expect(b.z).toBeCloseTo(0);
  });
  it('does not require clicking a monster: aim selects hostile in cone',()=>{
    const mobs=[{id:5,pos:{x:0,z:10}},{id:9,pos:{x:8,z:1}},{id:8,pos:{x:0,z:40}}];
    expect(highflyAimTarget(mobs,{x:0,z:0},0,25,true,()=>true)?.id).toBe(5);
    expect(highflyAimTarget(mobs,{x:0,z:0},Math.PI/2,25,true,()=>true)?.id).toBe(9);
    expect(highflyAimTarget(mobs,{x:0,z:0},0,5,true,()=>true)).toBeNull();
  });
  it('reuses native cast path; independent beta save and 3D reticle',()=>{
    expect(read('src/ui/hud/action_bar/mobile_action_ring_controller.ts')).toContain("deps.originAimGesture?.('start'");
    expect(read('src/ui/hud.ts')).toContain('this.playerGroundAim.commitAt(originAim)');
    expect(read('src/render/ground_aim_reticle_visual.ts')).toContain("shape==='cone'");
    expect(read('src/game/highfly_offline_save.ts')).toContain("'highfly-offline-f24-combat-beta'");
    expect(read('src/highfly/game_c1_runtime.ts')).toContain("'highfly:origin:f24:hud:'");
  });
});
