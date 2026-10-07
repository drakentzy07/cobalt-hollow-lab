# HIGHFLY CREATOR LAB · CAJA MÁGICA — RUN 0.1
## Alcance
Laboratorio **independiente**, sin tocar la rama verde `highfly-skinlab-v2-warrior-black`, el entrenamiento ni los publicadores de HIGHFLY.

### Herramientas implementadas en el prototipo
- Modelo real ClaudeCraft `warrior_modular.glb`, fuente congelada en `9b57e49c9676d75962700f828cc00a50a9a988b5`. Se comprueban blob Git SHA `e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2`, 3,477,500 bytes, Rig_Medium y 22 clips.
- Geometría de plumas original con superficie volumétrica parametrizada, centro curvo Catmull-Rom, quill independiente, 24 tramos, geometría cerrada y normales.
- Accesorios rígidos sobre `head` usando `M_Head` en `reference_head.glb` real generado por el proyecto.
- Piezas independientes: crear, duplicar, borrar, seleccionar mediante listado, cambiar largo/ancho/curvatura/torsión/abertura, material, color de cuerpo y nervadura; simetría.
- Historial deshacer/rehacer, reinicio, receta local y descarga JSON. Exportación GLB **solo del accesorio**; NO exporta el personaje ni supone transferencia de pesos de skinning.
- Cámara frente/perfil/espalda, previsualización de animaciones, PC y S23 horizontal.

### Fuera del alcance en RUN 0.1
No contiene sculpt brush general, operaciones booleanas/retopología/weight transfer automáticas, texturas PBR procedurales completas, nudos ajustables individualmente, ni pipeline Blender instalado. Blender automatizado es una **etapa futura** tras verificar una integración reproducible y compatible con licencias.
No se debe llamar a este prototipo "Blender completo", "armadura legendaria terminada" ni "GLB skinned". Las piezas creadas son rígidas y se anclan a `head`.

### Criterios de calidad obligatorios
1. Debe cargar el GLB original y una referencia de bind frame `M_Head` auténtica, sin proxy.
2. 22 clips y >=20 huesos; contenido del modelo fuente inalterado.
3. Pruebas de agregar, duplicar, eliminar, pintar, deshacer, rehacer, resetear, guardar/cargar y exportar GLB real.
4. Mallas sin NaN, clip base ejecutable, viewport PC/S23 visible.
5. No mezclar rama o publicador del juego con el Creator Lab. Publicación únicamente tras CI GREEN.

### Documentación técnica consultada
- Catmull-Rom: https://threejs.org/docs/pages/CatmullRomCurve3.html
- GLTFExporter: https://threejs.org/docs/pages/GLTFExporter.html
- OrbitControls: https://threejs.org/docs/pages/OrbitControls.html
- Blender Python headless: https://docs.blender.org/api/main/info_advanced_blender_as_bpy.html
- Blender Bevel: https://docs.blender.org/manual/en/4.4/modeling/modifiers/generate/bevel.html
- glTF/GLB Blender: https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html
