import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {r39MaskedMobilePair,r39TrackBone} from '../src/render/characters/highfly_r39_anim_split';
function track(n:string,axis=1) {
 return new THREE.VectorKeyframeTrack(n+'.position',[0,.15,.3],[0,0,0,axis,0,0,axis,0,0]);
}
function make(name:string,hasLeg=true){
 return new THREE.AnimationClip(name,.3,[
  track('root'),track('hips'),...(hasLeg?[track('upperleg.l'),track('lowerleg.l'),track('foot.l')]:[]),
  track('spine'),track('chest'),track('upperarm.r'),track('lowerarm.r'),track('hand.r'),
 ]);
}
describe('HIGHFLY R39A: actual two-layer animation contract',()=>{
 it('splits running feet from swinging torso; no bones are owned by both',()=>{
  const run=make('Running_A'),attack=make('1H_Melee_Attack_Chop');
  const combo=r39MaskedMobilePair(run,attack);
  expect(combo).not.toBeNull();
  const lo=combo!.lower.tracks.map(t=>r39TrackBone(t.name));
  const up=combo!.upper.tracks.map(t=>r39TrackBone(t.name));
  expect(lo).toContain('hips');expect(lo).toContain('upperleg.l');
  expect(up).toContain('chest');expect(up).toContain('upperarm.r');
  expect(lo.every(x=>!up.includes(x))).toBe(true);
  expect(run.tracks).toHaveLength(10);expect(attack.tracks).toHaveLength(10);
 });
 it('refuses incomplete donor rigs instead of deforming a character',()=>{
  expect(r39MaskedMobilePair(make('run',false),make('swing'))).toBeNull();
  expect(r39TrackBone('root.quaternion')).toBe('root');
  expect(r39TrackBone('.bones[upperarm.r].quaternion')).toBe('upperarm.r');
 });
 it('keeps a single mixer with independent lower/upper clip actions',()=>{
  const pair=r39MaskedMobilePair(make('run'),make('strike'))!;
  const root=new THREE.Group();
  for(const n of ['root','hips','upperleg.l','lowerleg.l','foot.l','spine','chest','upperarm.r','lowerarm.r','hand.r']) {
    const b=new THREE.Object3D();b.name=n;root.add(b);
  }
  const mixer=new THREE.AnimationMixer(root);
  const down=mixer.clipAction(pair.lower);const up=mixer.clipAction(pair.upper);
  down.setLoop(THREE.LoopRepeat,Infinity).play();
  up.setLoop(THREE.LoopOnce,1).play();
  mixer.update(.1);
  expect(root.getObjectByName('upperleg.l')!.position.x).toBeGreaterThan(0);
  expect(root.getObjectByName('upperarm.r')!.position.x).toBeGreaterThan(0);
  expect(root.getObjectByName('upperleg.l')).toBeDefined();
  down.stop();up.stop();mixer.stopAllAction();
 });
});
