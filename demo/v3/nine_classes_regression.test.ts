import { describe, expect, it } from 'vitest';
import { ABILITIES, CLASSES } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import { ALL_CLASSES, MAX_LEVEL, type PlayerClass } from '../src/sim/types';
import { VISUALS, modularVisualKey } from '../src/render/characters/manifest';
import { createHighflyHunterProfile } from '../src/highfly/training/core';

const NINE_CLASSES: readonly PlayerClass[] = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest',
  'shaman', 'mage', 'warlock', 'druid',
] as const;

describe('HIGHFLY DEMO V3: NINE authentic playable classes remain intact', () => {
  it('preserves exactly the nine original class identities and LV1-99 authority', () => {
    expect([...ALL_CLASSES]).toEqual([...NINE_CLASSES]);
    expect(MAX_LEVEL).toBe(99);
  });

  for (const cls of NINE_CLASSES) {
    it(`${cls}: real class kit, modular rig, training Hunter and native Sim spawn/save/load`, () => {
      const def = CLASSES[cls];
      expect(def, `missing original class definition ${cls}`).toBeDefined();
      expect(def.id).toBe(cls);
      expect(def.startWeapon).toBeTruthy();
      expect(def.abilities.length).toBeGreaterThan(0);
      expect(def.abilities.some(a => ABILITIES[a] !== undefined)).toBe(true);
      const visual = VISUALS[modularVisualKey(cls)];
      expect(visual, `missing modular visual ${cls}`).toBeDefined();
      expect(visual.modular).toBe(true);
      expect(visual.url).toContain('models/chars/modular/warrior_modular.glb');
      const hunter = createHighflyHunterProfile({
        profileId: `v3-nine-classes-${cls}`,
        classId: cls,
        level: 1,
      });
      expect(hunter.hunter.level).toBe(1);
      expect(hunter.training.points.earned).toBe(0);

      const sim = new Sim({ seed: 83001, playerClass: cls, autoEquip: true });
      expect(sim.player).toBeDefined();
      expect(sim.player.templateId).toBe(cls);
      expect(sim.player.level).toBe(1);
      expect(sim.player.hp).toBeGreaterThan(0);
      const saved = JSON.parse(JSON.stringify(sim.serializeCharacter(sim.player.id)));
      const restored = new Sim({ seed: 83002, playerClass: cls, noPlayer: true, autoEquip: true });
      const pid = restored.addPlayer(cls, 'ReturnHunter', { state: saved });
      expect(restored.entities.get(pid)?.templateId).toBe(cls);
      expect(restored.entities.get(pid)?.level).toBe(1);
      expect(restored.entities.get(pid)?.hp).toBeGreaterThan(0);
    });
  }
});
