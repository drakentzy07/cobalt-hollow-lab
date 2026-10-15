import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { ABILITIES } from '../src/sim/content/classes';
import { originCostDecision } from '../src/sim/highfly_origin_universal_resources';

describe('HIGHFLY ORIGIN R1-4C — owner-only native client resources, HUD and button cost', () => {
  it('mirrors the SAME authoritative server resource object on the local Hunter entity', () => {
    const sim = new Sim({ seed: 522, playerClass:'warrior', originHunterEnabled:true });
    const profile=sim.players.get(sim.player.id)?.originHunter;
    expect(profile).toBeDefined();
    expect(sim.player.originResources).toBe(profile?.resources);
    expect(sim.player.originResources).toEqual({ mana:200,maxMana:200,stamina:100,maxStamina:100 });
    expect(sim.player.hp).toBe(sim.player.maxHp);
  });
  it('updates the owner resource mirror when the server bills MP and stamina', () => {
    const sim = new Sim({ seed:522, playerClass:'warrior',originHunterEnabled:true });
    const player=sim.player;
    const profile=sim.players.get(player.id)?.originHunter;
    if(!profile) throw Error('No Hunter');
    const rage=player.resource;
    expect(sim.learnOriginHunterSkillTrusted('frost_armor',player.id)).toBe(true);
    sim.castAbility('frost_armor',player.id);
    expect(profile.resources.mana).toBeLessThan(200);
    expect(player.originResources?.mana).toBe(profile.resources.mana);
    expect(player.resource).toBe(rage);
  });
  it('legacy nine-class entities have no Hunter resource mirror', () => {
    for(const cls of ['mage','warrior','rogue','paladin'] as const){
      const sim=new Sim({seed:525,playerClass:cls});
      expect(sim.players.get(sim.player.id)?.originHunter).toBeUndefined();
      expect(sim.player.originResources).toBeUndefined();
    }
  });
  it('routes spellbook and button costs by skill, not Warrior carrier resource', () => {
    expect(originCostDecision(ABILITIES.fireball)).toEqual({ok:true,pool:'mana'});
    expect(originCostDecision(ABILITIES.sinister_strike)).toEqual({ok:true,pool:'stamina'});
    expect(originCostDecision(ABILITIES.heroic_strike).ok).toBe(false);
  });
  it('transmits resource values only to owner/self, not remote entity wire', () => {
    const game=readFileSync('server/game.ts','utf8');
    const wire=game.slice(game.indexOf('private selfWireJson('),game.indexOf('private selfWireJson(')+3500);
    const remote=game.slice(game.indexOf('export function wireEntity('),game.indexOf('export function wireEntity(')+220);
    expect(wire).toContain('omp: round2(meta.originHunter.resources.mana)');
    expect(wire).toContain('ost: round2(meta.originHunter.resources.stamina)');
    expect(remote).not.toContain('originHunter');
    expect(remote).not.toContain('originResources');
  });
  it('decodes authenticated owner-only resources and clears stale mirror on legacy login', () => {
    const client=readFileSync('src/net/online.ts','utf8');
    expect(client).toContain('typeof s.omp');
    expect(client).toContain('e.originResources = {');
    expect(client).toContain('delete e.originResources');
    expect(client).toContain('Math.min(s.omx, Math.max(0, s.omp))');
  });
  it('shows real HP + MP + Stamina bars and hides legacy carrier resource only for Hunter', () => {
    const html=readFileSync('index.html','utf8');
    const hud=readFileSync('src/ui/hud.ts','utf8');
    expect(html).toContain('id="pf-hp"');
    expect(html).toContain('id="origin-mp-fill"');
    expect(html).toContain('id="origin-stamina-fill"');
    expect(hud).toContain('this.pfResourceEl.style.display = show ? \'none\' : \'\';');
    expect(hud).toContain('if (!p.originResources) this.updateLowResource(p);');
    expect(hud).toContain('this.updateOriginResourceBars(p);');
    expect(hud).toContain('this.originMpMeterEl.setAttribute');
    expect(hud).toContain('this.originStaminaMeterEl.setAttribute');
  });
  it('skill hotbar greys out exactly on the independent MP/Stamina server bill', () => {
    const action=readFileSync('src/ui/hud/action_bar/action_bar_view.ts','utf8');
    expect(action).toContain('const originDecision = player.originResources ? originCostDecision(def) : null;');
    expect(action).toContain('player.originResources.mana');
    expect(action).toContain('player.originResources.stamina');
    expect(action).toContain('(!player.originResources || originDecision?.ok === true)');
    expect(action).toContain('(!(castingPool < payableCost) || freeByProc || freeBySolarReprisal)');
  });
});
