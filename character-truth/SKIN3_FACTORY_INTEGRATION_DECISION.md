# HIGHFLY SKIN FACTORY — DECISION DE UNIFICACION SEGURA (Fase 00)

## Decisión (08-oct-2026)

Crear una TERCERA rama de integración. NO hacer merge de ramas completas.
Preservar ambos laboratorios tal como están y usar solo módulos/contratos
que pasen las pruebas. Probar primero el SKIN3 independiente en el S23 Ultra;
integrar las funciones del Skin Factory V2 en sucesivos pasos aislados.
Nada de esto cambia el juego público, `main`, PF-6, Foundation, skills,
entrenamiento, progresión ni profesiones.

**Ramas base inmutables de referencia**
- SKIN3 auditado y candidato WebGL: `highfly-character-truth-audit-01`;
  base de integración: `b3fb7f43a917f05d93c3dbb3787c1f4911ef9700`.
- SKIN FACTORY V2 clásico: `highfly-skinlab-v2-warrior-black`;
  origen `cd6d60c7e445534b5425e6e84192b07aa9ac4ee9`.
- NUEVO aislamiento: `highfly-skinfactory-integration-00`.
- NUNCA desplegar desde estas ramas encima del GitHub Pages del juego.

## Qué usar de cada proyecto

**SKIN3 es la FUENTE DE VERDAD del personaje y del equipamiento:**
- Personajes originales masculinos y femeninos, `Rig_Medium`.
- Siete ranuras `head/chest/arms/hands/legs/feet/back`.
- Nodos originales `Armor_*` seleccionados por `modularPartNames`.
- Validación de reglas de equipo, modelo de inventario experimental.
- Primer laboratorio separado, con guardado experimental y control horizontal.
- NO CERTIFICA el inventario/guardado del juego real ni arma 3D adjunta.

**SKIN FACTORY V2 es DONANTE DE HERRAMIENTAS DE DISEÑO:**
- Modo sencillo, elección de pieza, pintura y pincel de materiales.
- Moldeador que modifica POSITION y comprueba huella de skinning.
- Cámara/animaciones originales, inspector de huesos, agarres y accesorios.
- Carga y guardado de una receta simple version 2 (una ranura y colores).
- Este laboratorio anterior arranca con `M_*`; NO asumir soporte femenino.
- Los wearables Harbormaster del V2 tienen derechos separados: NO trasladar
  su binario ni publicarlos sin licencia explícita.

## El problema que NO debemos crear

V2 maneja una sola `currentSimpleRecipe` con
`{version:2,set,slot,color,material,specialSkin,corvusColors}`.
SKIN3 maneja siete ranuras por separado y el inventario real maneja trece.
Copiar esa receta sobre SKIN3 haría perder información y acoplaría cosméticos
al equipo estadístico. La unificación NO puede usar un simple copiar/pegar
de HTML, nombres globales, controles ni localStorage.

## Contrato de integración futura (sin implementar todavía)

`DesignRecipeV3` (**DISEÑO PROPUESTO**, no un sistema ya implementado):
- `schemaVersion:3`, `rig:'Rig_Medium'`, `gender` y base original.
- Siete `parts` opcionales, cada uno con su fuente validada, color y molde.
- Accesorios solo referenciados si tienen procedencia/licencia y anclaje válidos.
- Presets y variantes se guardan como recetas no destructivas, no GLB original
  mutado de forma permanente.
- `EquipVisualLoadout` separado del aspecto y de los atributos RPG.
- `CharacterState` gameplay real conserva validadores/equipo/inventario.
- STR/AGI/VIT/PER/INT exclusivos del entrenamiento real, no equipamiento.
- Migración V2 v2 -> v3 preserva la pieza única y deja otras vacías;
  exige test de ida y vuelta y versión desconocida rechazada con seguridad.
- Guardar diseños es distinto de persistencia del inventario del juego.

## Gates / cronología por prueba, no por promesa de tiempo

0. **Auditoría estática**: verificar fuentes congeladas y matriz de
   compatibilidad. No mover funciones todavía.
1. **Playtest temprano**: probar SKIN3 con el Hunter verdadero y siete ranuras,
   en Android horizontal, en un hosting separado y después de validar derechos.
2. **Editor unificado aislado**: incorporar primero selector de piezas +
   pintor V2, sobre `modularPartNames`/SKIN3. Male/female, datos de receta.
3. **Moldeador**: integrar deformación solo con skinning/huesos/clipping/pose
   validados; revertir cambios que muevan mallas mal.
4. **Objetos y armas**: equipar/des-equipar arma original en sockets,
   y luego sincronizar con inventario y guardado de PF6 en laboratorio.
5. **Creación premium**: primer set HIGHFLY propio y receta de profesiones,
   solo con licencia, validación de malla, performance y aprobación visual.

## Prueba humana: no esperar al editor unificado

Cuando el laboratorio SKIN3 independiente esté accesible y autorizado,
probar: original male/female, casco/pecho/botas, combinaciones y falta de
piezas, quitar, animación y cámara, guardar/cargar, controles S23 horizontal.
Se registra lo observado antes de modificar comportamiento.
No confundir un GREEN de CI en emulación con Android físico.

## Gate de aceptación para cualquier transferencia de V2

1. No se editan archivos del laboratorio original ni `main`.
2. Se conserva la identidad real de GLB, huesos, sockets y clips.
3. Reversible; un módulo por vez, con capturas M/F.
4. Sin piezas proxy, sin reescribir estadísticas de entrenamiento.
5. Sin publicar assets sin permiso; se respeta `CREDITS.md`.
6. No hay integración en mundo público sin test de equipamiento/guardado.
7. Al fallar, revierte la función migrada; no todo el sistema.

**Estado:** documentación y auditoría estática; NO se declara editor unificado
ni publicación pública todavía.
