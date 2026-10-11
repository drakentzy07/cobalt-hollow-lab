# HIGHFLY V4-03 — P09 MONSTRUOS 6 · INTEGRACIÓN NATIVA DE ÉLITES Y CAPITANES

Fecha: 11 de octubre de 2026. **Estado documental previo a la sentencia final de P09 CI.**

## Historial comprobado

- P08 E2E completo **GREEN**: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38139928673 (SHA `cc877bba6005020621eea719eaa440994ccc81b1`).
- Contiene una muerte auténtica, loot de `rough_hide` recuperado por `Sim.lootCorpse`, consumo en la receta original `recipe_ironedge_longsword`, equipamiento real, elaboración de `highfly_fire_gem`, inlay, cuarto golpe elemental habilitado y serialización/reconstrucción. Los insumos que no provienen del monstruo, recetas, nivel y habilidad de profesiones son **precondiciones del TEST**, no provisión automática al jugador.
- Chrome móvil S23 **emulado** y paquete WebGL aislado en /cobalt-hollow-lab/v4-03-preview/ probados sin HTTP 404. NO es una URL pública ni una prueba en teléfono físico.
- El despliegue público Pages se realiza mediante `actions/deploy-pages` con reemplazo del **sitio entero**. **NO** publicar un subárbol sin reconstrucción y hash íntegro de todo el sitio público actual. `main` / Pages intactos.

## MONSTRUOS 6 · evidencia congelada y reusada

- `highfly-monsters-p02i-functional-freeze-green-20261010` @ `e6f59079fdc3f278ef041fbc8354ca837aee42ab`: 8 escenarios P02I, contenido/caza LV21–99, recompensas nativas, 16 élites/capitanes, biomas y ambientación del laboratorio.
- RUN P02M https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38095460400: matriz derivada de estadísticas/TTK/casos, laboratorio separado.
- RUN P02N https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38102239479: 1440 duelos `Sim.tick` headless, 80 plantillas × 9 clases × (nivel par/+5). **No** certifica victoria del jugador humano, rotaciones, parry o equipamiento progresivo definitivo.

## P09 NUEVO: capa optativa de desafíos en la MISMA app

Rama: `highfly-v4-03-p09-monster6-elites-native`. Código:
- `monsters/integration/highfly_p09_native_challenges.ts`
- `monsters/integration/activate_p09_challenges.py`
- `monsters/integration/highfly_p09_native_challenges.test.ts`
- `monsters/integration/activate_p09_mobile_smoke.py`
- `.github/workflows/highfly-v4-03-p09-monster6-elites-native.yml`

`VITE_HIGHFLY_NATIVE_HUNT=1` permite P06–P08. La bandera independiente `VITE_HIGHFLY_CHALLENGE_ENCOUNTERS=1` reemplaza, POR MAZMORRA, solo el spawn 6 por un élite y el spawn 8 por un capitán local. Conserva 6 de las ocho apariciones normales, por lo que el presupuesto **sigue en ocho mobs por instancia**, cero mundo abierto adicional. Cada familia normal conserva al menos un spawn, todas las coordenadas y el acceso original. Se reutilizan **exactamente los 16 MobTemplate P02I**, IA, XP, drops, cadáveres, `Sim` y `Hunter` existentes. Los cinco legendarios especiales NO entran aquí.

Con la bandera en `0`, P08 sigue intacto. No hay nuevo `Sim`, economía paralela, premio legendario, `setPlayerLevel` en código de producción, segundo Hunter ni migración de saves. El RUN P09 debe validar compilación, prototipos nativos, nueve clases, entrada/salida, examen de poblaciones y navegador antes de declarar GREEN.

## Lo que NO conviene duplicar

No rehacer las 80 plantillas de MONSTRUOS 6, los ocho mapas de laboratorio P02I, las 16 variantes normales especiales del laboratorio, entrenamiento, 9 clases, profesiones, gemas ni el botín de ClaudeCraft. `highfly_hunt_render_palette.ts` y `highfly_hunt_scenery.ts` son del **mundo de prueba**: no prueba que los ocho territorios persistentes de V4 tengan ya arte nuevo definitivo.

## Salida futura (sin fingir certificaciones)

1. Reproducir en V4-03 la matriz de duelos, equipamiento LV21–99 y entrenamiento legítimo, con rotaciones, parry, esquiva y derrotas/balance verificable.
2. Recorrer físicamente 8 regiones / 16 camps / 8 portales y comprobar colisiones, pendiente, agua, pathfinding y dificultad.
3. Medir FPS, p95, carga inicial y estabilidad en S23 Ultra **físico**, no emulador.
4. Definir integración visual localizada de los ocho biomas P02I con el terreno original, sin tocar rutas/dungeons existentes ni perjudicar FPS móvil.
5. Solo publicar una preview real de Pages después de poder reconstruir y comparar un manifest íntegro de la web actualmente publicada, o en un repositorio Pages independiente autorizado. Ni este workflow ni P08 tienen un job de deploy.
