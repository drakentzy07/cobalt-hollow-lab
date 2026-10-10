# HIGHFLY — CONTRATO DE EVOLUCIÓN EN 3 CAPAS
**Versión:** 1.0 · **Decisión de arquitectura:** 2026-10-10
**Principio:** HIGHFLY avanza sobre una base validada. Nunca vuelve a cero por una actualización.

Este contrato complementa `docs/HIGHFLY_FOUNDATION_V1.md` y los gates de CLEAN V3.
No modifica gameplay, despliegues ni versiones congeladas.

## 1. Arquitectura y autoridad

```
CAPA 3 — HIGHFLY ÚNICAS / EXPANSIONES
     ↓ extensiones compatibles mediante interfaces y adaptadores
CAPA 2 — HIGHFLY FOUNDATION / GAME INTEGRADO
     ↓ adaptación selectiva, control de versiones, GOLDEN
CAPA 1 — CLAUDECRAFT UPSTREAM / DONOR
```

### CAPA 1 — ClaudeCraft
Origen del motor, simulación, controles disponibles, clases, entidades,
habilidades, profesiones, mundo, crafting y sistemas RPG heredados.
**Upstream puede evolucionar permanentemente**, pero el árbol instalado de
HIGHFLY no se sobreescribe automáticamente. Para reproducibilidad, cada build
usa un **commit upstream fijado**. En CLEAN V3 el donor sigue anclado a
`levy-street/world-of-claudecraft@9b57e49c9676d75962700f828cc00a50a9a988b5`
(ClaudeCraft v0.44.0). Un candidato más nuevo se audita en un espacio aislado
antes de poder reemplazar ese pin.

### CAPA 2 — HIGHFLY Foundation
Producto integrado propio, **dueño de las decisiones GOLDEN**: movimiento
360° relativo a cámara, cámara derecha X/Y, multitouch, no inversión vertical,
HUD móvil editable, combate 1-2-3 con recuperación, soft target, lock manual,
Hunter único persistente, guardado, y conexión entre RPG / Training Core.
Los sistemas heredados se ADAPTAN; nunca se reimplementan sólo porque llegó
una nueva versión upstream. Todo hook compartido tiene **un único dueño**.

### CAPA 3 — HIGHFLY ÚNICAS
Contenido y mecánicas originales o ampliaciones específicas de HIGHFLY:
Training Core / desempeño físico y su autoridad, expansión LV1–99 y futura
Extended, oficios y gemas avanzados, skills EVO→MUTACIÓN→ÚNICA, skins premium,
monstruos especiales, RewardContext y escenarios propios.
Se acoplan **sobre Foundation mediante contratos claros**, sin reemplazar de
manera accidental el simulador, la cámara, el rig, el loot ni el guardado.
Los laboratorios Skin/Monster/Skill siguen aislados hasta cumplir sus gates.

Una capacidad puede existir en dos niveles (ej. Training Core: lógica única
en Capa 3, adaptador de runtime y UI estable en Capa 2). La propiedad y el
punto de integración deben estar expresados; **no dos autoridades para lo mismo**.

## 2. Actualizaciones upstream: adopción selectiva, NO merge automático

Para cada release o cambio relevante de ClaudeCraft:

1. **DESCUBRIR.** Registrar commit/tag candidato, changelog, licencia de
   código/assets y diferencias reales con el pin instalado.
2. **CLASIFICAR** los cambios:
   - `REUSE`: mejora directamente reutilizable y compatible;
   - `ADAPT`: mejora útil que requiere un adaptador protegido;
   - `DEFER`: útil, pero depende de trabajo pendiente;
   - `REJECT`: rompe decisiones HIGHFLY, duplica un sistema o no aporta.
3. **CONTRATO DE IMPACTO.** Listar archivos/sistemas afectados, APIs,
   esquema de datos, dependencias, compatibilidad de saves y tests concretos.
4. **INTEGRAR AISLADO.** Aplicar sólo el cambio aprobado sobre el pin conocido;
   nunca copiar overlays históricos enteros, reemplazar ramas enteras o
   promover al juego público a ciegas.
5. **VERIFICAR DIFERENCIAL.** Ejecutar las pruebas específicas de los
   sistemas modificados y sus dependencias. Si tocan infraestructura compartida
   (input, renderer, class, state, save, combate, UI mount, assets), ampliar
   el alcance a todos sus consumidores.
6. **PROMOVER/CONGELAR.** Green técnico + prueba humana donde corresponda +
   aprobación explícita antes de mover public/Pages; registrar el nuevo pin,
   SHA, procedencia, pruebas y rollback.

**Una actualización de ClaudeCraft NO es por sí misma una tarea de
revalidación de cada botón de HIGHFLY.** Es una propuesta de cambio
sobre un producto ya estable.

## 3. Regresiones por impacto, no volver a empezar

| Cambio real | Puerta de pruebas obligatoria | Lo que NO corresponde rehacer |
|---|---|---|
| Nueva criatura/IA/reward table | spawn→combat→death→loot→save, animaciones/fps donde impacte | creador, editor HUD, Training salvo dependencia |
| Nueva armadura/skin | rig real, wearables/sockets, escala, equipo visual, rendimiento | reglas de joystick o XP |
| Skill/gema elemental | cooldown, combo, targeting, HUD slot afectado, save y VFX | revisión genérica de todos los paneles |
| Receta/herrería/profesión | materiales, estación, craft, equipo, guardado, economía | cámara o navegación no vinculada |
| PF-6/Training Core | XP→perfil, stat authority, save, ausencia de duplicación | rehacer modelado 3D |
| Touch/input/cámara/HUD | regresión GOLDEN completa afectada, multitouch S23U | loot/profesiones si las APIs no cambiaron |
| Common core: Sim, CharacterState, loader, renderer, assets | gates ampliados, nueve clases, partidas previas y pruebas cross-system | *aquí sí* se justifica una batería grande |
| Release candidate / pin upstream nuevo | smoke integral PC/Android + save/reload + build + aprobación humana | reconstruir funcionalidades ya aprobadas |

**Tres niveles de certificación:**
- **PATCH GATE**: tests del cambio y vecinos afectados (rápido).
- **INTEGRATION GATE**: circuito multi-sistema cuando cambia una frontera
  (ej. minería→forja→equipo→combate→loot→guardar).
- **RELEASE GATE**: ejecución general, prueba de una partida real sin fixtures,
  nueve clases visuales, Android/S23U, saves/backcompat, rendimiento y rollback.
  Se usa antes de publicar, ante migraciones globales o como control periódico
  de release; **no como requisito para cada modificación pequeña**.

Un GREEN de tests con `seed`, herramientas/recetas preentregadas o mob de
1 HP prueba sólo el circuito descrito; no certifica por sí solo una partida
humana completa desde nivel 1 ni el balance final.

## 4. Inventario de responsabilidades actuales

| Sistema | Fuente / autoridad | Regla de compatibilidad |
|---|---|---|
| Sim RPG, loot, profesiones originales | ClaudeCraft, adaptado en Foundation | una sola economía/inventario/loot nativos |
| Cámara/joystick/HUD/combo móvil | HIGHFLY Foundation GOLDEN | no sustituir por controles upstream sin decisión |
| Hunter, levels, saves del RPG | Sim + puente Foundation | persistencia única coherente; migraciones verificadas |
| STR/AGI/VIT/PER/INT permanente | HIGHFLY Training Core: Awakening inicial + crecimiento natural por nivel + puntos de entrenamiento real | equipo, loot, talentos y XP no generan por sí solos puntos de Training |
| Skills base ClaudeCraft | Original preservado | EVO/MUT/ÚNICA en módulos/adaptadores separados |
| Laboratorio Skin / Monster / Skill | HIGHFLY ÚNICAS | sin fusionar experimentos no aprobados con producción |

## 5. GOLDEN no significa código inmóvil; significa comportamiento preservado

Referencia GOLDEN: `docs/HIGHFLY_FOUNDATION_V1.md`,
freeze C2.8.2 human-green `60daa3808573dbd2d05f5ade59fb0fe59254581a`.
Puede cambiar la implementación interna para ganar rendimiento o añadir
funcionalidad, **si la experiencia aprobada permanece igual o mejora
intencionalmente y se certifica su cambio**.

Si un gate de navegador redescubre un comportamiento ya congelado:
- comparar primero con la GOLDEN y con la rama integrada;
- aislar test/fixture/espera vs regresión real de producto;
- corregir únicamente el punto de divergencia; no reescribir input/HUD;
- conservar el mismo check mientras sea relevante y confiable.

## 6. Regla anti-colisión y anti-duplicación

**REUSE FIRST → AUDITAR → ADAPTAR → EXTENDER → TESTEAR → CONGELAR.**

- No activar a la vez dos sistemas que posean la misma responsabilidad.
- No duplicar listeners de input ni dos controladores del mismo botón.
- No crear un nuevo CharacterState/loot/profession engine porque una feature
  HIGHFLY necesita datos nuevos: extender el contrato existente.
- No modificar skeleton, skinIndex, skinWeight, animaciones originales de los
  GLB modulares para fabricar armaduras.
- Los flags/adaptadores deben ser removibles; eliminar código obsoleto sólo
  tras identificar consumidores, migraciones, pruebas y freeze.
- Proteger `main`, Pages, freezes y los laboratorios independientes.
- Cada cambio aceptado deja un registro mínimo: **fuente + objetivo + dueño +
  impacto + pruebas + decisión + SHA + rollback**.

## 7. Ejemplo de evolución sostenible

Año futuro: ClaudeCraft publica un jefe con IA mejorada.
Se compara con el donor instalado, se prueba en Monster Lab, se añade un
adaptador al RewardContext HIGHFLY, se ejecutan las pruebas de combate/loot/
save y, si todo es compatible, se promueve el jefe. Ni el joystick ni el
creador de personaje se vuelven a implementar o auditar desde cero.

**Resultado buscado: HIGHFLY se potencia con cada actualización; no se reinicia.**

## 8. Estado de implementación de este contrato

Este documento formaliza una decisión y **no afirma que ya exista
automatización completa de análisis de impacto ni despliegue condicional**.
El próximo paso de ingeniería es instrumentar los gates por cambios reales
y mantener los gate de release generales. Ninguna CI debe presentarse como
regresión selectiva automática hasta que ese enrutamiento esté implementado.
