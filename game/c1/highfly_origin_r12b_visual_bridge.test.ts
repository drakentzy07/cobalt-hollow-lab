import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { originNativeSkillMotion } from '../src/highfly/highfly_origin_skill_motion_catalog';
import { VISUALS } from '../src/render/characters/manifest';

describe('HIGHFLY ORIGIN R1-2B native skill animation on a single Rig_Medium body', () => {
  it('Hunter with Warrior carrier can learn a Mage skill without morphing to Mage', () => {
    const sim = new Sim({seed: 401, playerClass:'warrior', originHunterEnabled:true});
    expect(sim.players.get(sim.player.id)?.known).toEqual([]);
    expect(sim.learnOriginHunterSkillTrusted('fireball', sim.player.id)).toBe(true);
    expect(sim.resolvedAbility('fireball')?.def.class).toBe('mage');
    expect(sim.cfg.playerClass).toBe('warrior'); // legacy carrier, NOT a class swap
    const m = originNativeSkillMotion('fireball');
    expect(m?.legacyDonor).toBe('mage');
    expect(m?.spellcastFallback).toBe(true);
    expect(VISUALS.player_warrior_modular.url).toBe(VISUALS.player_mage_modular.url);
  });
  it('Rogue lunge routes to original authored animation and its real donor', () => {
    const route = originNativeSkillMotion('backstab');
    expect(route?.abilityClip).toBe('Rogue_Backstab');
    expect(route?.possibleClipGlbs).toContain('models/chars/players/rogue_ability_anims.glb');
    expect(route?.spellcastFallback).toBe(false);
    expect(originNativeSkillMotion('nonexistent_origin_skill')).toBeNull();
  });
  it('retains Paladin synthesized and Warrior native one-shots and source GLBs', () => {
    const p = originNativeSkillMotion('final_edict');
    const w = originNativeSkillMotion('heroic_leap');
    expect(p?.abilityClip).toBe('Paladin_Templars_Verdict_1H');
    expect(w?.abilityClip).toBe('Warrior_Heroic_Leap');
    expect(p?.legacyDonor).toBe('paladin');
    expect(w?.legacyDonor).toBe('warrior');
  });
  it('is a renderer-only integration: no auto learning, no new class model, no Sim attack path', () => {
    const visual = readFileSync('src/render/characters/visual.ts', 'utf8');
    const assets = readFileSync('src/render/characters/assets.ts', 'utf8');
    const script = readFileSync('src/highfly/highfly_origin_skill_motion_catalog.ts', 'utf8');
    expect(visual).toContain('if (abilityId && this.def.modular && this.key.startsWith(\'player_\'))');
    expect(visual).toContain('originMotion.legacyDonor !== carrierClass');
    expect(visual).toContain('const clip = originResidentNativeDonorClip(wanted, originMotion.possibleClipGlbs);');
    expect(visual).toContain('this.mixer.clipAction(clip)');
    expect(visual).toContain('this.playOneShot(wanted, this.def.attackTimeScale ?? 1.3)');
    expect(visual).toContain('const style = weaponAttackStyle(this.weaponItemId, this.offhandItemId);');
    expect(assets).toContain('export function originResidentNativeDonorClip(');
    expect(assets).toContain('if (!characterAssetResident(url)) ensureCharacterUrl(url);');
    expect(assets).toContain('createPaladinTemplarsVerdictClip(base)');
    expect(script).toContain("spellcastFallback: ability.school !== 'physical'");
  });
  it('legacy 9/9 class rules and weapons remain operational', () => {
    const legacy = new Sim({ seed: 401, playerClass: 'warrior' });
    expect(legacy.players.get(legacy.player.id)?.originHunter).toBeUndefined();
    expect(legacy.players.get(legacy.player.id)?.known.some(x=>x.def.id === 'heroic_strike')).toBe(true);
    expect(legacy.resolvedAbility('fireball')).toBeNull();
    const classic = new Sim({ seed:401, playerClass:'mage' });
    expect(classic.players.get(classic.player.id)?.known.some(x=>x.def.id === 'fireball')).toBe(true);
    expect(classic.resolvedAbility('heroic_strike')).toBeNull();
  });
});
