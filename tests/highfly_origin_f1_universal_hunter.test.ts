import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUILTIN_WORLD } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import {
  ORIGIN_F1_SCHOOLS,
  ORIGIN_HUNTER_CARRIER_CLASS,
  ORIGIN_STARTER_WEAPONS,
  ORIGIN_F23_MASTER_SKILLS,
  originCanTrainSkill,
  claimOriginStarter,
  consumeF1Resource,
  f1StartState,
  normalizeOriginF1Save,
  tickF1Resources,
} from '../src/highfly/origin/f1_core';
import { ORIGIN_GUIDE_ID, ORIGIN_GUIDE_POS } from '../src/highfly/origin/f1_world_ui';
import { ORIGIN_HUNTER_START } from '../src/highfly/origin/f1_start';
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

  it('places the optional NPC with the independent Hunter away from the native port',()=>{
    expect(BUILTIN_WORLD.npcs[ORIGIN_GUIDE_ID]?.id).toBe(ORIGIN_GUIDE_ID);
    expect(BUILTIN_WORLD.npcs[ORIGIN_GUIDE_ID].questIds).toEqual([]);
    expect(Math.hypot(
      ORIGIN_GUIDE_POS.x-ORIGIN_HUNTER_START.x,
      ORIGIN_GUIDE_POS.z-ORIGIN_HUNTER_START.z,
    )).toBeLessThan(8);
    expect(Math.hypot(
      ORIGIN_HUNTER_START.x-BUILTIN_WORLD.playerStart.x,
      ORIGIN_HUNTER_START.z-BUILTIN_WORLD.playerStart.z,
    )).toBeGreaterThan(40);
    const src=readFileSync('src/main.ts','utf8');
    expect(src).toContain('world: world ?? { ...BUILTIN_WORLD, playerStart: ORIGIN_HUNTER_START },');
    expect(src).not.toContain('...HIGHFLY_F72_HUNT_CAMPS');
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

  it('activates two genuine one-hand weapons for Universal Hunter only, without Fury spec or grants',()=>{
    const make = (universal: boolean) => new Sim({
      seed: 141, playerClass: 'warrior', playerName: 'Hunter Dual',
      compulsoryTutorial: false, originUniversalHunter: universal,
      world: {...BUILTIN_WORLD, camps: [], groundObjects: [], npcs: {}},
    });
    const prep = (sim: Sim) => {
      const pid=sim.playerId;
      // Starting Warrior's shield and sword are NOT duplicated or silently reused.
      for(const slot of ['mainhand','offhand'] as const) sim.unequipItem(slot,pid);
      sim.addItem('worn_sword',2,pid);
      sim.equipItem('worn_sword',pid);
      sim.equipItem('worn_sword',pid);
      return sim.players.get(pid)!;
    };
    const hunter=make(true);
    const hm=prep(hunter);
    expect(hm.equipment.mainhand).toBe('worn_sword');
    expect(hm.equipment.offhand).toBe('worn_sword');
    expect(hunter.player.highflyUniversalHunter).toBe(true);
    expect(hunter.player.dualWielding).toBe(true);
    expect(hunter.player.offhandWeapon).not.toBeNull();
    expect(hunter.serializeCharacter(hunter.playerId)?.equipment.offhand).toBe('worn_sword');

    // A mixed pair still uses the same real equipment/Sim path.
    hunter.unequipItem('offhand',hunter.playerId);
    hunter.addItem('rusty_hatchet',1,hunter.playerId);
    hunter.equipItem('rusty_hatchet',hunter.playerId);
    expect(hm.equipment.mainhand).toBe('worn_sword');
    expect(hm.equipment.offhand).toBe('rusty_hatchet');
    expect(hunter.player.dualWielding).toBe(true);

    // Original ClaudeCraft Warrior has NOT gained a free Fury specialization.
    const original=make(false);
    const om=prep(original);
    expect(original.player.highflyUniversalHunter).toBe(false);
    expect(original.player.dualWielding).toBe(false);
    expect(original.player.offhandWeapon).toBeNull();
    expect(om.equipment.offhand).not.toBe('worn_sword');
  });

  it('lets the level-1 Universal Hunter purchase any existing trainer skill using real copper only',()=>{
    for(const skill of ORIGIN_F23_MASTER_SKILLS){
      expect(originCanTrainSkill(skill.id,1,skill.copper,[],true),skill.id).toBe(true);
      expect(originCanTrainSkill(skill.id,1,skill.copper-1,[],true),skill.id).toBe(false);
      expect(originCanTrainSkill(skill.id,1,skill.copper,[skill.id],true),skill.id).toBe(false);
    }
    expect(originCanTrainSkill('invented_skill',1,99999,[],true)).toBe(false);
    // Historical F2.3 lab behavior is isolated from the new universal rule.
    expect(originCanTrainSkill('meteor',1,99999,[])).toBe(false);
    const ui=readFileSync('src/highfly/origin/f1_world_ui.ts','utf8');
    expect(ui).toContain('originCanTrainSkill(skill.id,sim.player.level,hunter?.copper??0,learned,unifiedFrame)');
    expect(ui).toContain('const hunterDef=unifiedFrame?{...trialDef,learnLevel:1}:trialDef;');
    expect(ui).toContain('hunter.copper-=skill.copper');
    expect(ui).toContain("current={...current,learnedAbilityIds:[...earned,skill.id]}");
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

  it('isolates separate GitHub Pages playtest saves from Draken and the former candidate',()=>{
    const source=readFileSync('src/game/highfly_offline_save.ts','utf8');
    expect(source).toContain("location.pathname.startsWith('/HIGHFLY-UNIFIED-PLAYTEST/')");
    expect(source).toContain("'highfly-unified-playtest-world-v1'");
    expect(source).toContain("'highfly-unified-playtest-lab-v1'");
    expect(source).toContain("'highfly.origin.unified.playtest.world.v1'");
    expect(source).toContain("'highfly.origin.unified.playtest.lab.v1'");
    expect(source).toContain("if (mode === 'lab' || UNIFIED_CANDIDATE_PREVIEW) return null;");
    expect(readFileSync('src/main.ts','utf8')).toContain("!location.pathname.startsWith('/HIGHFLY-UNIFIED-PLAYTEST/') &&");
  });

  it('resumes the same Hunter while isolating old same-name saves',()=>{
    const main=readFileSync('src/main.ts','utf8');
    const store=readFileSync('src/game/highfly_offline_save.ts','utf8');
    expect(main).toContain('const restored = exact ?? primary;');
    expect(main).toContain('await loadOriginHunterSave(ORIGIN_HUNTER_CARRIER_CLASS, rawName, mode)');
    expect(main).not.toContain('Existe una partida antigua con ese nombre');
    expect(main).toContain('setOriginCreatorPreview(look.app, look.worn, cls)');
    expect(main).toContain('bare ? null : undefined');
    expect(store).toContain("const ORIGIN_PRIMARY_SLOT_KEY = 'origin-f1:primary'");
    expect(store).toContain("'highfly.origin.primary.v1'");
    expect(store).toContain("'highfly.origin.f2-combat-beta.primary.v1'");
    expect(store).toContain('originIdentitySlotKey(save.playerClass, save.name, mode)');
    expect(store).toContain('hasOriginIdentity(oldExact) ? oldExact : null');
    expect(store).toContain("mode === 'lab' || F2_PAGES_LAB ? null");
    expect(store).toContain("F2_PAGES_LAB ? 'highfly-offline-f2-combat-beta'");
  });
});
