/**
 * HIGHFLY REBORN: cuatro mecánicas propias usando la autoridad NATIVA de Sim.
 * La clase 'warrior' es únicamente un adaptador temporal de guardados/rig.
 * No importar iconos CraftPix ni efectos propietarios.
 */
import type { AbilityDef } from '../../sim/types';

export const HIGHFLY_SKILL_IDS = [
  'highfly_arc_shot',
  'highfly_cross_cut',
  'highfly_breakstep',
  'highfly_storm_circle',
] as const;
export type HighflySkillId = (typeof HIGHFLY_SKILL_IDS)[number];

export const HIGHFLY_REBORN_SKILLS: Record<HighflySkillId, AbilityDef> = {
  highfly_arc_shot: {
    id: 'highfly_arc_shot', name: 'Pulso Arcano', class: 'warrior',
    learnLevel: 1, cost: 0, castTime: 0, castWhileMoving: true,
    cooldown: 2.5, range: 18, targetMode: 'position',
    school: 'arcane', requiresTarget: false,
    effects: [{ type: 'aoeDamage', min: 12, max: 17, radius: 1.15 }],
    description: 'S1: descarga instantánea apuntada; falla si la zona no alcanza a un enemigo.',
  },
  highfly_cross_cut: {
    id: 'highfly_cross_cut', name: 'Corte Cruzado', class: 'warrior',
    learnLevel: 1, cost: 0, castTime: 0, castWhileMoving: true,
    cooldown: 2, range: 0, school: 'physical', requiresTarget: false,
    effects: [{ type: 'aoeDamage', min: 15, max: 21, radius: 3, frontal: true, frontalHalfAngle: 1.2 }],
    description: 'S2: golpe físico frontal en movimiento, sin selección obligatoria.',
  },
  highfly_breakstep: {
    id: 'highfly_breakstep', name: 'Paso Quebrador', class: 'warrior',
    learnLevel: 1, cost: 0, castTime: 0, castWhileMoving: true,
    cooldown: 6, range: 0, school: 'physical', requiresTarget: false,
    effects: [{ type: 'aoeDamage', min: 13, max: 19, radius: 2.4 }],
    description: 'S3: tras el dash físico de Sim, aplica daño cercano desde la posición final.',
  },
  highfly_storm_circle: {
    id: 'highfly_storm_circle', name: 'Círculo de Tormenta', class: 'warrior',
    learnLevel: 1, cost: 0, castTime: 0, castWhileMoving: true,
    cooldown: 8, range: 15, targetMode: 'position',
    school: 'arcane', requiresTarget: false,
    effects: [{ type: 'groundAoE', min: 4, max: 7, radius: 3.5, duration: 2.5, interval: 0.5 }],
    description: 'S4: zona apuntada circular persistente. Evitable si el enemigo sale de ella.',
  },
};
