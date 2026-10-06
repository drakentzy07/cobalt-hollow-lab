import type { Entity, SimEvent } from '../sim/types';
import { highflyWeaponElement } from '../sim/combat/highfly_elemental_basic';

export function highflyWeaponElementColor(entity: Entity): number | null {
  const mode = highflyWeaponElement(entity);
  if (mode === 'fire') return 0xff6b1a;
  if (mode === 'frost') return 0x9be7ff;
  if (mode === 'lightning') return 0x72a7ff;
  if (mode === 'air') return 0xbdf7e7;
  return null;
}

type NativeVfx = {
  tick(id: number, school: string, color?: number): void;
  nova(id: number, school: string, color?: number): void;
  beam(source: number, target: number, school: string, color?: number): void;
};

/** Render-only reaction to the SIM-owned ATK4 event. Never damage authority. */
export function paintHighflyElementalBasic(
  event: SimEvent,
  source: Entity | undefined,
  vfx: NativeVfx,
): void {
  if (!source || event.type !== 'damage' || event.kind !== 'hit' || event.amount <= 0) return;
  if (!event.abilityId?.startsWith('highfly_basic_4_')) return;

  const mode = highflyWeaponElement(source);
  if (mode === 'fire') {
    vfx.tick(event.targetId, 'fire', 0xff6b1a);
    vfx.nova(event.targetId, 'fire', 0xff9a3d);
  } else if (mode === 'frost') {
    vfx.nova(event.targetId, 'frost', 0x9be7ff);
    vfx.tick(event.targetId, 'frost', 0xd8f7ff);
  } else if (mode === 'lightning') {
    vfx.beam(event.sourceId, event.targetId, 'nature', 0x72a7ff);
    vfx.tick(event.targetId, 'nature', 0xc5dcff);
  } else if (mode === 'air') {
    vfx.nova(event.targetId, 'nature', 0xbdf7e7);
  }
}
