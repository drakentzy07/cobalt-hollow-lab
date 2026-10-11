# HIGHFLY V4-03 — P01 SAME-SIM PERSISTENT HUNTER BRIDGE

## Estado y evidencias al 11/10/2026

- Base inalterada: rama `highfly-v4-03-pr19-monsters-handoff-real`, PR19 9 clases, Training, profesiones, Gemas, GOLDEN y P02I. Esta rama P01 es exclusivamente aislada, CI de fuente y test, **NO DEPLOY**.
- Nuevo módulo auténtico `monsters/integration/highfly_persistent_hunt_bridge.ts`, copiado por CI al overlay `src/highfly/monsters/hunt_persistent.ts`.
- API `HighflyPersistentHuntBridge`: `enter`/ `exit` para viajar con **el mismo `Sim` y `Entity`**, admisión por nivel/escenario/camps realmente instalados, una visita por Hunter, sin `setPlayerLevel`, sin HP ×3, sin `new Sim`, `safeCharacterForSave` devuelve **el mismo CharacterState nativo** con posición de retorno si estaba dentro. `lootNativeCorpse` invoca solo al `Sim.lootCorpse` original con filtro doble-tap; no genera botín adicional.
- GATE en CI: 9 clases con serialización/reapertura nativa, identidad estable, reingreso no duplicado, no mutar mapa original ni cambiar HP al viajar.
- Contenido de prueba **es una zona virtual de TEST**, no está conectado al menú público, no es una mazmorra 3D validada y no es un portal de mundo; código de producción necesita mapa/portal y autorización del host. Este módulo aún no constituye integración jugable V4-03.
- No reclamar como validado hasta recibir resultado SUCCESS en CI.

## Bloqueantes REALES para V4-03

1. Inyectar y validar ocho zonas/instancias en un mundo que conserve `BUILTIN_WORLD`, `setActiveWorldContent`, render y rutas Android. El `Sim.worldContent` se fija en constructor, no cambiar `cfg.world` después.
2. Conectar admisión por interacción nativa y no query `?hfHunt` ni startOffline creando `HuntPilot`; retirar HP×3 del camino persistente y los `setPlayerLevel` de pruebas.
3. Host de guardado debe llamar al `safeCharacterForSave` bajo flag y migrar/recuperar sesiones interrumpidas sin sobrescribir saves anteriores.
4. E2E real: kill autoritativo → XP → corpse loot → inventario → consumo crafting → herrería → gema → equipamiento → save/reload, con antidupe, quest/group/ownership.
5. Combate completo con 9 clases, parry/dash/skills, PF9 equipo LV21–99, entrenamiento validado. P02N 1440 peleas de 8 s **no** certifica balance.
6. Android físico S23 Ultra, FPS/p95, escenarios, touch y rollback.
7. Hasta que 1–6 estén GREEN REAL, **NO PUBLICAR**, NO actualizar main, /v4-02/, /monster-lab/, Skin Lab.

## Rollback congelado

- PR19 UI `f452fa29cd236d2addbef734cb6ee5bf3ad7d546`.
- PR19 WebGL `6de0c95a5eeaba2ce1e37805bf89dd00c6a704e3`.
- PR19 Pages `e90daec37dcf0778afa374dedd606a54f5696640`.
- P02I `e6f59079fdc3f278ef041fbc8354ca837aee42ab`.
- Handoff maestro: `highfly-v4-03-pr19-monsters-handoff-real`.

**Criterio de honestidad**: `P01 same-Sim trip/save` GREEN LAB cuando CI pase; `V4-03 persistente jugable` sigue YELLOW/RED hasta los gates 1–7.
