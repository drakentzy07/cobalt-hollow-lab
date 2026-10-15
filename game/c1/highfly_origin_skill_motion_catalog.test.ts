import { describe, expect, it } from 'vitest';
import { ALL_CLASSES } from '../src/sim/types';
import { ABILITIES } from '../src/sim/content/classes';
import { VISUALS } from '../src/render/characters/manifest';
import {
  originNativeSkillMotion,
  originEquippedSkillDonorUrls,
} from '../src/highfly/highfly_origin_skill_motion_catalog';

describe('HIGHFLY ORIGIN R1-2 P0 universal Hunter Rig_Medium native motion catalog', () => {
  it('indexes all nine ORIGINAL class visual donors without changing their identities', () => {
    expect(ALL_CLASSES).toHaveLength(9);
    for (const cls of ALL_CLASSES) {
      const d = VISUALS[`player_${cls}_modular`];
      expect(d?.url).toContain('warrior_modular.glb');
      expect(d?.modular).toBe(true);
      expect(d?.animUrls?.[0]).toBe(VISUALS[`player_${cls}`].url);
      expect(d?.clips).toEqual(VISUALS[`player_${cls}`].clips);
    }
  });
  it('takes unique rogue Backstab animation from the rogue donor, NOT the visual class active', () => {
    const m = originNativeSkillMotion('backstab');
    expect(m?.legacyDonor).toBe('rogue');
    expect(m?.abilityClip).toBe('Rogue_Backstab');
    expect(m?.possibleClipGlbs.some(x=>x.includes('rogue_ability_anims.glb'))).toBe(true);
  });
  it('keeps true paladin and warrior authored ability poses, including rush gestures', () => {
    expect(originNativeSkillMotion('final_edict')?.abilityClip).toBe('Paladin_Templars_Verdict_1H');
    expect(originNativeSkillMotion('heroic_leap')?.abilityClip).toBe('Warrior_Heroic_Leap');
  });
  it('exposes base attacks by donor and weapon style, without gating learned skills', () => {
    const m = originNativeSkillMotion('heroic_strike');
    expect(m?.weaponTwohand).toBe('2H_Melee_Attack_Chop');
    expect(m?.weaponDualwield).toBe('Dualwield_Melee_Attack_Chop');
    expect(m?.weaponAttacks).toContain('1H_Melee_Attack_Chop');
  });
  it('keeps all original authored ability class metadata, no classless alias', () => {
    expect(originNativeSkillMotion('backstab')?.legacyDonor).toBe(ABILITIES.backstab.class);
    expect(originNativeSkillMotion('fireball')?.legacyDonor).toBe('mage');
    expect(originNativeSkillMotion('ability_does_not_exist')).toBeNull();
  });
  it('dedupes and sorts only requested equipped skill donors; no eager downloads', () => {
    const a = originEquippedSkillDonorUrls(['backstab','final_edict','backstab']);
    const b = originEquippedSkillDonorUrls(['final_edict','backstab']);
    expect(a).toEqual(b);
    expect(a).toEqual([...a].sort());
    expect(new Set(a).size).toBe(a.length);
    expect(a.some(x=>x.includes('rogue_ability_anims.glb'))).toBe(true);
    expect(a.some(x=>x.includes('paladin_ability_anims.glb'))).toBe(true);
  });
});
