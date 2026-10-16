import { describe,it,expect } from 'vitest';
import { Sim } from '../src/sim/sim';
import { ABILITIES } from '../src/sim/content/classes';
import { R27_PREMIUM_23 } from '../src/sim/highfly_origin_r27_premium23_catalog';
import { r28UniversalCatalog,r28Selectable,r28NativeStatus } from '../src/sim/highfly_origin_r28_universal_catalog';
import { r28StartSession,r28Select,r28Selected,r28Reapply } from '../src/sim/highfly_origin_r28_session';
import { readFileSync } from 'node:fs';

describe('HIGHFLY R28 P1 — universal native tester / no saved grants',()=>{
 it('includes the entire original native registry and 23 honest non-castable Premium entries',()=>{
   const all=r28UniversalCatalog();
   const native=all.filter(x=>x.kind==='native');
   const premium=all.filter(x=>x.kind==='premium');
   expect(native).toHaveLength(Object.keys(ABILITIES).length);
   expect(new Set(native.map(x=>x.id)).size).toBe(native.length);
   expect(premium.map(x=>x.id)).toEqual(R27_PREMIUM_23.map(x=>x.id));
   expect(premium.every(x=>x.status==='catalog-only'&&x.cost===null)).toBe(true);
   expect(r28Selectable('hf_vfx23_astral_void_blast')).toBe(false);
   expect(r28Selectable('shadow_bolt')).toBe(true);
   expect(r28NativeStatus('divine_ascension').status).toBe('blocked');
   expect(native.some(x=>x.shape==='LINE')).toBe(true);
   expect(native.some(x=>x.shape==='CIRCLE')).toBe(true);
   expect(native.some(x=>x.shape==='SELF')).toBe(true);
 });
 it('creates one disposable selected native spell with NO persistent unlock',()=>{
   const sim=new Sim({seed:8121,playerClass:'warrior',originHunterEnabled:true});
   const meta=sim.players.get(sim.playerId)!;
   expect(meta.originHunter?.learnedSkillIds).toEqual([]);
   r28StartSession(sim);
   expect(r28Selected(sim)).toBe('shadow_bolt');
   expect(meta.known.map(x=>x.def.id)).toEqual(['shadow_bolt']);
   expect(r28Select(sim,'meteor')).toBe(true);
   expect(meta.known.map(x=>x.def.id)).toEqual(['meteor']);
   expect(meta.originHunter?.learnedSkillIds).toEqual([]);
   expect(r28Select(sim,'hf_vfx23_storm_lance')).toBe(false);
   expect(meta.known.map(x=>x.def.id)).toEqual(['meteor']);
   expect(sim.serializeCharacter(sim.playerId)?.originHunter?.learnedSkillIds).toEqual([]);
 });
 it('stays available at LV1, LV2, LV20, LV21, LV50 and LV99 with native recalculation',()=>{
   const sim=new Sim({seed:8122,playerClass:'warrior',originHunterEnabled:true});
   r28StartSession(sim);
   expect(sim.player.level).toBe(1);
   for(const level of [2,20,21,50,99]){
     sim.setPlayerLevel(level);
     expect(sim.player.level).toBe(level);
     expect(r28Selected(sim)).toBe('shadow_bolt');
     expect(sim.known.map(x=>x.def.id)).toEqual(['shadow_bolt']);
     expect(sim.players.get(sim.playerId)?.originHunter?.learnedSkillIds).toEqual([]);
   }
 });
 it('does not touch classic nine-class entitlement nor origin spellbook without R28 selection',()=>{
   const regular=new Sim({seed:8123,playerClass:'mage'});
   const old=regular.known.map(x=>x.def.id);
   regular.setPlayerLevel(2);
   expect(regular.known.map(x=>x.def.id)).toContain('fireball');
   expect(old.every(id=>regular.known.some(k=>k.def.id===id))).toBe(true);
   const hunter=new Sim({seed:8124,playerClass:'warrior',originHunterEnabled:true});
   hunter.learnOriginHunterSkillTrusted('fireball',hunter.playerId);
   const meta=hunter.players.get(hunter.playerId)!;
   r28Reapply(meta);
   expect(meta.known.map(k=>k.def.id)).toContain('fireball');
   expect(r28Selected(hunter)).toBeNull();
 });
 it('restores manual ATK identity by clearing only the ephemeral grant',()=>{
   const sim=new Sim({seed:8125,playerClass:'warrior',originHunterEnabled:true});
   r28StartSession(sim);
   expect(r28Select(sim,null)).toBe(true);
   expect(r28Selected(sim)).toBeNull();
   expect(sim.known).toEqual([]);
   sim.setPlayerLevel(2);
   expect(sim.known).toEqual([]);
   expect(sim.serializeCharacter(sim.playerId)?.originHunter?.learnedSkillIds).toEqual([]);
 });
 it('keeps ATK conversion distinct from normal slots and recycles R20/R21 geometry',()=>{
   const src=readFileSync('src/highfly/highfly_origin_r28_universal_tester.ts','utf8');
   const hud=readFileSync('src/ui/hud.ts','utf8');
   expect(src).toContain('new HighflyAimVisual(');
   expect(src).toContain('highflyManualAim(');
   expect(src).toContain('ORIGIN_FREE_SKILLS.has(id)');
   expect(src).toContain('h.sim.castAbilityAt(');
   expect(src).toContain('h.sim.castAbility(id)');
   expect(src).not.toContain('dealDamage(');
   expect(hud).toContain('mountR28UniversalTester({');
   expect(hud).toContain('this.buildMobileActionRing();');
   expect(src).toContain('VOLVER A ATK NORMAL');
   expect(src).toContain('r28Select(h.sim,null)');
 });
});
