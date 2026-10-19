# HIGHFLY ORIGIN — FOUNDATION-01 (2026-10-19)
## Estado: PLAN DE PRODUCCIÓN Y RAMA AISLADA; NO IMPLEMENTADO; NO CERTIFICADO
No es una reconstrucción ya terminada. Ninguna prueba fue ejecutada por la creación de este documento.
No desplegar en GitHub Pages ni escribir en main ni en ramas R39/R40.

### Fuentes congeladas y estrategia de rescate
- Repositorio del proyecto: drakentzy07/cobalt-hollow-lab.
- Rama de origen de FOUNDATION-01: highfly-main-clean-v1 @ 89c8d8fccdce476a486cce58a074332430512de4.
- Donante upstream ClaudeCraft v0.44.0 @ 9b57e49c9676d75962700f828cc00a50a9a988b5.
- Archivo de código experimentado para consulta, NO para aplicar en cascada: R40 @ 6566c3e3dd2f3716f2a59116bb0ac8e0c72bdf7f.
- Monstruos P02I @ e6f59079fdc3f278ef041fbc8354ca837aee42ab.
- Las ramas y parches históricos son SOLO LECTURA. Hacer inventario de otras referencias (training, profesiones, equipamiento, UI, monstruos, skills) antes de importar.
- La rama heredada usa thin-overlay. Siguiente etapa: materializar y versionar fuente de código consolidada con upstream pin; mantener media pesada separada con manifiestos, licencias y hashes. No declarar hecho mientras no exista el árbol editable.
- REUSE FIRST -> AUDIT -> ADAPT -> INTEGRATE -> TEST -> FREEZE. Prohibida la inserción textual encadenada como arquitectura final. Cambios nuevos en módulos propios y puntos de integración tipados.

### Fantasía y personalidad
- Referencias PRINCIPALES de experiencia: Shangri-La Frontier (SLF), Exiled Knight, Overgeared, Solo Leveling y mundo isekai abierto.
- The King's Avatar / Lord Grim SOLO inspira la libertad de disciplinas, NO los gráficos, el motor o la ambientación.
- Un solo Hunter persistente, con género/apariencia elegibles y un único guardado; ningún cambio de personaje en combate.
- Las nueve clases originales pasan a ser nueve ESCUELAS donantes; no existe elección obligatoria de clase. Mantener compatibilidad interna legacy del Sim hasta adaptar permisos, recetas y guardados.
- Entrenamiento REAL controla STR, AGI, VIT, PER e INT; niveles/rangos/maestrías evolucionan por mecánicas separadas. Prohibir aumento de estas cinco stats por equipo o distribución libre.
- HP + MP + STAMINA unificados; adaptar explícitamente cada coste especial heredado (Rage, Energy, devotion/ruin, etc.), jamás habilitar skills por omisión.
- Inventario, loot, armas y armaduras libres de exclusividad por clase inicial; conservar requisitos jugables genuinos (nivel, arma, maestría, estado).
- Personaje KayKit modular Rig_Medium y modelos masculinos/femeninos; no alterar skeleton/skins/sockets sin conversión y QA.

### Prioridad absoluta: control y movimiento extremo
- Conservar joystick GOLDEN camera-relative 360, cámara libre, multitouch Android horizontal, manual ATK y USAR por separado.
- 1er salto normal; 2do salto puede convertirse en flip frontal, trasero o lateral según dirección/estado; con headroom, colisión real, control aéreo, predicción de aterrizaje y fallback seguro si animación no está lista.
- DASH/Evade contextual: step, roll/rolido o esquiva lateral según joystick, situación y terreno. Sin teletransportación cosmética ni distancia de animación que contradiga la simulación.
- Parkour progresivo: trepar, salto de pared, wall-run diagonal, salto mortal; en módulos opt-in con test de colisión, velocidad, cámara y stamina.
- La animación NO es autoridad física. Sim/motor de movimiento calcula posiciones, validación, invulnerabilidad y costos.
- AnimGraph integrado: locomoción direccional, blending de torso/piernas donde sea seguro, transiciones, buffering y cancel windows; no cortar running gait para ataques aceptados ni crear 2 acciones full-body contradictorias.

### Combat Core: calidad ARPG/MOBA, NO implementación AAA certificada
- Una única entrada de inputs -> action resolver -> Sim/authority -> animation/VFX/audio/feedback. Nada de dobles sistemas de daño, actor duplicado o auto-ATK.
- ATK manual encadena 1-2-3 (+4 elemental exclusivamente con gema autorizada), ataques contextuales, combos y cancelaciones justificadas.
- Parry contextual sólo desde ATK y perfect dodge desde DASH, sin botón extra Block; contraataques responden a eventos nativos confirmados.
- Objetivo: free aim y soft aim sin cambiar dirección del jugador incorrectamente, rangos reales, timings de iFrames, hit reactions, poise/break, sonido, VFX, cámara y rendimiento medido S23.
- MVP: 4 skills activas propias hechas con recursos existentes: S1 corredor LINEAL; S2 CONO/sector circular; S3 AO​E CIRCULAR claramente delimitada; S4 TRIÁNGULO con base recta. Cada una con payload Sim: coste, CD, objetivo/área, daño, feedback y apuntado HOLD-DRAG-RELEASE con cancelación.
- 1 PASSIVA/Buff sin botón de skill; no ocupa slot activo; duración/coste/stack definidos antes de habilitarla.
- Futuro: 3 únicas invisibles hasta desbloqueo, no colocar slots fantasma. Más habilidades serán variaciones de contratos de cast, no nuevos mini-motores.

### Biblioteca de animaciones candidata (no importar automáticamente)
- KayKit Character Animations actual: 161 clips CC0, divididos por Rig_Medium/Rig_Large; alta prioridad para auditoría y compatibilidad real.
- Quaternius Universal Animation Library (120+), Universal Animation Library 2 (130+, combos y parkour) CC0. Requiere retarget de huesos, escala y root motion a Rig_Medium; no asumir plug-and-play.
- Mixamo: recurso humanoide opcional con restricciones de redistribución; no publicar archivos brutos. Priorizar KayKit antes.
- Solo incorporar clips tras inventario de los 22 clips ya embebidos en el personaje, test de rig, contactos del pie, y prueba en S23. Sin sustituir el modelo modular.

### Orden de producción
F0 - Consolidación de código y contratos.
F1 - Hunter persistente + Training Core + HP/MP/Stamina + apariencia/equipo base.
F2 - Movimiento GOLDEN + extremo, rig/animación y anti-slide.
F3 - Combate físico libre sin skills mágicas y pruebas S23.
F4 - 4 skills geométricas propias + 1 pasiva.
F5 - Primer enemigo con IA + daño/loot/save en un mismo mundo (vertical slice).
F6 - Nueve escuelas, equipamiento universal, bestiario y balance.
F7 - Quest/discovery + profesiones/crafteos + armaduras.
F8 - Living NPC, interiores RG Poly, sociedad/cooperativo y expansión isekai.

### Condiciones de seguridad y DONE
- Nunca tocar main, Pages público ni ramas antiguas sin instrucción explícita de publicación.
- Nuevos cambios SOLO en highfly-origin-foundation-clean-20261019; los artefactos grandes se publican solo al aprobar QA.
- Commits pequeños de fuente consolidada; CI corta de lint/tsc/unit primero; CI de integración después; S23 emulado y prueba física final.
- Demostración vertical se acepta si un solo Hunter entra en ClaudeCraft, corre/salta/esquiva/combate, usa 4 skills y 1 pasiva, mata a un enemigo, obtiene loot, guarda y restaura correctamente sin actor duplicado.
- No afirmar "AAA logrado" ni "60 FPS confirmado" sin sesiones físicas y mediciones.
