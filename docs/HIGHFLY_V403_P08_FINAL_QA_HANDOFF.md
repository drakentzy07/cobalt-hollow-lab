# HIGHFLY V4-03 — P08 Final Integration QA Handoff (CI GREEN / RELEASE PENDING)

**Fecha:** 2026-10-11  
**Rama de integración:** `highfly-v4-03-p08-final-integration-qa`  
**Commit de código y workflow P08 probado:** `e44f647c7219fc78bde4399a21d45f87cce7838a`  
**RUN GREEN:** https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38134956467  
**Origen P07:** `highfly-v4-03-p07-open-world-monster-habitats` @ `76d900e1bd810ec07a8b4b834f346cb803fadf51`  
**P07 código previamente GREEN:** `27982cd5dfdc11efdcc984383cff33c77aee69f8`.

## Entregado en P08 (sin cambiar la versión pública)

1. `monsters/integration/highfly_p08_world_class_save.test.ts`: 72 combinaciones (9 clases × 8 expediciones nativas) sobre `Sim` real: nivel inicial 1, nivel requerido **fijado sólo como fixture de QA**, instancia nativa con 8 mobs, salida original, serialización JSON, reconstrucción y conservación de nivel, XP, cobre, inventario, equipamiento y progreso de gathering; prueba complementaria de existencia y terreno finito para 8 portales / 16 camps / 32 mobs de arranque.
2. `monsters/integration/highfly_p08_optout.test.ts`: dos flags experimentales en `0` deben dejar mundo, regiones, camps y dungeons originales sin expansiones HF.
3. `.github/workflows/highfly-v4-03-p08-final-integration-qa.yml`: reutiliza las mismas capas congeladas de ClaudeCraft/CLEAN/PR19/P01–P07 y ejecuta los tests citados, regresiones originales, build WebGL y smoke de Chrome Android **emulado**. No hace deploy.
4. RUN `38134956467`: trabajo terminado en **SUCCESS**, 57 pasos completados / 0 fallidos, incluidos TypeScript, profesiones/gemas, Hunter, native kill+XP+copper+corpse, portales, habitats, 72 clases/bandas, optout, compilación y Chrome móvil emulado.

### Artefactos GitHub Actions del RUN

- `HIGHFLY-V403-P08-PR19-EIGHT-NATIVE-HUNTS-WEBGL-NO-DEPLOY` (artifact `11700712703`; ZIP de ~719 MB). Contiene candidato WebGL bajo `cobalt-hollow-lab/`, preparado para hosting en la base `/cobalt-hollow-lab/`.
- `HIGHFLY-V403-P08-S23-REAL-NATIVE-HUNTS-EVIDENCE` (artifact `11700049256`; ~6.9 MB): captura y reporte smoke Chrome 844×390 con UA/touch de Samsung emulado, **no físico**.
- `HIGHFLY-V403-P04-8-HUNT-GATES-NATIVE-QA-NO-DEPLOY` (artifact `11700992202`): overlay de tests/código.

**Importante:** una descarga ZIP no es URL jugable. No se publicó a Pages. `main`, V4-02, Monster Lab, Skin Lab y donor congelado se mantienen fuera del workflow.

## Confirmado por CI, no sobreinterpretar

- La app conserva el `Sim` original y la identidad del Hunter al entrar/salir y recargar según las pruebas.
- Los ocho portales y campamentos usan zonas de ClaudeCraft preexistentes; las geometrías interiores son prototipos `crypt/sanctum/temple`. No se certifican ocho nuevos mapas visuales.
- Las 72 combinaciones son pruebas de instancia/guardado, **NO 72 combates completos ni 72 progresiones naturales desde nivel 1**.
- La prueba P03 valida una muerte auténtica con XP/cobre/cadáver e inventario nativos. Las pruebas V4-02 validan fabricación de gemas Fuego/Hielo/Rayo y guardado. **No existe aún en P08 una sola prueba integral consecutiva monstruo LV21–99 → material realmente caído → receta consumidora → arma fabricada/equipada → gema → pelea → relog**; no declararla aprobada.
- El smoke usa Chromium con emulación Android/S23U, no el teléfono real. No certifica FPS físico, p95, temperatura, frame pacing ni navegación manual del terreno.

## Bloqueantes de salida que SIGUEN ABIERTOS

1. **Una URL jugable de revisión aislada y protegida:** requiere publicar la build sin reemplazar la versión V4-02 ni alterar otros directorios; antes de publicar, verificar hashes/manifest del contenido público. **Si no se puede probar preservación, NO DEPLOY**.
2. **QA de recorrido físico:** andar hacia los ocho accesos y los dieciséis campamentos, comprobar desniveles/colisiones, navegación, ataque y retorno.
3. **Profesiones/loot consecutivos:** hacer E2E auténtico de drops LV21–99, receta concreta existente, resultado equipado y persistencia; distinguir prerequisitos sembrados como fixtures.
4. **Balance reproducible 1–99:** combate completo con 9 clases, equipo legítimo, entrenamiento aplicado, skills, parry/dash/dodge y consumibles; un jugador diestro debe poder superar diferencias razonables de nivel. Simulaciones cortas o gating no lo demuestran.
5. **Samsung S23 Ultra físico:** FPS/p95, streaming, latencia táctil, memoria, recarga y carga inicial. No hay métricas físicas disponibles.
6. **Validación natural de progresión LV1→99:** probar XP/quests/mats/equipo de todos los rangos sin saltos de nivel de QA.

## Rollback confiable

- **P07** `76d900e1bd810ec07a8b4b834f346cb803fadf51` (documentación; gameplay previamente GREEN `27982cd5dfdc11efdcc984383cff33c77aee69f8`).
- **Optout:** `VITE_HIGHFLY_NATIVE_HUNT=0`, `VITE_HIGHFLY_OPEN_WORLD_HUNTS=0`, volver al mundo original sin borrar personajes/guardados. Esta ruta pasó test CI P08.
- Nunca hacer merge a main ni reemplazar Pages hasta superar las puertas restantes.

## Lista de aceptación física S23 Ultra (una vez que exista URL verificada)

1. Abrir la URL de revisión en Chrome, horizontal; entrar offline con Warrior LV1, validar personaje modular, HUD, joystick 360, cámara, skills/ATK123, training y persistencia.
2. Abrir `Más → Cacerías` en LV1 y comprobar el bloqueo; seguir progresión **normal** (sin niveles de prueba en la build pública).
3. Verificar portales y campamentos de cada zona al nivel correspondiente; ataque, daño, respawn y salida original. Grabar cualquier bloqueo del terreno y posición X,Z.
4. Hacer kill → cadáver → recoger material → inventario → forja/receta → arma → gema → ATK4 → salir/reingresar.
5. Reportar modelo exacto y navegador, video/captura del síntoma, clase/level/equipo, nombre de región, coords X,Z y si hubo pérdida de FPS/tirones.

**Estado final:** `P08 CI GREEN`; `V4-03 RELEASE / PAGES PREVIEW / S23 PHYSICAL / 1–99 BALANCE = PENDIENTES`. Sin falsas certificaciones.
