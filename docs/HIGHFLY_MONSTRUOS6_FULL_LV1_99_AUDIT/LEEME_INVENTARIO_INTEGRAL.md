# HIGHFLY MONSTRUOS 6 — INVENTARIO INTEGRAL LV1–99 (AUDITORÍA DE REGISTROS)

## Cobertura y verdad de producto
Fuente ejecutada en CI: ClaudeCraft v0.44.0 commit 9b57e49c... más overlay HIGHFLY MONSTRUOS P02I e6f59079...
Los registros ClaudeCraft incluyen no sólo enemigos abiertos, sino jefes, entidades de mazmorra, mascotas, invocaciones, objetos de misión, ambient y dummies: NO equipararlos a monstruos únicos activos.
LV1–20 funciona sobre tablas heredadas. HIGHFLY agrega 64 normales LV21–99 + 16 élites/capitanes de prueba. **Extended 100+ no implementado**.

## Resumen calculado automáticamente
- nativeTemplates: **270**
- highflyNormalTemplates: **64**
- highflyEliteCaptainTemplates: **16**
- totalTemplateRecords: **350**
- uniqueMobId: **350**
- nativeWorldZones: **15**
- highflyLabZones: **8**
- nativeWorldCamps: **218**
- nativeCampPopulation: **714**
- nativeDungeonCount: **14**
- nativeStaticDungeonSpawns: **114**
- nativeDelveDefinitions: **2**
- nativePortals: **1**
- nativeWorldBossSchedules: **1**
- trashRespawnSeconds: **60**
- offMapRespawnSeconds: **25**
- highflyLabNormalCampEntries: **32**
- highflyLabSpecialAlternatives: **16**
- mobTemplatesWithoutStaticPlacement: **146**
- lootDefinitionRows: **988**
- corpseHarvestTags: **231**
- attackMechanicRows: **350**

## Fórmulas de stats de combate nativas
- HP = round((hpBase + hpPerLevel × (lvl-1)) × (elite?2.3:1))
- Daño inicial = (dmgBase + dmgPerLevel × (lvl-1)) × (elite?1.5:1)
- Ataque min = round(daño × 0.8); ataque max = round(daño × 1.25)
- Armadura = round(armorPerLevel × (lvl-1))

## Dónde está cada valor
| Archivo | Contenido |
|---|---|
| 01_MONSTRUOS_TODOS.csv | TODOS los registros, vida y ataque a nivel mínimo y máximo, flags, familia, mapas y aparición |
| 02_APARICIONES_CAMPOS_MAZMORRAS_LAB.csv | Cada spawn/camp: ubicación, zona, cantidad, tipo de acceso y modo |
| 03_LOOT_TODAS_LAS_FILAS.csv | TODAS las entradas de loot: ítem, cobre, chance %, grupos y requisitos de misión |
| 04_ATAQUES_Y_MECANICAS.csv | Mecánicas originales y JSON de parámetros, velocidad y rangos |
| 05_RECOLECCION_CADAVER.csv | Componentes recolectables; separados de drop directo |
| 06_MAPAS_NATIVOS_Y_HIGHFLY.csv | Zonas, biomas, niveles, rectángulos, centros, cantidad de campamentos |
| 07_MAZMORRAS.csv | Entradas, puntos de acceso y mobs de instancia |
| 08_PORTALES_Y_ACCESOS.csv | Conexiones entre mapas y coordenadas de portales |
| 10_DELVES_ACCESOS_GENERACION.csv | Min nivel de acceso, límite de grupo, jefes candidatos, módulos aleatorios |
| 11_JEFES_MUNDIALES_HORARIOS.csv | Jefes mundiales, HP dinámico, puntos y temporizadores de aparición |
| 09_DATOS_COMPLETOS_BRUTOS.json | Todas las plantillas reales sin simplificar y objetos del mundo |
| 00_RESUMEN_AUDITORIA.json | Conteo reproducible y distinciones documentadas |

## Importante sobre lo que NO se puede inferir de tablas estáticas
- Extended 100+ is not enabled by HIGHFLY monster extension; 99 is max registered extension.
- One template record can have multiple spawn routes, and native generated/summoned events may have no static camp.
- Declared camps are planned simultaneous occupants, not measured online population or guaranteed respawn.
- Loot percentages are configured entry chances, not necessarily unconditional final RNG odds for quest or group rolls.
- Numeric HP and damage shown at min/max level use createMob current native formulas.
- Level gate for access is not implied by a zone levelRange: consult actual portals/instance logic.
- HIGHFLY experimental hunter 3x HP is NOT native MOB HP and does not promote to V4.
- No user saves, public V4 runtime, assets or original donors modified.

## Filtros para integración V4
1. Separar los originales jugables de pet/summon/dummy/ambient y líderes/eventos.
2. Identificar zonas original y sus rutas reales; LV1–20 se reutiliza, NO sustituir por arenas HIGHFLY.
3. Las ocho zonas HIGHFLY LV21–99 son LAB instanciado, NO parte del mundo público V4.
4. Cotejar drop de ítems raros, questId, rollGroup y chance real para no prometer un porcentaje incorrecto.
5. Hacer pruebas de gameplay de acceso, combate, muerte, loot, guardado y FPS en S23 antes de promocionar.
