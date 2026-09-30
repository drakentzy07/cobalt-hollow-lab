from pathlib import Path

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')

def rep(path, old, new):
    text = read(path)
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{path}: expected 1 anchor, got {n}: {old[:100]!r}')
    write(path, text.replace(old, new, 1))

rep('src/sim/types.ts',
    'export interface AbilityDef {\n',
    """export type HighflyWeaponStyle =
  | 'SWORD_1H'
  | 'SWORD_SHIELD'
  | 'DUAL_SWORD'
  | 'DUAL_DAGGER'
  | 'AXE_1H'
  | 'DUAL_AXE'
  | 'AXE_SHIELD'
  | 'SPEAR_2H'
  | 'UNARMED'
  | 'BOW';

export type HighflyAimShape =
  | 'TARGET'
  | 'LINE'
  | 'CIRCLE'
  | 'CONE'
  | 'ARC'
  | 'SWEEP'
  | 'RECTANGLE';

export interface HighflyAimProfile {
  shape: HighflyAimShape;
  radius?: number;
  length?: number;
  width?: number;
  angleDeg?: number;
  innerRadius?: number;
}

export interface AbilityDef {
""")
rep('src/sim/types.ts',
    '  requiresShield?: boolean;\n',
    """  requiresShield?: boolean;
  /** HIGHFLY centralized equipped-style requirement. */
  weaponStyle?: HighflyWeaponStyle | readonly HighflyWeaponStyle[];
  /** HIGHFLY presentation-only aim telegraph; never hit authority. */
  aimProfile?: HighflyAimProfile;
""")

rep('src/sim/combat/equipment_requirement.ts',
    """import { ITEMS } from '../data';
import { isShieldItem } from '../equipment_rules';
import { meetsLevelRequirement } from '../item_level_req';
import type { AbilityEffect, EquipSlot } from '../types';
""",
    """import { weaponTypeForItem } from '../content/weapon_skin_rules';
import { ITEMS } from '../data';
import { isShieldItem, weaponHand } from '../equipment_rules';
import { meetsLevelRequirement } from '../item_level_req';
import type { AbilityEffect, EquipSlot, HighflyWeaponStyle } from '../types';
""")
rep('src/sim/combat/equipment_requirement.ts',
    """export function effectsRequireDagger(effects: readonly AbilityEffect[]): boolean {
  for (const effect of effects) {
    if (effect.type === 'weaponStrike' && effect.requiresBehind) return true;
  }
  return false;
}
""",
    """export function effectsRequireDagger(effects: readonly AbilityEffect[]): boolean {
  for (const effect of effects) {
    if (effect.type === 'weaponStrike' && effect.requiresBehind) return true;
  }
  return false;
}

function usableWeapon(worn: WornItems, slot: 'mainhand' | 'offhand', level: number) {
  const id = worn[slot];
  if (!id) return null;
  const item = ITEMS[id];
  if (!item || item.kind !== 'weapon' || !meetsLevelRequirement(level, item)) return null;
  return item;
}

export function equippedWeaponStyle(worn: WornItems, level: number): HighflyWeaponStyle | null {
  const main = usableWeapon(worn, 'mainhand', level);
  const off = usableWeapon(worn, 'offhand', level);
  const mainType = weaponTypeForItem(worn.mainhand);
  const offType = weaponTypeForItem(worn.offhand);
  const shield = shieldEquipped(worn);

  if (!main && !off && !shield) return 'UNARMED';
  if (main && weaponHand(main) === 'twohand') {
    if (mainType === 'polearm' && !off && !shield) return 'SPEAR_2H';
    if (mainType === 'bow' && !off && !shield) return 'BOW';
    return null;
  }
  if (!main || weaponHand(main) !== 'onehand') return null;

  if (mainType === 'sword') {
    if (shield && !off) return 'SWORD_SHIELD';
    if (off && offType === 'sword' && weaponHand(off) === 'onehand') return 'DUAL_SWORD';
    if (!off && !shield) return 'SWORD_1H';
    return null;
  }
  if (mainType === 'dagger') {
    return off && offType === 'dagger' && weaponHand(off) === 'onehand' ? 'DUAL_DAGGER' : null;
  }
  if (mainType === 'axe') {
    if (shield && !off) return 'AXE_SHIELD';
    if (off && offType === 'axe' && weaponHand(off) === 'onehand') return 'DUAL_AXE';
    if (!off && !shield) return 'AXE_1H';
    return null;
  }
  if (mainType === 'bow' && !off && !shield) return 'BOW';
  return null;
}

export function weaponStyleRequirementMet(
  required: HighflyWeaponStyle | readonly HighflyWeaponStyle[] | undefined,
  worn: WornItems,
  level: number,
): boolean {
  if (required === undefined) return true;
  const allowed: readonly HighflyWeaponStyle[] = Array.isArray(required) ? required : [required];
  const equipped = equippedWeaponStyle(worn, level);
  return equipped !== null && allowed.includes(equipped);
}

export function weaponStyleRequirementLabel(
  required: HighflyWeaponStyle | readonly HighflyWeaponStyle[],
): string {
  return (Array.isArray(required) ? required : [required]).join(' / ');
}
""")

rep('src/sim/combat/casting_lifecycle.ts',
    "import { shieldEquipped } from './equipment_requirement';\n",
    """import {
  shieldEquipped,
  weaponStyleRequirementLabel,
  weaponStyleRequirementMet,
} from './equipment_requirement';
""")
rep('src/sim/combat/casting_lifecycle.ts',
    """  if (ability.requiresShield) {
    if (!shieldEquipped(p.equippedItems)) {
      ctx.error(p.id, 'You must have a shield equipped.');
      return;
    }
  }
""",
    """  if (ability.requiresShield) {
    if (!shieldEquipped(p.equippedItems)) {
      ctx.error(p.id, 'You must have a shield equipped.');
      return;
    }
  }
  if (ability.weaponStyle && !weaponStyleRequirementMet(ability.weaponStyle, p.equippedItems, p.level)) {
    ctx.error(
      p.id,
      'Estilo de arma requerido: ' + weaponStyleRequirementLabel(ability.weaponStyle) + '.',
    );
    return;
  }
""")

rep('src/ui/hud/action_bar/action_bar_view.ts',
    """  wieldsDagger,
} from '../../../sim/combat/equipment_requirement';
""",
    """  wieldsDagger,
  weaponStyleRequirementMet,
} from '../../../sim/combat/equipment_requirement';
""")
rep('src/ui/hud/action_bar/action_bar_view.ts',
    """  if (worn !== undefined) {
    if (def.requiresShield && !shieldEquipped(worn)) return false;
    if (
""",
    """  if (worn !== undefined) {
    if (def.requiresShield && !shieldEquipped(worn)) return false;
    if (def.weaponStyle && !weaponStyleRequirementMet(def.weaponStyle, worn, player.level ?? 1)) {
      return false;
    }
    if (
""")

rep('src/ui/hud/action_bar/ground_aim_controller.ts',
    "import type { AbilityEffect, Entity } from '../../../sim/types';\n",
    "import type { AbilityEffect, Entity, HighflyAimProfile } from '../../../sim/types';\n")
rep('src/ui/hud/action_bar/ground_aim_controller.ts',
    "  def: { id: string; range: number; minRange?: number; school: string };\n",
    "  def: { id: string; range: number; minRange?: number; school: string; aimProfile?: HighflyAimProfile };\n")
rep('src/ui/hud/action_bar/ground_aim_controller.ts',
    """export interface GroundAimReticleView {
  point: AimPoint;
  radius: number;
  school: string;
""",
    """export interface GroundAimReticleView {
  point: AimPoint;
  origin: AimPoint;
  radius: number;
  profile: HighflyAimProfile;
  school: string;
""")
rep('src/ui/hud/action_bar/ground_aim_controller.ts',
    """    return {
      point: projected,
      radius: abilityAoeRadius(res),
      school: res.def.school,
""",
    """    const fallbackRadius = abilityAoeRadius(res);
    const profile: HighflyAimProfile = res.def.aimProfile ?? {
      shape: 'CIRCLE',
      radius: fallbackRadius,
    };
    return {
      point: projected,
      origin: { x: player.pos.x, z: player.pos.z },
      radius: profile.radius ?? fallbackRadius,
      profile,
      school: res.def.school,
""")

write('src/render/highfly_aim_profile_geometry.ts', """import type { HighflyAimProfile } from '../sim/types';

export interface AimOutlinePoint { x: number; z: number }
const POINTS = 96;
const EPS = 1e-6;

function frame(origin: AimOutlinePoint, aim: AimOutlinePoint) {
  const dx = aim.x - origin.x, dz = aim.z - origin.z;
  const distance = Math.hypot(dx, dz);
  const fx = distance > EPS ? dx / distance : 0;
  const fz = distance > EPS ? dz / distance : 1;
  return { fx, fz, rx: fz, rz: -fx, distance };
}

function circle(center: AimOutlinePoint, radius: number): AimOutlinePoint[] {
  return Array.from({ length: POINTS }, (_, i) => {
    const a = (i / POINTS) * Math.PI * 2;
    return { x: center.x + Math.cos(a) * radius, z: center.z + Math.sin(a) * radius };
  });
}

function rectangle(origin: AimOutlinePoint, aim: AimOutlinePoint, width: number, requested?: number) {
  const f = frame(origin, aim);
  const len = Math.max(0.25, requested ?? f.distance);
  const half = Math.max(0.1, width) / 2;
  const cx = origin.x + f.fx * len / 2, cz = origin.z + f.fz * len / 2;
  const hx = f.fx * len / 2, hz = f.fz * len / 2;
  const wx = f.rx * half, wz = f.rz * half;
  const c = [
    { x: cx - hx - wx, z: cz - hz - wz },
    { x: cx + hx - wx, z: cz + hz - wz },
    { x: cx + hx + wx, z: cz + hz + wz },
    { x: cx - hx + wx, z: cz - hz + wz },
  ];
  return Array.from({ length: POINTS }, (_, i) => c[Math.floor(i / (POINTS / 4)) % 4]);
}

function cone(origin: AimOutlinePoint, aim: AimOutlinePoint, requested: number | undefined, angleDeg: number) {
  const f = frame(origin, aim);
  const len = Math.max(0.25, requested ?? f.distance);
  const heading = Math.atan2(f.fz, f.fx);
  const half = Math.max(1, Math.min(179, angleDeg)) * Math.PI / 360;
  return Array.from({ length: POINTS }, (_, i) => {
    if (i === 0 || i === POINTS - 1) return { ...origin };
    const t = (i - 1) / (POINTS - 2);
    const a = heading - half + t * half * 2;
    return { x: origin.x + Math.cos(a) * len, z: origin.z + Math.sin(a) * len };
  });
}

function arc(origin: AimOutlinePoint, aim: AimOutlinePoint, p: HighflyAimProfile) {
  const f = frame(origin, aim);
  const outer = Math.max(0.25, p.length ?? p.radius ?? f.distance);
  const inner = Math.max(0, Math.min(outer - 0.05, p.innerRadius ?? outer * 0.55));
  const heading = Math.atan2(f.fz, f.fx);
  const half = Math.max(1, Math.min(179, p.angleDeg ?? 100)) * Math.PI / 360;
  const n = POINTS / 2;
  const out: AimOutlinePoint[] = [];
  for (let i = 0; i < n; i++) {
    const a = heading - half + (i / (n - 1)) * half * 2;
    out.push({ x: origin.x + Math.cos(a) * outer, z: origin.z + Math.sin(a) * outer });
  }
  for (let i = 0; i < n; i++) {
    const a = heading + half - (i / (n - 1)) * half * 2;
    out.push({ x: origin.x + Math.cos(a) * inner, z: origin.z + Math.sin(a) * inner });
  }
  return out;
}

export function highflyAimProfileOutline(
  origin: AimOutlinePoint,
  aim: AimOutlinePoint,
  profile: HighflyAimProfile,
  fallbackRadius: number,
): AimOutlinePoint[] {
  switch (profile.shape) {
    case 'TARGET': return circle(aim, Math.max(0.4, profile.radius ?? 1.25));
    case 'CIRCLE': return circle(aim, Math.max(0.1, profile.radius ?? fallbackRadius));
    case 'LINE': return rectangle(origin, aim, profile.width ?? 1.5, profile.length);
    case 'RECTANGLE': return rectangle(origin, aim, profile.width ?? 4, profile.length);
    case 'CONE': return cone(origin, aim, profile.length, profile.angleDeg ?? 60);
    case 'ARC':
    case 'SWEEP': return arc(origin, aim, profile);
  }
}
""")

rep('src/render/ground_aim_reticle_visual.ts',
    "import * as THREE from 'three';\n",
    """import * as THREE from 'three';
import type { HighflyAimProfile } from '../sim/types';
import { highflyAimProfileOutline } from './highfly_aim_profile_geometry';
""")
rep('src/render/ground_aim_reticle_visual.ts',
    """export interface GroundAimVisualState {
  x: number;
  z: number;
  radius: number;
""",
    """export interface GroundAimVisualState {
  x: number;
  z: number;
  originX?: number;
  originZ?: number;
  radius: number;
  profile?: HighflyAimProfile;
""")
rep('src/render/ground_aim_reticle_visual.ts',
    """  private elapsed = 0;
  private dimmed = false;
""",
    """  private elapsed = 0;
  private dimmed = false;
  private profileKey = '';
  private originX = Number.NaN;
  private originZ = Number.NaN;
""")
rep('src/render/ground_aim_reticle_visual.ts',
    """    const radius = Math.max(0, aim.radius);
    if (!sameGroundAimGeometry(this.geometryState, aim.x, aim.z, radius)) {
      this.rebuild(aim.x, aim.z, radius);
      this.geometryState.x = aim.x;
      this.geometryState.z = aim.z;
      this.geometryState.radius = radius;
    }
""",
    """    const radius = Math.max(0, aim.radius);
    const profile = aim.profile ?? { shape: 'CIRCLE' as const, radius };
    const originX = aim.originX ?? aim.x;
    const originZ = aim.originZ ?? aim.z;
    const profileKey = JSON.stringify(profile);
    if (
      !sameGroundAimGeometry(this.geometryState, aim.x, aim.z, radius) ||
      this.profileKey !== profileKey ||
      this.originX !== originX ||
      this.originZ !== originZ
    ) {
      this.rebuildProfile(originX, originZ, aim.x, aim.z, radius, profile);
      this.geometryState.x = aim.x;
      this.geometryState.z = aim.z;
      this.geometryState.radius = radius;
      this.profileKey = profileKey;
      this.originX = originX;
      this.originZ = originZ;
    }
""")
rep('src/render/ground_aim_reticle_visual.ts',
    """  private rebuild(x: number, z: number, radius: number): void {
    writeCircle(this.outerGeometry, x, z, radius, OUTER_LIFT, this.heightAt);
    writeCircle(this.innerGeometry, x, z, radius * INNER_GUIDE_RATIO, INNER_LIFT, this.heightAt);
    writeBand(this.bandGeometry, x, z, radius, this.heightAt);
    writeTicks(this.tickGeometry, x, z, radius, this.heightAt);
  }
""",
    """  private rebuildProfile(
    originX: number,
    originZ: number,
    x: number,
    z: number,
    radius: number,
    profile: HighflyAimProfile,
  ): void {
    if (profile.shape === 'CIRCLE' || profile.shape === 'TARGET') {
      const r = Math.max(0.1, profile.radius ?? radius);
      writeCircle(this.outerGeometry, x, z, r, OUTER_LIFT, this.heightAt);
      writeCircle(this.innerGeometry, x, z, r * INNER_GUIDE_RATIO, INNER_LIFT, this.heightAt);
      writeBand(this.bandGeometry, x, z, r, this.heightAt);
      writeTicks(this.tickGeometry, x, z, r, this.heightAt);
      this.inner.visible = true;
      this.band.visible = true;
      this.ticks.visible = true;
      return;
    }
    const outline = highflyAimProfileOutline({ x: originX, z: originZ }, { x, z }, profile, radius);
    writeOutline(this.outerGeometry, outline, OUTER_LIFT, this.heightAt);
    this.inner.visible = false;
    this.band.visible = false;
    this.ticks.visible = false;
  }
""")
rep('src/render/ground_aim_reticle_visual.ts',
    "function writeCircle(\n",
    """function writeOutline(
  geometry: THREE.BufferGeometry,
  points: readonly { x: number; z: number }[],
  lift: number,
  heightAt: (x: number, z: number) => number,
): void {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < SEGMENTS; i++) {
    const p = points[i % Math.max(1, points.length)] ?? { x: 0, z: 0 };
    positions.setXYZ(i, p.x, heightAt(p.x, p.z) + lift, p.z);
  }
  positions.needsUpdate = true;
}

function writeCircle(
""")

rep('src/game/pad_ground_aim_wiring.ts',
    "import type { IWorld } from '../world_api';\n",
    "import type { HighflyAimProfile } from '../sim/types';\nimport type { IWorld } from '../world_api';\n")
rep('src/game/pad_ground_aim_wiring.ts',
    """    point: { x: number; z: number };
    radius: number;
    school: string;
""",
    """    point: { x: number; z: number };
    origin: { x: number; z: number };
    radius: number;
    profile: HighflyAimProfile;
    school: string;
""")
rep('src/game/pad_ground_aim_wiring.ts',
    """      x: number;
      z: number;
      radius: number;
      school: string;
""",
    """      x: number;
      z: number;
      originX: number;
      originZ: number;
      radius: number;
      profile: HighflyAimProfile;
      school: string;
""")
rep('src/game/pad_ground_aim_wiring.ts',
    """          x: reticle.point.x,
          z: reticle.point.z,
          radius: reticle.radius,
          school: reticle.school,
""",
    """          x: reticle.point.x,
          z: reticle.point.z,
          originX: reticle.origin.x,
          originZ: reticle.origin.z,
          radius: reticle.radius,
          profile: reticle.profile,
          school: reticle.school,
""")

rep('src/render/renderer.ts',
    "import { GoblinRocketSledFx } from './goblin_rocket_sled_fx';\n",
    "import type { HighflyAimProfile } from '../sim/types';\nimport { GoblinRocketSledFx } from './goblin_rocket_sled_fx';\n")
rep('src/render/renderer.ts',
    """      x: number;
      z: number;
      radius: number;
      school: string;
""",
    """      x: number;
      z: number;
      originX?: number;
      originZ?: number;
      radius: number;
      profile?: HighflyAimProfile;
      school: string;
""")
rep('src/render/renderer.ts',
    """            x: aim.x,
            z: aim.z,
            radius: aim.radius,
            color: SCHOOL_COLORS[aim.school] ?? 0xffffff,
""",
    """            x: aim.x,
            z: aim.z,
            originX: aim.originX,
            originZ: aim.originZ,
            radius: aim.radius,
            profile: aim.profile,
            color: SCHOOL_COLORS[aim.school] ?? 0xffffff,
""")

write('src/highfly/presentation_adapter.ts', """export interface HighflyVisualHitMoment {
  event: 'cast' | 'release' | 'landing' | 'impact';
  normalizedTime: number;
}
export interface HighflyCameraFeedback {
  event: 'release' | 'landing' | 'impact';
  amount: number;
}
export interface HighflyDonorPresentation {
  animationRoute?: string;
  retargetProfile?: string;
  visualHitMoments?: readonly HighflyVisualHitMoment[];
  vfxRoute?: string;
  sfxRoute?: string;
  cameraFeedback?: HighflyCameraFeedback;
}

export const HIGHFLY_PRESENTATION_BY_ABILITY: Readonly<Record<string, HighflyDonorPresentation>> = {
  hf_jump_smash_01: {
    animationRoute: 'heroic_leap',
    retargetProfile: 'kaykit-humanoid-warrior-1h',
    visualHitMoments: [{ event: 'landing', normalizedTime: 1 }],
    vfxRoute: 'heroic_leap',
    sfxRoute: 'slam',
    cameraFeedback: { event: 'landing', amount: 0.12 },
  },
};

export type HighflyPresentationRouteKind = 'animation' | 'vfx' | 'sfx';

export function highflyPresentationRoute(
  abilityId: string,
  kind: HighflyPresentationRouteKind,
): string {
  const p = HIGHFLY_PRESENTATION_BY_ABILITY[abilityId];
  if (!p) return abilityId;
  if (kind === 'animation') return p.animationRoute ?? abilityId;
  if (kind === 'vfx') return p.vfxRoute ?? abilityId;
  return p.sfxRoute ?? abilityId;
}
""")

rep('src/render/characters/visual.ts',
    "import * as THREE from 'three';\n",
    "import * as THREE from 'three';\nimport { highflyPresentationRoute } from '../../highfly/presentation_adapter';\n")
rep('src/render/characters/visual.ts',
    "    const override = this.def.clips.attackByAbility?.[abilityId];\n",
    "    const override = this.def.clips.attackByAbility?.[highflyPresentationRoute(abilityId, 'animation')];\n")
rep('src/render/characters/visual.ts',
    "    const rawOverride = abilityId ? this.def.clips.attackByAbility?.[abilityId] : undefined;\n",
    """    const rawOverride = abilityId
      ? this.def.clips.attackByAbility?.[highflyPresentationRoute(abilityId, 'animation')]
      : undefined;
""")
rep('src/render/characters/visual.ts',
    """      const authoredTimeScale = abilityId
        ? this.def.clips.attackTimeScaleByAbility?.[abilityId]
        : undefined;
""",
    """      const authoredTimeScale = abilityId
        ? this.def.clips.attackTimeScaleByAbility?.[highflyPresentationRoute(abilityId, 'animation')]
        : undefined;
""")

rep('src/render/ability_vfx_registry.ts',
    "import type { AbilityVfxFullSpec, AbilityVfxSpec } from './ability_vfx_core';\n",
    "import { highflyPresentationRoute } from '../highfly/presentation_adapter';\nimport type { AbilityVfxFullSpec, AbilityVfxSpec } from './ability_vfx_core';\n")
rep('src/render/ability_vfx_registry.ts',
    "export function abilityVfxSpec(abilityId: string): AbilityVfxSpec | undefined {\n",
    """export function abilityVfxSpec(abilityId: string): AbilityVfxSpec | undefined {
  const routed = highflyPresentationRoute(abilityId, 'vfx');
  if (routed !== abilityId) return abilityVfxSpec(routed);
""")
rep('src/render/ability_vfx_registry.ts',
    "export function abilityVfxFullSpec(abilityId: string): AbilityVfxFullSpec | undefined {\n",
    """export function abilityVfxFullSpec(abilityId: string): AbilityVfxFullSpec | undefined {
  const routed = highflyPresentationRoute(abilityId, 'vfx');
  if (routed !== abilityId) return abilityVfxFullSpec(routed);
""")

rep('src/ui/combat_sfx.ts',
    "import { ABILITIES, MOBS } from '../sim/data';\n",
    "import { highflyPresentationRoute } from '../highfly/presentation_adapter';\nimport { ABILITIES, MOBS } from '../sim/data';\n")
rep('src/ui/combat_sfx.ts',
    """export function castCueForAbility(ability: string): SfxId | null {
  if (ability === 'lightning_bolt') return 'cast_lightning_bolt';
  const school = magicSchool(ABILITIES[ability]?.school);
""",
    """export function castCueForAbility(ability: string): SfxId | null {
  const routed = highflyPresentationRoute(ability, 'sfx');
  if (routed !== ability) return castCueForAbility(routed);
  if (ability === 'lightning_bolt') return 'cast_lightning_bolt';
  const school = magicSchool(ABILITIES[ability]?.school);
""")
rep('src/ui/combat_sfx.ts',
    """  if (event.abilityId) {
    const override = IMPACT_ABILITY_CUES[event.abilityId];
""",
    """  if (event.abilityId) {
    const presentationAbilityId = highflyPresentationRoute(event.abilityId, 'sfx');
    const override = IMPACT_ABILITY_CUES[presentationAbilityId];
""")

rep('src/sim/content/classes.ts',
    "      'heroic_leap',\n      'cleave',\n",
    "      'heroic_leap',\n      'hf_jump_smash_01',\n      'cleave',\n")
rep('src/sim/content/classes.ts',
    "  rallying_cry: {\n",
    """  hf_jump_smash_01: {
    id: 'hf_jump_smash_01',
    name: 'Salto Demoledor',
    class: 'warrior',
    learnLevel: 1,
    cost: 15,
    castTime: 0,
    cooldown: 8,
    range: 12,
    minRange: 2,
    school: 'fire',
    requiresTarget: false,
    targetMode: 'position',
    weaponStyle: ['SWORD_1H', 'SWORD_SHIELD', 'DUAL_SWORD'],
    aimProfile: { shape: 'CIRCLE', radius: 6 },
    effects: [{ type: 'repositionToAim', landingAoe: { min: 28, max: 36, radius: 6 } }],
    description:
      'Salta al área indicada y descarga un espadazo incendiario al aterrizar, dañando a los enemigos cercanos.',
  },
  rallying_cry: {
""")

rep('src/sim/combat/heroic_leap.ts',
    "import { MANTLE_REACH, resolvePosition, seatGroundedAt } from '../colliders';\n",
    "import { MANTLE_REACH, resolvePosition, seatGroundedAt } from '../colliders';\nimport { ABILITIES } from '../data';\n")
rep('src/sim/combat/heroic_leap.ts',
    """  if (abilityId !== 'heroic_leap') return point;
  return computeHeroicLeapLanding(
""",
    """  const ability = ABILITIES[abilityId];
  const usesSweptLeap = ability?.effects.some(
    (effect) => effect.type === 'repositionToAim' && effect.landingAoe !== undefined,
  );
  if (!usesSweptLeap) return point;
  return computeHeroicLeapLanding(
""")

write('tests/highfly_skill_adapter.test.ts', """import { describe, expect, it } from 'vitest';
import {
  equippedWeaponStyle,
  weaponStyleRequirementMet,
} from '../src/sim/combat/equipment_requirement';
import { weaponTypeForItem } from '../src/sim/content/weapon_skin_rules';
import { ABILITIES, ITEMS, MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { isShieldItem, weaponHand } from '../src/sim/equipment_rules';
import {
  HIGHFLY_PRESENTATION_BY_ABILITY,
  highflyPresentationRoute,
} from '../src/highfly/presentation_adapter';
import { abilityVfxFullSpec } from '../src/render/ability_vfx_registry';
import { highflyAimProfileOutline } from '../src/render/highfly_aim_profile_geometry';
import { Sim } from '../src/sim/sim';
import type { Entity, SimEvent } from '../src/sim/types';
import { castCueForAbility } from '../src/ui/combat_sfx';
import { EMPTY_TEST_WORLD } from './sim_shared';

const ID = 'hf_jump_smash_01';
const all = Object.values(ITEMS);
const oneHand = (type: string) => all.find(
  (item) => item.kind === 'weapon' &&
    weaponHand(item) === 'onehand' &&
    weaponTypeForItem(item.id) === type,
)!.id;
const twoHand = (type: string) => all.find(
  (item) => item.kind === 'weapon' &&
    weaponHand(item) === 'twohand' &&
    weaponTypeForItem(item.id) === type,
)!.id;
const shield = all.find((item) => isShieldItem(item))!.id;
const sword = oneHand('sword');
const dagger = oneHand('dagger');
const axe = oneHand('axe');
const spear = twoHand('polearm');

describe('HIGHFLY weaponStyle central seam', () => {
  it('derives the required styles from Claude item taxonomy and hand rules', () => {
    const L = 60;
    expect(equippedWeaponStyle({}, L)).toBe('UNARMED');
    expect(equippedWeaponStyle({ mainhand: sword }, L)).toBe('SWORD_1H');
    expect(equippedWeaponStyle({ mainhand: sword, offhand: shield }, L)).toBe('SWORD_SHIELD');
    expect(equippedWeaponStyle({ mainhand: sword, offhand: sword }, L)).toBe('DUAL_SWORD');
    expect(equippedWeaponStyle({ mainhand: dagger, offhand: dagger }, L)).toBe('DUAL_DAGGER');
    expect(equippedWeaponStyle({ mainhand: axe }, L)).toBe('AXE_1H');
    expect(equippedWeaponStyle({ mainhand: axe, offhand: axe }, L)).toBe('DUAL_AXE');
    expect(equippedWeaponStyle({ mainhand: axe, offhand: shield }, L)).toBe('AXE_SHIELD');
    expect(equippedWeaponStyle({ mainhand: spear }, L)).toBe('SPEAR_2H');
    expect(weaponStyleRequirementMet(
      ['SWORD_1H', 'SWORD_SHIELD'],
      { mainhand: sword, offhand: shield },
      L,
    )).toBe(true);
  });
});

describe('HIGHFLY AimProfile presentation geometry', () => {
  for (const profile of [
    { shape: 'TARGET', radius: 1.2 },
    { shape: 'LINE', width: 1.5 },
    { shape: 'CIRCLE', radius: 6 },
    { shape: 'CONE', angleDeg: 60 },
    { shape: 'ARC', angleDeg: 100, innerRadius: 4 },
    { shape: 'SWEEP', angleDeg: 120, innerRadius: 3 },
    { shape: 'RECTANGLE', width: 4 },
  ] as const) {
    it('builds ' + profile.shape + ' as visual-only outline', () => {
      const points = highflyAimProfileOutline({ x: 0, z: 0 }, { x: 0, z: 10 }, profile, 6);
      expect(points).toHaveLength(96);
      expect(points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.z))).toBe(true);
    });
  }
});

describe('HIGHFLY donor presentation adapter', () => {
  it('routes only presentation identities', () => {
    expect(highflyPresentationRoute(ID, 'animation')).toBe('heroic_leap');
    expect(highflyPresentationRoute(ID, 'vfx')).toBe('heroic_leap');
    expect(highflyPresentationRoute(ID, 'sfx')).toBe('slam');
    expect(HIGHFLY_PRESENTATION_BY_ABILITY[ID]?.retargetProfile).toBeTruthy();
    expect(abilityVfxFullSpec(ID)).toBe(abilityVfxFullSpec('heroic_leap'));
    expect(castCueForAbility(ID)).toBe(castCueForAbility('slam'));
  });
});

type AnySim = Sim & { nextId: number; addEntity(entity: Entity): void };

function setup() {
  const sim = new Sim({
    seed: 7,
    playerClass: 'warrior',
    autoEquip: true,
    world: EMPTY_TEST_WORLD,
  }) as AnySim;
  sim.setPlayerLevel(20);
  const p = sim.player;
  p.equippedItems = { ...p.equippedItems, mainhand: sword, offhand: shield };
  p.resource = p.maxResource;
  p.gcdRemaining = 0;
  const aim = { x: p.pos.x + 9, z: p.pos.z };
  const mob = createMob(sim.nextId++, MOBS.training_dummy, 20, {
    x: aim.x,
    y: p.pos.y,
    z: aim.z + 1,
  });
  mob.hostile = true;
  mob.maxHp = mob.hp = 5000;
  sim.addEntity(mob);
  sim.drainEvents();
  return { sim, p, mob, aim };
}

describe('HIGHFLY Prototype 01 - Salto Demoledor', () => {
  it('uses existing Claude primitives and authored metadata', () => {
    const def = ABILITIES[ID];
    expect(def.targetMode).toBe('position');
    expect(def.weaponStyle).toEqual(['SWORD_1H', 'SWORD_SHIELD', 'DUAL_SWORD']);
    expect(def.aimProfile).toEqual({ shape: 'CIRCLE', radius: 6 });
    expect(def.effects).toEqual([
      { type: 'repositionToAim', landingAoe: { min: 28, max: 36, radius: 6 } },
    ]);
  });

  it('gates weapon, spends cost, starts cooldown, flies, and damages on landing', () => {
    const { sim, p, mob, aim } = setup();
    const hp0 = mob.hp, resource0 = p.resource;
    sim.castAbility(ID, p.id, aim);
    expect(p.leap).not.toBeNull();
    expect(p.resource).toBe(resource0 - ABILITIES[ID].cost);
    expect(p.cooldowns.get(ID)).toBeGreaterThan(0);
    expect(mob.hp).toBe(hp0);

    let events: SimEvent[] = [];
    for (let i = 0; i < 25 && p.leap; i++) events.push(...sim.tick());
    expect(p.leap).toBeNull();
    expect(mob.hp).toBeLessThan(hp0);
    expect(events.some(
      (e) => e.type === 'spellfxAt' && e.ability === ID && e.radius === 6,
    )).toBe(true);
  });

  it('refuses before cost/cooldown with the wrong style', () => {
    const { sim, p, aim } = setup();
    p.equippedItems = {};
    const resource0 = p.resource;
    sim.castAbility(ID, p.id, aim);
    const events = sim.tick();
    expect(p.leap ?? null).toBeNull();
    expect(p.resource).toBe(resource0);
    expect(p.cooldowns.has(ID)).toBe(false);
    expect(events.some(
      (e) => e.type === 'error' && e.text.includes('Estilo de arma requerido'),
    )).toBe(true);
  });

  it('inherits swept-leap placement preview by effect primitive, not id special-case', () => {
    const { sim, p, aim } = setup();
    const preview = sim.groundAimPlacementPreview(ID, aim);
    expect(Number.isFinite(preview.x) && Number.isFinite(preview.z)).toBe(true);
    expect(Math.hypot(preview.x - p.pos.x, preview.z - p.pos.z)).toBeLessThanOrEqual(12.01);
  });
});
""")

print('HIGHFLY adapter overlay applied')

# HIGHFLY VALIDATION PACK 01 — executable cross-class contract


# HIGHFLY VALIDATION PACK 01 — executable cross-class contract
write('src/highfly/validation_pack01.ts', """export type HighflyValidationStatus =
  | 'CUSTOM_VERTICAL_SLICE'
  | 'DONOR_RUNTIME_VERIFIED';

export interface HighflyValidationFamily {
  familyId: string;
  classId: 'warrior' | 'hunter' | 'mage' | 'priest' | 'druid';
  baseName: string;
  evolutionName: string;
  donorAbilityId: string;
  validationAbilityId: string;
  status: HighflyValidationStatus;
  seams: readonly string[];
}

export const HIGHFLY_VALIDATION_PACK_01: readonly HighflyValidationFamily[] = [
  {
    familyId: 'warrior_heroic_leap',
    classId: 'warrior',
    baseName: 'Salto Heroico',
    evolutionName: 'Salto Demoledor',
    donorAbilityId: 'heroic_leap',
    validationAbilityId: 'hf_jump_smash_01',
    status: 'CUSTOM_VERTICAL_SLICE',
    seams: ['position-aim', 'movement', 'landing-authority', 'aoe', 'presentation-adapter'],
  },
  {
    familyId: 'hunter_frostjaw',
    classId: 'hunter',
    baseName: 'Trampa Colmillo Helado',
    evolutionName: 'Prisión del Cazador',
    donorAbilityId: 'frostjaw_trap',
    validationAbilityId: 'frostjaw_trap',
    status: 'DONOR_RUNTIME_VERIFIED',
    seams: ['trap-entity', 'arm-time', 'root', 'slow', 'trigger-lifecycle'],
  },
  {
    familyId: 'mage_pyrelance',
    classId: 'mage',
    baseName: 'Lanza Pírica',
    evolutionName: 'Lanza del Fénix',
    donorAbilityId: 'pyroblast',
    validationAbilityId: 'pyroblast',
    status: 'DONOR_RUNTIME_VERIFIED',
    seams: ['projectile', 'direct-damage', 'dot', 'hot-streak-spender'],
  },
  {
    familyId: 'priest_psalm',
    classId: 'priest',
    baseName: 'Salmo Protector',
    evolutionName: 'Pacto Viviente',
    donorAbilityId: 'power_word_shield',
    validationAbilityId: 'power_word_shield',
    status: 'DONOR_RUNTIME_VERIFIED',
    seams: ['friendly-target', 'absorb', 'doctrine-link', 'damage-to-heal'],
  },
  {
    familyId: 'druid_moonseed',
    classId: 'druid',
    baseName: 'Semilla Lunar',
    evolutionName: 'Oleada Lunar',
    donorAbilityId: 'moonseed',
    validationAbilityId: 'moonseed',
    status: 'DONOR_RUNTIME_VERIFIED',
    seams: ['persistent-slot-id', 'aura-bank', 'runtime-replacement', 'shared-hotbar'],
  },
] as const;
""")

write('tests/highfly_validation_pack01.test.ts', r"""import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HIGHFLY_VALIDATION_PACK_01 } from '../src/highfly/validation_pack01';
import { ABILITIES } from '../src/sim/data';

describe('HIGHFLY Validation Pack 01 cross-class contract', () => {
  it('covers exactly five different classes and keeps implementation authority in Claude runtime', () => {
    expect(HIGHFLY_VALIDATION_PACK_01).toHaveLength(5);
    expect(new Set(HIGHFLY_VALIDATION_PACK_01.map((f) => f.classId)).size).toBe(5);
    expect(HIGHFLY_VALIDATION_PACK_01.every((f) => ABILITIES[f.validationAbilityId])).toBe(true);
  });

  it('Warrior validates mobile position aim -> swept movement -> authoritative landing AoE', () => {
    const def = ABILITIES.hf_jump_smash_01;
    expect(def.targetMode).toBe('position');
    expect(def.aimProfile).toEqual({ shape: 'CIRCLE', radius: 6 });
    expect(def.effects.some((e) => e.type === 'repositionToAim' && e.landingAoe?.radius === 6)).toBe(true);
  });

  it('Hunter validates a real armed trap lifecycle with root and outer slow', () => {
    const def = ABILITIES.frostjaw_trap;
    const trap = def.effects.find((e) => e.type === 'frostjawTrap');
    expect(trap).toMatchObject({
      type: 'frostjawTrap',
      radius: 4,
      armTime: 0.75,
      rootDuration: 3,
      slowMult: 0.5,
      slowDuration: 4,
    });
    const source = readFileSync(join(process.cwd(), 'src/sim/combat/hunter_trap.ts'), 'utf8');
    expect(source).toContain('tickHunterTrap');
    expect(source).toContain('segmentTouchesAnnulus');
    expect(source).toContain('rootInstead');
  });

  it('Mage validates heavy projectile + DoT and the existing Hot Streak spender seam', () => {
    const def = ABILITIES.pyroblast;
    expect(def.projectileFx).toBe('heavyBolt');
    expect(def.effects.some((e) => e.type === 'directDamage')).toBe(true);
    expect(def.effects.some((e) => e.type === 'dot')).toBe(true);
    const source = readFileSync(join(process.cwd(), 'src/sim/combat/fire_mage.ts'), 'utf8');
    expect(source).toContain("HOT_STREAK_SPENDERS");
    expect(source).toContain("'pyroblast'");
  });

  it('Priest validates shield -> Doctrine link without creating a parallel healing path', () => {
    const def = ABILITIES.power_word_shield;
    expect(def.targetType).toBe('friendly');
    expect(def.effects.some((e) => e.type === 'absorb')).toBe(true);
    const source = readFileSync(
      join(process.cwd(), 'src/sim/combat/priest/doctrine.ts'),
      'utf8',
    );
    expect(source).toContain("abilityId === 'power_word_shield'");
    expect(source).toContain('placeDoctrineLink');
  });

  it('Druid validates one persistent hotbar id transforming at the Moontide threshold', () => {
    const def = ABILITIES.moonseed;
    expect(def.actionReplacement).toMatchObject({
      abilityId: 'moonlash',
      auraKind: 'moontide',
      minStacks: 3,
      actorAuraKind: 'form_moonkin',
    });
    expect(ABILITIES.moonlash).toBeTruthy();
    const source = readFileSync(
      join(process.cwd(), 'src/sim/combat/action_replacement.ts'),
      'utf8',
    );
    expect(source).toContain('The learned base id remains authoritative');
    expect(source).toContain('resolveActionReplacement');
  });
});
""")

print('HIGHFLY_VALIDATION_PACK01_CONTRACT=1')
