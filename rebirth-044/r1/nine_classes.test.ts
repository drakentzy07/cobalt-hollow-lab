import { describe, expect, it } from 'vitest';
import { ALL_CLASSES, MAX_LEVEL } from '../src/sim/types';
import { CLASSES, abilitiesKnownAt } from '../src/sim/content/classes';
import { classSpecs, talentsFor } from '../src/sim/content/talents';
import { Sim } from '../src/sim/sim';
import { rebirthTrainingKey } from '../src/highfly/rebirth/training_entry';

describe('HIGHFLY REBIRTH 0.44.7 — native nine-class freeze',()=>{
  it('preserves exactly the nine original classes, their 27 specializations, and native cap',()=>{
    expect(ALL_CLASSES).toEqual([
      'warrior','paladin','hunter','rogue','priest',
      'shaman','mage','warlock','druid',
    ]);
    expect(MAX_LEVEL).toBe(20);
    expect(Object.keys(CLASSES).sort()).toEqual([...ALL_CLASSES].sort());
    let specializations=0;
    for (const cls of ALL_CLASSES) {
      const specs=classSpecs(cls);
      expect(specs,cls).toHaveLength(3);
      expect(new Set(specs).size,cls).toBe(3);
      expect(talentsFor(cls),cls).not.toBeNull();
      specializations+=specs.length;
      const native = abilitiesKnownAt(cls, 20);
      expect(native.length,cls+' native spells').toBeGreaterThan(0);
    }
    expect(specializations).toBe(27);
  });

  for(const cls of ALL_CLASSES) {
    it('keeps '+cls+' native ability book and original resource type',()=>{
      const sim=new Sim({seed:23000+ALL_CLASSES.indexOf(cls),playerClass:cls,autoEquip:false});
      expect(sim.player.level).toBe(1);
      expect(sim.player.resourceType).toBe(CLASSES[cls].resourceType);
      const native=abilitiesKnownAt(cls,1).map(x=>x.def.id).sort();
      const inGame=sim.players.get(sim.playerId)?.known.map(x=>x.def.id).sort()??[];
      for (const spellId of native) expect(inGame,spellId+' in native spellbook').toContain(spellId);
      expect(rebirthTrainingKey(cls,'Draken')).toContain(encodeURIComponent(cls));
      expect(rebirthTrainingKey(cls,'Draken')).not.toBe(rebirthTrainingKey(cls,'Other'));
    });
  }
});
