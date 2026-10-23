import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {
 highflyContextualWeaponClips,highflyPickVariedClip,highflyComboAccent,
 highflyWeaponBasicClips,highflyF263DirectionalFlip,HIGHFLY_SOMERSAULT_SECONDS,
} from '../src/render/characters/highfly_combat_presentation';

describe('FURY 360 Combat 2.0 — contextual visuals; Sim is authority',()=>{
 it('running switches strike posture without inventing new clips or damage mechanics',()=>{
  const stationary=highflyContextualWeaponClips('worn_sword',1,false);
  const running=highflyContextualWeaponClips('worn_sword',1,true);
  expect(stationary[0]).toBe(highflyWeaponBasicClips('worn_sword',1)[0]);
  expect(running[0]).toBe('1H_Melee_Attack_Slice_Diagonal');
  expect(highflyContextualWeaponClips('worn_sword',2,true)[0]).toBe('1H_Melee_Attack_Chop');
  expect(new Set(running).size).toBe(running.length);
 });
 it('prefers a different live clip and gracefully falls back on real rig availability',()=>{
  const choices=['A','B','A','C'];
  expect(highflyPickVariedClip(choices,'A',x=>x!=='C')).toBe('B');
  expect(highflyPickVariedClip(choices,'B',x=>x==='B')).toBe('B');
  expect(highflyPickVariedClip(choices,'A',()=>false)).toBeNull();
 });
 it('removes exaggerated rolling torso while keeping native directional flips',()=>{
  for(const n of [1,2,3,4]){
    const pose=highflyComboAccent('highfly_basic_'+n,0.17);
    expect(Math.abs(pose.roll)).toBeLessThan(0.10);
    expect(Math.abs(pose.pitch)).toBeLessThan(0.10);
  }
  expect(highflyComboAccent('highfly_basic_3',0.36)).toEqual({roll:0,pitch:0});
  const flip=highflyF263DirectionalFlip(HIGHFLY_SOMERSAULT_SECONDS/2,'forward');
  expect(flip.pitch).toBeGreaterThan(3);
 });
 it('uses only existing upper-body animation tracks while allowing running legs',()=>{
  const visual=readFileSync('src/render/characters/visual.ts','utf8');
  expect(visual).toContain('highflyPickVariedClip(candidates,this.originLastPhysicalClip,');
  expect(visual).toContain('const tracks=(leftArmOnly||rightArmOnly)&&handTracks.length<2?upper:handTracks;');
  expect(visual).toContain('layer.fadeIn(0.055).play();');
  const sim=readFileSync('src/sim/combat/auto_attack.ts','utf8');
  expect(sim).toContain('weaponMult: 1');
  expect(sim).toContain('autoAttack: false');
 });
});
