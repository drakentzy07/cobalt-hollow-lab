# HIGHFLY Training RUN1-J — Tracker

Base congelada: `RUN1-I GREEN @ f572bd236dc9777a421d844e271f5f8bc5c9e41d`

Rama activa: `highfly-training-run1j`

Último GREEN confirmado: `335724daeab4da96926398069d08072f6f3a4ba7`

## Cerrado en RUN1-J

- [x] Rutina HIGHFLY 5D real trasladada a autoridad de sesión.
- [x] Periodización 4 semanas: 3 carga + 1 descarga.
- [x] Regla adaptativa: si el ciclo sale bien, suben ligeramente las cargas; si no, se repite.
- [x] Readiness subjetivo eliminado del scoring.
- [x] PER derivado de adherencia + precisión/secuencia.
- [x] INT derivado de gestión de descansos + cumplimiento de prescripción.
- [x] Bloqueo secuencial de ejercicios.
- [x] Descanso real medido entre sets y penalización por corte anticipado.
- [x] Estado de ciclo persistente.
- [x] Tests de autoridad de rutina y regresión.
- [x] TypeScript, tests, build y smokes verdes.

## Siguiente bloque

- [ ] Branding HIGHFLY visible completo.
- [ ] Aplicar logo completo en portada/intro/loading donde corresponda.
- [ ] Aplicar isotipo en espacios compactos/PWA/UI.
- [ ] Eliminar branding visible World of ClaudeCraft.
- [ ] Eliminar Discord y CTAs heredados de la superficie HIGHFLY.
- [ ] Español total en la superficie jugable HIGHFLY.
- [ ] Completar puente Training Core → atributos RPG reales para STR/AGI/VIT/PER/INT.
- [ ] Tests específicos de cada efecto del puente.
- [ ] Smoke mobile S23 Ultra sin regresiones de RUN0.9.2.
- [ ] Cierre RUN1-J GREEN final.

## Regla de integración

REUSE FIRST. No reemplazar sistemas nativos que ya funcionan. El Training Core se aplica después del cálculo RPG donor y sólo modifica/deriva los atributos existentes que correspondan.

## Checkpoints

- J0 — base RUN1-I congelada
- J1 — rutina + ciclo adaptativo + PER/INT + secuencia: GREEN
- J2 — branding + limpieza visible + español
- J3 — puente completo Core Stats → RPG
- J4 — QA móvil + cierre RUN1-J
