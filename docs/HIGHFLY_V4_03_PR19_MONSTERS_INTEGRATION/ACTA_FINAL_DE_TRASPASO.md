# ACTA FINAL DE TRASPASO — MONSTRUOS → HIGHFLY V4-03

**Corte de requisitos:** 10/10/2026 22:44 (Argentina).  
**Estado de entrega:** **TRASPASO TÉCNICO COMPLETO EN FUENTES Y AUDITORÍAS; JUEGO PERSISTENTE V4-03 TODAVÍA NO INTEGRADO AL 100%**. No autorizar deploy público.

## 1. ESTADO REAL
- GREEN REAL: app HIGHFLY V4-02 PR19, Training PF6 LV1-99, 9 clases, profesiones PR1-13, gemas PR14-16 y UI móvil PR18/19, según sus CI específicas.
- GREEN LAB: catálogo original + monstruos P02I 21-99; 8 biomas, 64 normales y 16 variantes; combo de módulos PR19 + P02I probado en build aislada bajo el workflow V4-03; NO es portal persistente.
- GREEN AUDIT: P02L 350 registros, 988 filas loot, campamentos, mapas, ataques, ports/respawns.
- GREEN LAB SIM: P02N 1.440 peleas con IA real, duración máxima 8 segundos, 6 WIN, 1.434 TIMEOUT, sin evidencia de winrate jugable.
- RED: puente UN Hunter/UN Sim con entrada/salida y save, loot→herrería→gema→persistencia, balance E2E de peleas completas.
- FUTURO: 5 bosses legendarios especiales, Skin Lab premium y Extended 100+.

## 2. RAMA Y SHA
Rama de traspaso: `highfly-v4-03-pr19-monsters-handoff-real`. Leer el commit actual desde su [árbol GitHub](https://github.com/drakentzy07/cobalt-hollow-lab/tree/highfly-v4-03-pr19-monsters-handoff-real), porque los commits de pruebas/documentos CI generan SHAs sucesivos.
- Donor `9b57e49c9676d75962700f828cc00a50a9a988b5`.
- PR19 WebGL base `6de0c95a5eeaba2ce1e37805bf89dd00c6a704e3`.
- PR19 Published Pages `e90daec37dcf0778afa374dedd606a54f5696640`.
- Monstruos P02I `e6f59079fdc3f278ef041fbc8354ca837aee42ab`.
- P02M auditorías `402c779c9f2caf2e3c538313ed627d1163792aaf`.
- P02N 1.440 confirmado `0ebb3de9044cd86b47ac4cd9cc2665b47cb85c04`.

## 3. RUN GREEN
- PR19 UI: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38085915127
- PR19 WebGL: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38085989015
- PR19 Pages: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38086619159
- P02I: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38086684125
- P02L: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38094126772
- P02M: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38095460400
- P02N: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38102239479
- Reports + 350/988 + 1440: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38103132422
- PR19+P02I combined GREEN: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38103098404 (tests PR19 S23 emulado, gemas y Monster Lab).

## 4. BUILD Y ANDROID
- Sitio aislado de monstruos previamente GREEN: https://drakentzy07.github.io/cobalt-hollow-lab/monster-lab/hunts.html
- V4-03 combinada anterior PR17 GREEN: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38102162302 (artefacto WebGL, NO equivalente PR19).
- Build combinada PR19 **GREEN LAB**, sin portal persistente: [artefacto WebGL de GitHub #11689006382](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38103098404/artifacts/11689006382), 719.303.385 bytes. Solo paquete WebGL sin publicación; no es prueba en Samsung físico.
- En Samsung S23 Ultra: elegir PR19 original o Monster Lab aislado sin mezclar guardados. Cualquier WebGL empaquetado se sirve por HTTP local/LAN, **no file://**, antes de URL de QA separada.

## 5. CONTENIDO
270 plantillas originales ClaudeCraft; 64 nuevos normales; 16 variantes élite/capitán; **350 definiciones no todas jugables**. 15 zonas originales, 8 arenas LAB, 218 camps donor, 32 entradas de campamento LAB, 14 dungeons originales, 988 líneas loot, 350 registros ataque/mecánica. Extended 100+ cerrado; cinco bosses especiales ajenos a los 16 de LAB.

## 6. BALANCE
P02M 21.600 escenarios de modelos; P02N 1.440 ejecuciones native Sim de 8 segundos, 4/720 igual nivel y 2/720 +5 terminaron en WIN; 1.434 TIMEOUT; sin tasa de victoria real. Falta equipamiento PF9 real, 3 perfiles Training, skills completas, parry/dash/dodge humano, combate 15-240 s, daño/muerte/loot efectivo. No activar bonus +5 sin autoridad kill antiabuso.

## 7. INTEGRACIÓN REAL
Un WEBGL conjunto puede mostrar modos normales y `?hfHunt=` aislado; **actualmente HuntPilot crea Hunter temporal +3x HP**. Falta el puente a mismo `Sim` / misma identidad/guardado/XP/bolsa y retorno a mundo con loot. **No permitir segundo Hunter en ruta persistente.**

## 8. ARCHIVOS
Carpeta `docs/HIGHFLY_V4_03_PR19_MONSTERS_INTEGRATION/`:
`HIGHFLY_V4_03_MONSTERS_INTEGRATION_MANIFEST.json`;
`HIGHFLY_V4_03_BESTIARY_1_99.csv`;
`HIGHFLY_V4_03_WORLD_SPAWN_ACCESS.csv`;
`HIGHFLY_V4_03_HUNTER_VS_MOB_BALANCE_REPORT.json`;
`HIGHFLY_V4_03_REWARD_LOOT_CRAFTING.csv`;
`HIGHFLY_V4_03_P02N_1440_RAW_DUELS.csv`;
`HIGHFLY_V4_03_INTEGRATION_HANDOFF.md`;
`PROMPT_TRASPASO_HIGHFLY_V403_PR19.md`.
Código y tests: `monsters/integration/build_v403_pr19_handoff.py`, `.github/workflows/highfly-v4-03-pr19-monsters-combined.yml`, `.github/workflows/highfly-v4-03-pr19-handoff-reports.yml`.

## 9. BLOQUEANTES
Único Hunter, transición autorizada en Sim, recompensa una sola vez, guardado idempotente y retorno; además itemización 21-99 balanceada, test real S23, QA humano y hashes root/Pages intactos.

## 10. PLAN DE INTEGRACIÓN
PR19 freeze → inyectar P02I `WorldContent` con extensión nativa de instancias → un solo Hunter/Sim → nativo mob AI/loot transaccional → profesiones/gema → save/restore → E2E 9 clases → balance de combate y economía → QA S23 → revisión humana → PR y despliegue controlado.

## 11. ROLLBACK
No se realizó deploy de esta rama. Puntos de recuperación PR19: `6de0c95a5eeaba2ce1e37805bf89dd00c6a704e3` para WebGL y `e90daec37dcf0778afa374dedd606a54f5696640` para Pages. Antes de migrar, crear snapshots exportables de guardados y verificar recuperación de inventario, rango, Training Core y profesiones.

## 12. PROMPT DE TRASPASO
Abrir `PROMPT_TRASPASO_HIGHFLY_V403_PR19.md` en esta misma carpeta. Contiene instrucciones técnicas y enlaces GREEN para continuar en el chat principal sin comenzar desde cero y sin reintroducir PR17/HP×3.
