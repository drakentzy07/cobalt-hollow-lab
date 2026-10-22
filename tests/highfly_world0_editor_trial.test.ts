import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {BUILTIN_WORLD, MOBS} from '../src/sim/data';
import {sanitizeMapDoc} from '../src/sim/map_doc';
import {customMapToWorldContent} from '../src/editor/custom_map';
import {makeWorld0Map,makeWorld0Content,WORLD0_GREETER_ID,WORLD0_HUNTER_SPAWN,WORLD0_ID} from '../src/highfly/world_zero/world0_map';
import {ORIGIN_HUNTER_CARRIER_CLASS} from '../src/highfly/origin/f1_core';
import {offlineWorldConfig} from '../src/game/offline_world_config';
describe('HIGHFLY World0: native content and universal Warrior compatibility',()=>{
  it('does not render the original Eastbrook or Fenbridge town in our clean map',()=>{
    const renderer=readFileSync('src/render/renderer.ts','utf8');
    expect(renderer).toContain("if(this.sim.cfg.world?.npcs?.hf_world0_greeter) this.eastbrookTownView.group.visible=false;");
    expect(renderer).toContain("if(this.sim.cfg.world?.npcs?.hf_world0_greeter) this.fenbridgeTownView.group.visible=false;");
  });
  it('keeps every builtin terrain zone without its inherited actors',()=>{
    const m=makeWorld0Map(),world=makeWorld0Content();
    expect(m.content.zones.map(z=>z.id)).toEqual(BUILTIN_WORLD.zones.map(z=>z.id));
    expect(world.zones.length).toBeGreaterThanOrEqual(8);
    expect(world.camps).toEqual([{mobId:'forest_wolf',center:{x:27,z:-43},radius:.5,count:1}]);
    expect(Object.keys(world.npcs)).toEqual([WORLD0_GREETER_ID]);
    expect(world.groundObjects).toEqual([]);
    expect(world.props.buildings).toEqual([]);
    expect(customMapToWorldContent(m).props.buildings).toEqual([]);
    expect(world.props.docks).toEqual([]);
    expect(world.services).toBeUndefined();
    expect(world.playerStart).toEqual(WORLD0_HUNTER_SPAWN);
    expect(MOBS.forest_wolf.loot.length).toBeGreaterThan(0);
  });
  it('has the actual three ships, four towers and two buildings in native GLB placements',()=>{
    const m=makeWorld0Map();
    expect(m.placements.filter(x=>x.assetId.startsWith('biome/hex_ship_'))).toHaveLength(3);
    expect(m.placements.filter(x=>x.assetId==='biome/hex_tower')).toHaveLength(4);
    expect(m.placements.filter(x=>x.assetId==='props/inn'||x.assetId==='biome/hex_tavern')).toHaveLength(2);
    expect(m.blockers).toHaveLength(5);
    expect(m.content.roads?.[0]?.length).toBeGreaterThan(4);
  });
  it('survives the original editor map sanitizer without needing server or old map',()=>{
    const original=makeWorld0Map();
    const after=sanitizeMapDoc(JSON.stringify(original));
    expect(after).not.toBeNull();
    expect(after!.meta.id).toBe(WORLD0_ID);
    expect(after!.content.camps).toHaveLength(1);
    expect(Object.keys(after!.content.npcs)).toHaveLength(1);
    expect(after!.placements.length).toBe(original.placements.length);
  });
  it('uses Warrior only as private carrier, with universal equip and skills policy',()=>{
    expect(ORIGIN_HUNTER_CARRIER_CLASS).toBe('warrior');
    const config=offlineWorldConfig({
       playerClass:ORIGIN_HUNTER_CARRIER_CLASS,name:'WorldZeroTest',devCommands:false,
       originUniversalHunter:true,world:makeWorld0Content()
    });
    expect(config.originUniversalHunter).toBe(true);
    expect(config.playerClass).toBe('warrior');
    expect(config.world?.camps).toHaveLength(1);
    expect(config.compulsoryTutorial).toBe(false);
  });
});
