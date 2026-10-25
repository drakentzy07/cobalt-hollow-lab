# HIGHFLY REBORN — Sustitutos verificados sin compra

**Todos los siguientes enlaces son del autor/editor original y señalan licencia CC0.**
El inventario de archivos de ClaudeCraft v0.44.7 tiene prioridad: no descargar
un pack que ya esté integrado/licenciado salvo que falten modelos concretos.

| Necesidad | Pack | Fuente de origen | Licencia | Uso propuesto |
|---|---|---|---|---|
| Hunter, espada, escudo, hacha, báculo y clips | KayKit Character Pack: Adventurers | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 | CC0 | Conservar esqueleto y animaciones, reemplazar armas comerciales sin romper slots |
| Árboles, arbustos, flores, rocas | Quaternius Stylized Nature MegaKit | https://quaternius.com/packs/stylizednaturemegakit.html | CC0 | Recuperar vegetación original; reemplazar solo modelos sin permiso confirmado |
| Barcos, botes, velas | Kenney Watercraft Kit | https://kenney.nl/assets/watercraft-kit | CC0 | Sustitutos de ferry/embarcaciones reservadas; necesitan colocación y colisiones |
| Puerto, muelle, embarcación, accesorios | Kenney Pirate Kit | https://kenney.nl/assets/pirate-kit | CC0 | Sustitutos portuarios; conservar orientación/escala/colisión |
| Equipamiento y props medievales | KayKit Dungeon Remastered, Quaternius Fantasy Props MegaKit | URLs y licencia registradas en upstream CREDITS.md | CC0 | Reutilizar los elementos integrados y acreditados |

## Pendientes concretos
- **Campana del tutorial:** identificar ruta de escena y GLB, contrastar licencia antes de tocar. Que sea una campana no la vuelve restringida.
- **Armadura blanca:** probar materiales del GLB CC0 y atlas/vertex colors con rutas de red correctas; no sustituir la geometría por defecto.
- **Cuadro de entrada:** localizar la referencia exacta al antiguo placeholder y reemplazar interfaz con componentes HIGHFLY propios, no una imagen rectangular.
- **Iconos de habilidades:** retirar los CraftPix y los dibujos privados del build distribuible; nuevas ilustraciones originales HIGHFLY después. Las mecánicas se mantienen mientras se desarrollan las propias.
- **Iconos de inventario/pericias:** revisar `public/ui/items/mapping.json` y demás manifest por identificador; sustituir exclusivamente entradas no redistribuibles.
- **Audio CC BY-NC/privado:** identificar cada pista y usar audio CC0 verificado; no remapear todas las voces a un sonido genérico sin validación del gameplay.

### Condición de salida
Todo reemplazo necesita un registro:
`ruta lógica original | licencia | componente afectado | sustituto | licencia del sustituto | hash | prueba S23`.
**No hacer distribución pública desde este documento:** falta validar todos los assets
que aparecen en el mundo de prueba.
