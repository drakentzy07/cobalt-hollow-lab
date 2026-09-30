from pathlib import Path

Path('tests/highfly_vertical_slice_contract.test.ts').write_text(r"""import { describe, expect, it } from 'vitest';
import { ABILITIES } from '../src/sim/data';
import { emptyAllocation } from '../src/sim/content/talents';
import { Sim } from '../src/sim/sim';
import {
  encodeStoredHotbarAction,
  loadoutKnownAbilityIds,
  parseStoredHotbarAction,
  placeAbilityOnSlot,
} from '../src/ui/hud/action_bar/hotbar';
import {
  XHB_ONLY_AIM_SLOT,
  commitGroundAim,
  createGroundAimState,
  enterGroundAim,
  resolveGroundAimAbility,
  shouldUseGroundAim,
} from '../src/ui/hud/action_bar/ground_aim';
import {
  mobileButtonOwnsSourceSlot,
  sourceSlotForMobileButton,
} from '../src/ui/hud/action_bar/mobile_action_page_view';
import { EMPTY_TEST_WORLD } from './sim_shared';

const ID = 'hf_jump_smash_01';

describe('HIGHFLY Prototype 01 full route contract', () => {
  it('is learned/resolved through Claude ability resolution rather than a parallel registry', () => {
    const knownIds = loadoutKnownAbilityIds('warrior', emptyAllocation(), 20);
    expect(knownIds.has(ID)).toBe(true);
    expect(ABILITIES[ID]?.id).toBe(ID);

    const sim = new Sim({
      seed: 11,
      playerClass: 'warrior',
      autoEquip: true,
      world: EMPTY_TEST_WORLD,
    });
    sim.setPlayerLevel(20);
    const resolved = resolveGroundAimAbility(sim.known, ID);

    expect(resolved?.def).toBe(ABILITIES[ID]);
    expect(resolved?.def.targetMode).toBe('position');
    expect(resolved?.def.range).toBe(12);
    expect(resolved?.def.minRange).toBe(2);
  });

  it('uses Claude hotbar placement and persistence with the stable Ability ID', () => {
    const knownIds = loadoutKnownAbilityIds('warrior', emptyAllocation(), 20);
    const empty = Array.from({ length: 33 }, () => null);
    const placed = placeAbilityOnSlot(empty, ID, 8);
    const action = placed[8];

    expect(action).toEqual({ type: 'ability', id: ID });

    const encoded = encodeStoredHotbarAction(action);
    expect(encoded).toBe(JSON.stringify({ type: 'ability', id: ID }));

    const restored = parseStoredHotbarAction(
      encoded,
      (id) => knownIds.has(id),
      () => false,
    );
    expect(restored).toEqual({ type: 'ability', id: ID });
  });

  it('is reachable from the existing mobile radial source slots without a mobile-only skill path', () => {
    const sourceSlot = sourceSlotForMobileButton(0, 0, 'right');
    expect(sourceSlot).toBe(9);
    expect(mobileButtonOwnsSourceSlot(0, 0, sourceSlot)).toBe(true);

    const empty = Array.from({ length: 33 }, () => null);
    const placed = placeAbilityOnSlot(empty, ID, sourceSlot - 1);
    expect(placed[sourceSlot - 1]).toEqual({ type: 'ability', id: ID });

    expect(shouldUseGroundAim(true, true, true)).toBe(true);
  });

  it('keeps the same Ability ID through cross-hotbar-only ground aim enter/commit', () => {
    const active = enterGroundAim(createGroundAimState(), ID, XHB_ONLY_AIM_SLOT);
    expect(active).toEqual({ activeAbilityId: ID, activeSlot: XHB_ONLY_AIM_SLOT });

    const committed = commitGroundAim(active);
    expect(committed.abilityId).toBe(ID);
    expect(committed.state).toEqual({ activeAbilityId: null, activeSlot: null });
  });
});
""", encoding='utf-8')
print('HIGHFLY vertical slice contract tests installed')
