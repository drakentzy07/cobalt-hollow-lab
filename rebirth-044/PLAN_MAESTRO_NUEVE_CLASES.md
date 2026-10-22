# HIGHFLY REBIRTH — 0.44 FIRST, 0.45 SELECTIVELY
**22 Octubre 2026 — NUEVA DECISIÓN, sustituye GENESIS 0.45 G1/G2**

## Regla innegociable
HIGHFLY **tiene las nueve clases nativas jugables de World of ClaudeCraft**:
Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid.
**Todas sus habilidades originales, 27 especializaciones, talentos,
requisitos, efectos, animaciones, costes, restricciones de equipamiento,
ataques y recursos se conservan**. No hay un único Universal Hunter de
compatibilidad ni escuelas sin clases que anulen las originales.

### Criterio técnico de verdad para las 9 clases
- Usar el sistema fuente \`src/sim/types.ts\` (\`ALL_CLASSES\`, \`MAX_LEVEL=20\`)
  y \`src/sim/content/classes.ts\` (\`CLASSES\`, habilidades conocidas).
- Probar nueve creaciones independientes; cada una debe mostrar su clase,
  repertorio original, recursos, talentos, 3 specs y equipamientos adecuados.
- Entrenamiento real modifica únicamente bonificaciones HIGHFLY y **nunca**
  reemplaza \`abilitiesKnownAt\`, listas de skills nativas ni especializaciones.
- Cualquier bonificación debe respetar el server-authoritative model cuando
  se active modo cooperativo, y no sumar dos veces durante \`recalcPlayerStats\`.

## Bases seleccionadas, sin copiar códigos invasivos
1. **Motor de referencia**: \`levy-street/world-of-claudecraft@v0.44.7\`,
   estable. Sus NPC, misiones, clases, profesiones, zonas y sistemas intactos.
2. **Patrones HIGHFLY ya probados**:
   - \`highfly-origin-f263-collision-gesture-save-polish-20261020\`:
     Training Core modular (incluido \`training/ui.ts\`), bridge de estadísticas,
     motor de movimiento/aiming, pruebas móviles. **Solo rescatar mecanismos;
     NO clase única, universal equipment ni overlays 99**.
   - \`highfly-origin-f123-hunter-reset-hud-20261019\`:
     flujo de ingreso y menús móvil como referencia; NO el Hunter universal.
   - \`highfly-origin-android-p3-clean-hud-four-base\`:
     referencias HUD móvil sin trasladar su antigua configuración de clases.
3. **ClaudeCraft 0.45**: proveedor de *mejoras auditadas concretas*, no
   base de runtime: ciudades mejoradas, contenidos e interiores, colocación,
   herramientas de terreno y assets en grupos pequeños. 
4. **Editor 0.44**: ya incluye \`editor.html\`, \`src/editor/custom_map.ts\`,
   \`src/sim/map_doc.ts\` y catálogo de modelos. NO obligarnos a llevar
   todo el Studio 0.45; migrar features con schemas y validaciones.

## Gran bloque 1: HIGHFLY REBIRTH — 9 clases + training + combate + creador + menú
**Una sola entrega de usuario**, no ensayos de cada botón:
- Entrada HIGHFLY propia, offline aislado, selector de NUEVE clases,
  nombre editable normal sin espejo, apariencia y guardado de prueba
  separado de Draken real.
- Training Core real de STR, AGI, VIT, PER e INT integrado EN EL MENÚ
  existente, no botón flotante. Perfiles y puntuaciones por personaje.
- Cámara libre S23; movimiento 360°, dash y doble salto; ataques fluidos
  respetando el sistema nativo de cada clase y sus técnicas. Sin cambiar
  globalmente el autoataque ni recursos nativos.
- HUD unificado, vida/maná/estamina según clase, panel móvil claro y
  rendimiento aceptable, sin barros de texto superpuestos.
- Primer juego hasta LV20, mapas/NPC/loot/monstruos/profesiones intactos.
- Asset manifests completos; **nunca eliminar GLBs invocados por mapas
  activos** para caber en Pages. En lugar de romper visuales, reducir
  zona de preview, separar packs o cambiar hosting solo si es necesario.
- Validación automatizada y jugada en S23; GREEN CI por sí solo no es
  garantía de interfaz, menú, escena ni de rendimiento.

## Gran bloque 2: WORLD / LIVING WORLD
Mejorar una ciudad existente y crear una región HIGHFLY conectada,
preservando NPC/quests/roads/respawns y mapas originales. Importar solo
herramientas/modelos concretos 0.45 probados, y conectarlas a mundo
autoritativo futuro. Una zona mística con cascada/laguna/cueva vendrá
cuando terrain/collision tenga funcionamiento demostrado en Android.

## Gran bloque 3: HIGHFLY EVOLUTION
Conservar todas las técnicas nativas de cada una de las nueve clases;
agregar una técnica distintiva propia por clase, nuevas variantes de
monstruos y loot integrado/crafteos/boss a nivel 20. Expansión 21–99+
suspendida hasta calidad del contenido inicial.

## Gran bloque 4: ONE WORLD / MULTIPLAYER
App única, mundo real + lab aislado, compartir mundo 3-5 jugadores
mediante simulación del servidor, validación de Training Core y
progresión y regiones HIGHFLY sin confiar en solo datos del browser.

## Retiro del experimento fallido GENESIS 0.45
- G1/G2 PR #45 y #46 cerrados sin merge.
- Se restaura el Pages de antes de G2 mediante el artefacto certificado
  del RUN 39785774710. El run de restauración es 39829882419.
- G1/G2 artefactos grandes de CI removidos **solo después** de
  restaurar y verificar Pages, sin tocar copias de Draken.
- El workflow de G2 Pages se retira de main. No promocionar G1/G2.

## Criterio de aceptación para la primera publicación REBIRTH
1. Las 9 clases + 27 specs completas visibles y funcionales.
2. Skills 100% nativas operativas con equipo/recursos correspondientes.
3. Creador móvil correcto; Training Core DENTRO de menú y guardado aislado.
4. Combate y movimiento satisfacen pruebas en S23 Ultra.
5. No error "missing file or bad GLB" de contenido activo.
6. Offline móvil sin cuenta de ClaudeCraft; no toques de Draken guardado.
7. Preview solo después de build, pruebas UI y lista exacta de assets usados.
