# HIGHFLY V4-03 — P07 | UN SOLO MUNDO, Cacerías al aire libre + portales

## Qué SÍ hace la versión de pruebas

- El mundo original ClaudeCraft no se reemplaza. LV1–20, sus ciudades, caminos, fauna, hubs, dungeons, quests, loot, crafting, gemas, entrenamiento y guardados siguen siendo originales PR19 + HIGHFLY.
- OCHO **portales físicos** añadidos a regiones **YA EXISTENTES**. El `Sim` original los genera como `dungeon_door`. Al caminar cerca entra mediante `updateDoorTriggers`, con **comprobación de nivel en `enterDungeon`**. Reutiliza `claimInstance`, ocho `DungeonSpawn` nativos por dungeon, `createMob`, IA, ataques, muerte, XP, corpse, loot, regreso y guardado. No hay instancia del Hunter de laboratorio, `setPlayerLevel` ni HP×3.
- P07 agrega opcionalmente dos campamentos **de alto nivel** por región, con dos criaturas por campamento, `offStream: true`: 16 campamentos y un máximo inicial de 32 enemigos de caza abierta adicionales, en posiciones separadas de los pueblos, de lagos, de camps originales, de POIs y de puertas originales. Respawn y recompensas permanecen en ClaudeCraft. El mapa agrega POIs con símbolos ⚔ (portal) y ⚠ (peligro).
- Los ocho biomas/terrenos HIGHFLY artísticos y escenarios especiales **todavía NO están incluidos**. Los ocho dungeons reutilizan geometría tipo `crypt/sanctum/temple` como piloto. Tampoco hay 32 enemigos en la pantalla: quedan distribuidos por ocho regiones lejanas.

## Regiones originales — portales P06 GREEN

Coordenadas del mundo virtual, auditadas en `RUN #38108818189`:

| Cacería | Región de ClaudeCraft | Coordenadas originales (X,Z) | Enemigos |
|---|---|---|---|
| LV21–29, Umbral de los Aullidos | The Veiled Hollow | (45, 1095) | 8 dentro + 4 afuera P07 |
| LV30–39, Marisma del Velo | The Drakelands | (489, 1965) | 8 dentro + 4 afuera P07 |
| LV40–49, Desfiladero Colmillo | The Frostveil Reach | (-115, 1625) | 8 dentro + 4 afuera P07 |
| LV50–59, Tundra del Silencio | The Amberfall | (-275, 2137) | 8 dentro + 4 afuera P07 |
| LV60–69, Yermo de las Escamas | The Willowfen | (-275, 427) | 8 dentro + 4 afuera P07 |
| LV70–79, Jardín Marchito | The Nightbloom | (-285, 1485) | 8 dentro + 4 afuera P07 |
| LV80–89, Cresta del Trueno | The Wraithwood | (445, 1495) | 8 dentro + 4 afuera P07 |
| LV90–99, Orilla del Abismo | The Palmreach | (-215, 885) | 8 dentro + 4 afuera P07 |

Los nombres de cacería indican sus **bandas de progresión**, no que la región ClaudeCraft adquiera mágicamente ese bioma o que la nieve/lava ya esté pintada allí.

## Flujo concreto de juego

1. Crear Hunter LV1 de cualquiera de las nueve clases. Explorar mundo original. Entrenamiento y progresión propias de HIGHFLY.
2. Matar criaturas originales y conseguir sus recompensas reales. LV21 habilita primera cacería HIGHFLY.
3. Descubrir zona de peligro LV21–29 en el mapa, pelear contra criaturas HIGHFLY en campamentos lejanos.
4. Encontrar el portal físico original de la etapa o usar `Más → Cacerías` como atajo (misma instancia). Entrar sin reemplazar Hunter ni Sim.
5. Matar mobs con habilidades nativas y equipamiento, recibir XP/cobre/reagentes, recoger loot en inventario, gastar materiales en recetas existentes.
6. Salir por el portal de salida, guardar partida original y seguir hacia las siguientes zonas/mazmorras hasta LV99.

## Gates reales

- P06 **GREEN**: 53 pasos, 8 puertas físicas y dungeons, 9 clases y S23 **emulado**. Artefacto WebGL aislado, no Pages pública.
- P07 **debe aprobar**: instalación del habitat `WorldContent`, dos camps seguros por región, 16/32 presupuesto, mapas POI, TS, 9 clases, S23 Chrome, compilación WebGL. **No declararlo GREEN antes del RUN**.
- QA física Samsung S23 Ultra todavía pendiente.
- Balance Hunter vs monstruos LV1–99 con equipos reales todavía pendiente.
- Ocho mapas/biomas definitivos son trabajo de actualización visual futura. No incluir todavía jefes especiales sin validación.
- No se debe sobrescribir `main`, `v4-02`, `monster-lab` ni Pages pública. `VITE_HIGHFLY_OPEN_WORLD_HUNTS` requiere `1` en el paquete piloto, desactivado por defecto.

## Rollback

P06 base: `highfly-v4-03-p06-world-portals-native` SHA congelado GREEN disponible en GitHub. Desactivar env `VITE_HIGHFLY_OPEN_WORLD_HUNTS` quita todos los camps y puntos de peligro sin migraciones; desactivar `VITE_HIGHFLY_NATIVE_HUNT` vuelve a la fuente PR19 sin 8 dungeons. No modifica `CharacterState`.

**Esta entrega no equivale a la publicación de los 8 biomas exclusivos.**
