import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { bestSoftAutoTarget, shouldAutoTarget } from '../src/game/auto_target';
import { highflyV91UnawareStealthBackstab } from '../src/sim/combat/highfly_v91_rogue_opener';
import { ABILITIES } from '../src/sim/content/classes';
import type { Entity } from '../src/sim/types';

const CLASSES = ['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'] as const;
type Foe = { id:number; pos:{x:number;z:number}; hp:number; maxHp:number };
const foes: Foe[]=[
  {id:1,pos:{x:0,z:2.8},hp:100,maxHp:100},
  {id:2,pos:{x:0,z:-2},hp:100,maxHp:100},
  {id:3,pos:{x:0,z:15},hp:100,maxHp:100},
];
const pick=(range=40,current:number|null=null)=>bestSoftAutoTarget(foes,{x:0,z:0},0,()=>true,range,current);

describe('HIGHFLY V9.1 — native nine-class mobile action aim (shared not Rogue-only)',()=>{
  for (const cls of CLASSES) {
    it(cls+' soft-aims near 360 hostile from ANY previous target',()=>{
      expect(pick(40,3)).toBe(1);
      expect(bestSoftAutoTarget(
        [{id:1,pos:{x:0,z:-2},hp:100,maxHp:100}],{x:0,z:0},0,()=>true,5
      )).toBe(1);
    });
  }
  it('keeps hard manual TARGET/LOCK routed separately from the soft picker',()=>{
    const main=readFileSync('src/main.ts','utf8');
    expect(main).toContain('highflyManualTargetLocked()');
    expect(main).toContain('highflyV91AimAt(lockedEntity.id)');
    expect(main).toContain('highflyV91AimAt(best)');
  });
  it('mobile ATK aims BEFORE each strike even when a stale hostile is already selected',()=>{
    const ring=readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts','utf8');
    expect(ring).toMatch(/deps\.attackNearest\?\.\(\);[\s\S]{0,90}deps\.activateFixedAttackSlot\(\);/);
    expect(ring).not.toContain('handleMobileAttackTap(deps.attackTapState()');
    const main=readFileSync('src/main.ts','utf8');
    expect(main).toContain('const basicReach');
    expect(main).toContain("c === 'hunter' ? 35");
    expect(main).toContain("'warlock' ? 30 : 5");
  });
  it('ability soft target uses real melee range instead of the old 12 yd selection',()=>{
    const picker=readFileSync('src/game/pad_target_pick.ts','utf8');
    expect(picker).toContain('Math.max(5, ability.range)');
    expect(picker).toContain('onSoftAim?.(picked)');
    expect(pick(5)).toBe(1);
    expect(bestSoftAutoTarget([{id:9,pos:{x:0,z:8}}],{x:0,z:0},0,()=>true,5)).toBeNull();
  });
  it('does not change heals or untargeted AoEs into hostile casts',()=>{
    expect(shouldAutoTarget({requiresTarget:false},false)).toBe(false);
    expect(shouldAutoTarget({requiresTarget:true,targetType:'friendly'},false)).toBe(false);
    expect(shouldAutoTarget({requiresTarget:true},true)).toBe(false);
  });
});

describe('HIGHFLY V9.1 — Rogue stealth opener, authored identity preserved',()=>{
  const rogue = {id:10,kind:'player',auras:[{kind:'stealth'}]} as unknown as Entity;
  const mob = {id:20,kind:'mob',dead:false,aggroTargetId:null,targetId:null} as unknown as Entity;
  it('allows a genuine rogue backstab against an UNAWARE mob while stealthed',()=>{
    expect(highflyV91UnawareStealthBackstab('backstab',rogue,mob)).toBe(true);
  });
  it('rejects front combat backstab, other positional abilities, and non-stealth rogue',()=>{
    expect(highflyV91UnawareStealthBackstab('ambush',rogue,mob)).toBe(false);
    expect(highflyV91UnawareStealthBackstab('backstab',{...rogue,auras:[]} as Entity,mob)).toBe(false);
    expect(highflyV91UnawareStealthBackstab('backstab',rogue,{...mob,aggroTargetId:rogue.id} as Entity)).toBe(false);
    expect(highflyV91UnawareStealthBackstab('backstab',rogue,{...mob,targetId:rogue.id} as Entity)).toBe(false);
    expect(highflyV91UnawareStealthBackstab('backstab',rogue,{...mob,dead:true} as Entity)).toBe(false);
  });
  it('keeps native dagger/energy/range/positional gates and original combo reward',()=>{
    const cast=readFileSync('src/sim/combat/casting_lifecycle.ts','utf8');
    expect(cast).toContain('if (!p.weapon.dagger)');
    expect(cast).toContain('highflyV91UnawareStealthBackstab(ability.id, p, target)');
    expect(cast).toContain("ctx.error(p.id, 'You must be behind your target.')");
    expect(ABILITIES.backstab.cost).toBe(60);
    expect(ABILITIES.backstab.awardsCombo).toBe(1);
    expect(ABILITIES.backstab.effects.some(x=>x.type==='weaponStrike'&&x.requiresBehind)).toBe(true);
  });
});

describe('HIGHFLY V9.1 — tactile S23 combo/joystick guard',()=>{
  it('buffers only one early hit, retains the original accepted-strike and gem 4th cadence',()=>{
    const hud=readFileSync('src/ui/hud.ts','utf8');
    expect(hud).toContain('this.highflyV91QueuedAttack === null');
    expect(hud).toContain('wait <= 0.20');
    expect(hud).toContain('this.onHighflyBasicAttack?.(next)');
    expect(hud).toContain('this.onHighflyElementalFinisherReady?.()');
    expect(hud).toContain('this.highflyComboExpiresAt');
  });
  it('does not modify camera-relative movement vector, input or equipment stats',()=>{
    const main=readFileSync('src/main.ts','utf8');
    expect(main).toContain('mi.highflyWorldX = worldX');
    expect(main).toContain('mi.highflyWorldZ = worldZ');
    expect(main).toContain('highflyV91AimUntil = performance.now() + 125');
    const css=readFileSync('src/styles/shell.css','utf8');
    expect(css).toContain('#mobile-action-attack[data-hf-v91-pressed="1"]');
    expect(css).toContain('no translate/scale animation');
  });
});
