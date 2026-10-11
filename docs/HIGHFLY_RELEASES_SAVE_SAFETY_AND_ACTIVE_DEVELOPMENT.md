# HIGHFLY · Modelo de releases y guardados 2026-10-11
## Decisión operativa: juego permanente + desarrollo activo (no ramas nuevas por cada sesión)
**Reglas:** GitHub Pages sigue siendo hosting público; no Vercel. Jamás sobreescribir el artefacto Pages completo sólo para publicar una subruta. El freeze ClaudeCraft/CLEAN y las bases públicas V4-02, Monster Lab y Skin Lab quedan intactos.

### Roles únicos
1. `highfly-play-v403-release-candidate`: corte jugable desde P10 CI GREEN `fc74d3ba8638aa3bee263c710b5be28da81c6710`, **NO publicado ni certificado S23 físico**. Contiene P01–P10: mismo `Sim`/Hunter, PF6 LV1–99, PR1–13 y gemas PR14–16, P07 exteriores, P09 16 monstruos élite/capitán opt-in, P10 144 duelos nativos. El release candidato se congela y sólo recibe correcciones de bloqueo del juego, NO los experimentos.
2. `highfly-dev-main`: línea de desarrollo continuo desde P11, con su auditoría de 11 tramos. Nuevas ampliaciones se proponen como PRs hacia esta rama. PRs cortos por impacto: receta/itemización, loot, un oficio, biome art, una familia monstruo o QA. Nada llega al candidato por `push` automático: un PR seleccionado/cherry-pick probado pasa por pre-release.
3. `main` + Pages público: sin cambios hasta certificar publicación completa segura. Una rama no equivale a una URL ni a una actualización del usuario.

### Verdad del guardado existente
- CLEAN V1 incluye `src/game/highfly_offline_save.ts`, autoguardado ~2.5s; fallback `localStorage['highfly.offline.primary.v1']`; IndexedDB DB `highfly-offline`, store `saves`, clave `hunter:<clase>:<nombre normalizado>`; mantiene primary y entrada de Training por identidad. Loader nativo `Sim.addPlayer({state})`.
- `HighflyOfflineSave.version === 1` hoy: NO equiparar con `HIGHFLY_TRAINING_SCHEMA_VERSION === 5` ni con build V4-03; son tres cosas distintas.
- IndexedDB/localStorage se comparten por **origen completo**, no por la ruta `/cobalt-hollow-lab/v4-02/`, `/v4-03-preview/` o incluso diferente repositorio de Pages bajo el **mismo** `drakentzy07.github.io`. Por tanto abrir Play y Dev bajo un mismo host sin namespacing puede mezclar backups, autosaves y claves HUD.
- Los artefactos P08–P10 prueban serialize/addPlayer y emulación S23, **no** certifican aún actualización del mismo navegador V4-02→V4-03, IndexedDB real, ni migración de Training y GEM frente a cambios de esquema.

### Contrato profesional de release (obligatorio ANTES de publicar)
1. **Identificadores:** versión del cliente semántica independiente `4.03.x`; versión del contenido (tabla de item/receta/mob `contentRevision`); versión de guardado independiente `schemaVersion`. No restablecer IDs existentes ni reemplazar `Sim`; agregar nuevos IDs.
2. **Backups:** snapshot inmutable previo a migración en otra entrada IndexedDB, exportable como JSON con checksum SHA256 y revisión de versión; no borrar backup después del update. Exportación manual descargable debe incluir CharacterState, EquipmentInstance y Hunter Training; confirmar importación idempotente (no duplicar XP/loot).
3. **Migración:** forward-only incremental v1→v2..., idempotente, validar antes/después: clase, nombre, nivel, XP, monedas, quest log, inventory/bags/bank/vault, equipo+gema por copia, recipes, craftSkills, gathering, Training Core/points/rank. Cualquier dato desconocido **se conserva** en shadow JSON hasta admitirlo. No escribir sobre la copia previa si faltan definiciones o se recibe esquema de versión futura.
4. **DEV aislado:** `highfly-dev` usa **otra base/clave IDB** y nunca carga ni escribe `highfly-offline` de Play. La URL por sí sola no aísla. Usar modo QA sandbox con datos sintéticos y navegador context separado.
5. **QA automatizada:** fixtures V4-02 + V4-03 reales, 9 clases, con/sin Gem, Legacy Training schema, 1/20/21/50/99, profesión 0/125, cadáver reclamado y viejo save sin campos opcionales. Para cada fixture: importación → juego → autosave → cerrar → relog → reabrir con nuevo binario → comparación no destructiva. Añadir prueba con Playwright en Chrome emulado usando IndexedDB real y navegación al juego sin editar niveles de usuario.
6. **QA jugable:** correr Golden HUD/joystick/combate, navegación exterior a 8 portales/16 camps, loot/crafting/gem, rendimiento FPS/p95/carga en S23 Ultra **físico**, rollback verificado. Los 144 duelos automáticos no equivalen a balance humano.
7. **Staging Pages:** publicar sólo cuando el paquete PUBLICADO completo pueda reconstruirse sin borrar hashes/rutas: raíz, `v4-02/`, `monster-lab/`, `skin-lab/`, otros. Alternativa: origen de dominio **distinto** para la beta, con aislamiento de guardados y plan de import/export explícito. No disparar `actions/deploy-pages` hasta resolver.
8. **Despliegue gradual:** QA interna → beta → release estable; PIN SHA, artefacto exacto, changelog, gates y backup; etiquetar versión sólo si CI + prueba manual son GREEN. Soportar rollback de **cliente** sin cargar una partida escrita con esquema más nuevo en binario antiguo. En el rollback, restaurar copia antigua o bloquear solo escritura y recuperar al actualizar.
9. **Sincronización entre teléfonos:** Pages estático NO ofrece guardado centralizado. Primero export/import local; más adelante backend autenticado/cloud (según aprobación) para sincronización multidispositivo.

### Qué contiene la versión que estamos preparando
- ClaudeCraft original 1–20 conservado; Hunter HIGHFLY y XP LV1–99; ocho tramos 21–99; 80 **plantillas derivadas** (64 mobs normales + 16 élite/capitanes) reusan NPC/IA real, no 80 nuevos modelos 3D; 8 expediciones interiores prototipo, 16 campamentos.
- Diez oficios del `CRAFT_RING` conservan skill hasta 125; recetas `ALL_RECIPES` integradas 212, el nivel nominal máximo de receta llega a 42 (P11), esto no implica que oficios terminen al nivel 42. Tres gemas (Fuego/Hielo/Rayo) en contenido de receta 10/15/20, socket/ATK4 real.
- P10 144 encuentros prolongados: normales 56 WIN/11 LOSS/5 TIMEOUT; capitanes 10 WIN/56 LOSS/6 TIMEOUT bajo bot simplificado; no ajustar a ciegas Priest/Mage/Druid por el bot. P11: ocho de 11 tramos muestran al menos una brecha; el endgame no está final.
- Extended real 100+ BLOQUEADO. El Hunter puede alcanzar LV99 normal; las profesiones skill 125 son independientes.
- `main` Pages actual público no contiene por arte de magia la rama candidata.

### Trabajo activo, sin reiniciar
**Track RELEASE:** primero prueba de saves/backup/IDB; después browser/Android+URL beta segura; publicar V4-03 PLAY sobre URL aislada sólo cuando esté seguro. Estos cambios tienen prioridad sobre lo cosmético y no pasan mecánicas experimentales.
**Track CONTENT:** sobre Dev arreglar las brechas P11 50–99: materiales (obtención), recetas (sink), armas/armadura/consumibles (valor de combate), gemas (tier), progresión de oficios 125, nueve clases y TTK; usar IDs/loot/crafting donados, no duplicar sistema. Entrega por tramos y tests de adquisición real.
**Track PREMIUM:** skins originales, 5 legendarios y especiales SLF y futuras skills EVO/Mutación/Únicas se desarrollan aisladas y no condicionan jugar hoy.

### Estados y gates
- P08 GREEN https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38139928673
- P09 GREEN https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38140856603
- P10 GREEN https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38141812753
- P11 GREEN https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38142361089
- P12 TEST: `monsters/integration/highfly_p12_local_save_compat.test.ts` cubre FALLBACK localStorage+Sim nativo de nueve clases; NO IDB/browser real y NO backup/export ni migración cross-build aún.
