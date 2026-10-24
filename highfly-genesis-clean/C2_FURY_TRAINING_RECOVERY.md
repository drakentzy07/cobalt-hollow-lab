# HIGHFLY CLEAN — C2 recuperación controlada (2026-10-24)

## Objetivo

Recuperar componentes reales de **Fury 360°** y sentar el esquema de **Training + stats universales** sin romper el mundo original ni introducir 99 niveles, clases obligatorias o un segundo motor.

**El usuario autorizó avanzar. El sitio público no se modifica hasta pruebas de integración + Android.**

## Donantes identificados y sus límites

| Sistema | Rama verificada | Qué podemos recuperar | Qué NO copiar |
|---|---|---|---|
| Fury F5 | `highfly-rebirth-fury360-engine-20261022` | Ocho módulos `fury360/src/*.ts`, control táctil/retículas, gestos, targeting y combos como propuestas | Ningún `main.ts`, `input.ts`, `mobile_controls.ts` ni `player_motion.ts` históricos |
| GOLDEN 360 | `highfly-main-clean-v1` | Proyección de joystick cámara-relativa, test de ocho direcciones, adaptación futura del input | El overlay `highfly_mobile_360.py` no debe aplicarse sin revalidar anchors |
| Training Core | `highfly-main-clean-v1` | Cálculos de entrenamiento y pruebas, para analizar y adaptar | El antiguo `core.ts` fija nueve clases y LV99; contradice al Hunter universal LV20 actual |
| Original estable | `levy-street/world-of-claudecraft@493c35a1...` | Mundo, sim, personajes KayKit, ítems, stats, físicas | No sobrescribir archivos originales ni cambiar assets/licencias en C2 |

## Alcance C2-01 (estadio compilable, todavía NO jugable)

1. Descargar **upstream por SHA** y ambas ramas históricas como fuentes independientes.
2. Ejecutar los tests FURY originales y la prueba de 8 direcciones, sin modificar upstream.
3. Simular el stage FURY (dry-run) y copiar sus ocho módulos **solo** en `src/highfly/fury/`.
4. Copiar un contrato nuevo `src/highfly/training/universal_stats.ts`: clase universal, nivel máximo 20, STR/AGI/VIT/PER/INT, entrenamientos validados, asignación explícita de puntos; resto de los atributos deriva del core.
5. Pruebas unitarias puras del contrato universal y typecheck del candidato upstream.
6. Verificar que no cambió ninguna ruta Git-tracked del donante y que los archivos nuevos se limitan a `src/highfly/`.
7. Resultado: recuperar librerías **sin activarlas**: todavía no puede afirmarse movimiento 360 jugable ni entrenamiento conectado a guardados.

## Gates posteriores

- C2-02: aplicar adaptador de joystick al touch router ya existente; pruebas vectoriales y de Android.
- C2-03: conectar 2.º salto/dash al Sim nativo y secuencias de animación, sin teleports.
- C2-04: conectar Training Core universal al perfil persistente con guardados separados Mundo/LAB, atributos derivados sin duplicación y UI.
- C2-05: enlazar acciones FURY a aceptación real de Sim (no simular daño desde la capa de gestos).

**No se publicó Pages, no se borró/reemplazó arte y no se reescribió gameplay en C2-01.**
