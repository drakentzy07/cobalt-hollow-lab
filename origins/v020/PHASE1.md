# HIGHFLY ORIGIN 0.20 — Fase 1: Comercialización responsable y RPG intacto

La fuente de juego se mantiene en **v0.20.0** fijada por commit. No se actualiza upstream ni se copian módulos de v0.44.x todavía.

## Qué comprobamos aquí
1. Pasan el chequeo del compilador y pruebas unitarias originales de simulación, progresión, mazmorras, portales, misiones, editor y móvil.
2. Se genera un inventario de **todos** los archivos de `public/`: SHA256, bytes, riesgo, posible presencia en `dist/`.
3. `CREDITS.md` y diez manifiestos de íconos (9 clases + inventario) se comprueban por presencia/declaran CraftPix.
4. Cualquier recurso no acreditado individualmente permanece NO APROBADO para distribución. La categoría `CC0_CANDIDATE_UNVERIFIED` identifica una hipótesis, no una autorización.

## Riesgos concretos confirmados en el upstream
- La propia `public/ui/items/mapping.json` declara licencia CraftPix comprada por Levy Street: sus íconos son tan restringidos como `public/ui/skills/*/*.webp`.
- Los panoramas `public/env/*_backdrop*.webp` son arte del proyecto, no CC0.
- Algunos monstruos de `public/models/creatures` son creación Meshy bajo licencia propiedad del proyecto.
- `THIRD_PARTY_NOTICES.md` documenta términos específicos de Reown y WalletConnect; no se supone que todo sea MIT.
- Sonidos, íconos de armas, branding y otros binarios necesitan trazabilidad archivo a archivo.

## No tocar
- Las 3 zonas originales, 5 mazmorras, NPC, monstruos, misiones, IA, inventario, estadísticas y editor 3D.
- No publicar en Pages el `dist/` original: Vite incluye recursos restringidos desde `public/`.
- No inventar sustituciones gráficas genéricas que degraden un juego antes de validar una biblioteca visual autorizada.

## Próximos trabajos después de completar este run
**P1B**: sustituciones uno-a-uno de imágenes de skills y objetos y selección de sonidos/modelos CC0 o propios; conservar IDs exactos y referencias.
**P1C**: capa de construcción `clean` que *excluya* todos los no aprobados y bloquee publicación si quedan fugas de derechos. Validar ausencia en binarios.
**P2**: mundo autónomo de producción, guardado verificado y controles Android horizontal; smoke real en teléfono antes de Pages.
**P3**: FURY 360°, Hunter universal y stats entrenables, en integraciones separadas.

El estado de GitHub Actions **verde** significa únicamente *auditoría técnica y regresión aprobadas*. No certifica el juego para comercialización.
