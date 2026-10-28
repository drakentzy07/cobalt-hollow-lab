# HIGHFLY ORIGIN v0.20 — integración ART253, rama segura creada

## Situación verificada (28/10/2026)
- Punto de partida: **FURY P4A** commit `6539dfd0669224095ac6c98c3b7e02ab0a1254b1` (P4A fue GREEN en run [40766979754](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40766979754)).
- Rama de recepción: `highfly-origin-v020-art253-integration-20261028`, creada **desde ese commit**, nunca desde `main` ni una base antigua.
- ZIP recibido y auditado en conversación: `HIGHFLY_253_KIT_INTEGRACION_V020(1).zip`, SHA-256 `633af1bf4e248bbe35cc4741740aa367f6991d1fe4ce1bb3bca0778c756755cc`.
- Conteo: **253 archivos WebP, 152 habilidades + 101 inventario**, todos decodifican a **128×128 RGB**, SHA-256 individual conforme a `MANIFIESTO_253.json`, ninguna ruta ni ID duplicado.
- Nombres y rutas coinciden con el catálogo original de 253 rutas de v0.20.0.
- Los 253 hashes son únicos, pero **eso no certifica unicidad visual ni titularidad**. Es requerida una revisión gráfica y comercial.
- El manifiesto menciona `masters_png_512`, pero dichos maestros **NO están incluidos** en el ZIP. No impide usar los WebP.

## Traspaso de los binarios a GitHub
**Esta rama contiene el checkpoint y este documento; NO se considera integrados los 253 binarios hasta recibir el commit de arte de la máquina que tenga el ZIP.**

Motivo: los conectores GitHub de esta sesión permiten crear commits de texto y blobs proporcionados como contenido, pero no exponen automáticamente los bytes de un archivo del entorno local para subirlos como blob. No declarar integración o GREEN por un commit de documentación.

Usar el paquete de instalación ART253 revisado que acompaña esta auditoría. Su script usa esta rama existente y no pisa el P4A. El conjunto de 253 archivos se debe subir bajo `origins/v020/art/overlay/public/ui/` y el workflow bajo `.github/workflows/highfly-origin-v020-art253.yml`. No reemplazar `mapping.json` ni los scripts P2/P3/FURY.

## Puertas obligatorias
1. En el commit de binarios: `node origins/v020/art/apply_validate.mjs --check-overlay`. Hash exacto de cada WebP y 253 archivos sin extra.
2. En CI: checkout upstream `4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25`, parches offline P2, mundo/HUD P3, FURY P4A, y **después** overlay ART253.
3. Ejecutar `npm run check:ts`, tests del Sim, mundo, movilidad y controles; `npm run build`.
4. Verificar `node origins/v020/art/apply_validate.mjs --verify-dist upstream/dist` para garantizar que los WebP finales son exactamente los nuevos, no CraftPix.
5. Pese a GREEN, **NO PUBLICAR Pages/APK**: otros modelos, fondos, audios, UI y marcas aún no han sido aprobados comercialmente.

## Continuación de ingeniería
La próxima línea es P4B (dash direccional + segundo salto/mortal), preservando esta rama de arte y P4A. **Nunca se reinstala ClaudeCraft completo en la rama de HIGHFLY**; CI puede obtener temporalmente su fuente exacta con los overlays propios.
