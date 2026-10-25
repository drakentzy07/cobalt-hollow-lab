# HIGHFLY REBORN — Registro de licencias y reemplazos (v0.44.7)

**Fuente de autoridad:** `levy-street/world-of-claudecraft/CREDITS.md` del commit
`493c35a108cef6c8aa290e8793107b1cd117886e`.
El `LICENSE` MIT se aplica al **código**, NO universalmente a la multimedia.

| Familia | Estado para distribuir HIGHFLY | Tratamiento propuesto |
|---|---|---|
| Modelos y animaciones KayKit, armas básicas | CC0 / Sí | **Conservar intactos**; Hunter rig compatible, comprobar piezas equipables |
| Naturaleza Quaternius (árboles, arbustos, rocas) | CC0 / Sí | **Conservar intacta**; un árbol blanco es un defecto técnico hasta demostrar lo contrario |
| Kenney, Poly Haven, ambientCG | CC0 o atribución indicada / Sí | Conservar con avisos y créditos requeridos |
| Props y criaturas originales “With the project only” | Permitidos dentro del fork | **Conservar en el juego**; nunca extraer a asset pack |
| Iconos de clases / habilidades CraftPix | NO, licencia comprada por Levy Street | Sustitutos HIGHFLY propios (primero iconos neutrales legibles, luego nuestros definitivos) |
| Iconos de habilidad originales/proporcionados al proyecto | NO, derechos reservados/permiso al titular | Sustitutos HIGHFLY propios; mantener solo lógica nativa de skill hasta diseñar la nueva |
| Libro de logros / profesiones / pinturas de ítems restringidas | Parte NO, mezcla con recursos autorizados | Inventario por archivo, conservar los permitidos; remplazar los identificados como NO |
| Season 1 Armory, Claudium y armas de prestigio | NO, derechos reservados | KayKit/Quaternius CC0 equivalente y remapeo sin perder slots, stats ni equipamiento |
| Props portuarios concretos reservados (ferry y muelles nombrados) | NO según CREDITS.md | Kenney Watercraft / Pirate Kit, Quaternius Pirate Kit (CC0), preservar colisiones y rutas |
| Grabación temporal_clock y voces originales protegidas | NO o pendiente según archivo | Sustituto CC0 con origen documentado; silencio solo en caso de fallo no como audio licenciado |
| @jamiecypher CC BY-NC | Solo no comercial con atribución | Preferir sustitutos CC0 para no bloquear el futuro comercial |
| Marcas/logos de servicios y World of ClaudeCraft | Branding ajeno | Interfaz propia HIGHFLY, sin reutilizar marcas ajenas como marca del juego |
| Campana del tutorial | **Pendiente identificar ruta** | No eliminar a ciegas; si viene de Kenney/KayKit/Quaternius CC0 se conserva; si modelo proyecto “With the project only” se conserva dentro del fork |
| Árboles blancos, armaduras sin material | **Fallo visual**, no inferir derechos | Auditar rutas, GLB/GLTF materiales, vertex colors, PBR/normal maps y CDN antes de editar |

## Criterios que evitan repetir el desastre
1. El inventario debe señalar **ruta exacta, titular, licencia, sustituto y estado**.
2. `Yes`, `Yes, attribution required`, `With the project only`: se mantienen.
3. `No, permission required`: no pasan a Pages; reemplazo original o permiso.
4. `Unlisted`: requiere investigación; NO se convierte automáticamente en libre.
5. No hay reemplazo masivo de `ui/items`, `models/props` o `textures` sin clasificar.
6. No alterar geometría/materiales de CC0 para corregir iconos CraftPix.
7. Publicación bloqueada hasta pasar auditoría de piezas visibles en Android.

## Primeros donantes recomendados para reemplazo
- KayKit Character Pack Adventures / Skeletons (CC0): personaje, equipo, armas.
- Quaternius Stylized Nature MegaKit (CC0): árboles, rocas, vegetación.
- Kenney Pirate Kit y Watercraft Kit (CC0): accesorios de puerto, barcos y muelles.
- Quaternius Fantasy Props MegaKit / Medieval Village Pack (CC0): objetos generales y escenarios.
- Arte HIGHFLY propio: iconografía de habilidades, profesiones/objetos restringidos y emblemas.

**No presupuestar compras**; primero usar lo ya presente en v0.44.7 que esté acreditado
con licencia reutilizable. Cada recurso añadido externamente debe guardarse con su
licencia, URL de origen, hash y atribución necesaria.

## Pistas de implementación confirmadas
- G6/C2-04 aplicó `highfly-world/pages/sanitize_candidate.mjs`: sustituye varias
  carpetas de imágenes por cuadrados de 128×128. Esto no debe heredarse.
- C2-04 GOLDEN probó joystick y física de segundo salto; **dash y flips NO**.
- `highfly-origin-f263-collision-gesture-save-polish-20261020` incluye
  `HIGHFLY_EVADE_SPEED`, `highflyEvadeSeq`, `highflyFlipDir` y ramas de evasión
  en `src/sim/player_motion.ts`. Es donante, no base.
- FURY F5 incluye ocho módulos de intención/combate. No confirmar golpes si la API
  nativa devuelve `void`.

**Estado general**: inventario inicial de familias; TODAVÍA NO auditoría exhaustiva
archivo por archivo, ni visto bueno legal definitivo ni test real S23.
