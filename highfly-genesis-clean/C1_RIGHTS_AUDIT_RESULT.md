# HIGHFLY WORLD — C1: auditoría de medios original v0.44.7

Fecha: 2026-10-24. Rama: `highfly-genesis-clean-0447`.

## Resultado confirmado

- GitHub Actions: [RUN 40131967033](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40131967033) — etapa `media-rights` SUCCESS.
- SHA upstream: `493c35a108cef6c8aa290e8793107b1cd117886e`.
- **0 archivos eliminados. 0 archivos sustituidos. 0 páginas publicadas.**
- El informe completo archivo por archivo está en el artefacto del RUN: `highfly-clean-c1-file-by-file-rights-audit`.
- Registro `CREDITS.md`: **69 filas de medios «No, permission required» + 1 fila explicativa de la tabla**. El cómputo antiguo de «70 recursos prohibidos» sumaba esa fila explicativa y no expresaba archivos.

## Clasificación preliminar automática (6.402 ficheros de medios)

| Estado | Cantidad | Qué significa |
|---|---:|---|
| RESTRICTED | 2.720 | Coinciden con grupos de medios cuyo permiso de redistribución está restringido. Revisar los que vienen de grupos o colecciones antes de sustituir. |
| FORK_ONLY | 63 | Coinciden con ejemplos explícitos licenciados para uso dentro de World of ClaudeCraft o sus forks. |
| YES | 10 | Coinciden con una muestra de recursos de kits libres y modelos originales, como armas KayKit. Esto NO es el recuento de todos los libres. |
| NEEDS_REVIEW | 3.609 | No se pudo atribuir un permiso específico automáticamente. **NO significa restringido; NO se borra ni sustituye**. |

La cantidad de archivos clasificados como `NEEDS_REVIEW` es la razón para **no publicar todavía** un build comercialmente usable ni repetir el borrado masivo de G2–G6.

## Recursos restringidos identificados en CREDITS que requerirán sustituciones concretas

- Íconos de habilidades incluidos en packs CraftPix Premium (derechos de la licencia original no transferidos); ilustraciones generadas para el propio World of ClaudeCraft que constan como reservadas.
- Ciertas imágenes de objetos e inventario: usar los IDs de `public/ui/items/mapping.json`, no sustituir `public/ui/items/**` a ciegas.
- Modelos y renders de sets Claudium/Season 1 Armory; no sustituir las espadas, hachas ni escudos KayKit originales.
- Dos accesorios del Harbormaster (`harbormaster_tricorne.glb`, `harbormaster_spyglass.glb`) que **deben seguir siendo archivos GLB válidos si el motor los precarga**.
- Casos expresamente identificados: `models/props/reeds.glb`, `eastbrook_ferry.glb`, `harbor_route_marker.glb`, `wyrmwatch_harbor.glb`, `wickharbor_wharf.glb`, `wickharbor_harbor.glb`.
- Cuatro monturas excepcionales: `terrorspark_groundshaker.glb`, `goblin_rocket_sled.glb`, `lanternback_troll.glb`, `chimeglass_tortoise.glb`.
- Mapa global `public/map_art/world_overview.webp` reservado, **pero no los mapas regionales .png**, permitidos «With the project only».
- Voces de `audio/voice/ignivar`, `audio/voice/varkhul` y `audio/sfx/temporal_clock.mp3`, expresamente reservados.
- Recursos de promoción/web y marca Claudium reservados (no confundir con los props ni con el mundo jugable).

## Recursos permitidos que no deben alterarse sin una razón técnica demostrada

Personajes y animaciones KayKit; criaturas y estructuras Quaternius; recursos Kenney; materiales ambientales CC0; mapas regionales permitidos dentro del fork; ciertas bolsas e imágenes permitidas por sus créditos; pantallas de carga «With the project only». Cada caso se verifica por fuente original y licencia.

## Próximo control C1.1 (todavía NO ejecutado)

1. Resolver la procedencia de los 3.609 recursos que no clasificaron, empezando por modelos 3D y el HUD esencial. Una fuente sin clasificar no se asume libre ni se elimina.
2. Antes de cualquier sustitución, guardar la lista explícita `ruta | origen | permiso | sustituto | chequeo del motor`.
3. Reemplazar solo lo realmente necesario en **un paquete generado aparte**; jamás modificar los recursos de C0.
4. Comprobar compilación, renderizado de íconos, mapa, precarga GLB y funcionamiento original del mundo. La publicación pública requiere una etapa posterior explícita.

**Regla de HIGHFLY:** no quitar cosas «porque sí»; toda sustitución debe estar documentada por archivo y validada. Esta auditoría es técnica, no una autorización legal nueva.
