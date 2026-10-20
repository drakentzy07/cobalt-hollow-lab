import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { highflyComboAnimationRate, highflySomersaultPitch, HIGHFLY_SOMERSAULT_SECONDS } from '../src/render/characters/highfly_combat_presentation';
import { HIGHFLY_ORIGIN_JUMP_VELOCITY, JUMP_VELOCITY, GRAVITY } from '../src/sim/player_motion';
const read = (path:string) => readFileSync(path, 'utf8');

describe('HIGHFLY F2.3 HUNTER UNCHAINED first integrated mobility + combo pass', () => {
  it('keeps native ClaudeCraft gravity and donor jump untouched', () => {
    expect(JUMP_VELOCITY).toBe(6);
    expect(GRAVITY).toBe(16);
    expect(HIGHFLY_ORIGIN_JUMP_VELOCITY).toBeGreaterThan(JUMP_VELOCITY);
    expect(HIGHFLY_ORIGIN_JUMP_VELOCITY / GRAVITY * 2).toBeGreaterThan(0.85);
    const motion=read('src/sim/player_motion.ts');
    expect(motion.match(/inp.highflyAirDashEnabled === true && !p.mountKey/g)?.length).toBe(2);
  });
  it('second jump finishes the authored flip in the airtime without teleportation', () => {
    expect(HIGHFLY_SOMERSAULT_SECONDS).toBeLessThan(2*HIGHFLY_ORIGIN_JUMP_VELOCITY/GRAVITY);
    expect(highflySomersaultPitch(HIGHFLY_SOMERSAULT_SECONDS / 2)).toBeCloseTo(-Math.PI);
    expect(highflySomersaultPitch(HIGHFLY_SOMERSAULT_SECONDS)).toBe(0);
    expect(highflySomersaultPitch(0.1,true)).toBe(0);
    const visual=read('src/render/characters/visual.ts');
    expect(visual).toContain('this.poseWrap.rotation.x =');
    expect(visual).toContain('this.originFlipTime');
  });
  it('native basic 1-2-3 has different authored attack clips and a decisive cadence', () => {
    const manifest=read('src/render/characters/manifest.ts');
    expect(manifest).toContain("highfly_basic_1: '1H_Melee_Attack_Chop'");
    expect(manifest).toContain("highfly_basic_2: '1H_Melee_Attack_Slice_Diagonal'");
    expect(manifest).toContain("highfly_basic_3: 'Warrior_Reaping_Arc'");
    for(const step of [1,2,3,4]) expect(highflyComboAnimationRate('highfly_basic_'+step, 1.3)).toBeGreaterThan(1.3);
    expect(highflyComboAnimationRate('heroic_leap',1.3)).toBe(1.3);
    expect(highflyComboAnimationRate(undefined,1.3)).toBe(1.3);
  });
  it('uses upper-body overlays at every physical hit transition, without replacing Sim', () => {
    const visual=read('src/render/characters/visual.ts');
    expect(visual).toContain('if (physical && this.originHunterCombat)');
    expect(visual).toContain('layer.timeScale=presentationScale');
    expect(visual).toContain('this.playOriginPhysicalGesture(override, authoredTimeScale ?? this.def.attackTimeScale ?? 1.3, originPhysical, abilityId);');
    expect(read('src/ui/hud.ts')).toContain('this.highflyComboExpiresAt = now + 1.35');
    expect(read('src/main.ts')).not.toContain('new FreedomWorld(');
    expect(read('src/game/highfly_offline_save.ts')).toContain("'highfly-offline-f23-combat-beta'");
    expect(read('src/game/highfly_offline_save.ts')).toContain("'highfly.origin.f23-combat-beta.primary.v1'");
    expect(read('src/highfly/game_c1_runtime.ts')).toContain("'highfly:origin:f23:hud:'");
  });
});
