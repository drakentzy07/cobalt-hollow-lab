# HIGHFLY PR-19 — Contrato de compatibilidad ClaudeCraft → HIGHFLY

## Jerarquía de autoridad

1. **ClaudeCraft original, congelado por SHA**: base del rig modular, mundo, UI nativa, inventario, profesiones, combat y crafting. Referencia auditada: `9b57e49c9676d75962700f828cc00a50a9a988b5`.
2. **Overlays HIGHFLY preexistentes**: training Core, nivel 1–99, HUD GOLDEN, economía original y gemas PR14–PR18. Se aplican en orden exacto por CI.
3. **PR-19 exclusivamente visual**: selector de oficio (hace `.click()` sobre botones nativos), detalles de oficio plegables, distribución de la guía GEM y diseño móvil. Sin nuevas acciones Sim ni tablas de datos.

## Regla de actualización REUSE FIRST

Si ClaudeCraft publica una versión superior, **NO** cambiar automáticamente el SHA congelado del juego público.

1. Auditar qué cambió en ClaudeCraft: rig/animación, interfaces, lógica de profesiones, Sim, recetas, HUD, CSS, assets y licencias.
2. En rama aislada, tomar exclusivamente las mejoras compatibles y registrar sus orígenes.
3. Reaplicar overlays en orden: ClaudeCraft → foundation HIGHFLY → profesiones/gemas → PR-19 presentación.
4. Exigir que cada script encuentre **exactamente** sus anclajes. Si cambia la API o el DOM, CI debe fallar en vez de aplicar un parche a ciegas.
5. Ejecutar TypeScript, tests Training Core, gemas/profesiones, GOLDEN joystick/cámara y navegador móvil S23 emulado.
6. Recién entonces abrir build Pages aislada, comprobar sha de la raíz pública y pedir evaluación visual del Samsung real antes de fusionar.

## Invariantes inviolables PR-19

- Sin modificación de `src/sim`, recetas, drops, stats, guardados, XP, nivel, combate o core de entrenamiento.
- El selector de oficios no crea acciones nuevas: invoca el botón del oficio que creó ClaudeCraft y mantiene sus eventos.
- La guía de gemas consulta la economía real, pero su presentación no otorga recursos, gemas ni niveles.
- En PC no cambiar estilos. En el móvil no mover las posiciones aprobadas del HUD ni alterar joystick/cámara.
- Evitar `@media` global o reglas visuales que afecten otras pantallas. Mantener PR-19 en su CSS con selectores acotados.
- PR-19 es **DRAFT y NO DEPLOY** hasta GREEN y evaluación en dispositivo; no fusionar ramas públicas por accidente.
