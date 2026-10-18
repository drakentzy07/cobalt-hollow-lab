/** R39A isolated clip-track partitioner. No effect on authoritative Sim. */
import * as THREE from 'three';
const LOWER = new Set([
 'root','hips','upperleg.l','upperleg.r','lowerleg.l','lowerleg.r',
 'foot.l','foot.r','toes.l','toes.r',
]);
const UPPER = new Set([
 'spine','chest','head','upperarm.l','upperarm.r','lowerarm.l','lowerarm.r',
 'wrist.l','wrist.r','hand.l','hand.r','handslot.l','handslot.r',
]);
export interface R39MaskedPair { lower:THREE.AnimationClip; upper:THREE.AnimationClip; }
export function r39TrackBone(name:string):string {
  const dot=name.lastIndexOf('.');
  if(dot<=0)return '';
  const target=name.slice(0,dot);
  // THREE.GLTFLoader usually emits 'hips.position'; tolerate scoped track names.
  const bracket=target.match(/\[([^\]]+)\]$/);
  return bracket?.[1]??target.split('/').pop()??'';
}
export function r39MaskedMobilePair(
  locomotion:THREE.AnimationClip,
  attack:THREE.AnimationClip,
):R39MaskedPair|null {
  if(!Number.isFinite(locomotion.duration)||locomotion.duration<=0||
     !Number.isFinite(attack.duration)||attack.duration<=0)return null;
  const down=locomotion.tracks.filter(t=>LOWER.has(r39TrackBone(t.name)));
  const up=attack.tracks.filter(t=>UPPER.has(r39TrackBone(t.name)));
  // Never render half a rig if donor naming, animations or props drift.
  if(!down.some(t=>r39TrackBone(t.name).startsWith('upperleg.'))||
     !down.some(t=>r39TrackBone(t.name)==='hips')||
     !up.some(t=>r39TrackBone(t.name).startsWith('upperarm.'))||
     !up.some(t=>r39TrackBone(t.name)==='chest'||r39TrackBone(t.name)==='spine'))
    return null;
  const all=new Set([...down,...up].map(t=>t.name));
  if(all.size!==down.length+up.length)return null;
  // Reuse existing immutable KeyframeTrack objects. No mutation of donor clips.
  return {
    lower:new THREE.AnimationClip(locomotion.name+'__HF_R39_LOWER',locomotion.duration,down),
    upper:new THREE.AnimationClip(attack.name+'__HF_R39_UPPER',attack.duration,up),
  };
}
