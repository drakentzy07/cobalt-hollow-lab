#!/usr/bin/env python3
"""R39A add-only, native mobile Hunter animation split; preserves all gameplay.
Manual basic ATK moving on ground: legs keep walking/running while original
attack animation controls torso/arms. All skills/full-body motions untouched.
Fail-closed on donor drift, original full-body attack remains fallback.
"""
from pathlib import Path
import shutil

p=Path('src/render/characters/visual.ts')
s=p.read_text('utf8')
def one(old,new):
 global s
 n=s.count(old)
 if n!=1:raise SystemExit('R39A_VISUAL_DRIFT:'+str(n)+':'+old[:90])
 s=s.replace(old,new,1)

one("import * as THREE from 'three';",
    "import * as THREE from 'three';\nimport {r39MaskedMobilePair, type R39MaskedPair} from './highfly_r39_anim_split';")
one("  private actions = new Map<string, THREE.AnimationAction>();",
    """  private actions = new Map<string, THREE.AnimationAction>();
  // R39A: only the owner's moving manual ATK, never other players' NPC casts.
  private r39MovingGround = false;
  private r39MobileLower: THREE.AnimationAction | null = null;
  private r39MobileUpper: THREE.AnimationAction | null = null;
  private readonly r39MaskedClips = new Map<string,R39MaskedPair>();""")
one("  update(dt: number, s: AnimState, animate: boolean, reducedMotion = false): void {",
    """  update(dt: number, s: AnimState, animate: boolean, reducedMotion = false): void {
    // Read movement from ACTUAL renderer state. Never invent body displacement.
    this.r39MovingGround = Boolean(this.def.modular && this.key.startsWith('player_') &&
      s.moving && s.running && !s.airborne && !s.swimming && !s.wading &&
      !s.casting && !s.spinning && !s.sitting && !s.stealthed && !s.dead);
    if(this.r39MobileLower){
      // If thumbstick is released mid-swing, stop advancing the stride until
      // the upper-body attack finishes rather than skating forward in place.
      this.r39MobileLower.paused=!this.r39MovingGround;
    }""")
# Splits are intentionally only for manual basic attacks; rush / magic /
# signature / spells always retain original choreography.
start=s.index('  playAttack(abilityId?: string): void {')
end=s.index('  /** Bladed Gyre',start)
slice_=s[start:end]
anchor='this.currentOneShotIsAttack = true;'
count=slice_.count(anchor)
if count!=4:raise SystemExit('R39A_ATTACK_BRANCH_COUNT_DRIFT:'+str(count))
slice_=slice_.replace(anchor,anchor+"\n      this.r39StartMobileBasic(abilityId);")
s=s[:start]+slice_+s[end:]

marker="  private playOneShot(\n    name: string,"
if s.count(marker)!=1:raise SystemExit('R39A_ONE_SHOT_ANCHOR_DRIFT')
methods="""  /** Kept entirely local to this Visual's existing AnimationMixer. */
  private r39ClearMobileSplit():number|null {
    const lower=this.r39MobileLower,upper=this.r39MobileUpper;
    if(!lower && !upper)return null;
    const phase=lower ? lower.time : null;
    lower?.stop();upper?.stop();
    this.r39MobileLower=null;this.r39MobileUpper=null;
    return phase;
  }

  /** R39A: grounded RUNNING manual basic ATK only. No skill, cast or hit changes. */
  private r39StartMobileBasic(abilityId?:string):void {
    if(abilityId || !this.r39MovingGround || this.warriorBody.rushOwnsBody ||
       !this.current || !this.currentIsOneShot)return;
    const attack=this.current;
    const gait=this.action(this.def.clips.run);
    if(!gait)return;
    const runClip=gait.getClip(), attackClip=attack.getClip();
    const key=runClip.uuid+':'+attackClip.uuid;
    let pair=this.r39MaskedClips.get(key);
    if(!pair) {
      const created=r39MaskedMobilePair(runClip,attackClip);
      if(!created)return; // original attack still fully plays, fail closed
      this.r39MaskedClips.set(key,created);
      pair=created;
    }
    // Native playOneShot has already picked the correct weapon/animation.
    // Take over its PRESENTATION ONLY. Both actions own disjoint tracks,
    // so mixer never blends legs with sword clips or arms with run clips.
    const attackScale=attack.timeScale;
    for(const a of this.actions.values())
      if(!a.paused && a.isRunning())a.stop();
    const lower=this.mixer.clipAction(pair.lower);
    const upper=this.mixer.clipAction(pair.upper);
    lower.reset();lower.paused=false;lower.setEffectiveWeight(1);
    lower.setLoop(THREE.LoopRepeat,Infinity);lower.clampWhenFinished=false;
    lower.timeScale=1;lower.play();
    upper.reset();upper.paused=false;upper.setEffectiveWeight(1);
    upper.setLoop(THREE.LoopOnce,1);upper.clampWhenFinished=true;
    upper.timeScale=attackScale;upper.play();
    this.r39MobileLower=lower;this.r39MobileUpper=upper;
    this.current=upper;this.currentIsOneShot=true;
    this.currentOneShotIsAttack=true;
  }

"""
s=s.replace(marker,methods+marker,1)
one("  private playOneShot(\n    name: string,\n    timeScale: number,\n    repeats = 1,\n    emoteId: OverheadEmoteId | null = null,\n  ): void {\n    this.currentOneShotIsAttack = false;",
    """  private playOneShot(
    name: string,
    timeScale: number,
    repeats = 1,
    emoteId: OverheadEmoteId | null = null,
  ): void {
    this.r39ClearMobileSplit(); // a new attack replaces the old split
    this.currentOneShotIsAttack = false;""")
one("  private fadeTo(next: THREE.AnimationAction | null, fade: number, oneShot: boolean): void {\n    if (!next) return;\n    if (next === this.current && !oneShot) return;",
    """  private fadeTo(next: THREE.AnimationAction | null, fade: number, oneShot: boolean): void {
    if (!next) return;
    if (next === this.current && !oneShot) return;
    // Original full-body pose machine remains the owner outside running ATK.
    const r39GaitPhase=this.r39ClearMobileSplit();""")
one("    this.beginAction(next, prev, fade);\n    this.current = next;\n    this.currentIsOneShot = oneShot;",
    """    this.beginAction(next, prev, fade);
    if(r39GaitPhase!==null && (this.baseState==='run'||this.baseState==='walk')) {
      const dur=next.getClip().duration;
      if(dur>0)next.time=r39GaitPhase%dur;
    }
    this.current = next;
    this.currentIsOneShot = oneShot;""")
one("  private enterDeath(): void {\n    this.stopTemplarsVerdictFx();",
    """  private enterDeath(): void {
    this.r39ClearMobileSplit();
    this.stopTemplarsVerdictFx();""")
p.write_text(s,'utf8')
target=Path('src/render/characters/highfly_r39_anim_split.ts')
shutil.copy2('../v9-corrections/game/c1/highfly_origin_r39a_anim_split.ts',target)
assert 'r39StartMobileBasic(abilityId);' in s
assert s.count('this.r39StartMobileBasic(abilityId);')==4
print('HIGHFLY_R39A_NATIVE_MANUAL_BASIC_SPLIT_NO_SKILL_OVERRIDES_APPLIED=1')
