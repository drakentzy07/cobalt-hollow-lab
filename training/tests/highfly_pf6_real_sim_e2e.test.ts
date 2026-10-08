import { afterEach, describe, expect, it } from 'vitest';
import { dealDamage, grantXp } from '../src/sim/combat/damage';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import { MAX_LEVEL, xpForLevel } from '../src/sim/types';
import {
  HIGHFLY_TRAINING_SCORING_VERSION,
  allocateTrainingPoints,
  createHighflyHunterProfile,
  earnTrainingPoints,
} from '../src/highfly/training/core';
import {
  clearActiveHighflyHunterProfile,
  getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';
import { syncHighflyPf6FromGameplay } from '../src/highfly/training/pf6_progression_sync';

afterEach(() => clearActiveHighflyHunterProfile());

function makeSim(): Sim {
  return new Sim({ seed: 61627, playerClass: 'warrior', autoEquip: true });
}

function project(sim: Sim, eventEntityId: number): void {
  syncHighflyPf6FromGameplay({
    localEntityId: sim.player.id,
    eventEntityId,
    level: sim.player.level,
    barXp: sim.xp,
    classId: 'warrior',
  });
}

describe('HIGHFLY PF-6 D: real donor XP, gameplay events and persistence', () => {
  it('real mob kill awards exactly one donor XP event and mirrors Hunter without Training mint', () => {
    const sim = makeSim();
    sim.setPlayerLevel(5);
    const player = sim.player;
    setActiveHighflyHunterProfile(createHighflyHunterProfile({
      profileId: 'pf6-real-kill', classId: 'warrior', level: player.level,
    }));
    const mob = createMob(sim.nextId++, MOBS.forest_wolf, 5, {
      x: player.pos.x + 2, y: player.pos.y, z: player.pos.z,
    });
    mob.hostile = true;
    mob.tappedById = player.id;
    sim.addEntity(mob);
    const beforeXp = sim.xp;
    const beforeLifetime = sim.players.get(player.id)!.lifetimeXp;
    sim.drainEvents();
    dealDamage(sim.ctx, player, mob, mob.hp + 5000, false, 'physical', null, 'hit');
    expect(mob.dead).toBe(true);
    const xpEvents = sim.drainEvents().filter((event) =>
      event.type === 'xp' && event.pid === player.id,
    );
    expect(xpEvents).toHaveLength(1);
    const credited = xpEvents[0];
    if (!credited || credited.type !== 'xp') throw new Error('Missing XP event');
    expect(credited.amount).toBeGreaterThan(0);
    expect(sim.xp).toBe(beforeXp + credited.amount);
    expect(sim.players.get(player.id)!.lifetimeXp).toBe(beforeLifetime + credited.amount);
    project(sim, player.id);
    expect(getActiveHighflyHunterProfile()?.hunter).toMatchObject({
      level: player.level, xp: sim.xp,
    });
    expect(getActiveHighflyHunterProfile()?.training.points.earned).toBe(0);
  });

  it('real Sim multi-level grant and cap LV99 survive donor save/load plus Training wallet', () => {
    const sim = makeSim();
    const pid = sim.player.id;
    sim.setPlayerLevel(98);
    let profile = createHighflyHunterProfile({
      profileId: 'pf6-lv99-save', classId: 'warrior', level: 98,
    });
    profile = earnTrainingPoints(profile, 4, {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'real-training-existing-session',
    });
    profile = allocateTrainingPoints(profile, 'AGI', 3);
    setActiveHighflyHunterProfile(profile);
    sim.drainEvents();
    const meta = sim.players.get(pid)!;
    const beforeLifetime = meta.lifetimeXp;
    const award = xpForLevel(98) + 123;
    grantXp(sim.ctx, award, meta);
    expect(MAX_LEVEL).toBe(99);
    expect(sim.player.level).toBe(99);
    expect(sim.xp).toBe(0);
    expect(meta.lifetimeXp).toBe(beforeLifetime + award);
    const events = sim.drainEvents();
    expect(events.filter(e => e.type === 'xp' && e.pid === pid)).toHaveLength(1);
    expect(events.filter(e => e.type === 'levelup' && e.pid === pid)).toHaveLength(1);
    project(sim, pid);
    const completed = getActiveHighflyHunterProfile()!;
    expect(completed.hunter).toMatchObject({ level: 99, xp: 0 });
    expect(completed.training.points).toEqual(profile.training.points);

    // Donor CharacterState and HIGHFLY Training profile are saved separately.
    const gameSaved = JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    const trainingSaved = JSON.parse(JSON.stringify(completed));
    expect(gameSaved.level).toBe(99);
    expect(gameSaved.xp).toBe(0);
    const restored = new Sim({ seed: 61628, playerClass: 'warrior', noPlayer: true, autoEquip: true });
    const reloadPid = restored.addPlayer('warrior', 'Return Hunter', { state: gameSaved });
    const reloaded = restored.entities.get(reloadPid);
    expect(reloaded?.level).toBe(99);
    expect(restored.players.get(reloadPid)?.xp).toBe(0);
    clearActiveHighflyHunterProfile();
    setActiveHighflyHunterProfile(trainingSaved);
    const mirror = syncHighflyPf6FromGameplay({
      localEntityId: reloadPid,
      eventEntityId: reloadPid,
      level: reloaded!.level,
      barXp: restored.players.get(reloadPid)!.xp,
      classId: 'warrior',
    });
    expect(mirror?.hunter).toMatchObject({ level: 99, xp: 0 });
    expect(mirror?.training.points).toEqual(profile.training.points);
    expect(mirror?.training.core.AGI.trainingAllocated).toBe(3);
  });

  it('donor grants multiple levels with one XP event and one levelup per level', () => {
    const sim = makeSim();
    const pid = sim.player.id;
    sim.setPlayerLevel(1);
    setActiveHighflyHunterProfile(createHighflyHunterProfile({
      profileId: 'pf6-batch-ding', classId: 'warrior', level: 1,
    }));
    sim.drainEvents();
    const award = xpForLevel(1) + xpForLevel(2) + 25;
    grantXp(sim.ctx, award, sim.players.get(pid)!);
    expect(sim.player.level).toBe(3);
    expect(sim.xp).toBe(25);
    const events = sim.drainEvents();
    expect(events.filter(ev => ev.type === 'xp' && ev.pid === pid)).toHaveLength(1);
    expect(events.flatMap(ev => ev.type === 'levelup' && ev.pid === pid ? [ev.level] : []))
      .toEqual([2, 3]);
    project(sim, pid);
    expect(getActiveHighflyHunterProfile()?.hunter).toMatchObject({ level: 3, xp: 25 });
    expect(getActiveHighflyHunterProfile()?.training.points.earned).toBe(0);
  });
});
