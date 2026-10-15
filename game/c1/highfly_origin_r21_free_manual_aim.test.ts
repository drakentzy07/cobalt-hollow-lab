import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import { highflyManualAim, highflyManualRayTarget, highflyEffectiveAimRange } from '../src/highfly/highfly_origin_r21_aim_intent';
import {highflyAimSpec} from '../src/highfly/highfly_origin_r20_premium_aim';
const actor={x:0,y:0,z:0};
const camera=(x:number,_y:number,z:number)=>({x:100+x*10,y:100-z*10,behind:false});
const turned=(x:number,_y:number,z:number)=>({x:100-z*10,y:100-x*10,behind:false});
describe('HIGHFLY R21 manual drag is never an auto-target',()=>{
 it('RIGHT thumb direction points RIGHT on screen, not the opposite',()=>{
   const a=highflyManualAim(actor,95,0,30,'line',camera,0);
   expect(a.dir.x).toBeCloseTo(1,5);expect(a.dir.z).toBeCloseTo(0,5);
   expect(a.point.x).toBeCloseTo(30,5);
 });
 it('UP drag points upward on screen through original camera projection',()=>{
   const a=highflyManualAim(actor,0,-100,30,'line',camera,0);
   expect(a.dir.z).toBeCloseTo(1,5);expect(a.dir.x).toBeCloseTo(0,5);
 });
 it('same directional intent holds after camera is rotated',()=>{
   const a=highflyManualAim(actor,80,0,30,'line',turned,Math.PI/2);
   const tip=turned(a.point.x,0,a.point.z);
   expect(tip.x).toBeGreaterThan(100);
   expect(tip.y).toBeCloseTo(100,4);
 });
 it('ground circle distance scales with drag and remains within native reach',()=>{
   const p=highflyManualAim(actor,50,0,30,'circle',camera,0);
   expect(p.distance).toBeLessThan(30);
   expect(p.distance).toBeGreaterThan(2);
 });
 it('manual strike picks ONLY targets inside the lane; ignores a lower HP monster off-ray',()=>{
   const enemies=[
    {id:1,kind:'mob',hostile:true,dead:false,hp:1,maxHp:30,pos:{x:5,z:4}},
    {id:2,kind:'mob',hostile:true,dead:false,hp:30,maxHp:30,pos:{x:0.5,z:3}},
    {id:3,kind:'mob',hostile:true,dead:false,hp:25,maxHp:30,pos:{x:0.1,z:40}},
   ];
   expect(highflyManualRayTarget(actor,enemies,{x:0,z:1},4.5,1.2)).toBe(2);
   expect(highflyManualRayTarget(actor,enemies,{x:1,z:0},4.5,1.2)).toBeNull();
 });
 it('native melee range zero is interpreted as short preview only',()=>{
   expect(highflyAimSpec('sinister_strike')).toMatchObject({shape:'line',range:4.5});
   expect(highflyAimSpec('ambush')).toMatchObject({shape:'line',range:4.5});
   expect(highflyEffectiveAimRange({range:0,requiresTarget:true})).toBe(4.5);
   expect(highflyAimSpec('blizzard')).toMatchObject({shape:'circle',radius:7});
   expect(highflyAimSpec('heroic_leap')).toMatchObject({shape:'dash',radius:6});
 });
 it('new preview never hard-snaps the line to an enemy during drag',()=>{
   const s=readFileSync('src/highfly/highfly_origin_r17_hud.ts','utf8');
   const move=s.slice(s.indexOf('  const move=(ev:PointerEvent)=>{'),s.indexOf('  const clear=()=>{'));
   expect(move).toContain('highflyManualRayTarget(');
   expect(move).toContain('showHalo(aimed.point.x');
   expect(move).not.toContain('h.target(');
   expect(move).not.toContain('showHalo(enemy.pos');
   expect(s).toContain('h.face(aimed.point)');
   expect(s).toContain('h.castAt(def.id,aimed.point)');
 });
});
