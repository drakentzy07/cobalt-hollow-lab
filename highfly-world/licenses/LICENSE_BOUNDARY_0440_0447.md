# HIGHFLY GENESIS — límites de licencias y restauración G6

Auditoría: 2026-10-24. Fuente vinculante: [ClaudeCraft v0.44.7 CREDITS.md](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md).

**Comparación de origen:** en \`v0.44.0\` y \`v0.44.7\` aparecen exactamente las mismas **70 filas** con columna \`No, permission required\`. Una fila puede abarcar miles de archivos (íconos, por ejemplo). La etiqueta de versión no añadió nuevas restricciones en esas filas. El MIT cubre el código, **no automáticamente las imágenes, modelos o audio**.

## Permitidos para HIGHFLY dentro del fork: conservar originales

- **CC0 / dominio público:** modelos y animaciones KayKit (incluido \`Rig_Medium\`), armas/escudos KayKit, esqueletos KayKit, criaturas y pueblos Quaternius, mundo/props Kenney, biomas ambientCG/Poly Haven. Conservar los bytes originales.
- **Con atribución:** recursos con \`Yes, attribution required\`, mantener créditos.
- **With the project only:** geometría de mundo generada por World of ClaudeCraft, retratos de monstruos, pantallas de carga, \`public/map_art/*.png\` de zonas, audio/terrenos que su CREDITS identifica así. Se pueden distribuir **dentro de World of ClaudeCraft o un fork**; NO como pack independiente. Mantener créditos.
- **Sin inferir derechos de archivos no registrados:** si un recurso aparece sin clasificación inequívoca, queda con **licencia pendiente de verificar**; su presencia en GitHub no es permiso automático de redistribución.

## No redistribuibles sin permiso/licencia propia (sustituir exactamente esos recursos)

| Grupo | Archivos o ejemplos | Motivo en CREDITS |
|---|---|---|
| Artes de habilidades | \`public/ui/skills/<class>/*.webp\`, incluyendo CraftPix y pinturas propias reservadas | CraftPix premium no transferible o derechos del proyecto |
| Pinturas de inventario | \`public/ui/items/*.webp\` de lotes \`generatedBatches\`, profesiones y pinturas de armas; **excepción explícita:** seis bolsas "With the project only" | Arte propio reservado, de terceros o comisionado |
| HUD y progreso | \`ui/chrome\`, \`ui/deeds\`, \`ui/auras\`, \`ui/map-markers\`, ciertas \`ui/specs\`, \`ui/crests\`, \`ui/fiesta\`, \`ui/delve-affixes\`, \`ui/currency\`, imágenes de profesiones | Reservados en el registro |
| Rangos/tabla | \`ui/ranks/elite-dragon-frame.webp\`, \`ui/leaderboard/medal_*.webp\` | Reservados |
| Arte comercial/promocional | \`ui/store/armory/**\`, \`ui/store/season-01-armory-promo.webp\`, modelos/renders de Season 1 y prototipos Claudium; \`public/claudium\` | Derechos de ClaudeCraft; no confundir con todo \`ui/store\` |
| Armas 3D reservadas | \`models/weapons/{purple_*,redskull_*,emberfang_sword,tome_*,guildmark_*,...}.glb\` y variantes comerciales identificadas | Claudium / Season 1 / tomos exclusivos |
| Props del mundo | \`models/props/reeds.glb\` (Tripo), \`eastbrook_ferry.glb\`, \`harbor_route_marker.glb\`, \`wyrmwatch_harbor.glb\`, \`wickharbor_*.glb\` | Derechos reservados específicos, **no todos los props** |
| Accesorios de Harbormaster | \`models/chars/npc_gear/harbormaster_{tricorne,spyglass}.glb\` | Dos modelos originales reservados; deben seguir presentes con GLB neutral |
| Monturas específicas | \`terrorspark_groundshaker\`, \`goblin_rocket_sled\`, \`lanternback_troll\`, \`chimeglass_tortoise\` | Derechos reservados, **no todas las monturas** |
| Arte del mapa global | \`map_art/world_overview.webp\` | Reservado. **No reemplazar** los siete mapas regionales \`map_art/*.png\` marcados "With the project only" |
| Arte de la web | \`public/website-*\` restringidos, marcas originales y recursos de promoción reservados | Reservados |
| Voces/efecto | \`audio/voice/ignivar/**\`, \`audio/voice/varkhul/**\`, \`audio/sfx/temporal_clock.mp3\` | Derechos reservados/permiso limitado |
| Música CC BY-NC | Efectos específicos @jamiecypher | No usar comercialmente sin autorización |

**Sustituir NO significa borrar.** Para cada archivo restringido que el código original todavía solicita, conservar nombre/ruta con un reemplazo legal de su mismo formato (GLB parseable, imagen válida o sonido válido), o cambiar deliberadamente todas las referencias del motor y probar esa modificación. No fusionar assets originales restringidos al sitio público.

## Comprobaciones automáticas G6

1. Extraer upstream exacto \`v0.44.7\` desde cero y aplicar solo patches HIGHFLY.
2. Comparar por SHA256 recursos libre/fork-autorizados seleccionados, incluyendo Hunter modular, armas KayKit, NPCs/mobs, \`map_art/eastbrook_vale.png\` y \`ui/weapons/axe_a.jpg\`.
3. Comparar exhaustivamente \`git diff public/\` contra \`public/highfly-license-audit.json\`. Falla si se altera cualquier archivo no declarado. No se borran archivos.
4. Regenerar el manifiesto de hashes **tras** las sustituciones, antes de compilar.
5. Cargar los GLB neutros con el Three.js \`GLTFLoader\` real; verificar 1.838 rutas medias y sus hashes en el build.
6. En el publicador desde \`main\`, verificar por HTTP los archivos GLB obligatorios.

## Problemas pendientes *no atribuibles a licencias*

El Hunter todavía utiliza un adaptador interno \`warrior\`; el laboratorio no aísla completamente progresión/guardados; la barra táctil MOBA definitiva y la selección/apuntado de cuatro skills no están finalizados; los NPC/dummies/ubicación inicial no están configurados específicamente para HIGHFLY; quedan etiquetas de ClaudeCraft. **Restaurar recursos no corrige estas funciones por sí solo**. Se deben probar por separado en Android.

Esta guía no es una autorización legal adicional: para cualquier activo fuera de los casos documentados, revisar origen y términos exactos antes de redistribuir.
