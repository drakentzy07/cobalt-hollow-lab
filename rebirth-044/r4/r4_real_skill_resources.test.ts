import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {ABILITIES,CLASSES} from '../src/sim/content/classes';
import type {Entity} from '../src/sim/types';
import {rebirthInitializeVitals,rebirthAbilityBalance,rebirthDebitCrossPool,rebirthMirrorNativeVitals,rebirthPoolForAbility,rebirthSecondaryPool} from '../src/highfly/rebirth/vitals_core';
import {resolveFreedom360} from '../src/highfly/combat/freedom_360';
import {mapHighflyJoystickVector,mapJoystickVector} from '../src/game/mobile_controls';
const profile=(cls:keyof typeof CLASSES):Entity=>{
  const native=CLASSES[cls];
  return {templateId:cls,level:1,resourceType:native.resourceType,resource:native.resourceType==='mana'?120:0,
  maxResource:native.resourceType==='mana'?120:100,stats:{int:native.baseStats.int},
  savedMana:0,fiveSecondRule:7} as Entity;
};
describe('HIGHFLY R4 nine-class original skill budget across MP/EN',()=>{
  it('from level one all nine classes have 2 real pools and retain donor definitions',()=>{
    for(const cls of Object.keys(CLASSES) as (keyof typeof CLASSES)[]){
      const p=profile(cls);const v=rebirthInitializeVitals(p);
      expect(v.maxMana).toBeGreaterThan(0);expect(v.maxEnergy).toBe(100);
      expect(v.mana).toBeGreaterThan(0);expect(v.energy).toBe(100);
      expect(p.resourceType).toBe(CLASSES[cls].resourceType);
    }
  });
  it('native abilities retain their class, learning level, cost, damage and cast time',()=>{
    const f=ABILITIES.fireball;
    expect(f.class).toBe('mage');expect(f.learnLevel).toBe(1);
    expect(f.school).toBe('fire');expect(f.cost).toBe(30);
    expect(f.castTime).toBe(1.5);
  });
  it('magical hunter abilities use MP, physical hunter attacks use EN',()=>{
    const p=profile('hunter');rebirthInitializeVitals(p);
    const magic={school:'nature'},physical={school:'physical'};
    expect(rebirthPoolForAbility(magic)).toBe('mana');
    expect(rebirthPoolForAbility(physical)).toBe('energy');
    expect(rebirthAbilityBalance(p,magic)).toBeGreaterThan(0);
    const beforeEnergy=p.resource, beforeMana=p.highflyVitals!.mana;
    expect(rebirthDebitCrossPool(p,magic,25)).toBe(true);
    expect(p.highflyVitals!.mana).toBe(beforeMana-25);
    expect(p.resource).toBe(beforeEnergy);
    expect(p.fiveSecondRule).toBe(0);
    expect(rebirthDebitCrossPool(p,physical,15)).toBe(false);
  });
  it('mana classes spend only EN on physical skills and MP on magic',()=>{
    const p=profile('paladin');rebirthInitializeVitals(p);
    const mana=p.resource;
    expect(rebirthSecondaryPool(p,{school:'physical'})).toBe('energy');
    expect(rebirthDebitCrossPool(p,{school:'physical'},30)).toBe(true);
    expect(p.highflyVitals!.energy).toBe(70);
    expect(p.resource).toBe(mana);
    expect(rebirthDebitCrossPool(p,{school:'holy'},40)).toBe(false);
    p.resource-=40;
    expect(rebirthMirrorNativeVitals(p)!.mana).toBe(mana-40);
  });
  it('original druid form entry and auto-unshift stay on native budget',()=>{
    const p=profile('druid');rebirthInitializeVitals(p);
    expect(rebirthAbilityBalance(p,{school:'physical'},true)).toBeNull();
    expect(rebirthAbilityBalance(p,{school:'physical'},false,true)).toBeNull();
    expect(rebirthDebitCrossPool(p,{school:'physical'},30,true)).toBe(false);
  });
  it('clamps resources and restores both real pools from per-character snapshot',()=>{
    const p=profile('mage');rebirthInitializeVitals(p,{mana:44,energy:18});
    expect(p.resource).toBe(44);
    expect(p.highflyVitals?.energy).toBe(18);
    expect(rebirthDebitCrossPool(p,{school:'physical'},9999)).toBe(true);
    expect(p.highflyVitals?.energy).toBe(0);
  });
  it('original donor simulation has no global policy when HIGHFLY is absent',()=>{
    const p=profile('warrior');
    expect(rebirthAbilityBalance(p,{school:'nature'})).toBeNull();
    expect(rebirthDebitCrossPool(p,{school:'nature'},40)).toBe(false);
    expect(p.resource).toBe(0);
  });
});
describe('R4 Golden 360 tactile regression',()=>{
 it('stick close to deadzone clears both analog and native movement gates',()=>{
   const raw=mapHighflyJoystickVector(.16,-.12,.22);
   expect(raw).toEqual({x:0,y:0});
   const move=mapJoystickVector(raw.x,raw.y,.001);
   expect(Object.values(move).some(Boolean)).toBe(false);
 });
 it('diagonals move at equal normalized speed at every yaw',()=>{
   for(const yaw of [0,.2,Math.PI/2,Math.PI,5.2]){
    for(let i=0;i<16;i++){
      const x=Math.sin(i*Math.PI/8),y=-Math.cos(i*Math.PI/8);
      const raw=mapHighflyJoystickVector(x,y,.22),intent=resolveFreedom360(raw,yaw);
      expect(intent).not.toBeNull();
      expect(Math.hypot(intent!.worldX,intent!.worldZ)).toBeCloseTo(1);
    }
   }
 });
 it('visual facing never reapplies native strafe after GOLDEN intent',()=>{
  const src=readFileSync('src/main.ts','utf8');
  expect(src).toContain('the visible body through native backpedal/strafe');
  expect(src).toContain('return !movementFrozen() ? baseFacing : null;');
  const mobile=readFileSync('src/game/mobile_controls.ts','utf8');
  expect(mobile).toContain('this.input.setTouchMove(coherentMove)');
 });
});
