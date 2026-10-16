/** HIGHFLY ORIGIN R27 — DATA-ONLY 23 VFX CATALOG, NOT A PLAYABLE INTEGRATION.
 * Sources pinned at known revisions. Preserve the MIT copyright/license notice
 * when copying substantial upstream code. Binary assets (Mixamo FBX, HDR,
 * textures and snake.glb) are NOT automatically MIT. Never ship unreviewed assets.
 * Demo cooldowns/ranges are measurements for reference ONLY; damage, native
 * cost and persistence MUST be supplied by HIGHFLY Sim after review.
 */
export const R27_UPSTREAM_SOURCES = {
  casting6: {
    repository: 'https://github.com/achrefelouafi/LinearAbiltyCastingThreeJS',
    commit: '97f1de19617e9a2e3af3c8021c8c21c8f58b40f3',
    license: 'MIT-code; third-party-assets-review'
  },
  effects7: {
    repository: 'https://github.com/achrefelouafi/LinearAbilityExtThreeJS',
    commit: 'bf58757ab9b6057515470aa074cdb4026bc54ed7',
    license: 'MIT-code; third-party-assets-review'
  },
  advanced10: {
    repository: 'https://github.com/achrefelouafi/LinearAbiltyCastingExtendedThreeJS',
    commit: '8c377c886ac2c68b26bc65c8f3507905818b974a',
    license: 'MIT-code; third-party-assets-review'
  }
} as const;

export type R27AimShape = 'line' | 'circle' | 'gate' | 'ring' | 'scribe';
export type R27SkillRole =
  | 'projectile' | 'area' | 'channel' | 'control' | 'barrier' | 'summon' | 'portal';
export type R27Source = keyof typeof R27_UPSTREAM_SOURCES;

export interface R27SkillPrototype {
  /** Namepaced: must never collide with native ClaudeCraft skill IDs. */
  id: string;
  /** Index in the user-approved catalog; stable 1–23. */
  index: number;
  /** Technical name from original demo. */
  sourceId: string;
  /** Authoring repo and pinned source revision. */
  source: R27Source;
  aim: R27AimShape;
  role: R27SkillRole;
  /** World-unit range from demo, NOT HIGHFLY metres. */
  demoMinRange: number;
  demoMaxRange: number;
  /** Area footprint from demo, when relevant. */
  demoRadius: number;
  /** Seconds from demo: NOT proposed RPG cooldown. */
  demoCooldownSec: number;
  /** Registry entry is descriptive only: no damage/cast/VFX implementation. */
  integrationStatus: 'catalog-only';
  /** Requires legal approval of exact binaries if copied. */
  assetStatus: 'review-required';
}

export const R27_PREMIUM_23: readonly R27SkillPrototype[] = [
  {index:1,id:'hf_vfx23_frost_lance',sourceId:'ice',source:'casting6',aim:'line',role:'projectile',demoMinRange:2.5,demoMaxRange:15,demoRadius:0,demoCooldownSec:0.4,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:2,id:'hf_vfx23_storm_lance',sourceId:'thunder',source:'casting6',aim:'line',role:'projectile',demoMinRange:2,demoMaxRange:24,demoRadius:0,demoCooldownSec:0.5,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:3,id:'hf_vfx23_cinder_fall',sourceId:'meteor',source:'casting6',aim:'line',role:'area',demoMinRange:3,demoMaxRange:20,demoRadius:0,demoCooldownSec:0.9,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:4,id:'hf_vfx23_nova_beam',sourceId:'beam',source:'casting6',aim:'line',role:'channel',demoMinRange:3,demoMaxRange:26,demoRadius:0,demoCooldownSec:1.6,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:5,id:'hf_vfx23_voltaic_snare',sourceId:'snare',source:'casting6',aim:'circle',role:'control',demoMinRange:0,demoMaxRange:20,demoRadius:4.4,demoCooldownSec:1.4,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:6,id:'hf_vfx23_glacial_crown',sourceId:'glacier',source:'casting6',aim:'circle',role:'barrier',demoMinRange:0,demoMaxRange:18,demoRadius:4.6,demoCooldownSec:1.6,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:7,id:'hf_vfx23_pyre_crown',sourceId:'pyre',source:'effects7',aim:'circle',role:'area',demoMinRange:0,demoMaxRange:18,demoRadius:4.2,demoCooldownSec:1.6,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:8,id:'hf_vfx23_kraken_crown',sourceId:'kraken',source:'effects7',aim:'circle',role:'summon',demoMinRange:0,demoMaxRange:18,demoRadius:4.6,demoCooldownSec:2.2,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:9,id:'hf_vfx23_electrical_sphere',sourceId:'electrical',source:'effects7',aim:'circle',role:'summon',demoMinRange:0,demoMaxRange:18,demoRadius:4.5,demoCooldownSec:2,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:10,id:'hf_vfx23_earthen_spire',sourceId:'earth',source:'effects7',aim:'line',role:'area',demoMinRange:0,demoMaxRange:18,demoRadius:0,demoCooldownSec:1.4,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:11,id:'hf_vfx23_verdant_gate',sourceId:'portal',source:'effects7',aim:'gate',role:'portal',demoMinRange:3,demoMaxRange:17,demoRadius:0,demoCooldownSec:2.6,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:12,id:'hf_vfx23_tidewrought_ring',sourceId:'aether',source:'effects7',aim:'ring',role:'portal',demoMinRange:3.5,demoMaxRange:18,demoRadius:2.15,demoCooldownSec:2.8,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:13,id:'hf_vfx23_fire_portal',sourceId:'firePortal',source:'effects7',aim:'scribe',role:'portal',demoMinRange:3,demoMaxRange:18,demoRadius:2.15,demoCooldownSec:3,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:14,id:'hf_vfx23_volcanic_horror_ward',sourceId:'ward',source:'advanced10',aim:'circle',role:'barrier',demoMinRange:0,demoMaxRange:20,demoRadius:5,demoCooldownSec:2.4,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:15,id:'hf_vfx23_caustic_bloom',sourceId:'acid',source:'advanced10',aim:'circle',role:'area',demoMinRange:0,demoMaxRange:20,demoRadius:4.4,demoCooldownSec:2.2,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:16,id:'hf_vfx23_arborists_growth',sourceId:'growth',source:'advanced10',aim:'circle',role:'summon',demoMinRange:0,demoMaxRange:22,demoRadius:4.2,demoCooldownSec:3.2,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:17,id:'hf_vfx23_cyber_serpent',sourceId:'cyber',source:'advanced10',aim:'line',role:'projectile',demoMinRange:3.5,demoMaxRange:26,demoRadius:0,demoCooldownSec:1.5,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:18,id:'hf_vfx23_crystallized_venom_surge',sourceId:'venom',source:'advanced10',aim:'line',role:'area',demoMinRange:2.5,demoMaxRange:16,demoRadius:0,demoCooldownSec:0.5,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:19,id:'hf_vfx23_brutalist_earth_blast',sourceId:'quake',source:'advanced10',aim:'line',role:'area',demoMinRange:3,demoMaxRange:17,demoRadius:0,demoCooldownSec:0.8,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:20,id:'hf_vfx23_sumi_tide',sourceId:'ink',source:'advanced10',aim:'circle',role:'control',demoMinRange:0,demoMaxRange:22,demoRadius:5,demoCooldownSec:2.8,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:21,id:'hf_vfx23_astral_void_blast',sourceId:'astral',source:'advanced10',aim:'circle',role:'control',demoMinRange:0,demoMaxRange:24,demoRadius:5.5,demoCooldownSec:4,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:22,id:'hf_vfx23_baleful_cascade_mark',sourceId:'cascade',source:'advanced10',aim:'circle',role:'summon',demoMinRange:0,demoMaxRange:24,demoRadius:4,demoCooldownSec:3.4,integrationStatus:'catalog-only',assetStatus:'review-required'},
  {index:23,id:'hf_vfx23_celestial_rend',sourceId:'rend',source:'advanced10',aim:'circle',role:'area',demoMinRange:0,demoMaxRange:24,demoRadius:5,demoCooldownSec:5.5,integrationStatus:'catalog-only',assetStatus:'review-required'},
] as const;

export function r27SkillPrototype(id: string): R27SkillPrototype | undefined {
  return R27_PREMIUM_23.find((skill) => skill.id === id);
}

export const R27_EXTRA_BUFFS = ['electric_boost','magic_boost','fire_boost'] as const;
// These are separate VFX demos; no stat effects yet. Never spend a combat slot.

export const R27_INTEGRATION_POLICY = {
  publicDeploy: false,
  persistentUnlocks: false,
  previewMayEquipAll: true,
  equippedNormalSlots: 7,
  reservedSpecialSlots: 3,
  nativeSimOwnsDamage: true,
  nativeSimOwnsHp: true,
  nativeSimOwnsCosts: true,
  nativeSimOwnsCooldown: true,
  nativeSimOwnsCollision: true,
  manualAimOverridesAutoAim: true,
  nativeHunterRigOnly: true,
  unverifiedAssetsForbidden: true
} as const;
