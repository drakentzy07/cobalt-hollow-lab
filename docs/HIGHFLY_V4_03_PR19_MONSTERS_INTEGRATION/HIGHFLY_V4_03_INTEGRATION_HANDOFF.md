# HIGHFLY V4-03 PR19 — REAL MONSTER INTEGRATION HANDOFF
**Corte solicitado:** 10/10/2026 22:44, Buenos Aires. **Estado del artefacto:** auditado, integración persistente NO certificada. No publicar.

## 1) Jerarquía de origen (NO confundir dos V4-03)
- ClaudeCraft pinned: `levy-street/world-of-claudecraft@9b57e49c9676d75962700f828cc00a50a9a988b5`.
- App móvil actual GREEN: PR19 source `highfly-v4-02-pr19-mobile-ui-unification@f452fa29cd236d2addbef734cb6ee5bf3ad7d546`, RUN `38085915127`.
- PR19 WebGL GREEN candidata: `highfly-v4-02-pr19-webgl-package@6de0c95a5eeaba2ce1e37805bf89dd00c6a704e3`, RUN `38085989015`.
- PR19 Pages publicado y congelado: `highfly-v4-02-pr19-pages-preserve-monster@e90daec37dcf0778afa374dedd606a54f5696640`, RUN `38086619159`. Root y /monster-lab/ NO sobrescribir.
- Monstruos P02I frozen: `e6f59079fdc3f278ef041fbc8354ca837aee42ab`, RUN `38086684125`; LAB Pages GREEN `38086943612`.
- P02L registros completos RUN `38094126772`. P02M matemático RUN `38095460400`.
- P02N 306 RUN `38101731031`; 1.440 reales con IA nativa RUN `38102239479`.
- V4-03 PR17 combinada: RUN `38102162302` GREEN, **NO basarla en PR19 sin reponer la UI móvil**.
- Rama PR19 real segura: `highfly-v4-03-pr19-monsters-handoff-real`, base PR19 real. Workflow **NO DEPLOY**: `.github/workflows/highfly-v4-03-pr19-monsters-combined.yml`, RUN GREEN #38103098404, artefacto [WebGL PR19+Monsters](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38103098404/artifacts/11689006382).

## 2) Estado real, sin maquillar
| Subsistema | Estado | Verificación |
|---|---|---|
| ClaudeCraft original, Hunter 9 clases, PR19 móvil, TRAINING/PF6 y profesiones del pipeline PR19 | GREEN REAL en PR19 | GREEN #38085915127 / #38085989015 |
| P02I monster definitions (64 normales + 8 élites + 8 capitanes) | GREEN LAB | #38086684125 |
| Registrados originales de ClaudeCraft (270) | GREEN AUDIT | P02L |
| Totales 350 registros, 988 loot rows, 8 LAB + 15 zonas nativas | GREEN AUDIT | P02L #38094126772 |
| Motor nativo vs 9 clases, a nivel y +5 | GREEN LAB smoke de 8 segundos | P02N #38102239479 |
| La mayoría de los duelos termina, balance real, rotations, defensas, gear, Training | RED/NO EVIDENCIA | P02N: 6 WIN, 1.434 TIMEOUT |
| V4-03 binario PR19 + monstruos fuente en **una misma compilación** | GREEN LAB, **sin Hunter persistente** | RUN #38103098404 + artefacto #11689006382 |
| V4-03 **UN Hunter persistente entre mundo y ocho instancias** | RED | Inexistente puente de instancia |
| V4-03 XP/loot al inventario único y retorno tras carga de save | RED | Requiere E2E con un solo Sim |
| Loot desafío P02M +5 con propiedad, antifraude y economía | GREEN PROPUESTA LAB; NO ACTIVO | `monsters/balance/highfly_challenge_reward_policy.ts` en rama P02M |
| Cinco bosses especiales y skins premium | FUTURO | No promover |
| Extended LV100+ | FUTURO | No habilitar |

**No afirmar '350 monstruos jugables':** 350 son definiciones, con entidades de pet, dummy, summon, jefe/evento sin estática. Los ocho LAB contienen 8 mobs simultáneos mediante 4 camps ×2; élite/capitán sustituyen uno de esos 8. El Hunter de ensayo usa HP×3 temporal.

## 3) Código exacto a transferir PR19 → instancia V4
En `highfly-v4-03-pr19-monsters-handoff-real` el workflow reproduce desde cero el runtime PR19, añade módulos P02I pinned:
`monsters/lv99/highfly_monster_content.ts`,
`highfly_hunt_rewards.ts`,
`highfly_hunt_encounters.ts`,
`highfly_hunt_scenarios.ts`,
`highfly_hunt_playtest_world.ts`,
`highfly_hunt_browser_pilot.ts`,
`highfly_hunt_scenery.ts`,
`highfly_hunt_render_palette.ts`,
más scripts `activate_content.py`, `activate_hunt_preview.py`, `activate_hunt_render_palette.py`.
Ninguno de los originales se duplica; original `MOBS`, `ITEMS`, `ALL_RECIPES`, `Sim`, reglas de Training y talentos continúan siendo autoridad.

**Aún NO copiar `activate_hunt_preview.py` al flujo persistente.** Ese script crea `HuntPilot` temporal con `sim.setPlayerLevel` y multiplica vida ×3. Sirve exclusivamente en artefacto aislado, bajo build flag `VITE_HIGHFLY_HUNT_PREVIEW=1` y query opt-in. En V4 definitiva debe desaparecer de la ruta productiva de entrada/salida.

### Contrato de puente único (IMPLEMENTAR, no presumir completo)
1. Cargar `CharacterState` del Hunter original con identidad y perfil Training ya existente y la versión de guardado de PR19.
2. Conservar **la misma instancia del Sim**; la propiedad original `Sim.worldContent` es `private readonly`, de modo que **NO** basta reasignar `sim.cfg.world` ni iniciar `new Sim` por cambio de escena. Adaptar mecanismo nativo de instancias/dungeons dentro del Sim o registrar zonas autorizadas al crear `WorldContent` antes del Sim. Documentar elección y testearla.
3. Crear catálogo de entradas accesibles por misión/rango (sin `?hfHunt` en app pública). Viajar hasta la instancia, registrar punto retorno en save versionado, bloquear ingreso repetido durante carga.
4. Aplicar la tabla real de enemigos y su IA/cantidad/respawn. No crear un ID de mob duplicado ni cargar todo el bestiario simultáneo. Ocho instancias HIGHFLY no son ocho mundos completos hoy.
5. En muerte de mob real emitir evento autoritativo con identificación única de kill y `RewardContext` validado. Integrar RNG, ownership/party, loot, moneda/XP en UNA transacción idempotente del Sim, no en HTML/client. `RewardContext v1.2` es contrato conceptual: no dar por existente el adaptador runtime.
6. Persistencia: inventario único, XP PF6, material/receta PROF, equipamiento/gema PR14–16, Skill 1-2-3 (+4 solo con gema), sin tocar Training STR/AGI/VIT/PER/INT por matar.
7. Salida: guardar, desmontar encuentro sin re-loot ni dupes, devolver al mismo Hunter y coordenada de retorno, probar cerrar navegador durante cada frontera de carga/guardado.
8. Mantener 100+ cerrado, y no introducir un segundo sistema de combate, de profesiones o de recompensas.

### Riesgo central que vuelve RED a 'todo todo'
Con el estado verificado, compartir JS WebGL no significa compartir Hunter ni save. Si se ejecuta `HuntPilot` en la rama pública, se pierde la identidad y se infla HP. La integración debe crear una API de entrada/salida en la autoridad de juego, no reutilizar sin adaptar el preview.

## 4) Balance, XP y loot
- P02M: 21.600 comparaciones matemáticas sin equipo, activación de esquiva/parry o completo uso de skills. P02N: 1.440 duelos de 8 s con IA y autoataque/cast; **4 WIN/716 TIMEOUT al mismo nivel**, **2 WIN/718 TIMEOUT contra +5**, 0 LOSS dentro de la ventana de 8 s. No estimar winrate real a partir de ese smoke.
- Para autorizar el juego: 9 clases × 3 perfiles genuinos Training × >=3 tiers de equipo real PF9 × +0/+3/+5/+8/+10 × normales/élites, muchas seeds, tiempos >=15-240 s según clase; parry/dash/dodge y cooldowns verdaderos. Registrar HP inicial/fin, daño recibido, XP/h, loot/kills y tasas de cancelación de combate.
- P02M recompensa +3/+5 **solo propuesta** para reactivos de crafting del loot real; no mutar rollGroup de quest/legendario ni multiplicar todas las filas. Idempotencia y antiabusos después de conseguir kill server/sim validada.
- 988 loot rows P02L son chances de fila, muchas condicionadas por quest/roll group; no equivalen a 988 ítems garantizados. Conectar obtención real con consumo real en receta, herrería, gemas, guardado.

## 5) Testing y gates (orden obligatorio)
1. CI PR19 combined **GREEN**: TypeScript, PR19 S23 Chrome, PR18 UI, PR14/15/16 gemas, Training PF6, profesiones PR1-13, 80 monster templates, AI/cadáver/RNG, 8 LAB, assets WebGL.
2. Crear mundo/instancing de **un solo Sim**; controlar duplicidad, desconexión, guardar/cargar y revivir.
3. End-to-end no synthetic: Hunter original → portal nativo → combate normal/élite → kill → loot/cobre/XP → materiales → forjar equipo → incrustar gema → volver → reiniciar PWA → verificar MISMO Hunter, stats y materiales.
4. Anti exploit: morir/reiniciar en transición, acceso +5, grupo, doble tap loot, manipulación cliente, cambio de rango, latencia, save corrupto, rollback.
5. QA móvil **físico** Galaxy S23 Ultra horizontal con cámara X/Y y multitouch, HUD editable, FPS+p95 en cada bioma/cerca y lejos de fogata, sin blancos de suelo.
6. Solo tras todo GREEN REAL considerar PR hacia V4 persistente. Nunca deploy a root, `/v4-02/`, `/monster-lab/` o Skin Lab mientras no exista autorización y SHA compare.

## 6) Archivos de auditoría transferidos al repositorio
Todos generados por `monsters/integration/build_v403_pr19_handoff.py` en `docs/HIGHFLY_V4_03_PR19_MONSTERS_INTEGRATION/`:
- `HIGHFLY_V4_03_MONSTERS_INTEGRATION_MANIFEST.json`
- `HIGHFLY_V4_03_BESTIARY_1_99.csv`
- `HIGHFLY_V4_03_WORLD_SPAWN_ACCESS.csv`
- `HIGHFLY_V4_03_HUNTER_VS_MOB_BALANCE_REPORT.json`
- `HIGHFLY_V4_03_REWARD_LOOT_CRAFTING.csv`
- `HIGHFLY_V4_03_P02N_1440_RAW_DUELS.csv`
Verificar origen y `source_sha256` de manifest antes de usar. La CI de informes es `.github/workflows/highfly-v4-03-pr19-handoff-reports.yml` y GREEN `38103132422`.

## 7) Rollback que debemos mantener operativo
Restaurar branch y artifact PR19 `highfly-v4-02-pr19-webgl-package@6de0c95a5eeaba2ce1e37805bf89dd00c6a704e3`, para publicar usar la actual prueba de Pages `highfly-v4-02-pr19-pages-preserve-monster@e90daec37dcf0778afa374dedd606a54f5696640` sin modificar original.
Guardar copias de save/CharacterState de PR19 antes de probar; aplicar flags aislados hasta testear rollback completo; nunca sustituir archivos históricos ni datos reales en V4 para hacer una demostración.
