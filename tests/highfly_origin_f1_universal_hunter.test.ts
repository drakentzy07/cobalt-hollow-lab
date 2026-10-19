import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUILTIN_WORLD } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import {
  ORIGIN_F1_SCHOOLS,
  ORIGIN_HUNTER_CARRIER_CLASS,
  ORIGIN_STARTER_WEAPONS,
  claimOriginStarter,
  consumeF1Resource,
  f1StartState,
  normalizeOriginF1Save,
  originF1CanMakeFresh,
  tickF1Resources,
} from '../src/highfly/origin/f1_core';
import { ORIGIN_GUIDE_ID, ORIGIN_GUIDE_POS } from '../src/highfly/origin/f1_world_ui';
import { offlineWorldConfig } from '../src/game/offline_world_config';

describe('HIGHFLY F1 integral — one Hunter, safe birth, first weapon and resources',()=>{
  it('keeps nine native technique schools while exposing one internal carrier',()=>{
    expect(ORIGIN_HUNTER_CARRIER_CLASS).toBe('warrior');
    expect(new Set(ORIGIN_F1_SCHOOLS).size).toBe(9);
    const html=readFileSync('index.html','utf8');
    const select=html.split('id="offline-select"')[1]?.split('id="offline-skin-row"')[0] ?? '';
    expect(select.match(/data-class="/g)?.length).toBe(1);
    expect(select).toContain('HUNTER UNIVERSAL');
    expect(select).not.toContain('data-class="mage"');
  });

  it('turns OFF mandatory tutorial at both the Sim config and the HUD entry',()=>{
    const cfg=offlineWorldConfig({playerClass:'warrior',name:'Wayfarer',devCommands:false});
    expect(cfg.compulsoryTutorial).toBe(false);
    const hud=readFileSync('src/ui/hud.ts','utf8');
    expect(hud).toContain("classList.contains('hf-origin-f1')");
  });

  it('places the optional NPC in the same world, close to normal Eastbrook birth',()=>{
    expect(BUILTIN_WORLD.npcs[ORIGIN_GUIDE_ID]?.id).toBe(ORIGIN_GUIDE_ID);
    expect(BUILTIN_WORLD.npcs[ORIGIN_GUIDE_ID].questIds).toEqual([]);
    expect(Math.hypot(
      ORIGIN_GUIDE_POS.x-BUILTIN_WORLD.playerStart.x,
      ORIGIN_GUIDE_POS.z-BUILTIN_WORLD.playerStart.z,
    )).toBeLessThan(8);
  });

  it('can actually unequip the native default weapon, offhand and chest',()=>{
    const sim=new Sim({
      seed:141,playerClass:'warrior',playerName:'New Hunter',
      compulsoryTutorial:false,
      world:{...BUILTIN_WORLD,camps:[],groundObjects:[],npcs:{}},
    });
    const player=sim.player;
    const meta=sim.players.get(sim.playerId)!;
    expect(meta.equipment.mainhand).toBeTruthy();
    for(const slot of ['mainhand','offhand','chest'] as const){
      const itemId=meta.equipment[slot];
      if(!itemId)continue;
      expect(sim.unequipItem(slot,sim.playerId),slot).toBe(true);
      sim.removeItem(itemId,1,sim.playerId);
      expect(meta.equipment[slot]).toBeUndefined();
    }
    expect(player.hp).toBeGreaterThan(0);
    expect(sim.serializeCharacter(sim.playerId)?.equipment.mainhand).toBeUndefined();
  });

  it('grants no duplicate starter, accepts only existing basic choices',()=>{
    expect(ORIGIN_STARTER_WEAPONS.length).toBe(3);
    const state=f1StartState();
    expect(state.starterClaimed).toBe(false);
    expect(claimOriginStarter(state,'mystery_legendary')).toBeNull();
    const claimed=claimOriginStarter(state,'worn_sword')!;
    expect(claimed.starterWeaponId).toBe('worn_sword');
    expect(claimOriginStarter(claimed,'rusty_hatchet')).toBeNull();
    expect(state.starterClaimed).toBe(false);
  });

  it('caps mana/stamina, refuses excess cost and preserves across a save',()=>{
    const initial=f1StartState();
    expect(consumeF1Resource(initial.resources,'mana',201)).toBeNull();
    const spent=consumeF1Resource(initial.resources,'stamina',40)!;
    expect(spent.stamina).toBe(60);
    const refilled=tickF1Resources(spent,2);
    expect(refilled.stamina).toBe(62.5); // deterministic timestep capped at 0.25s
    const restored=normalizeOriginF1Save(JSON.parse(JSON.stringify({...initial,resources:refilled})));
    expect(restored?.resources.stamina).toBe(62.5);
    expect(normalizeOriginF1Save({...initial,resources:{mana:-99,maxMana:200,stamina:1e9,maxStamina:100}})?.resources)
      .toEqual({mana:0,maxMana:200,stamina:100,maxStamina:100});
  });

  it('does not silently adopt or overwrite legacy saves',()=>{
    expect(originF1CanMakeFresh(null)).toBe(true);
    expect(originF1CanMakeFresh({version:1,playerClass:'warrior',name:'OldHero'})).toBe(false);
    expect(originF1CanMakeFresh({originF1:f1StartState()})).toBe(true);
  });
});
