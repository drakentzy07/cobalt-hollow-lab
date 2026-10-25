# HIGHFLY CLEAN REBORN — 0.44.7 (rama de integración aislada)

## Principio
No se copia ni se publica G6/C2-04 como base. El candidato se vuelve a obtener SIEMPRE de
`levy-street/world-of-claudecraft` en el commit inmutable
`493c35a108cef6c8aa290e8793107b1cd117886e` (v0.44.7).

El repositorio HIGHFLY conserva recetas y tests, no la biblioteca de assets de terceros.
C2-04 es una **fuente de recetas de movimiento/entrenamiento**, no el binario ni el
sitio desde el cual reconstruimos. F263 aporta el dash y la física ya desarrollados,
previa comparación de anclajes. FURY aporta módulos de intención, NO reemplaza Sim.

## Estado y prohibiciones
- **C0 en trabajo**: auditar licencias y validar motor + training desde upstream limpio.
- Sin publicación de Pages en esta fase; main, G6, /c204 y guardados quedan intactos.
- No usar `highfly-world/pages/sanitize_candidate.mjs` ni los reemplazos G6.
- Ninguna imagen o GLB se vuelve blanco o azul para "hacer funcionar" el juego.
- Originales CC0 (KayKit/Quaternius/Kenney/ambientCG/Poly Haven) se preservan byte a byte.
- Los recursos `With the project only` están permitidos **como parte del fork**, no
  como un asset pack independiente (según CREDITS.md original).
- `No, permission required`: fuera del build distribuible, sustitución propia
  o autorización previa. `Non-commercial only`: no para distribución comercial.
- Assets sin registro: **pendientes**, no "aprobados por descarte".
- Nunca despliegue público sin inventario cerrado + prueba Android S23 Ultra.
- Verdes CI != verde de dash, mortal, cámara, gráficos o guardados reales.

## Orden de integración
1. C0: reconstruir v0.44.7 inmutable, inventariar originales y verificar
   movilidad GOLDEN + Training Core + FURY sin publicar ni tocar media.
2. C1: selección de assets por licencia **archivo a archivo**; reemplazos
   HIGHFLY legibles solo donde sean necesarios. Verificar árbol/armaduras/campana.
3. C2: rescatar física de dash+doble salto de
   `highfly-origin-f263-collision-gesture-save-polish-20261020`,
   sin sustituir Sim ni copiar archivos grandes a ciegas. Mortal/flip requiere
   evento animado confirmado: no alcanza con una señal o una constante.
4. C3: Hunter sin limitación de clase; compatibilidad con módulos de equipamiento,
   guardado y estadísticas antes de retirar las 9 clases del interfaz.
5. C4: prueba jugable privada, inspección S23 y solo entonces Pages aislado.

## DoD para la próxima versión jugable
- Ingreso fullscreen y creador sin espejo, guardado que persiste.
- Árboles, construcciones, tutorial y armaduras con materiales originales o sustitutos verificables.
- Stick izquierdo mueve, dedo derecho orbita, sin inversión.
- Dash físico funcional y doble salto con mortal visible según dirección.
- ATK al correr y en el aire, sin objetivo obligatorio, bajo pruebas de Sim.
- Training Core impacta estadísticas nativas y no pisa guardados.
- Sin recursos bloqueados por licencias en el paquete distribuible.

Referencias: `CREDITS.md` del upstream fijado;
`fury360/FURY_HANDOFF_REBIRTH.md` en la rama donante FURY.
