/** HIGHFLY V3-04 native COMBAT -> KILL -> LOOT -> CHARACTER SAVE.
 * Donor stays frozen. No loot grant, custom drop table, manual corpse injection,
 * XP/stat mutation or level bypass. Real wolf loot has guaranteed copper.
 * Single low-HP combat fixture shortens fight; not a monster balance test.
 */
import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { meleeSwing } from '../src/sim/combat/auto_attack';
import { Sim } from '../src/sim/sim';

describe('HIGHFLY V3-04 original ClaudeCraft combat, loot rights and Hunter persistence', () => {
  it('real melee swing kills forest wolf, native death rolls guaranteed copper, loot is single-use and save survives', () => {
    const sim=new Sim({seed:7,playerClass:'warrior',noPlayer:true,autoEquip:true});
    const pid=sim.addPlayer('warrior','HunterLoot');
    const actor=sim.entities.get(pid);
    const meta=sim.players.get(pid);
    if(!actor||!meta)throw new Error('missing real Hunter PlayerMeta');
    const wolfDef=MOBS.forest_wolf;
    expect(wolfDef).toBeDefined();
    expect(wolfDef.loot).toContainEqual({copper:8,chance:1});
    const wolf=createMob(sim.nextId++,wolfDef,1,{
      x:actor.pos.x,y:actor.pos.y,z:actor.pos.z+2,
    });
    wolf.hp=1; // COMBAT duration-only test fixture; native hp balance not asserted.
    wolf.hostile=true;
    wolf.aiState='idle';
    sim.addEntity(wolf);
    actor.facing=Math.atan2(wolf.pos.x-actor.pos.x,wolf.pos.z-actor.pos.z);
    sim.targetEntity(wolf.id,pid);
    const startingCopper=meta.copper;
    expect(sim.lootCorpse(wolf.id,pid)).toBe(false);
    expect(meta.copper).toBe(startingCopper);

    let swung=0;
    for(;swung<40&&!wolf.dead;swung++){
      meleeSwing(sim.ctx,actor,wolf,0,null);
    }
    expect(wolf.dead,'authentic native melee should kill the 1HP wolf').toBe(true);
    expect(wolf.lootable,'mob death should create a lootable corpse').toBe(true);
    expect(wolf.loot,'native death must resolve actual loot table').not.toBeNull();
    expect(wolf.loot?.copper,'wolf has a real guaranteed copper source').toBeGreaterThan(0);
    const generatedCopper=wolf.loot?.copper??0;
    expect(meta.copper).toBe(startingCopper);
    expect(sim.lootCorpse(wolf.id,pid),'real corpse looting must work for killer').toBe(true);
    expect(meta.copper).toBe(startingCopper+generatedCopper);
    expect(wolf.loot?.copper).toBe(0);
    const inventoryAfterLoot=JSON.stringify(meta.inventory);
    const balanceAfterLoot=meta.copper;
    sim.lootCorpse(wolf.id,pid); // replay cannot duplicate loot
    expect(meta.copper).toBe(balanceAfterLoot);
    expect(JSON.stringify(meta.inventory)).toBe(inventoryAfterLoot);
    const saved=sim.serializeCharacter(pid);
    expect(saved).not.toBeNull();
    const fresh=new Sim({seed:9,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const loadedPid=fresh.addPlayer('warrior','HunterLoot',{state:JSON.parse(JSON.stringify(saved))});
    const loaded=fresh.players.get(loadedPid);
    expect(loaded?.copper).toBe(balanceAfterLoot);
    expect(loaded?.inventory).toEqual(meta.inventory);
    expect(fresh.entities.get(loadedPid)?.templateId).toBe('warrior');
  });
});
