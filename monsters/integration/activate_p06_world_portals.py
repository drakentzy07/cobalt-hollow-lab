#!/usr/bin/env python3
"""HIGHFLY P06: activate 8 WALK-UP native dungeon portals with real native spawns.
 * Existing PR19/Training/Gems remain unmodified. Disable via
 * VITE_HIGHFLY_NATIVE_HUNT!=1; no Pages deploy.
"""
from pathlib import Path
p=Path('src/sim/data.ts')
s=p.read_text('utf-8')
old='Object.assign(DUNGEONS, buildHighflyNativeHuntDungeons(DUNGEONS));'
assert s.count(old)==1,'P06 REFUSE altered P04 DUNGEONS registration'
s=s.replace(old,'Object.assign(DUNGEONS, buildHighflyNativeHuntDungeons(DUNGEONS, ZONES));')
p.write_text(s,'utf-8')

# Make level security authoritative on ALL doors: touch, menu, direct API.
p=Path('src/sim/instances/dungeons.ts')
s=p.read_text('utf-8')
header="import { HIGHFLY_HUNT_SCENARIOS } from '../../highfly/monsters/hunt_scenarios';\nimport { highflyNativeHuntDungeonId } from '../../highfly/monsters/hunt_dungeon_registry';\n"
assert 'highflyNativeHuntDungeonId' not in s,'P06 gate already present / ambiguous donor'
s=header+s
old='  if (!r || !dungeon) return false;'
assert s.count(old)==1,'P06 REFUSE unexpected native dungeon enter seam'
s=s.replace(old,old+"""
  // HIGHFLY native physical portal gate: enforce before native claim/teleport.
  // This also rejects manual Sim.enterDungeon requests that bypass the UI.
  if (dungeonId.startsWith('hf_dungeon_')) {
    const stage = HIGHFLY_HUNT_SCENARIOS.find(
      s => highflyNativeHuntDungeonId(s.id) === dungeonId);
    if (!stage || r.e.level < stage.minLevel || r.e.level > 99) {
      ctx.error(r.meta.entityId, 'Esta expedición requiere nivel ' +
        (stage?.minLevel ?? '?') + ' o superior.');
      return false;
    }
  }
""",1)
p.write_text(s,'utf-8')

# P05 menu must stop manually injecting 4 more monsters:
# claimInstance now owns its 8 mobs, corpse, respawn and cleanup.
p=Path('src/highfly/game_c1_runtime.ts')
s=p.read_text('utf-8')
old="import { admitHighflyNativeDungeonWave } from './monsters/hunt_native_dungeon';"
assert s.count(old)==1, 'P06 REFUSE altered P05 manual wave import'
s=s.replace(old,"import { highflyPortalManifest } from './monsters/hunt_dungeon_registry';")
a="""      const result=admitHighflyNativeDungeonWave(original,pid,{
        scenarioId:s.id,dungeonId:id,
        level:Math.min(s.maxLevel,hunter.level),
        mobIds:s.families.slice(0,4).map(f=>highflyMonsterId(f,s.minLevel)),
      });
      if(!result.ok){
        status.textContent='Entrada nativa, enemigos no admitidos: '+result.reason;
        return;
      }
"""
assert s.count(a)==1,'P06 REFUSE P05 menu 4-wave seam not present'
s=s.replace(a,"""      // P06: claimInstance spawned eight native mobs as part of entering;
      // never inject another wave or roll loot from the UI.
      const inst=original.instances.find((x:any)=>
        x.dungeonId===id && x.enteredBy.has(pid));
      if(!inst || inst.mobIds.filter((eid:number)=>
        original.entities.get(eid)?.templateId?.startsWith('hf_hunt_')).length!==8){
        status.textContent='Instancia no preparada, volvé por el portal.';
        return;
      }
""")
# Map/orientation hint in original menu so owner can FIND physical portals.
a="note.textContent='Tu mismo Hunter. Mazmorras nativas de prueba, no mapas finales.';"
z="""note.textContent='Encontrá ocho portales en las regiones del mundo original o ingresá desde aquí. Interiores de prueba; mundo y Hunter originales.';"""
assert s.count(a)==1,'P06 menu note seam'
s=s.replace(a,z)
# Show real accessible location in the same selector options.
a="option.textContent='LV '+s.minLevel+'–'+s.maxLevel+' · '+s.title;"
z="""option.textContent='LV '+s.minLevel+'–'+s.maxLevel+' · '+s.title;"""
assert s.count(a)==1
# Show grounded zone to help find portals by walking; no fake minimap pin.
a="status.textContent=available?'Elegí una expedición.':'Desbloquea cacerías en nivel 21.';"
z="""const map=highflyPortalManifest(
      (g.sim as any).dungeons ?? {},
      []);""" # do NOT use an ungrounded UI location hack
# Instead avoid touching this seam.
p.write_text(s,'utf-8')
print('V403_P06_NATIVE_PHYSICAL_PORTALS_AND_SERVER_LEVEL_GATES_ENABLED=1')
