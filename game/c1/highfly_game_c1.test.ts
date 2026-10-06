import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyHighflyElementalFinisher,
  configureHighflyWeaponElement,
  highflyElementalFinisherReady,
  highflyWeaponElement,
} from '../src/sim/combat/highfly_elemental_basic';
import { BUILTIN_WORLD, CLASSES, MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import { placePlayerInOpenField } from './helpers/open_field';

function fixture() {
  const sim = new Sim({
    seed: 5151,
    playerClass: 'warrior',
    autoEquip: true,
    world: { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] },
  });
  sim.setPlayerLevel(20);
  placePlayerInOpenField(sim);
  const p = sim.player;
  const target = createMob(sim.nextId++, MOBS.forest_wolf, 1, {
    x: p.pos.x,
    y: p.pos.y,
    z: p.pos.z + 2,
  });
  target.hostile = true;
  target.maxHp = target.hp = 5000;
  sim.addEntity(target);
  p.targetId = target.id;
  return { sim, p, target };
}

describe('HIGHFLY GAME-C1 character + combat + HUD foundation', () => {
  it('keeps the nine original ClaudeCraft classes as the runtime class set', () => {
    expect(Object.keys(CLASSES).sort()).toEqual(
      ['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'].sort(),
    );
  });

  it('keeps ATK4 locked without an active equipped-weapon gem', () => {
    const { p } = fixture();
    expect(highflyWeaponElement(p)).toBe('base');
    expect(highflyElementalFinisherReady(p)).toBe(false);
    configureHighflyWeaponElement(p, p.mainhandItemId, 'base', false);
    expect(highflyElementalFinisherReady(p)).toBe(false);
  });

  it.each([
    ['fire', 'dot'],
    ['frost', 'slow'],
    ['lightning', 'stun'],
  ] as const)('%s enables ATK4 and adds only its elemental rider', (mode, kind) => {
    const { sim, p, target } = fixture();
    configureHighflyWeaponElement(p, p.mainhandItemId, mode, true);
    expect(highflyWeaponElement(p)).toBe(mode);
    expect(highflyElementalFinisherReady(p)).toBe(true);
    const hp = target.hp;
    applyHighflyElementalFinisher(sim.ctx, p, target, mode);
    expect(target.hp).toBe(hp);
    expect(target.auras.some((a) => a.kind === kind)).toBe(true);
  });

  it('air uses displacement without rewriting native damage', () => {
    const { sim, p, target } = fixture();
    configureHighflyWeaponElement(p, p.mainhandItemId, 'air', true);
    const before = { x: target.pos.x, z: target.pos.z, hp: target.hp };
    applyHighflyElementalFinisher(sim.ctx, p, target, 'air');
    expect(target.hp).toBe(before.hp);
    expect(Math.hypot(target.pos.x - before.x, target.pos.z - before.z)).toBeGreaterThan(0);
  });

  it('rejects a gem bound to a weapon that is not currently equipped', () => {
    const { p } = fixture();
    configureHighflyWeaponElement(p, 'not-equipped', 'fire', true);
    expect(highflyWeaponElement(p)).toBe('base');
    expect(highflyElementalFinisherReady(p)).toBe(false);
  });

  it('GAME-C1 never imports or mutates HIGHFLY Core', () => {
    const files = [
      readFileSync('src/highfly/game_c1_runtime.ts', 'utf8'),
      readFileSync('src/sim/combat/highfly_elemental_basic.ts', 'utf8'),
      readFileSync('src/highfly/game_c1_elemental_weapon_vfx.ts', 'utf8'),
    ].join('\n');
    expect(files).not.toContain("highfly/training/core");
    expect(files).not.toContain('HIGHFLY_CORE_STATS');
    expect(files).not.toContain('training.core');
    expect(files).not.toMatch(/\.STR\s*=|\.AGI\s*=|\.VIT\s*=|\.PER\s*=|\.INT\s*=/);
  });

  it('contains no alternate-body or affinity runtime', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    const elemental = readFileSync('src/sim/combat/highfly_elemental_basic.ts', 'utf8');
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    const combined = [runtime, elemental, css].join('\n').toLowerCase();
    expect(combined).not.toContain('qmale');
    expect(combined).not.toContain('qfemale');
    expect(combined).not.toContain('hf_aff_');
  });

  it('reserves exactly ten native skill seats in the approved compact cluster', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    expect(css.toLowerCase()).not.toContain('crescent');
    const points: Array<{ slot: number; right: number; bottom: number }> = [];
    const lines = css.split(/\r?\n/);
    for (let slot = 1; slot <= 10; slot++) {
      const marker = '[data-hotbar-slot="' + slot + '"]';
      const line = lines.find((row) =>
        row.includes(marker) && row.includes('{ right:') && row.includes('bottom:'),
      );
      expect(line, 'missing S' + slot).toBeDefined();
      const match = line?.match(/right:\s*(\d+)px[^;]*;\s*bottom:\s*(\d+)px/);
      expect(match, 'unreadable geometry S' + slot).not.toBeNull();
      points.push({ slot, right: Number(match?.[1]), bottom: Number(match?.[2]) });
    }
    expect(new Set(points.map((p) => p.right + ':' + p.bottom)).size).toBe(10);
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(
          Math.hypot(points[i].right - points[j].right, points[i].bottom - points[j].bottom),
          'skill collision S' + points[i].slot + '/S' + points[j].slot,
        ).toBeGreaterThanOrEqual(44);
      }
    }
  });

  it('keeps ESP1 ESP2 ULT reserved and TARGET / evade / jump separate', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    for (const id of ['hf-c1-esp1','hf-c1-esp2','hf-c1-ult']) {
      expect(css).toContain('#' + id);
      expect(runtime).toContain(id);
    }
    expect(css).toContain('#mobile-target-cycle');
    expect(css).toContain('#mobile-evade');
    expect(css).toContain('#mobile-jump');
  });

  it('uses one contextual ATK/USAR control and hides the separate native Use surface', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    const controller = readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts', 'utf8');
    const main = readFileSync('src/main.ts', 'utf8');
    expect(css).toMatch(/#mobile-interact[\s\S]*display:\s*none\s*!important/);
    expect(controller).toContain('contextualUse(): boolean');
    expect(controller).toContain('if (deps.contextualUse())');
    expect(main).toContain('resolveNearbyInteractionCandidate');
    expect(main).toContain('hud.onMobileContextualUse = highflyContextualUse');
  });

  it('owns touch for S1-S10 so hold inspects and a second touch still executes native click', () => {
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain("event.pointerType !== 'touch'");
    expect(runtime).toContain('stopImmediatePropagation');
    expect(runtime).toContain('520');
    expect(runtime).toContain('btn.click()');
    expect(runtime).toContain('suppressClickUntil');
  });

  it('keeps actionable utility seats separate from passive aura information', () => {
    const css = readFileSync('src/styles/hf_game_c1.css', 'utf8');
    const runtime = readFileSync('src/highfly/game_c1_runtime.ts', 'utf8');
    expect(runtime).toContain('hf-c1-utility-lane');
    expect(runtime).toContain('mobile-consumable-seat');
    expect(runtime).toContain('mobile-stance-anchor');
    expect(css).toContain('#buff-bar');
    expect(css).not.toMatch(/#buff-bar[\s\S]{0,300}pointer-events:\s*auto/);
  });
});
