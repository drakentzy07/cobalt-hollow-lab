/** MONSTRUOS 6 / P02-L: ACTUAL pinned runtime registry audit, no fixtures or manual rows.
 * The output is exhaustive for shipped static MOBS, CAMPS, ZONES, DUNGEONS, and the
 * HIGHFLY 21–99 extension; dynamic systems are explicitly listed as separate gates.
 * NEVER writes back to Sim registries, user saves or public gameplay.
 */
import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { MOBS, CAMPS, ZONES, DUNGEONS, DELVES, PORTALS, ITEMS, ALL_RECIPES } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { HARVEST_COMPONENT_ITEMS } from '../src/sim/content/professions';
import { WORLD_BOSSES } from '../src/sim/world_boss';
import { TRASH_RESPAWN_SECONDS, DEFAULT_RESPAWN_SECONDS, LEGACY_RESPAWN_SECONDS } from '../src/sim/respawn_policy';
import { HIGHFLY_MONSTER_BANDS, HIGHFLY_MONSTER_DONORS, buildHighflyMonsterRoster } from '../src/highfly/monsters/level99';
import { HIGHFLY_HUNT_SCENARIOS } from '../src/highfly/monsters/hunt_scenarios';
import { highflyHuntRewardProfiles, applyHighflyHuntRewardTables } from '../src/highfly/monsters/hunt_rewards';
import { buildHighflyHuntEncounters } from '../src/highfly/monsters/hunt_encounters';

type O = Record<string, any>;
const A=(v:unknown):O[]=>Array.isArray(v)?v as O[]:[];
const S=(v:unknown):string=>v===undefined||v===null?'':String(v);
const j=(v:unknown)=>JSON.stringify(v)??'';
const output='/tmp/hf-monstruos6-full-audit';
mkdirSync(output,{recursive:true});
function csv(filename:string, rows:O[], cols:string[]) {
  const cell=(v:unknown)=>'"'+S(v).replaceAll('"','""').replaceAll(/\r?\n/g,' ⏎ ')+'"';
  writeFileSync(output+'/'+filename, '\uFEFF'+cols.map(cell).join(',')+'\n'+rows.map(row=>cols.map(k=>cell(row[k])).join(',')).join('\n')+'\n');
}
function zoneAt(x:number,z:number):O|null {
  // Runtime zoneAt resolves overlaps by map-specific rules, so treat this only as
  // authored rectangle placement; DO NOT assert it equals live navigation zoneAt.
  return A(ZONES).find(q=>x>=(q.xMin??-180)&&x<(q.xMax??180)&&z>=q.zMin&&z<q.zMax)||null;
}
function statRow(m:O,lev:number):O {
  const e=createMob(777001,m as any,lev,{x:0,y:0,z:0});
  return {level:lev,hp:e.maxHp,attackMin:e.weapon.min,attackMax:e.weapon.max,attackInterval:e.weapon.speed,
    armor:e.stats.armor,moveSpeed:e.moveSpeed,aggroRadius:m.aggroRadius,lootRows:A(m.loot).length};
}
const mechanics = [
  'aoePulse','infernoChannel','breathCone','engageShout','counterStun','broodEgg','broodWhelp',
  'bigCast','deathZoneCast','deathZoneStrike','summonAdds','stomp','terrify','aoeSlow','battleYells',
  'channelHeal','stoneskin','rally','warcry','venom','ensnare','demoralize','soulrot','enrage',
  'cleave','concuss','bleed','chillOnHit','spellVuln','meleeBomb','frenzyOnHit','packFrenzy',
  'wardAllies','mendAlly','enervate','rangedAttack','charge','shieldBash','silence','root',
  'fireball','frostbolt','lightning','poison','burn','slow','fear','knockback','disarm',
  'wardWhelps','execute','aoeHeal','desperateHeal','deathZone','aoeKnockback','battleCry',
  'bigHeal','shockwave','leap','rangedCast','summon','rangedDamage'
];
const standard=new Set(['id','name','minLevel','maxLevel','family','hpBase','hpPerLevel','dmgBase','dmgPerLevel',
 'attackSpeed','armorPerLevel','moveSpeed','aggroRadius','loot','scale','color','componentTags',
 'boss','rare','worldBoss','elite','dummy','ambient','untameable','requiresQuestId','canSwim',
 'ccImmune','slowImmune','hardLeashRadius','damageFloorPct','xpMult','respawnMult','respawnWindow',
 'respawnSeconds','offStreamIdle','idleStationary','wanderHaste','phasesThroughObstacles',
 'restHpFraction','friendlyPracticeTarget','quietMechanics','ignoreTaunt','tameable']);
function attackData(m:O) {
  // Keep FULL nontrivial mechanics as JSON, not only guessed display labels.
  const d:O={}; for(const [key,value] of Object.entries(m)){
    if(standard.has(key)||value===undefined)continue;
    if(typeof value==='object'||mechanics.includes(key))d[key]=value;
  }
  return d;
}
function entryRows(m:O,scope:string):O[] {
  const rows:O[]=[];
  for(const [i,l] of A(m.loot).entries()){
    rows.push({scope,monsterId:m.id,monster:m.name,lvMin:m.minLevel,lvMax:m.maxLevel,
      index:i+1,lootType:l.itemId?'item':l.copper!==undefined?'copper':'other',
      itemId:l.itemId??'',copperAmount:l.copper??'',chanceRaw:l.chance??'',
      chancePercent:l.chance===undefined?'':Number((l.chance*100).toFixed(5)),
      qtyMin:l.minQty??'',qtyMax:l.maxQty??'',rollGroup:l.rollGroup??'',
      questId:l.questId??'',flags:j(Object.fromEntries(Object.entries(l).filter(([k])=>!['itemId','copper','chance','questId','rollGroup','minQty','maxQty'].includes(k))))});
  }
  return rows;
}
function audit() {
  const natives=Object.values(MOBS) as O[];
  const normal=applyHighflyHuntRewardTables(buildHighflyMonsterRoster(MOBS),ITEMS,ALL_RECIPES) as O;
  const elite=buildHighflyHuntEncounters(normal) as O;
  const extended=[...Object.values(normal),...Object.values(elite)] as O[];
  const all=[...natives,...extended];
  expect(Object.keys(normal)).toHaveLength(64);
  expect(Object.keys(elite)).toHaveLength(16);
  expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
  expect(HIGHFLY_MONSTER_BANDS).toHaveLength(8);
  expect(HIGHFLY_MONSTER_DONORS).toHaveLength(8);
  expect(highflyHuntRewardProfiles(ITEMS,ALL_RECIPES)).toHaveLength(64);
  expect(new Set(all.map(m=>m.id)).size).toBe(all.length);

  const spawns:O[]=[];
  const addSpawn=(type:string,placeId:string,placeName:string,mobId:string,count:number,extra:O={})=>{
     spawns.push({type,placeId,placeName,mobId,count,templateExists:!!MOBS[mobId]||!!normal[mobId]||!!elite[mobId],...extra});
  };
  for(const [i,c] of CAMPS.entries()){
    const z=zoneAt(c.center.x,c.center.z);
    addSpawn('native_open_world_camp',z?.id??'UNMAPPED',z?.name??'SIN ZONA RECTANGULAR',c.mobId,c.count,{
      campIndex:i,centerX:c.center.x,centerZ:c.center.z,radius:c.radius,
      zoneLevelRange:z?.levelRange?.join('-')??'',offStream:c.offStream??false,
      access:'Campo abierto: recorrido/camino/portal según conexiones reales del mundo'});
  }
  for(const d of Object.values(DUNGEONS) as O[]){
    for (const [i,sp] of A(d.spawns).entries()) {
      addSpawn('native_dungeon',d.id,d.name,sp.mobId,1,{
        campIndex:i,centerX:sp.x,centerZ:sp.z,
        access:'Entrada mazmorra: puerta ('+S(d.doorPos?.x)+','+S(d.doorPos?.z)+')',
        dungeonSuggestedPlayers:d.suggestedPlayers,instance:'SI',
        miniboss:j(sp.miniboss??null),packId:sp.packId??''});
    }
  }
  for (const d of Object.values(DELVES) as O[]) {
    // A delve boss is a CHOICE POOL, NOT a guarantee that all bosses spawn.
    for(const [i,bossId] of A(d.bosses).entries()) {
      addSpawn('native_delve_boss_candidate',d.id,d.name,S(bossId),0,{
        campIndex:i,centerX:d.doorPos?.x,centerZ:d.doorPos?.z,
        access:'Entrada delve ('+S(d.doorPos?.x)+','+S(d.doorPos?.z)+') · nivel mínimo '+S(d.minLevel),
        minLevel:d.minLevel,maxPlayers:d.maxPlayers,suggestedPlayers:d.suggestedPlayers,
        notes:'CANDIDATO de jefe para generación dinámica: count=0 indica NO garantizar su aparición'});
    }
  }
  for(const boss of WORLD_BOSSES) {
    const z=zoneAt(boss.pos.x,boss.pos.z);
    addSpawn('native_world_boss_scheduler',z?.id??'UNMAPPED',z?.name??'UNMAPPED',boss.templateId,1,{
      centerX:boss.pos.x,centerZ:boss.pos.z,
      access:'Aparición del scheduler, no campamento fijo',
      spawnIntervalSeconds:boss.intervalSeconds,
      bossHpScale:j(boss.hpScale),
      notes:'HP especial escalado por participantes; NO usar createMob como vida final del world boss'});
  }
  for(const s of HIGHFLY_HUNT_SCENARIOS) {
    for(const fam of s.families){
      addSpawn('highfly_opt_in_hunt',s.id+'_playtest',s.title,'hf_hunt_'+fam+'_'+s.minLevel,2,{
        zoneLevelRange:s.minLevel+'-'+s.maxLevel,
        biome:s.biome,access:'Solo LAB /monster-lab/?hfHunt='+s.minLevel,
        instance:'SI',selectedMode:'normal',notes:'4 familias ×2 = 8 mobs simultáneos'});
    }
    for(const mode of ['elite','captain']){
      addSpawn('highfly_opt_in_variant',s.id+'_playtest',s.title,'hf_enc_'+mode+'_'+s.minLevel,1,{
        zoneLevelRange:s.minLevel+'-'+s.maxLevel,
        biome:s.biome,access:'Solo LAB /monster-lab/?hfHunt='+s.minLevel+'&hfEncounter='+mode,
        instance:'SI',selectedMode:mode,
        notes:'Sustituye uno de los 8 mobs; no se suma como noveno'});
    }
  }
  const placements=new Map<string,O[]>();
  for(const sp of spawns){
    if(!placements.has(sp.mobId))placements.set(sp.mobId,[]);
    placements.get(sp.mobId)!.push(sp);
  }

  const mobRows:O[]=[];
  const attackRows:O[]=[];
  const lootRows:O[]=[];
  const harvestRows:O[]=[];
  for(const m of all){
    const source=natives.includes(m)?'CLAUDECRAFT_PINNED':'HIGHFLY_P02I_21_99';
    const p=placements.get(m.id)||[];
    const lvLo=Number(m.minLevel), lvHi=Number(m.maxLevel);
    const lo=statRow(m,lvLo),hi=statRow(m,lvHi);
    const flags={boss:!!m.boss,elite:!!m.elite,rare:!!m.rare,worldBoss:!!m.worldBoss,
      dummy:!!m.dummy,ambient:!!m.ambient,quest:!!m.requiresQuestId};
    const ai=attackData(m);
    const row={
      source,id:m.id,name:m.name,family:m.family,lvMin:lvLo,lvMax:lvHi,
      hpBase:m.hpBase,hpPerLevel:m.hpPerLevel,dmgBase:m.dmgBase,dmgPerLevel:m.dmgPerLevel,
      respawnSeconds:m.respawnSeconds??'',respawnMult:m.respawnMult??'',
      respawnWindow:j(m.respawnWindow??null),requiresQuestId:m.requiresQuestId??'',
      armorPerLevel:m.armorPerLevel,attackSpeed:m.attackSpeed,moveSpeed:m.moveSpeed,
      aggroRadius:m.aggroRadius,scale:m.scale,xpMultiplier:m.xpMult??1,
      ...flags,spawnRoutes:p.length,spawnType:[...new Set(p.map(x=>x.type))].join('; '),
      mapNames:[...new Set(p.map(x=>x.placeName))].join('; '),
      declaredSpawnCount:p.reduce((a,c)=>a+(Number(c.count)||0),0),
      hpAtMin:lo.hp,hpAtMax:hi.hp,attackAtMin:lo.attackMin+'-'+lo.attackMax,
      attackAtMax:hi.attackMin+'-'+hi.attackMax,
      armorAtMin:lo.armor,armorAtMax:hi.armor,
      lootEntries:A(m.loot).length,
      harvestTags:A(m.componentTags).join('; '),
      combatMechanics:Object.keys(ai).join('; '),
      mechanismDetails:j(ai),
      rowClassification:p.length?'AUTHORED_ROUTE':'NO_STATIC_ROUTE',
    };
    mobRows.push(row);
    attackRows.push({source,id:m.id,name:m.name,lvMin:lvLo,lvMax:lvHi,
       baseAttackInterval:m.attackSpeed,damageRangeMin:lo.attackMin+'-'+lo.attackMax,
       damageRangeMax:hi.attackMin+'-'+hi.attackMax,
       mechanicsCount:Object.keys(ai).length,mechanics:j(ai)});
    lootRows.push(...entryRows(m,source));
    for(const tag of A(m.componentTags)){
      harvestRows.push({source,id:m.id,name:m.name,tag,itemMapping:j((HARVEST_COMPONENT_ITEMS as O)[tag]??null),
        note:'Recolección de cadáver: resultado condicionado por reglas de profesión, NO chance de loot directo'});
    }
  }
  const zones=A(ZONES).map(z=>({id:z.id,name:z.name,biome:z.biome,levelMin:z.levelRange?.[0],
    levelMax:z.levelRange?.[1],xMin:z.xMin??-180,xMax:z.xMax??180,zMin:z.zMin,zMax:z.zMax,
    hubName:z.hub?.name??'',hubX:z.hub?.x??'',hubZ:z.hub?.z??'',
    sealedSouthBorder:!!z.sealedSouthBorder,passageSouthX:z.southPassX??'',
    access:'Ver portales y conexiones reales. Rango de zona no implica bloqueo automático por nivel',
    staticCamps:spawns.filter(p=>p.type==='native_open_world_camp'&&p.placeId===z.id).length,
    statedMobCount:spawns.filter(p=>p.type==='native_open_world_camp'&&p.placeId===z.id).reduce((s,c)=>s+c.count,0)
  }));
  const huntZones=HIGHFLY_HUNT_SCENARIOS.map(s=>({
    id:s.id+'_playtest',name:s.title,biome:s.biome,levelMin:s.minLevel,levelMax:s.maxLevel,
    xMin:'',xMax:'',zMin:'',zMax:'',hubName:'Hunter Refuge',hubX:0,hubZ:38,
    sealedSouthBorder:'',passageSouthX:'',
    access:'Solo Monster LAB; no hay portal integrado a HIGHFLY V4',
    staticCamps:4,statedMobCount:8
  }));
  const dungeonRows=Object.values(DUNGEONS).map((d:any)=>({
    id:d.id,name:d.name,doorX:d.doorPos?.x,doorZ:d.doorPos?.z,
    suggestedPlayers:d.suggestedPlayers,instanceSpawnCount:A(d.spawns).length,
    bossIds:A(d.spawns).filter(x=>MOBS[x.mobId]?.boss).map(x=>x.mobId).join('; '),
    zoneAtDoor:zoneAt(d.doorPos?.x,d.doorPos?.z)?.name??'UNMAPPED',
    entryRule:'Consultar gating de instancia; datos no prueban permiso por nivel',
    details:j({guideVisible:d.guideVisible,overworldDoor:d.overworldDoor,interior:d.interior})
  }));
  const delveRows=Object.values(DELVES).map((d:any)=>({
    id:d.id,name:d.name,minLevel:d.minLevel,suggestedPlayers:d.suggestedPlayers,
    maxPlayers:d.maxPlayers,doorX:d.doorPos?.x,doorZ:d.doorPos?.z,
    bossCandidates:A(d.bosses).join('; '),modules:A(d.modules).join('; '),
    moduleCount:j(d.moduleCount),objective:d.objective,
    note:'Bosses and modules are generation candidates, not simultaneous guaranteed spawns'
  }));
  const worldBossRows=WORLD_BOSSES.map(b=>({
    mobId:b.templateId,x:b.pos.x,z:b.pos.z,
    map:zoneAt(b.pos.x,b.pos.z)?.name??'UNMAPPED',
    intervalSeconds:b.intervalSeconds,hpBase:b.hpScale.base,
    hpExtraPerPlayer:b.hpScale.perPlayer,hpMax:b.hpScale.max,
    lockout:'Personal loot: raid-reset lockout'
  }));
  const portalRows=A(PORTALS).map(p=>({id:p.id,ax:p.a?.x,az:p.a?.z,bx:p.b?.x,bz:p.b?.z,
    aZone:zoneAt(p.a?.x,p.a?.z)?.name??'UNMAPPED',
    bZone:zoneAt(p.b?.x,p.b?.z)?.name??'UNMAPPED',radius:p.radius,
    condition:'Portal bidireccional por proximidad según src/sim/portals.ts',
    enterText:p.enterText,leaveText:p.leaveText}));
  const cols=(rows:O[])=>[...new Set(rows.flatMap(row=>Object.keys(row)))];
  csv('01_MONSTRUOS_TODOS.csv',mobRows,cols(mobRows));
  csv('02_APARICIONES_CAMPOS_MAZMORRAS_LAB.csv',spawns,cols(spawns));
  csv('03_LOOT_TODAS_LAS_FILAS.csv',lootRows,cols(lootRows));
  csv('04_ATAQUES_Y_MECANICAS.csv',attackRows,cols(attackRows));
  csv('05_RECOLECCION_CADAVER.csv',harvestRows,cols(harvestRows));
  csv('06_MAPAS_NATIVOS_Y_HIGHFLY.csv',[...zones,...huntZones],cols([...zones,...huntZones]));
  csv('07_MAZMORRAS.csv',dungeonRows,cols(dungeonRows));
  csv('08_PORTALES_Y_ACCESOS.csv',portalRows,cols(portalRows));
  csv('10_DELVES_ACCESOS_GENERACION.csv',delveRows,cols(delveRows));
  csv('11_JEFES_MUNDIALES_HORARIOS.csv',worldBossRows,cols(worldBossRows));
  writeFileSync(output+'/09_DATOS_COMPLETOS_BRUTOS.json',j({nativeMobs:MOBS,extendedNormal:normal,
    extendedEliteCaptain:elite,nativeCamps:CAMPS,nativeZones:ZONES,nativeDungeons:DUNGEONS,
    nativeDelves:DELVES,nativePortals:PORTALS,worldBossDefinitions:WORLD_BOSSES,
    respawnPolicy:{TRASH_RESPAWN_SECONDS,DEFAULT_RESPAWN_SECONDS,LEGACY_RESPAWN_SECONDS},
    huntScenarios:HIGHFLY_HUNT_SCENARIOS}));
  const summary={source:'ClaudeCraft 0.44.0 + HIGHFLY P02I without code modification',
    nativeTemplates:natives.length,highflyNormalTemplates:Object.keys(normal).length,
    highflyEliteCaptainTemplates:Object.keys(elite).length,
    totalTemplateRecords:mobRows.length,uniqueMobId:new Set(mobRows.map(x=>x.id)).size,
    nativeWorldZones:zones.length,highflyLabZones:huntZones.length,
    nativeWorldCamps:CAMPS.length,nativeCampPopulation:CAMPS.reduce((s,c)=>s+c.count,0),
    nativeDungeonCount:dungeonRows.length,nativeStaticDungeonSpawns:dungeonRows.reduce((s,c)=>s+c.instanceSpawnCount,0),
    nativeDelveDefinitions:Object.keys(DELVES).length,nativePortals:PORTALS.length,
    nativeWorldBossSchedules:WORLD_BOSSES.length,
    trashRespawnSeconds:TRASH_RESPAWN_SECONDS,offMapRespawnSeconds:DEFAULT_RESPAWN_SECONDS,
    highflyLabNormalCampEntries:spawns.filter(x=>x.type==='highfly_opt_in_hunt').length,
    highflyLabSpecialAlternatives:spawns.filter(x=>x.type==='highfly_opt_in_variant').length,
    mobTemplatesWithoutStaticPlacement:mobRows.filter(m=>!m.spawnRoutes).length,
    lootDefinitionRows:lootRows.length,corpseHarvestTags:harvestRows.length,
    attackMechanicRows:attackRows.length,
    categories:{
      regular:mobRows.filter(r=>!r.boss&&!r.elite&&!r.rare&&!r.dummy&&!r.ambient&&!r.worldBoss).length,
      boss:mobRows.filter(r=>r.boss).length,elite:mobRows.filter(r=>r.elite).length,
      rare:mobRows.filter(r=>r.rare).length,worldBoss:mobRows.filter(r=>r.worldBoss).length,
      dummy:mobRows.filter(r=>r.dummy).length,ambient:mobRows.filter(r=>r.ambient).length
    },
    notes:[
      'Extended 100+ is not enabled by HIGHFLY monster extension; 99 is max registered extension.',
      'One template record can have multiple spawn routes, and native generated/summoned events may have no static camp.',
      'Declared camps are planned simultaneous occupants, not measured online population or guaranteed respawn.',
      'Loot percentages are configured entry chances, not necessarily unconditional final RNG odds for quest or group rolls.',
      'Numeric HP and damage shown at min/max level use createMob current native formulas.',
      'Level gate for access is not implied by a zone levelRange: consult actual portals/instance logic.',
      'HIGHFLY experimental hunter 3x HP is NOT native MOB HP and does not promote to V4.',
      'No user saves, public V4 runtime, assets or original donors modified.'
    ]
  };
  writeFileSync(output+'/00_RESUMEN_AUDITORIA.json',JSON.stringify(summary,null,2));
  const summaryLines=Object.entries(summary).filter(([k,v])=>typeof v==='number').map(([k,v])=>'- '+k+': **'+v+'**');
  const main=[
 '# HIGHFLY MONSTRUOS 6 — INVENTARIO INTEGRAL LV1–99 (AUDITORÍA DE REGISTROS)',
 '',
 '## Cobertura y verdad de producto',
 'Fuente ejecutada en CI: ClaudeCraft v0.44.0 commit 9b57e49c... más overlay HIGHFLY MONSTRUOS P02I e6f59079...',
 'Los registros ClaudeCraft incluyen no sólo enemigos abiertos, sino jefes, entidades de mazmorra, mascotas, invocaciones, objetos de misión, ambient y dummies: NO equipararlos a monstruos únicos activos.',
 'LV1–20 funciona sobre tablas heredadas. HIGHFLY agrega 64 normales LV21–99 + 16 élites/capitanes de prueba. **Extended 100+ no implementado**.',
 '',
 '## Resumen calculado automáticamente',
 ...summaryLines,'',
 '## Fórmulas de stats de combate nativas',
 '- HP = round((hpBase + hpPerLevel × (lvl-1)) × (elite?2.3:1))',
 '- Daño inicial = (dmgBase + dmgPerLevel × (lvl-1)) × (elite?1.5:1)',
 '- Ataque min = round(daño × 0.8); ataque max = round(daño × 1.25)',
 '- Armadura = round(armorPerLevel × (lvl-1))',
 '',
 '## Dónde está cada valor',
 '| Archivo | Contenido |',
 '|---|---|',
 '| 01_MONSTRUOS_TODOS.csv | TODOS los registros, vida y ataque a nivel mínimo y máximo, flags, familia, mapas y aparición |',
 '| 02_APARICIONES_CAMPOS_MAZMORRAS_LAB.csv | Cada spawn/camp: ubicación, zona, cantidad, tipo de acceso y modo |',
 '| 03_LOOT_TODAS_LAS_FILAS.csv | TODAS las entradas de loot: ítem, cobre, chance %, grupos y requisitos de misión |',
 '| 04_ATAQUES_Y_MECANICAS.csv | Mecánicas originales y JSON de parámetros, velocidad y rangos |',
 '| 05_RECOLECCION_CADAVER.csv | Componentes recolectables; separados de drop directo |',
 '| 06_MAPAS_NATIVOS_Y_HIGHFLY.csv | Zonas, biomas, niveles, rectángulos, centros, cantidad de campamentos |',
 '| 07_MAZMORRAS.csv | Entradas, puntos de acceso y mobs de instancia |',
 '| 08_PORTALES_Y_ACCESOS.csv | Conexiones entre mapas y coordenadas de portales |',
 '| 10_DELVES_ACCESOS_GENERACION.csv | Min nivel de acceso, límite de grupo, jefes candidatos, módulos aleatorios |',
 '| 11_JEFES_MUNDIALES_HORARIOS.csv | Jefes mundiales, HP dinámico, puntos y temporizadores de aparición |',
 '| 09_DATOS_COMPLETOS_BRUTOS.json | Todas las plantillas reales sin simplificar y objetos del mundo |',
 '| 00_RESUMEN_AUDITORIA.json | Conteo reproducible y distinciones documentadas |',
 '',
 '## Importante sobre lo que NO se puede inferir de tablas estáticas',
 ...summary.notes.map(x=>'- '+x),
 '',
 '## Filtros para integración V4',
 '1. Separar los originales jugables de pet/summon/dummy/ambient y líderes/eventos.',
 '2. Identificar zonas original y sus rutas reales; LV1–20 se reutiliza, NO sustituir por arenas HIGHFLY.',
 '3. Las ocho zonas HIGHFLY LV21–99 son LAB instanciado, NO parte del mundo público V4.',
 '4. Cotejar drop de ítems raros, questId, rollGroup y chance real para no prometer un porcentaje incorrecto.',
 '5. Hacer pruebas de gameplay de acceso, combate, muerte, loot, guardado y FPS en S23 antes de promocionar.',
 ''
  ];
  writeFileSync(output+'/LEEME_INVENTARIO_INTEGRAL.md',main.join('\n'));
  expect(spawns.filter(x=>x.type==='highfly_opt_in_hunt')).toHaveLength(32);
  expect(spawns.filter(x=>x.type==='highfly_opt_in_variant')).toHaveLength(16);
  expect(lootRows.length).toBeGreaterThan(80);
  expect(zones.length).toBeGreaterThan(5);
  console.log('HF_MONSTRUOS6_FULL_REAL_REGISTRY_AUDIT='+JSON.stringify(summary));
  console.log('HF_MONSTRUOS6_NATIVE_MAP_SPAWN_MOB_HP_ATTACK_LOOT_100_PERCENT_EXPORTED_GREEN=1');
}
describe('HIGHFLY Monstruos 6 P02L FULL DATA AUDIT (NO DEPLOY)',()=>{
 it('exports original ClaudeCraft + HIGHFLY LV21–99 native registries and checks counts',audit,120000);
});
