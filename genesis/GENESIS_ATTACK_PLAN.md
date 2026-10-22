# HIGHFLY GENESIS — GRAN PLAN DE INTEGRACIÓN (22 OCT 2026)

## Decisión congelada
- **Plataforma:** ClaudeCraft, nueve clases originales, sus 27 especializaciones, recursos, habilidades, equipo, profesiones, misiones, NPC, monstruos y mazmorras.
- **Nivel inicial:** mantener nivel máximo nativo 20. LV21–99+ reservado para otro ciclo de contenido; no mezclar con este bloque.
- **Diferencial HIGHFLY:** Training Core real (STR/AGI/VIT/PER/INT) y combate móvil 360, seguido de habilidades propias y Living World.
- **Mundo:** conservar ciudades y terreno original y expandir por regiones anexadas, no sustituir `BUILTIN_WORLD` con una isla aislada.
- **Online:** el mapa jugable por cliente no equivale al mundo del servidor; diseño futuro exige integrar regiones al Sim autoritativo.
- **Seguridad:** jamás modificar branch main, Pages, saves originales o repositorio upstream durante las pruebas. No instalar scripts ocultos ni fusionar patches históricos R20–R40.

## Base técnica y trazabilidad
- Última estable al comienzo: `levy-street/world-of-claudecraft@v0.44.7` (referencia de regresión).
- Candidato 0.45 Studio: `levy-street/world-of-claudecraft@91e9c7753f2a132e55647455dd4fccfd5edbe6de` (revisión explícita, **NO release estable**).
- Donante HIGHFLY para rescate selectivo: `drakentzy07/cobalt-hollow-lab@cb166cc23d4177260602b0b768d671e133b9313b` (no se copian los cambios del motor ni el HUD universal).
- El RUN G1 utiliza ambos donantes de solo lectura, copia módulos individuales en un directorio temporal y ejecuta pruebas. El antiguo `CLAUDECRAFT_UPSTREAM.lock` de main NO se cambia.

## Los cuatro bloques de producto (entregas grandes)
### GENESIS I — REBIRTH (prioridad actual)
Nueve clases y 27 especializaciones íntegras; Training Core por **identidad de personaje** y estadísticas sin doble cómputo, con modo apagado que preserva exactamente los valores nativos; movimiento 360 sobre Sim nativo, cámara libre, y mejoras de dash/salto/ataque que respeten mecánicas y autoataques de las nueve clases; HUD táctil y guardado sin alterar los históricos. No habilitar ventajas de movimientos/casteos para todos sin balance y server parity.

**RUN G1 — compuerta de compatibilidad:** construir 0.45 desde un SHA fijo + recuperar motor de entrenamiento y proyección de movimiento + probar nueve clases, cálculo neutro y bonus por crecimiento, límites de nivel, móvil 360, regresiones nativas, TypeScript y Vite. Este RUN prepara el adaptador, pero todavía NO afirma que todos los controles estén cableados en el juego. **GO** de la siguiente fase solo tras verdes y auditoría del resultado. Dejar un informe reproducible aunque de rojo.

**RUN G2 — integración completa dentro del mismo BLOQUE I:** conectar entrenamiento a estadísticas por personaje en *cliente y servidor*; conectar controles táctiles a Sim; HUD táctil y selección de las 9 clases; probar partida real nivel 1–20, guardados y balance. Solo después de la prueba real en Samsung S23 Ultra se autoriza una publicación candidata. No hacer otra app.

### GENESIS II — LIVING WORLD
Traer las mejoras de Studio auditadas, sin sobrescribir el mundo original. Renovar una ciudad preservando NPC/servicios/misiones; anexar una región HIGHFLY con puerto, pueblo, bosque, lobo, profesión y loot real; cascada/laguna/caverna jugable. Todos los caminos, colliders, terreno y respawn verificados. Mapas del editor deben integrarse a servidor en un futuro; playtest offline no es multiusuario.

### GENESIS III — EVOLUTION
9 skills HIGHFLY originales (una por clase), maestría complementaria, monstruos nuevos, un jefe, loot y recetas, conservando habilidades/atributos/elecciones originales nivel 20. Integración sim/client/server y prevención de grindeo artificial.

### GENESIS IV — ONE WORLD
Una app, persistencia aislada por personaje, varias clases y región compartida, validación de servidor autoritativo y prueba de cooperativo 3–5 personas; despliegue posterior con revisión de costes y permisos.

## Política de entrega
- No vender como "GREEN" una ejecución que todavía está en curso.
- GREEN de CI no significa Android jugable; QA S23 Ultra obligatorio antes de release.
- Bloques grandes para pruebas de usuario; dentro de cada bloque pueden existir commits y correcciones sin cambiar de proyecto.
- No Pages, no APK, no escritura de saves en G1.
