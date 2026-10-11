# HIGHFLY V4-03 — primera build combinada MONSTRUOS + GEMAS (AISLADA)

**Estado:** BUILD EXPERIMENTAL, NO publicar. Creada 2026-10-10 (AR).

## Fuentes conservadas
- Base V4-02 PR17: `highfly-v4-02-pr17-webgl-device-preview` (CLEAN V1, Training Core, PF6 LV1–99, profesión PR1–13, gemas fuego/hielo/rayo PR14–16, 9 clases).
- Monstruos fuente GREEN exacta: `e6f59079fdc3f278ef041fbc8354ca837aee42ab` (PASS02-I); 64 plantillas LV21–99 + 8 elites + 8 capitanes, 8 instancias de LAB.
- Inventario auditado P02L: 350 entradas de monstruos en total (270 originales + 80 HF) y 988 líneas de loot.
- Simulación P02M: 21.600 escenarios matemáticos, NO certificación de balance.
- Simulación P02N: control 306 combates native Sim GREEN; 1.440 combate completo **consultar RUN**, no asumir GREEN antes de conclusión.

## Lo que SÍ hace la build
- Compila un único bundle WebGL V4 con MONSTER-LAB opt-in (`?hfHunt=21`, `30`, `40`, `50`, `60`, `70`, `80`, `90`; opcional `&hfEncounter=elite` o `captain`).
- La ruta sin `hfHunt` usa el arranque normal V4, comprobado por test/regresiones.
- Playtest del Monster LAB sí incluye AI/HP/combat/loot nativo con 8 mobs simultáneos y terreno cromático.
- El modo opt-in aún usa el HuntPilot de laboratorio, con VIDA x3 y un Hunter nuevo. No debe permitir modificar guardado real de V4.
- El paquete se entrega como artifact de GitHub (ZIP de preview local/LAN), **NO** como Pages público.

## Lo que todavía NO contiene
- NO hay portal persistente ni cambio de WorldContent del Hunter único para cruzar mundos y regresar.
- XP, loot, equipo, profesiones y guardado NO están conectados al avatar persistente entre sesiones del LAB y V4.
- NO está activado el multiplicador de botín por enemigos LV+5 (política P02M solo auditada).
- NO están los cinco bosses especiales legendarios ni sus modelos nuevos, ni SKIN LAB en esta build.
- NO hay itemización garantizada de equipo LV21–99 calibrada con PF9, combos premium ni entrenamiento físico real simulado.
- Extended LV100+ sigue cerrado.
- El rendimiento físico S23 Ultra debe medirse con `hfPerf=1` o una prueba real del dispositivo, no inferirse del navegador CI.

## Validación requerida para promocionar a APP única
1. RUN de compilación V4-03 GREEN, TS completo, tests originales de gemas/profesiones/Training, loot nativo, 8 escenarios, Chrome Android emulado.
2. Contrato de entrada por portal con **UN SOLO Hunter**: misma identidad, nivel real, training wallet intacta; sin `setPlayerLevel`, sin `*3 HP`, sin `new Sim` adicional por entrar a un escenario.
3. Persistencia y retorno: bolsa real, receta consumible, XP y oro de una sola autoridad, acceso/cierre por nivel, revive/respawn, caída de red y almacenamiento, sin duplicación.
4. Balance P02N con gear real LV21–99 + combos 1-2-3 (+4 solo gema), dash, parry, consumibles y validación del riesgo/recompensa.
5. Análisis de P95/FPS físico Samsung S23 Ultra horizontal, misma HUD/cámara/joystick.
6. Recién al terminar esos controles promover una rama de integración real y ofrecer una preview aislada en otro origen/subruta. NO pisar Pages de V4 ni root.

## Links
- GitHub Actions V4-03: `https://github.com/drakentzy07/cobalt-hollow-lab/actions/workflows/highfly-v4-03-monsters-combined-preview.yml`
- Monster LAB disponible: `https://drakentzy07.github.io/cobalt-hollow-lab/monster-lab/hunts.html`
- RUN GREEN 306-duel: `https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38101731031`
- Último RUN P02N completo: `https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38100537075`
