# HIGHFLY ORIGIN — ClaudeCraft v0.20.0

**Estado: FASE 0 — BASE Y AUDITORÍA, NO COMERCIALIZABLE, NO DEMO APROBADA.**

## Base congelada
- Donante: [levy-street/world-of-claudecraft](https://github.com/levy-street/world-of-claudecraft/tree/v0.20.0)
- Tag: `v0.20.0`
- Commit etiquetado (objeto COMMIT, no objeto TAG): `4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25`
- Este laboratorio sigue siendo una capa fina: el código original se descarga durante CI, no se copia masivamente al repo HIGHFLY.
- Se mantiene intacto el upstream 0.44.x de otras ramas y las demos previas de HIGHFLY.

## Objetivo innegociable
Conservar **el RPG REAL de la versión 0.20.0**: terreno y tres zonas originales, NPC, monstruos, misiones, inventario/equipo/loot, habilidades, mazmorras y editor 3D. La README de la versión declara 5 mazmorras, aproximadamente 80 misiones y progresión 1–20. La primera integración no debe sustituirlos por un escenario de prueba vacío.

## Restricciones de uso comercial
MIT cubre el código; **no garantiza las licencias de arte, sonido, video, marcas ni modelos**. La versión 0.20.0 declara en `CREDITS.md`:
- Kits KayKit, Quaternius, Kenney, ambientCG, Poly Haven y algunos otros recursos CC0;
- mapas normales de agua de three.js MIT, con sus avisos;
- íconos de habilidades CraftPix comprados por el titular original: **no redistribuibles por HIGHFLY sin licencia propia**;
- fondos panorámicos específicos creados por el proyecto: **permisos pendientes**;
- modelos de enemigos creados con Meshy para el proyecto, incluidos Drowned Litany: **permisos pendientes**.

Los demás medios no identificados quedan en **REVISAR**, nunca `APROBADO` por defecto. Los íconos de inventario, audio, logos y UI deben auditarse archivo a archivo. El pipeline NO publica en Pages, no sube builds ni emite APK.

## Puertas de fase
1. **P0:** reproducir upstream exacto, ejecutar auditoría de presencia/licencias y build técnico sin distribución.
2. **P1:** sustituir o licenciar medios no aprobados; comprobar enlaces visuales y conservar geometría/IA/misiones/portales.
3. **P2:** validación en Galaxy S23 Ultra horizontal (fps, carga, HUD táctil, cámara, salto, guardado).
4. **P3:** FURY 360° en adaptador aislado, con compatibilidad de combate/simulación.
5. **P4:** Hunter universal y adquisición de skills sin clases visibles; pruebas de equipo y guardados.
6. **P5:** entrenamiento real → STR, AGI, VIT, PER, INT, conectado al cálculo de atributos sin alterar estadísticas base por equipamiento.
7. **P6:** expansión selectiva por módulo, con procedencia, compatibilidad y pruebas, desde 0.22+.

**Prohibido declarar GREEN, FULL o comercializable** por tener un workflow verde. El primer verde es exclusivamente prueba técnica de fuente, dependencias y build.

## Ejecución
CI: `.github/workflows/highfly-origin-v020-audit.yml`.
Script: `node origins/v020/audit.mjs upstream` (una vez descargada la versión oficial en la carpeta `upstream`).

No modifica repositorios originales ni despliega en Pages.
