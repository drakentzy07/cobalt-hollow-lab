/**
 * HIGHFLY REBIRTH R1 — native nine-class offline Training Core.
 * Training is additive; class, spec, ability and resource tables are never touched.
 * Opt-in in an isolated web preview ONLY; no writes to ClaudeCraft CharacterState.
 */
import type { Sim } from '../../sim/sim';
import type { PlayerClass } from '../../sim/types';
import { applyHunterProgression, createHighflyHunterProfile, type HighflyHunterProfile } from '../training/core';
import { getActiveHighflyHunterProfile, setActiveHighflyHunterProfile } from '../training/profile_store';
import { applyActiveTrainingBridgeToEntity, bindActiveTrainingCombatEntity, setActiveTrainingBridgeFlags } from '../training/combat_runtime';
import { installHighflyTrainingUi } from '../training/ui';
import { recalcPlayerStats } from '../../sim/entity';

const PREFIX = 'highfly.rebirth044.training.r1:';
const started = new Set<string>();

export function rebirthTrainingKey(cls: PlayerClass, name: string): string {
  return PREFIX + encodeURIComponent(cls) + ':' + encodeURIComponent(name.trim().toLowerCase());
}

export function rebirthTrainingLoad(key: string, cls: PlayerClass): HighflyHunterProfile {
  const fresh = () => createHighflyHunterProfile({ profileId: key, classId: cls });
  try {
    const json = localStorage.getItem(key);
    if (!json) return fresh();
    const result = JSON.parse(json) as HighflyHunterProfile;
    if (result.schemaVersion !== 5 || result.profileId !== key ||
        result.awakening?.classId !== cls || !result.hunter || !result.training?.points ||
        !result.training?.core) return fresh();
    return result;
  } catch {
    return fresh();
  }
}

export function initHighflyRebirth044Training(sim: Sim, cls: PlayerClass, name: string): void {
  const key=rebirthTrainingKey(cls,name);
  const profile = applyHunterProgression(rebirthTrainingLoad(key,cls), {
    level: Math.min(20, Math.max(1, sim.player.level)), classId: cls,
  });
  setActiveHighflyHunterProfile(profile);

  // The native Sim is still the sole source for class/level/gear/spec/skill.
  bindActiveTrainingCombatEntity(sim.player);
  setActiveTrainingBridgeFlags({
    enabled: true, applyMovement: true, applyPerception: true, applyIntelligence: false,
  });
  const meta=sim.players.get(sim.playerId);
  if (meta) {
    // Recalculate donor stats first, then the bound bridge applies its unique
    // training-derived movement/perception modifiers without replacing class stats.
    recalcPlayerStats(sim.player, cls, meta.equipment, meta.talentMods, meta.equipmentInstance);
  } else {
    applyActiveTrainingBridgeToEntity(sim.player);
  }
  const save=()=>{
    const active=getActiveHighflyHunterProfile();
    if(!active || active.awakening.classId!==cls || active.profileId!==key)return;
    try{localStorage.setItem(key,JSON.stringify(active));}catch{/* quota, private mode */}
  };

  installHighflyTrainingUi();
  // Retain history/TP independently from the donor's offline state.
  // R1 test preview uses one character per tab: save on each changed profile,
  // tab exit, and when Training closes.
  if (!started.has(key)) {
    started.add(key);
    window.addEventListener('highfly:training-session-committed',save);
    document.getElementById('highfly-training-close')?.addEventListener('click',save);
    window.addEventListener('pagehide',save);
    window.addEventListener('highfly:open-training',()=> {
      const open=()=>{
        const popup=document.getElementById('highfly-training-window');
        if(popup)popup.removeAttribute('hidden');
      };
      open();
    });
  }
}
