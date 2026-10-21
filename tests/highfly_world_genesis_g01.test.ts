import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Group, Scene, Object3D } from 'three';
import { createG01Hunter, creditG01Stat, deriveG01Stats, G01_STAT_NAMES } from '../src/highfly/world_genesis/g01_core';
import { G01_BINDINGS, G01_ACCEPTANCE_SEQUENCE } from '../src/highfly/world_genesis/g01_bindings';
import { attachG01Map, g01MapUrl } from '../src/highfly/world_genesis/g01_map_loader';

describe('G01 — original Universal Hunter and donor contracts (NO DEPLOY)', () => {
  it('creates ONE standalone Hunter without any hidden class fields', () => {
    const h = createG01Hunter('hunter-001', 'Draken', 'male');
    expect(h.identity.body).toBe('male');
    expect(Object.keys(h)).toEqual(['schemaVersion', 'identity', 'base', 'training', 'adventure']);
    expect(JSON.stringify(h)).not.toMatch(/classId|playerClass|awakeningClass|specId/);
    expect(createG01Hunter('hunter-002', 'Cazadora', 'female').identity.body).toBe('female');
    expect(G01_STAT_NAMES).toEqual(['STR','AGI','VIT','PER','INT']);
  });
  it('gives TRAINING stronger primary-stat influence than equal in-world credits', () => {
    const initial = createG01Hunter('id', 'Draken', 'male');
    const trained = creditG01Stat(initial, 'training', 'STR', 4);
    const played = creditG01Stat(initial, 'adventure', 'STR', 4);
    expect(deriveG01Stats(trained).STR).toBeGreaterThan(deriveG01Stats(played).STR);
    expect(deriveG01Stats(initial).STR).toBe(10);
    expect(initial.training.STR).toBe(0);
    expect(() => creditG01Stat(initial, 'adventure', 'STR', -2)).toThrow();
  });
  it('points to real HIGHFLY donors, not a second engine or a migrated Warrior', () => {
    expect(G01_BINDINGS.skill.id).toBe('fireball');
    expect(G01_BINDINGS.wolf.id).toBe('forest_wolf');
    expect(G01_BINDINGS.npc.behaviorDonorId).toBe('smith_haldren');
    const zone = readFileSync('src/sim/content/zone1.ts', 'utf8');
    const abilities = readFileSync('src/sim/content/classes.ts', 'utf8');
    expect(zone).toContain('forest_wolf:');
    expect(zone).toContain('smith_haldren:');
    expect(abilities).toContain('fireball:');
    expect(G01_ACCEPTANCE_SEQUENCE).toHaveLength(6);
  });
  it('loads a real exported RG Poly GLB into Three.js without runtime Unity', async () => {
    const parent = new Scene();
    const testGroup = new Group();
    testGroup.add(new Object3D());
    let asset = '';
    const root = await attachG01Map(parent, '/cobalt-hollow-lab/', {
      async loadAsync(url) { asset = url; return { scene: testGroup }; },
    });
    expect(asset).toBe('/cobalt-hollow-lab/highfly/world-genesis/rgpoly-city01.glb');
    expect(g01MapUrl('')).toBe('/highfly/world-genesis/rgpoly-city01.glb');
    expect(root.name).toBe('HIGHFLY_G01_RG_POLY_CITY');
    expect(parent.children).toContain(root);
  });
  it('does not silently substitute fake terrain when GLB is missing', async () => {
    const scene = new Scene();
    await expect(attachG01Map(scene, '/', {
      async loadAsync() { throw new Error('404 real GLB absent'); },
    })).rejects.toThrow('404 real GLB absent');
    expect(scene.children).toHaveLength(0);
  });
  it('does not touch original World/Lab namespace keys', () => {
    const modes = readFileSync('src/highfly/origin/unified_mode.ts','utf8');
    expect(modes).toContain("'highfly.origin.primary.v1'");
    expect(modes).toContain("'highfly.origin.lab.primary.v1'");
    const core = readFileSync('src/highfly/world_genesis/g01_core.ts','utf8');
    expect(core).not.toContain('from \'../../sim/content/classes');
  });
});
