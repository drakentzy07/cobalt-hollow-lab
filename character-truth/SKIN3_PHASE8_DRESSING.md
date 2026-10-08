# HIGHFLY SKIN 3 / Fase 8: siete ranuras reales, composicion original

## Objetivo
No creamos otro Hunter. Auditamos el GLB autentico warrior_modular y los seis
origenes oficiales congelados por SHA, usando EXACTAMENTE la funcion original
modularPartNames. La rama esta aislada; PF-6 y Foundation no se modifican.

## Dato confirmado en el codigo original
ClaudeCraft define siete ranuras head, chest, arms, hands, legs, feet, back.
CADA ranura puede usar un conjunto original diferente: knight, barbarian,
druid, mage, paladin, ranger y rogue. Algunas ranuras no tienen pieza:
barbarian/back, druid/head, mage/hands, ranger/head y rogue/head.

El cuerpo autentico sigue visible bajo la armadura para proteger huecos
anatomicos; no se reemplaza indiscriminadamente el cuerpo por la placa.
La ropa de cintura y el casco tienen reglas particulares de visibilidad.

## Pruebas
- 2 cuerpos sin armadura (hombre y mujer).
- 14 conjuntos completos (7 conjuntos x 2 cuerpos).
- 98 cambios individuales de ranura (7 x 7 x 2).
- 2 mezclas completas de siete fuentes diferentes, con animacion Block.
- Total: 116 configuraciones originales (sin proxies), con registro de meshes,
  fuente real, armadura por slot, huesos y caja anatomica calculada en GPU/CPU.
- Capturas reales tomadas en el laboratorio aislado.

## Reglas que permanecen
El GREEN de este laboratorio NO certifica que el equipamiento individual este
implementado dentro del gameplay de PF-6 ni en su guardado. Tampoco prueba que
el merge de mallas y efectos original PF-6 coincidan exactamente con el visor,
que se hayan detectado TODOS los posibles problemas de clipping en movimiento,
que hayan pasado las armas ni el dispositivo S23. Es una verificacion tecnica
del COMPOSITOR Y ASSETS ORIGINALES para preparar la fabrica de skins.

Siguiente gate: comprobar la UI de inventario/equipamiento real y el
conexion entre equipamiento visual, estado persistente y animaciones jugables.

## Criterio de fallo
Si falta una malla que el kit oficial SI define, falla el gate. Si el kit no incluye esa
ranura, se registra como AUSENTE_ORIGINAL, nunca se genera un mesh sustituto.
