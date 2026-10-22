/**
 * HIGHFLY GENESIS G2 — preview-only entry quest.
 *
 * NO separate class, mastery, damage, drop or save authority is introduced here.
 * This state progression exists only to validate the entrance-to-NPC-to-wolf
 * journey until an adapter can bind the SAME events to the native HIGHFLY Sim.
 * Resources remain owned by the original simulation.
 */
export type G2QuestPhase = 'meet_smith' | 'hunt_wolf' | 'return_to_smith' | 'complete';
export type G2QuestEvent =
  | { readonly type: 'blacksmith_used' }
  | { readonly type: 'native_wolf_defeated'; readonly monsterId: 'forest_wolf' }
  | { readonly type: 'reset_preview' };
export interface G2TrialQuest {
  readonly schemaVersion: 2;
  readonly kind: 'preview_only';
  readonly hunter: 'universal';
  readonly phase: G2QuestPhase;
  /** Only an NPC-supplied trial flag, NOT persistent equipment or class data. */
  readonly trialWeaponGranted: boolean;
  readonly sourceMonsterDefeated: boolean;
  readonly completed: boolean;
}
export function newG2TrialQuest(): G2TrialQuest {
  return {
    schemaVersion: 2,kind:'preview_only',hunter:'universal',
    phase:'meet_smith',trialWeaponGranted:false,
    sourceMonsterDefeated:false,completed:false,
  };
}
export function advanceG2TrialQuest(s:G2TrialQuest,e:G2QuestEvent):G2TrialQuest {
  if (e.type==='reset_preview') return newG2TrialQuest();
  switch(s.phase){
    case 'meet_smith':
      return e.type==='blacksmith_used'
        ? {...s,phase:'hunt_wolf',trialWeaponGranted:true}:s;
    case 'hunt_wolf':
      return e.type==='native_wolf_defeated'&&e.monsterId==='forest_wolf'
        ? {...s,phase:'return_to_smith',sourceMonsterDefeated:true}:s;
    case 'return_to_smith':
      return e.type==='blacksmith_used'
        ? {...s,phase:'complete',completed:true}:s;
    default:
      return s;
  }
}
export const G2_EXPERIMENTAL_SKILLS = [
  { slot:1, nativeId:'fireball', intent:'projectile' },
  { slot:2, nativeId:'charge', intent:'mobility' },
  { slot:3, nativeId:'cleave', intent:'melee_arc' },
  { slot:4, nativeId:'meteor', intent:'area' },
] as const;
/** The preview must never claim the donor Sim has these IDs at every slot. */
export const G2_TRIAL_STATUS = {
  experimentalMechanics: true, nativeCombatBound: false,realKaykitRig: false,
  originalUnityTerrainLoaded: false,originalSavesWritten: false,
} as const;
