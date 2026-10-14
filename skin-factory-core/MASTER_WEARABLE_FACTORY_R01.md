# HIGHFLY WEARABLE FACTORY R0.1 — decisión arquitectónica

## Objetivo que NO cambia
Un único Warrior modular real de KayKit/ClaudeCraft (frozen source SHA e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2), con su Rig_Medium de 23 huesos, 22 animaciones, escalas, base corporal, sockets y HUD intactos. El usuario describe con texto o imagen una armadura y al final **equipa una malla 3D verdaderamente nueva**, con textura PBR, sin pintar el viejo Knight/Paladin ni pegar geometrías flotantes. No hay alas por defecto.

## Diagnóstico probado
* SKIN 8.8 y 9.1 modifican geometría ClaudeCraft: integración técnica útil, NO recreación fiel de referencia 2D.
* SKIN 8.9 construyó casco/coraza genéricos: tests pasaron pero calidad visual falló; NO tomar como generador.
* Existe un artefacto anterior real V19 GREEN (GitHub Actions run 37984648737) con `HIGHFLY-V19-LEGENDARY-ORNAMENTS.glb` (32 meshes originales, pesos y skin de 23 huesos), y combined (124 meshes originales, head no incluido). Esto prueba import/export y compatibilidad real, NO IA generativa ni armadura completa premium.
* GitHub Pages es un sitio web estático; **NO** contiene GPU de inferencia, backend seguro para API keys ni servicio Meshy/Tripo por sí mismo. No exponer claves API en JS público.
* Un modelo generado por Meshy, Tripo o Rodin es geometría GLB; aun con auto-rig por proveedor **NO** se transforma automáticamente en vestimenta del Rig_Medium original.

## Herramientas verificadas (documentación oficial)
* Meshy Image-to-3D GLB, formato `glb` y API autenticada: https://docs.meshy.ai/en/api/image-to-3d
* Tripo Image-to-Model + optional `generate_parts`: https://developers.tripo3d.ai/en/docs/generation-image-to-model
* Tripo riggin bípede no equivale al rig de Hunter: https://developers.tripo3d.com/en/docs/animations-rig
* Rodin text/image 3D: https://docs.hyper3d.ai/en
* Blender Data Transfer de vertex groups usando nearest-face interpolation (NO nearest-vertex si existe superficie): https://docs.blender.org/api/4.5/bpy.types.DataTransferModifier.html
* Unity SkinnedMeshRenderer: https://docs.unity.com/en-us/engine/6000.3/manual/assets-and-media/asset-types/mesh/components-reference/class-skinned-mesh-renderer
* Hunyuan3D-2.1 abierto bajo licencia comunitaria **NO MIT**, demanda ~10GB VRAM forma, ~21GB texturas; no cabe en runner CPU estándar: https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1
* Stable Fast 3D tiene licencia comunitaria, tampoco MIT libre irrestricto: https://github.com/Stability-AI/stable-fast-3d/blob/main/LICENSE.md

## Pipeline único, detrás de escena
1. `DesignRequest`: texto o imagen provistos por usuario. Incluir silueta, casco cerrado, coraza, hombreras, brazos, manos, cintura, piernas, botas, palette, estilo, referencias de frente/perfil/espalda cuando existan.
2. `GeometryProvider`: seleccionar un único generador real (Meshy/Tripo/Rodin/alternativa compatible con sus licencias y facturación), preferentemente **modelos separados por regiones** en vez de una estatua sólida. Generar **mallas 3D / texturas / UV**, no solo imagen.
3. `Raw GLB gate`: confirmar triangulación, vértices finitos, materiales, tamaño compatible y origen/licencia. Archivo crudo no se declara equipable.
4. `Fit & Segmentation` **todavía pendiente de implementar**: separar y ajustar armadura a las zonas del cuerpo real; escala mundial original, evitar intersección con cara/cuello/axilas/rodillas y preservar volumen; mostrar únicamente la piel base no cubierta.
5. `Skinning & bind` **todavía pendiente de implementar**: Blender importa geometría sin rig, transfiere vertex groups desde donantes correctos usando interpolación de caras, limita a 4 influencias, normaliza pesos, asigna el armature original y exporta GLB Y-up. Usar inverse bind real para no desplazar piezas. NO crear otro skeleton.
6. `Wearable GLB gate`: misma lista de 23 huesos, JOINTS_0/WEIGHTS_0 por vértice, sin partes visibles sin rig, GLB válido. Implementado en `validate_real_wearable.mjs`.
7. `Art & animation QA`: capturas frontal/lateral/trasera contra referencia, idle/run/jump/attack, penetraciones, FPS del S23 Ultra. GREEN técnico != aprobación artística.
8. `Publish`: únicamente versiones aprobadas en nueva ruta aislada GitHub Pages; jamás reemplazar juego o laboratorio anterior sin visto bueno.

## Estado R0.1 real
**Implementado:** `validate_real_wearable.mjs` que revisa un GLB crudo o riggeado y la estructura de 23 huesos contra el Warrior original. Prueba con mallas reales V19, no cubos de un screenshot.
**NO implementado:** generación Meshy/Tripo automatizada (necesita API key/cuenta/créditos; sin uso de pago sin autorización); adaptación/transferencia desde GLB crudo; clon fidelísimo de imagen; visualización pública del nuevo intake; rig real para un GLB generado por proveedor aún no probado.

## UI final (después de que el motor funcione)
Un campo 'Describí tu armadura', una entrada de imagen opcional, acción 'Crear', estado de avance y vista 3D con 'Equipar / Retirar'. No exponer opciones de mapeo, rigging o API keys. Nunca simular un resultado como si viniese de una IA externa.

## Siguiente RUN técnico
Conseguir un **GLB sin rig con geometría nueva**, preferentemente separado por casco/torso/brazos/piernas, ejecutar fit a medidas originales + Data Transfer real en Blender; luego auditar export, animaciones y capturas. Eso demostrará el puente 3D crudo → wearable en una sola pieza end-to-end, pendiente de control humano de la calidad artística.
