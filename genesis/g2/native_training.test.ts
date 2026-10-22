import { describe, expect, it } from 'vitest';
import { createPlayer, recalcPlayerStats } from '../../src/sim/entity';
import type { PlayerEquipment, PlayerEquipmentInstances } from '../../src/sim/entity';
import { ALL_CLASSES } from '../../src/sim/types';
import {
  createHighflyHunterProfile,
  commitTrainingCoreStat,
  HIGHFLY_TRAINING_SCORING_VERSION,
} from '../../src/highfly/training/core';
import {
  genesisAttachTraining,
  genesisApplyTrainingAfterNativeRecalc,
  genesisDetachTraining,
} from '../../src/highfly/genesis/training_runtime';

const gear = {} as PlayerEquipment;
const instances = {} as PlayerEquipmentInstances;

describe('GENESIS G2 actual native entity/stat integration', () => {
  for (const cls of ALL_CLASSES) {
    it(cls + ': zero training is exactly donor baseline on repeated recalcs', () => {
      const player = createPlayer(100, cls, {x:0,y:0,z:0}, 'Test');
      recalcPlayerStats(player,cls,gear,undefined,instances);
      const baseline = { ap:player.attackPower, hp:player.maxHp, speed:player.moveSpeed };
      const profile = createHighflyHunterProfile({profileId:'g2-'+cls, classId:cls});
      genesisAttachTraining(player, cls, profile);
      recalcPlayerStats(player,cls,gear,undefined,instances);
      expect({ap:player.attackPower,hp:player.maxHp,speed:player.moveSpeed}).toEqual(baseline);
      recalcPlayerStats(player,cls,gear,undefined,instances);
      expect({ap:player.attackPower,hp:player.maxHp,speed:player.moveSpeed}).toEqual(baseline);
      genesisDetachTraining(player);
    });
  }
  it('warrior trained STR changes real attack once, not on every recalc', () => {
    const player=createPlayer(123,'warrior',{x:0,y:0,z:0},'Test');
    recalcPlayerStats(player,'warrior',gear,undefined,instances);
    const normal=player.attackPower;
    const fresh=createHighflyHunterProfile({profileId:'g2-real',classId:'warrior'});
    const profile=commitTrainingCoreStat(
      fresh,'STR',fresh.training.core.STR.current+5,
      {source:'training-performance-gate',scoringVersion:HIGHFLY_TRAINING_SCORING_VERSION,evidenceId:'g2-native'},
    );
    genesisAttachTraining(player,'warrior',profile);
    recalcPlayerStats(player,'warrior',gear,undefined,instances);
    const trained=player.attackPower;
    expect(trained).toBeGreaterThan(normal);
    recalcPlayerStats(player,'warrior',gear,undefined,instances);
    expect(player.attackPower).toBe(trained);
    genesisDetachTraining(player);
    recalcPlayerStats(player,'warrior',gear,undefined,instances);
    expect(player.attackPower).toBe(normal);
  });
  it('cannot cross-attach a mage profile to warrior', () => {
    const player=createPlayer(321,'warrior',{x:0,y:0,z:0},'Test');
    const profile=createHighflyHunterProfile({profileId:'g2-mage',classId:'mage'});
    expect(()=>genesisAttachTraining(player,'warrior',profile)).toThrow(/mismatch/);
  });
});
