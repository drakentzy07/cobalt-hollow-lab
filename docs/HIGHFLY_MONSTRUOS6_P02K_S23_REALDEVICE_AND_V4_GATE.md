# HIGHFLY — MONSTRUOS 6 / PASS 02-K
## Puerta de validación física S23 Ultra y traspaso seguro a V4

Fecha: 2026-10-10. Este documento CONTINÚA MONSTRUOS 5; no reemplaza ni reescribe ClaudeCraft, CLEAN V1 ni HIGHFLY V4.

### Fuentes verificadas
- Base: rama `highfly-monsters-p02j-mobile-fps-overlay-safe`, commit `6d4413265556547a148513cee697098654911989`.
- PASS 02-J, RUN GREEN `38090028346`: CI WebGL, HUD y panel FPS; despliegue Pages GREEN.
- Monstruos P02-I: 8 instancias diferenciadas (`haunt`, `marsh`, `peaks`, `frost`, `volcano`, `garden`, `gale`, `cave`), bandas 21/30/40/50/60/70/80/90 hasta 99; base heredada para 1–20.
- 64 plantillas normales de LV21–99, 16 variantes élite/capitán; 8 enemigos simultáneos por instancia. Materiales para profesiones: drops de base con probabilidades preexistentes en el LAB (no afirmar inventario/persistencia V4).
- La capa de prueba P02-I aumenta HP de Hunter temporalmente ×3, sólo en Monster Lab. No es un cambio de balance definitivo.
- PASS 02-J agregó panel `?hfPerf=1` en `/cobalt-hollow-lab/monster-lab/hunts.html` (FPS, p95 en ms y porcentaje de fotogramas >50ms), sólo Monster Lab; V4, raíz y medios existentes preservados por hashes.
- Las métricas en runner con emulación Chrome (ej. LV21 ~2 FPS y LV90 capitán ~3.7 FPS) **no** son mediciones físicas del Samsung S23 Ultra. No usarlas como benchmark ni como aprobación de rendimiento.

### Decisión de arquitectura
1. Escenarios separados/instanciados por bioma y banda de nivel, sin convertir cada bioma en el mismo terreno nevado; reutilizar los escenarios y activos nativos que sean apropiados para cada región.
2. Enemigos por familia → instancia/encuentro → combate → `RewardContext` → loot → profesión/crafting. Separar datos de enemigos de vegetación/suelo y de recompensas.
3. Monstruos de nivel 1–99 y Extended 100+ reservado; jefes/especiales como contenido progresivo, nunca replicarlos como enemigos normales por error.
4. Mantener entrenamiento real como única fuente de STR/AGI/VIT/PER/INT por ejercicio; XP de cacería sólo progresa nivel/reglas ya acordadas. Ítems no dan esos cinco stats.
5. Reusar ClaudeCraft congelado, adaptar antes de extender, y evitar archivos/códigos duplicados. No cambiar cámara GOLDEN, joystick 360, ataque 1–2–3 o 4º golpe elemental condicionado por gema.
6. No tocar `main`, la demo pública ni `/v4-02/` desde este gate. Integrar a V4 sólo después de que V4-02 sea estable y de aprobar pruebas de supervivencia, loot, guardado y rendimiento S23.

### PASS 02-K: prueba física prioritaria (sin reconstrucción)
Abrir en Chrome S23 Ultra horizontal:
`https://drakentzy07.github.io/cobalt-hollow-lab/monster-lab/hunts.html?hfPerf=1`.

Probar primero una zona fría (Frost LV50) cerca de un fuego y lejos del fuego; capturar después de 10 segundos en cada condición: FPS, p95, tirones, cantidad aproximada de monstruos visibles, si ataca/camina con respuesta inmediata. Repetir en una zona que no sea de nieve (Volcano LV60), y una de LV90 con capitán si es jugable. Mantener misma orientación, cámara y condiciones de uso; no cambiar tres variables a la vez. Probar también menú de cazas SIN `hfPerf=1` para descartar sobrecarga del diagnóstico.

Una caída selectiva en Frost sugiere revisar materiales de nieve/partículas/vegetación y sus shaders. Una caída lejos del fuego en todos los biomas sugiere culling, densidad, visibilidad, streaming u otra carga de escenario. Una caída solo frente a 8 enemigos sugiere actualización IA/animación/efectos. **No declarar causa sin la comparación física.**

### Criterios para declarar 'apto para integrar'
- Visual: cada uno de los ocho biomas conserva ambiente propio, mapa cargado, rutas utilizables, sin hundimiento de agua / colisiones rotas.
- Combate: móvil multitouch, movilidad, lock y ataques no cambian de comportamiento; hit/damage/kill reales, no sólo entidades visibles.
- Supervivencia: dificultad razonable al LV de prueba, respawn funcional, opción de volver a intentar; HP ×3 de LAB no pasa a V4 sin diseño explícito.
- Recompensa: muertes producen `RewardContext` correcto, loot tangible y reglas de probabilidades auditables; sin duplicados; puente a inventario/crafting/profesiones y persistencia comprobados.
- Progresión: XP LV1–99 y rangos coherentes; NO otorgar STR/AGI/VIT/PER/INT con kills/items.
- Rendimiento: medir en S23 físico con panel opcional, registrar casos de <25 FPS sostenidos, p95 >50ms o tirones >10%; objetivo de diseño de 30 FPS estables en situaciones normales, no homologado aún.
- Integración: usar rama aislada y pruebas CI / dispositivo; comparar hashes raíz y `/v4-02/`; aprobación explícita antes de publicar o mezclar.

### ESTADO DE ENTREGA
PASS 02-J = publicado y automatizado GREEN; S23 físico = PENDIENTE; Monster & Loot integrados persistentemente a V4 = PENDIENTE. Este PASS 02-K crea únicamente el contrato de QA/handoff: NO afirma que se midió en teléfono, NO ejecuta código ni publica versiones nuevas.
