import {describe,it,expect} from 'vitest';
import {furyStickWorld} from '../src/game/highfly_fury_core';
import {Sim} from '../src/sim/sim';
const near=(a:number,b:number,e=0.045)=>expect(Math.abs(a-b)).toBeLessThan(e);
describe('HIGHFLY FURY P4A continuous analog movement',()=>{
  it('rejects deadzone, out-of-bounds and non-finite coordinates',()=>{
    expect(furyStickWorld(0,0,0)).toBeNull();
    expect(furyStickWorld(0.04,-0.04,0)).toBeNull();
    expect(furyStickWorld(Infinity,0,0)).toBeNull();
    expect(furyStickWorld(0,-1,NaN)).toBeNull();
  });
  it('maps all four axes with ClaudeCraft original right-handed screen convention',()=>{
    const forward=furyStickWorld(0,-1,0)!;
    const back=furyStickWorld(0,1,0)!;
    const right=furyStickWorld(1,0,0)!;
    const left=furyStickWorld(-1,0,0)!;
    near(forward.worldX,0);near(forward.worldZ,1);
    near(back.worldX,0);near(back.worldZ,-1);
    near(right.worldX,-1);near(right.worldZ,0);
    near(left.worldX,1);near(left.worldZ,0);
    const yaw90=furyStickWorld(0,-1,Math.PI/2)!;
    near(yaw90.worldX,1);near(yaw90.worldZ,0);
  });
  it('preserves the full continuum and partial strength rather than 8 discrete bins',()=>{
    const a=furyStickWorld(0.26,-0.77,0)!;
    const b=furyStickWorld(0.28,-0.77,0)!;
    expect(Math.abs(a.facing-b.facing)).toBeGreaterThan(0.001);
    const slow=furyStickWorld(0,-0.36,0)!;
    expect(slow.power).toBeGreaterThan(0);
    expect(slow.power).toBeLessThan(.5);
    near(Math.hypot(a.worldX,a.worldZ),a.power,.001);
    const diag=furyStickWorld(0.5,-0.5,0)!;
    expect(diag.worldX).toBeLessThan(0);expect(diag.worldZ).toBeGreaterThan(0);
  });
  it('actually displaces player in the full original collision/terrain Sim',()=>{
    const sim=new Sim({seed:20061,playerClass:'warrior',playerName:'Draken'});
    const before={x:sim.player.pos.x,z:sim.player.pos.z};
    const f=furyStickWorld(0,-1,0)!;
    Object.assign(sim.moveInput,{forward:false,back:false,strafeLeft:false,strafeRight:false,
      analogWorldX:f.worldX,analogWorldZ:f.worldZ});
    sim.player.facing=f.facing;
    for(let i=0;i<10;i++)sim.tick();
    expect(sim.player.pos.z-before.z).toBeGreaterThan(.2);
    expect(Math.abs(sim.player.pos.x-before.x)).toBeLessThan(1);
    expect(Number.isFinite(sim.player.pos.y)).toBe(true);
  });
});
