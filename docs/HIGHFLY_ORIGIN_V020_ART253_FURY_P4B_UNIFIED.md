# HIGHFLY ORIGIN — Unificación ART253 + FURY P4B

**Rama receptora activa:** `highfly-origin-v020-art253-fury-p4b-unified-20261028`.
**Base segura:** FURY P4A `6539dfd0669224095ac6c98c3b7e02ab0a1254b1`, a través de ART253 `e5c293a217b77c384e99931e607fbdcd719e5b4e`.

## Plan único
Se entrega en la conversación el paquete `HIGHFLY_ORIGIN_ART253_FURY_P4B_UNIFICADO.zip` con:
- 253 WebP originales HIGHFLY (152 skills + 101 ítems) y manifiesto SHA-256.
- `origins/v020/mobility/fury_mobility.ts`: controlador P4B de dash 360°, energía/cooldown, segundo salto y aire.
- `origins/v020/mobility/patch_mobility.mjs`: aplica el P4B tras P2/P3/P4A, sin eliminar mundo, IA ni quests.
- `.github/workflows/highfly-origin-v020-unified.yml`: **un único run** en el primer push conjunto de arte, movilidad y workflow.
- `DOBLE_CLICK_UNIFICAR.bat`: automatiza en Windows la subida del kit completo a ESTA rama (no P4A/main).

## Verificaciones efectuadas antes de la subida
- 253/253 WebP válidos, nombres, rutas y hashes correctos.
- Controlador independiente: 3/3 tests locales verdes en Node.js 22.

## Pendientes honestos
- Los 253 binarios aún **NO están en GitHub**, dado que el archivo es un adjunto local del usuario.
- **NO hay todavía run unificado verde**. Al subir el ZIP desde Windows, el workflow corre TypeScript, Sim, pruebas originales P3/P4A, Chromium horizontal, build, verificación de 253 WebP en dist y detección de CraftPix originales.
- No se desarrolló todavía el mortal direccional animado; sí la lógica inicial de dash/segundo salto y control aéreo.
- No se publica Pages/APK porque otros medios de ClaudeCraft aún tienen licencias pendientes.
- Integrar contenido completo (la rama de origen sigue siendo ClaudeCraft v0.20.0, no una escena demo).

## Seguimiento
- Rama: https://github.com/drakentzy07/cobalt-hollow-lab/tree/highfly-origin-v020-art253-fury-p4b-unified-20261028
- Una sola Actions tras subida: https://github.com/drakentzy07/cobalt-hollow-lab/actions/workflows/highfly-origin-v020-unified.yml
