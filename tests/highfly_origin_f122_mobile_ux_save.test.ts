import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { BUILTIN_WORLD } from '../src/sim/data';
import { TRANSPORT_ROUTES } from '../src/sim/content/transport_ships';
import { ORIGIN_STARTER_WEAPONS } from '../src/highfly/origin/f1_core';

describe('HIGHFLY ORIGIN F1.2.2 — Android-safe UX and save contract', () => {
  it('keeps all 3 optional weapon choices in an accessible centered modal',()=>{
    const src=readFileSync('src/highfly/origin/f1_world_ui.ts','utf8');
    expect(src).toContain("backdrop.id='hf-origin-f1-modal-backdrop'");
    expect(src).toContain("modal.setAttribute('aria-modal','true')");
    expect(src).toContain("options.id='hf-origin-f1-options'");
    expect(src).toContain("b.dataset.starter=item.id");
    expect(src).toContain("modal.style.cssText='box-sizing:border-box");
    expect(src).toContain('touch-action:pan-y');
    expect(src).toContain("setOpen(false);");
  });
  it('does not show pre-equipped warrior blade/shield in Hunter creator',()=>{
    const src=readFileSync('src/main.ts','utf8');
    expect(src).toContain('if (bare) characterPreview?.setWeaponSkin(null)');
    expect(src).toContain('bare ? null : undefined, bare ? null : undefined');
    const preview=readFileSync('src/render/characters/preview.ts','utf8');
    expect(preview).toContain("this.canvas.dataset.highflyPreviewWeaponItem = weaponItemId ?? ''");
    expect(preview).toContain("this.canvas.dataset.highflyPreviewOffhandItem = offhandItemId ?? ''");
  });
  it('can equip every offered weapon natively rather than only showing a button',()=>{
    for(const item of ORIGIN_STARTER_WEAPONS){
      const sim=new Sim({
        seed:161,
        playerClass:'warrior',
        playerName:'Universal Hunter',
        compulsoryTutorial:false,
        world:BUILTIN_WORLD,
      });
      const meta=sim.players.get(sim.playerId)!;
      for(const slot of ['mainhand','offhand'] as const){
        const worn=meta.equipment[slot];
        if(worn){
          expect(sim.unequipItem(slot,sim.playerId),slot).toBe(true);
          sim.removeItem(worn,1,sim.playerId);
        }
      }
      expect(sim.canAddItem(item.id,1,sim.playerId),item.id).toBe(true);
      sim.addItem(item.id,1,sim.playerId);
      sim.equipItem(item.id,sim.playerId);
      expect(meta.equipment.mainhand,item.id).toBe(item.id);
    }
  });
  it('serializes a passenger on a sailing ferry to the destination pier (not open sea)',()=>{
    const route=TRANSPORT_ROUTES[0];
    expect(route).toBeDefined();
    const sim=new Sim({
      seed:141,
      playerClass:'warrior',
      playerName:'Wayfarer',
      compulsoryTutorial:false,
      world:BUILTIN_WORLD,
    });
    sim.player.ferryRide={
      route:route.id,
      from:0,
      to:1,
      ship:{x:0,z:0,rot:0},
    };
    const snapshot=sim.serializeCharacter(sim.playerId);
    expect(snapshot?.pos).toEqual({
      x:route.berths[1].landing.x,
      z:route.berths[1].landing.z,
    });
    expect(snapshot?.dead).toBe(false);
  });
  it('serializes death state without silently resurrecting before saving',()=>{
    const sim=new Sim({
      seed:142,
      playerClass:'warrior',
      playerName:'Fallen Hunter',
      compulsoryTutorial:false,
      world:BUILTIN_WORLD,
    });
    sim.player.dead=true;
    sim.player.hp=0;
    const snapshot=sim.serializeCharacter(sim.playerId);
    expect(snapshot?.dead).toBe(true);
    expect(snapshot?.hp).toBe(0);
  });
});
