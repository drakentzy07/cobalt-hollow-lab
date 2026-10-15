#!/usr/bin/env python3
"""HIGHFLY ORIGIN R1-2B P1: native cross-discipline animation on the SAME rig.
Keep V15.2 class skill playback untouched. ONLY modular player visuals
casting skills owned by another original class use this optional route.
No new body, no animation rerig, no skill grants or network/client authority.
"""
from pathlib import Path

def once(file: str, old: str, new: str) -> None:
    path=Path(file)
    src=path.read_text(encoding='utf-8')
    count=src.count(old)
    if count != 1:
        raise SystemExit(f'ORIGIN_R12B_VISUAL_SOURCE_DRIFT {file} count={count}: {old[:95]!r}')
    path.write_text(src.replace(old,new,1),encoding='utf-8')

# assets.ts already stores the original KayKit GLBs indexed by URL and already
# exposes ensureCharacterUrl(). Read clip from resident assets only; failed lazy
# loads leave the original attack/cast fallback intact until the next use.
once('src/render/characters/assets.ts',
     'export function ensureCharacterUrl(url: string | null | undefined): void {',
     """/** ORIGIN R1-2B. Resolve ORIGINAL Rig_Medium donor clip without constructing
 * a second avatar. Missing GLBs load lazily, not on every character spawn.
 * Only the named skill's class donors are touched (not all nine sets).
 * A malformed/unavailable donor is deliberately a safe null. */
export function originResidentNativeDonorClip(
  clipName: string,
  possibleUrls: readonly string[],
): THREE.AnimationClip | null {
  if (!clipName || possibleUrls.length === 0) return null;
  for (const url of possibleUrls) {
    const gltf = gltfByUrl.get(assetUrl(url));
    const clip = gltf?.animations.find((x) => x.name === clipName);
    if (clip) return clip;
  }
  // The two paladin actions synthesized from original KayKit clips (they are
  // normally synthesized in prepareVisual for the original Paladin rig).
  if (clipName === PALADIN_TEMPLARS_VERDICT_CLIP ||
      clipName === PALADIN_BASTION_SWEEP_CLIP) {
    const sourceName = clipName === PALADIN_TEMPLARS_VERDICT_CLIP
      ? PALADIN_SYNTHESIZED_CLIP_SOURCES[PALADIN_TEMPLARS_VERDICT_CLIP]
      : PALADIN_SYNTHESIZED_CLIP_SOURCES[PALADIN_BASTION_SWEEP_CLIP];
    for (const url of possibleUrls) {
      const base = gltfByUrl.get(assetUrl(url))?.animations.find((x) => x.name === sourceName);
      if (!base) continue;
      return clipName === PALADIN_TEMPLARS_VERDICT_CLIP
        ? createPaladinTemplarsVerdictClip(base)
        : createPaladinBastionSweepClip(base);
    }
  }
  for (const url of possibleUrls) {
    if (!characterAssetResident(url)) ensureCharacterUrl(url);
  }
  return null;
}

/** Kick a streamed character GLB (memoized by loadGltf) and index it on arrival. */
export function ensureCharacterUrl(url: string | null | undefined): void {""")

once('src/render/characters/visual.ts',
     "import * as THREE from 'three';",
     "import * as THREE from 'three';\nimport { originNativeSkillMotion } from '../../highfly/highfly_origin_skill_motion_catalog';")
once('src/render/characters/visual.ts',
     '  prepareVisual,\n  releaseModularVariant,',
     '  prepareVisual,\n  originResidentNativeDonorClip,\n  releaseModularVariant,')
once('src/render/characters/visual.ts',
     """    if (signature && this.action(signature)) {
      this.playOneShot(signature, 1);
      this.currentOneShotIsAttack = true;
      return;
    }
    // Resolved against THIS rig's bound clips:""",
     """    if (signature && this.action(signature)) {
      this.playOneShot(signature, 1);
      this.currentOneShotIsAttack = true;
      return;
    }
    // HIGHFLY ORIGIN R1-2B: one persistent modular Hunter can learn an
    // ability originally authored for a different class. Attach that native
    // motion to THIS visual's existing Rig_Medium mixer (no model swap).
    // The Sim/server still owns skill entitlement and all damage/cost gates.
    // Preserve same-class ClaudeCraft animations byte-for-byte.
    if (abilityId && this.def.modular && this.key.startsWith('player_')) {
      const originMotion = originNativeSkillMotion(abilityId);
      const carrierClass = this.key.slice('player_'.length).replace(/_modular$/, '');
      if (originMotion && originMotion.legacyDonor !== carrierClass) {
        // Nonphysical generic skills use their native spellcasting pose when
        // no authored one-shot exists; never pose a Mage fireball as a dagger
        // stab. An absent donor falls through to native safe fallback.
        const wanted = originMotion.abilityClip ??
          (originMotion.spellcastFallback ? originMotion.castClip : null);
        if (wanted) {
          let action = this.action(wanted);
          if (!action) {
            const clip = originResidentNativeDonorClip(wanted, originMotion.possibleClipGlbs);
            if (clip) {
              action = this.mixer.clipAction(clip);
              this.actions.set(wanted, action);
            }
          }
          if (action) {
            this.playOneShot(wanted, this.def.attackTimeScale ?? 1.3);
            this.currentOneShotIsAttack = true;
            return;
          }
        }
      }
    }
    // Resolved against THIS rig's bound clips:""")

once('src/highfly/highfly_origin_skill_motion_catalog.ts',
     '  weaponDualwield: string | null;\n};',
     '  weaponDualwield: string | null;\n  /** A non-physical ability may use the original KayKit spellcast gesture. */\n  spellcastFallback: boolean;\n};')
once('src/highfly/highfly_origin_skill_motion_catalog.ts',
     '    weaponDualwield: def.clips.attackByHand?.dualwield ?? null,',
     '    weaponDualwield: def.clips.attackByHand?.dualwield ?? null,\n    spellcastFallback: ability.school !== \'physical\',')

assert 'originResidentNativeDonorClip' in Path('src/render/characters/visual.ts').read_text()
assert 'this.actions.set(wanted, action)' in Path('src/render/characters/visual.ts').read_text()
assert 'originMotion.legacyDonor !== carrierClass' in Path('src/render/characters/visual.ts').read_text()
assert 'if (!characterAssetResident(url)) ensureCharacterUrl(url);' in Path('src/render/characters/assets.ts').read_text()
print('HIGHFLY_ORIGIN_R12B_CROSS_CLASS_NATIVE_ANIMATION_ATTACHED_TO_EXISTING_MIXER=1')
