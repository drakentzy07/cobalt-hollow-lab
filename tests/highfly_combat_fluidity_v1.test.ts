import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {HIGHFLY_FLUID_COMBO_LOCKS,HIGHFLY_FLUID_BUFFER_SECONDS,HIGHFLY_FLUID_CHAIN_SECONDS,
 highflyCanBufferAttack,highflyFluidNextStep,highflyFluidRecovery}
 from '../src/highfly/combat/combo_fluidity';
import {highflyComboAnimationRate,highflyWeaponBasicClips}
 from '../src/render/characters/highfly_combat_presentation';

describe('HIGHFLY Combat Fluidity 1.0 — S23 manual attacks',()=>{
  it('has four distinct fast contacts; all improve on the original slow chain',()=>{
    expect(HIGHFLY_FLUID_COMBO_LOCKS).toEqual([0.23,0.25,0.29,0.39]);
    expect(HIGHFLY_FLUID_COMBO_LOCKS.every((t,i)=>t<[0.31,0.35,0.40,0.68][i])).toBe(true);
    expect([0,1,2,3,4].map(n=>highflyFluidNextStep(n as 0|1|2|3|4))).toEqual([1,2,3,4,2]);
    expect([1,2,3,4].map(n=>highflyFluidRecovery(n as 1|2|3|4))).toEqual([0.23,0.25,0.29,0.39]);
    expect(HIGHFLY_FLUID_CHAIN_SECONDS).toBeGreaterThan(HIGHFLY_FLUID_COMBO_LOCKS[3]);
  });
  it('buffers only the last 180ms of a genuine recovery, never unlimited autofire',()=>{
    expect(HIGHFLY_FLUID_BUFFER_SECONDS).toBe(0.18);
    expect(highflyCanBufferAttack(1.00,1.19)).toBe(false);
    expect(highflyCanBufferAttack(1.02,1.19)).toBe(true);
    expect(highflyCanBufferAttack(1.19,1.19)).toBe(false);
    expect(highflyCanBufferAttack(1.21,1.19)).toBe(false);
    expect(highflyCanBufferAttack(NaN,1.19)).toBe(false);
    const hud=readFileSync('src/ui/hud.ts','utf8');
    expect(hud).toContain('this.highflyBufferedAttackUntil = 0;');
    expect(hud).toContain('this.activateFixedAttackSlot();');
    expect(hud).toContain('this.highflyComboReadyAt = now + highflyFluidRecovery(next);');
    expect(hud).toContain('if (p.dead || seconds > this.highflyBufferedAttackUntil || !this.onHighflyBasicAttack)');
  });
  it('leaves damage, mana, stamina, melee acquisition and Fireball aim authoritative',()=>{
    const sim=readFileSync('src/sim/combat/auto_attack.ts','utf8');
    const main=readFileSync('src/main.ts','utf8');
    expect(sim).toContain("weaponMult: 1,");
    expect(sim).toContain('const landed = meleeSwing(ctx, p, t, 0,');
    expect(main).toContain('const success = actionWorld.highflyBasicAttack?.(step) ?? false;');
    expect(main).toContain('if (success) resource?.spend(kind,cost);');
    expect(main).toContain("action.id==='fireball'");
  });
  it('removes heavy slow-motion animation factors without replacing locomotion',()=>{
    expect(highflyComboAnimationRate('highfly_basic_3',1)).toBeGreaterThan(1);
    expect(highflyComboAnimationRate('highfly_basic_4',1)).toBeGreaterThan(1);
    expect(highflyWeaponBasicClips('rusty_hatchet',2)[0]).toBe('1H_Melee_Attack_Slice_Diagonal');
    const visual=readFileSync('src/render/characters/visual.ts','utf8');
    expect(visual).toContain('const upper=source.tracks.filter(track=>isHighflyUpperBodyTrack(track.name));');
    expect(visual).toContain('layer.fadeIn(0.055).play();');
  });
  it('forces physical Hunter name input to LTR on Samsung and accepts explicitly aimed offhand swords',()=>{
    const html=readFileSync('index.html','utf8');
    const css=readFileSync('src/styles/shell.css','utf8');
    const main=readFileSync('src/main.ts','utf8');
    const items=readFileSync('src/sim/items.ts','utf8');
    expect(html).toContain('id="char-name" type="text" dir="ltr"');
    expect(css).toContain('unicode-bidi: normal !important;');
    expect(main).toContain("offlineNameInput.dir = 'ltr';");
    expect(items).toContain("targetSlot === 'offhand' && weaponHand(def) === 'onehand'");
    expect(items).toContain("universalHunterCanEquipSlot(def, slot)");
  });
});
