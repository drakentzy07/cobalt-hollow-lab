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
        raise SystemExit(f'{path}: expected 1 anchor, got {n}: {old[:120]!r}')
    write(path, text.replace(old, new, 1))

# ---------------------------------------------------------------------------
# Donor Presentation Adapter: promote Prototype 01 from provisional Heroic Leap
# visuals to its own authored HIGHFLY VFX identity while keeping the proven
# Claude body animation and heavy Slam audio route.
# ---------------------------------------------------------------------------
rep(
    'src/highfly/presentation_adapter.ts',
    """export interface HighflyCameraFeedback {
  event: 'release' | 'landing' | 'impact';
  amount: number;
}
""",
    """export interface HighflyCameraFeedback {
  event: 'release' | 'landing' | 'impact';
  amount: number;
  /** Presentation-only animation hold. Never pauses or changes the sim clock. */
  hitStopSeconds?: number;
}
""",
)
rep(
    'src/highfly/presentation_adapter.ts',
    """    visualHitMoments: [{ event: 'landing', normalizedTime: 1 }],
    vfxRoute: 'heroic_leap',
    sfxRoute: 'slam',
    cameraFeedback: { event: 'landing', amount: 0.12 },
""",
    """    // Approved Unity donor hit was at 0.58s; Claude's swept flight is 0.60s.
    visualHitMoments: [{ event: 'landing', normalizedTime: 1 }],
    vfxRoute: 'hf_jump_smash_01',
    sfxRoute: 'slam',
    cameraFeedback: { event: 'landing', amount: 0.24, hitStopSeconds: 0.07 },
""",
)
rep(
    'src/highfly/presentation_adapter.ts',
    """export type HighflyPresentationRouteKind = 'animation' | 'vfx' | 'sfx';

export function highflyPresentationRoute(
""",
    """export type HighflyPresentationRouteKind = 'animation' | 'vfx' | 'sfx';

export function highflyPresentation(abilityId: string): HighflyDonorPresentation | undefined {
  return HIGHFLY_PRESENTATION_BY_ABILITY[abilityId];
}

export function highflyPresentationRoute(
""",
)

# ---------------------------------------------------------------------------
# Authored HIGHFLY VFX spec. This is presentation data only.
# EarthShatter = fracture/debris/dust; EnergyExplosion = orange fire ring,
# ember burst, light and scorch. The VFX cannot create hits.
# ---------------------------------------------------------------------------
write(
    'src/highfly/jump_smash_vfx_spec.ts',
    """import type { AbilityVfxFullSpec, AbilityVfxSpec } from '../render/ability_vfx_core';

export const HIGHFLY_JUMP_SMASH_VFX_SPEC: AbilityVfxSpec = {
  c: '#ff6a22',
  p: 'fire',
  pw: 1.5,
  sp: 52,
  rg: 2.8,
  vr: 1,
  db: 1,
  sm: 1,
  li: 1.7,
  lg: 1.8,
  wu: 0.3,
  a: 'dash',
};

export const HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC: AbilityVfxFullSpec = {
  archetype: 'dash',
  palette: 'fire',
  power: 1.5,
  windup: 0.3,
  windupStyle: 'weapon',
  motifs: ['fissure'],
  motifAt: 'target',
  decal: 'crack',
  linger: 1.8,
  rim: '#ff8a3c',
  tint: '#ff5a18',
  accent: '#ffd08a',
  hot: 0.28,
  impact: {
    trail: 'overhead',
    ring: 2.8,
    vRing: true,
    sparks: 52,
    debris: true,
    smoke: true,
    flipbook: true,
    light: 1.7,
  },
};
""",
)

write(
    'src/render/ability_vfx/highfly_jump_smash.ts',
    """import type { SequencerHost } from './sequencer';
import { drawWarriorLeapLanding } from './warrior_leap';

/**
 * HIGHFLY Jump Smash landing presentation.
 *
 * It deliberately composes Claude's authored Vaulting Charge fracture with a
 * separate fiery EnergyExplosion layer. This function is render-only: no
 * target lookup, no damage, no state mutation.
 */
export function drawHighflyJumpSmashLanding(
  host: SequencerHost,
  x: number,
  z: number,
  radius: number,
  tier: number,
  cameraAmount: number,
): number {
  if (![x, z, radius, cameraAmount].every(Number.isFinite) || radius <= 0) return 0;

  // EarthShatter: reuse the production warrior fracture instead of rebuilding
  // another crack/debris system.
  let count = drawWarriorLeapLanding(host, x, z, radius, tier);
  const floor = host.groundYAt(x, z);
  const scale = radius / 6;

  // EnergyExplosion: one hot horizontal wave plus a vertical compression ring.
  host.ringAt(x, floor + 0.08, z, radius * 0.92, 0.42, 0xff6a22, 2.1, false);
  host.ringAt(x, floor + 0.28, z, radius * 0.58, 0.34, 0xffb15c, 1.7, true);
  count += 2;

  // Scorched center remains after the physical fracture, matching the old
  // EarthShatter + EnergyExplosion two-layer donor read.
  host.decalXZ(x, z, radius * 0.72, 0xff6a22, 'scorch', 1.15);
  count++;

  if (tier < 2) {
    host.burstAt(x, floor + 0.4, z, 0xff7a2a, tier === 0 ? 52 : 24, 1.45, 'embers', 0.55);
    host.burstAt(x, floor + 0.18, z, 0x4a3328, tier === 0 ? 22 : 10, 1.05, 'smoke', 0.65);
    count += 2;
  }
  if (tier === 0) {
    host.burstAt(x, floor + 0.16, z, 0xb08a66, 18, 1.25, 'debris', 0.5);
    host.worldLightAt?.(x, floor + 0.55, z, 'fire', 5.2 * scale, 0.24);
    count += 2;
  }

  // The base fracture already has a compressed physical catch. This extra
  // adapter-driven camera beat is the old Jump Smash's premium landing punch.
  host.shakeAt(x, floor, z, cameraAmount, true);
  count++;
  return count;
}
""",
)

# Registry: own VFX identity, not a Heroic Leap alias.
rep(
    'src/render/ability_vfx_registry.ts',
    """import { highflyPresentationRoute } from '../highfly/presentation_adapter';
import type { AbilityVfxFullSpec, AbilityVfxSpec } from './ability_vfx_core';
""",
    """import {
  HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC,
  HIGHFLY_JUMP_SMASH_VFX_SPEC,
} from '../highfly/jump_smash_vfx_spec';
import { highflyPresentationRoute } from '../highfly/presentation_adapter';
import type { AbilityVfxFullSpec, AbilityVfxSpec } from './ability_vfx_core';
""",
)
rep(
    'src/render/ability_vfx_registry.ts',
    """export function abilityVfxSpec(abilityId: string): AbilityVfxSpec | undefined {
  const routed = highflyPresentationRoute(abilityId, 'vfx');
  if (routed !== abilityId) return abilityVfxSpec(routed);
""",
    """export function abilityVfxSpec(abilityId: string): AbilityVfxSpec | undefined {
  const routed = highflyPresentationRoute(abilityId, 'vfx');
  if (routed !== abilityId) return abilityVfxSpec(routed);
  if (abilityId === 'hf_jump_smash_01') return HIGHFLY_JUMP_SMASH_VFX_SPEC;
""",
)
rep(
    'src/render/ability_vfx_registry.ts',
    """export function abilityVfxFullSpec(abilityId: string): AbilityVfxFullSpec | undefined {
  const routed = highflyPresentationRoute(abilityId, 'vfx');
  if (routed !== abilityId) return abilityVfxFullSpec(routed);
""",
    """export function abilityVfxFullSpec(abilityId: string): AbilityVfxFullSpec | undefined {
  const routed = highflyPresentationRoute(abilityId, 'vfx');
  if (routed !== abilityId) return abilityVfxFullSpec(routed);
  if (abilityId === 'hf_jump_smash_01') return HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC;
""",
)

# Landing event carries the caster id strictly for presentation routing.
rep(
    'src/sim/combat/heroic_leap.ts',
    """    radius: flight.landingAoe.radius,
    ability: flight.abilityId,
""",
    """    radius: flight.landingAoe.radius,
    ability: flight.abilityId,
    sourceId: entity.id,
""",
)

# One recorded heavy landing cue. This replaces the generic nova+school pair
# for the world-point impact; procedural ability audio can still supply the
# fiery layer from the VFX sequencer.
rep(
    'src/ui/combat_sfx.ts',
    """  flamestrike: 'flamestrike',
};
""",
    """  flamestrike: 'flamestrike',
  hf_jump_smash_01: 'impact_masterwork_execution',
};
""",
)

# Bespoke landing draw + adapter-driven hitstop/camera. No damage code here.
rep(
    'src/render/ability_vfx/painter.ts',
    """import { drawWarriorLeapLanding, drawWarriorLeapLaunch } from './warrior_leap';
""",
    """import { highflyPresentation } from '../../highfly/presentation_adapter';
import { drawHighflyJumpSmashLanding } from './highfly_jump_smash';
import { drawWarriorLeapLanding, drawWarriorLeapLaunch } from './warrior_leap';
""",
)
rep(
    'src/render/ability_vfx/painter.ts',
    """    if (ev.ability === 'heroic_leap' && ev.fx === 'nova') {
      const tier = this.biasFor(casterId, this.budget.peek(casterId, nowSec));
      this.spawned = drawWarriorLeapLanding(fx, ev.x, ev.z, ev.radius ?? 6, tier);
      this.spawned += this.areaTelegraph(ev, planCast(spec, this.quality, tier).color);
      this.recordStat('heroic_leap', true);
      return true;
    }
""",
    """    if (ev.ability === 'hf_jump_smash_01' && ev.fx === 'nova') {
      const tier = this.biasFor(casterId, this.budget.peek(casterId, nowSec));
      const presentation = highflyPresentation(ev.ability);
      const feedback =
        presentation?.cameraFeedback?.event === 'landing' ? presentation.cameraFeedback : undefined;
      this.spawned = drawHighflyJumpSmashLanding(
        fx,
        ev.x,
        ev.z,
        ev.radius ?? 6,
        tier,
        feedback?.amount ?? 0.24,
      );
      this.spawned += this.areaTelegraph(ev, planCast(spec, this.quality, tier).color);
      if (casterId >= 0 && feedback?.hitStopSeconds) {
        // Animation-only hold: the sim clock, movement and damage are untouched.
        this.deps.animHold?.(casterId, 0.06, feedback.hitStopSeconds);
      }
      this.deps.abilityAudio?.('impact', 'fire', 1.5, ev.x, gy, ev.z, {
        abilityId: ev.ability,
        lite: tier > 0,
      });
      this.recordStat(ev.ability, true);
      return true;
    }
    if (ev.ability === 'heroic_leap' && ev.fx === 'nova') {
      const tier = this.biasFor(casterId, this.budget.peek(casterId, nowSec));
      this.spawned = drawWarriorLeapLanding(fx, ev.x, ev.z, ev.radius ?? 6, tier);
      this.spawned += this.areaTelegraph(ev, planCast(spec, this.quality, tier).color);
      this.recordStat('heroic_leap', true);
      return true;
    }
""",
)

# The first adapter test previously pinned the provisional Heroic Leap VFX alias.
rep(
    'tests/highfly_skill_adapter.test.ts',
    """    expect(highflyPresentationRoute(ID, 'animation')).toBe('heroic_leap');
    expect(highflyPresentationRoute(ID, 'vfx')).toBe('heroic_leap');
    expect(highflyPresentationRoute(ID, 'sfx')).toBe('slam');
    expect(HIGHFLY_PRESENTATION_BY_ABILITY[ID]?.retargetProfile).toBeTruthy();
    expect(abilityVfxFullSpec(ID)).toBe(abilityVfxFullSpec('heroic_leap'));
    expect(castCueForAbility(ID)).toBe(castCueForAbility('slam'));
""",
    """    expect(highflyPresentationRoute(ID, 'animation')).toBe('heroic_leap');
    expect(highflyPresentationRoute(ID, 'vfx')).toBe(ID);
    expect(highflyPresentationRoute(ID, 'sfx')).toBe('slam');
    expect(HIGHFLY_PRESENTATION_BY_ABILITY[ID]?.retargetProfile).toBeTruthy();
    expect(abilityVfxFullSpec(ID)?.palette).toBe('fire');
    expect(abilityVfxFullSpec(ID)?.motifs).toContain('fissure');
    expect(castCueForAbility(ID)).toBe(castCueForAbility('slam'));
""",
)

write(
    'tests/highfly_jump_smash_full.test.ts',
    """import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  highflyPresentation,
  highflyPresentationRoute,
} from '../src/highfly/presentation_adapter';
import {
  HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC,
  HIGHFLY_JUMP_SMASH_VFX_SPEC,
} from '../src/highfly/jump_smash_vfx_spec';
import { abilityVfxFullSpec, abilityVfxSpec } from '../src/render/ability_vfx_registry';
import { drawHighflyJumpSmashLanding } from '../src/render/ability_vfx/highfly_jump_smash';
import type { SequencerHost } from '../src/render/ability_vfx/sequencer';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import { novaAbilityCue } from '../src/ui/combat_sfx';
import { EMPTY_TEST_WORLD } from './sim_shared';

const ID = 'hf_jump_smash_01';

describe('HIGHFLY Jump Smash FULL presentation contract', () => {
  it('keeps the approved 0.60s leap body route but owns VFX and heavy landing audio', () => {
    const p = highflyPresentation(ID);
    expect(highflyPresentationRoute(ID, 'animation')).toBe('heroic_leap');
    expect(highflyPresentationRoute(ID, 'vfx')).toBe(ID);
    expect(highflyPresentationRoute(ID, 'sfx')).toBe('slam');
    expect(p?.visualHitMoments).toEqual([{ event: 'landing', normalizedTime: 1 }]);
    expect(p?.cameraFeedback).toEqual({
      event: 'landing',
      amount: 0.24,
      hitStopSeconds: 0.07,
    });
    expect(novaAbilityCue(ID)).toBe('impact_masterwork_execution');
  });

  it('registers a real fire+fissure VFX identity instead of aliasing Heroic Leap', () => {
    expect(abilityVfxSpec(ID)).toBe(HIGHFLY_JUMP_SMASH_VFX_SPEC);
    expect(abilityVfxFullSpec(ID)).toBe(HIGHFLY_JUMP_SMASH_VFX_FULL_SPEC);
    expect(abilityVfxFullSpec(ID)?.palette).toBe('fire');
    expect(abilityVfxFullSpec(ID)?.motifs).toContain('fissure');
    expect(abilityVfxFullSpec(ID)?.impact?.trail).toBe('overhead');
    expect(abilityVfxFullSpec(ID)?.impact?.debris).toBe(true);
    expect(abilityVfxFullSpec(ID)?.impact?.smoke).toBe(true);
  });

  it('composes EarthShatter + EnergyExplosion through render primitives only', () => {
    const calls = {
      decals: [] as string[],
      bursts: [] as string[],
      rings: 0,
      shakes: [] as number[],
      lights: 0,
    };
    const host = {
      groundYAt: () => 0,
      decalXZ: (_x: number, _z: number, _r: number, _c: number, style: string) =>
        calls.decals.push(style),
      crestAt: () => true,
      pathRibbon: (
        _c: number,
        _w: number,
        _l: number,
        fill: (points: { set(x: number, y: number, z: number): unknown }[]) => number,
      ) => {
        fill(Array.from({ length: 12 }, () => ({ set: vi.fn() })));
        return true;
      },
      bakedAt: vi.fn(),
      fragmentsAt: vi.fn(),
      flipbookAt: vi.fn(),
      shakeAt: (_x: number, _y: number, _z: number, amount: number) =>
        calls.shakes.push(amount),
      ringAt: () => {
        calls.rings++;
      },
      burstAt: (
        _x: number,
        _y: number,
        _z: number,
        _c: number,
        _n: number,
        _p: number,
        kind: string,
      ) => calls.bursts.push(kind),
      worldLightAt: () => {
        calls.lights++;
      },
    } as unknown as SequencerHost;

    const count = drawHighflyJumpSmashLanding(host, 4, 9, 6, 0, 0.24);

    expect(count).toBeGreaterThan(10);
    expect(calls.decals).toContain('leap_fracture');
    expect(calls.decals).toContain('scorch');
    expect(calls.bursts).toContain('embers');
    expect(calls.bursts).toContain('smoke');
    expect(calls.bursts).toContain('debris');
    expect(calls.rings).toBe(2);
    expect(calls.lights).toBe(1);
    expect(calls.shakes).toContain(0.24);
  });

  it('emits the landing presentation cue from the authoritative landing, with source id', () => {
    const sim = new Sim({
      seed: 19,
      playerClass: 'warrior',
      autoEquip: true,
      world: EMPTY_TEST_WORLD,
    });
    sim.setPlayerLevel(20);
    const p = sim.player;
    p.resource = p.maxResource;
    p.gcdRemaining = 0;
    const aim = { x: p.pos.x + 8, z: p.pos.z };

    sim.castAbility(ID, p.id, aim);
    let events: SimEvent[] = [];
    for (let i = 0; i < 30 && p.leap; i++) events.push(...sim.tick());

    const landing = events.find(
      (e): e is Extract<SimEvent, { type: 'spellfxAt' }> =>
        e.type === 'spellfxAt' && e.ability === ID && e.fx === 'nova',
    );
    expect(landing).toBeTruthy();
    expect(landing?.sourceId).toBe(p.id);
    expect(landing?.radius).toBe(6);
  });

  it('keeps the FULL presentation layer free of damage authority', () => {
    const vfx = readFileSync(
      join(process.cwd(), 'src/render/ability_vfx/highfly_jump_smash.ts'),
      'utf8',
    );
    const spec = readFileSync(
      join(process.cwd(), 'src/highfly/jump_smash_vfx_spec.ts'),
      'utf8',
    );
    const adapter = readFileSync(
      join(process.cwd(), 'src/highfly/presentation_adapter.ts'),
      'utf8',
    );
    const combined = vfx + spec + adapter;

    expect(combined).not.toMatch(/dealDamage|TakeDamage|damageTarget|hostilesInRadius/);
  });
});
""",
)

print('HIGHFLY Jump Smash FULL presentation installed')
