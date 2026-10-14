# HIGHFLY · PartCrafter free-cloud R0.4 · Manual GPU pilot

**Estado confirmado:** CPU verification `RUN 38602886202` GREEN. **La inferencia GPU gratuita en Colab sigue SIN EJECUTAR**, y el sistema de adaptación completa/semántica de una armadura generada no está validado. No confundir GREEN con arte listo.

## Por qué lo diseñamos así
`HIGHFLY_PartCrafter_Gratis_R04.ipynb` emplea [PartCrafter MIT](https://github.com/wgsxm/PartCrafter), su script de inferencia real y pesos MIT, con un commit fijo (`3d773bf02fad51c7ab31a5615573fec93b287b30`). Genera `object.glb` y hasta 4 `part_XX.glb` desde una **imagen de armadura**.

La gráfica Intel UHD de la PC no cumple los 8 GB VRAM CUDA; los runners GitHub estándar tampoco incluyen una GPU NVIDIA gratuita. Colab gratuito puede asignar GPU pero **no garantiza recursos**, conexión ni tiempo. NO intentamos activar GPU automáticamente desde GitHub ni usar intermediarios para eludir restricciones. No se contratan créditos ni suscripciones.

**Abrir cuaderno publicado:**
https://colab.research.google.com/github/drakentzy07/cobalt-hollow-lab/blob/highfly-skinfactory-r04-free-cloud-partcrafter/skin-factory-core/HIGHFLY_PartCrafter_Gratis_R04.ipynb

En Colab: iniciar sesión de Google, seleccionar GPU gratuita, ejecutar celdas en orden, cargar la imagen original `caballero_de_obsidiana_con_energía_violeta.png` que ya se usó como concepto, esperar a que termine, descargar `HIGHFLY_OBSIDIAN_PARTCRAFTER_RAW3D.zip`. Si no hay GPU gratis, **detenerse**, no elegir planes pagos. Si falla el setup, no hay inferencia ni modelo generado.

## Aceptación del ZIP
`partcrafter_bundle_gate.py` valida metadatos, huellas SHA256, número de piezas, seguridad ZIP, vértices/triángulos finitos reales y que no se presente el crudo como wearable. Un zip validado es **solo entrada 3D cruda**: sigue sin rig, sin slots identificados automáticamente, ni fitting ni aprobación visual.

En un equipo con Python 3.11 + trimesh:
```bash
python -m pip install numpy==1.26.4 trimesh==4.5.3
python skin-factory-core/partcrafter_bundle_gate.py HIGHFLY_OBSIDIAN_PARTCRAFTER_RAW3D.zip --report partcrafter_qa.json
```

## Lo que queda después del primer ZIP
1. Revisar en 3D si el generador realmente separó partes que se correspondan con cabeza/pecho/brazos/manos/piernas/botas. **No** asumir `part_00` = casco.
2. Etiquetado semántico y fitting al cuerpo del verdadero `warrior_modular.glb` (Y-up/escala/orientación).
3. Solo entonces usar Blender `blender_auto_bind.py` mediante su mapeo de donantes, con las 23 articulaciones originales. Actualmente el script se probó con **32 piezas V19 ya colocadas y nombradas**, no con un GLB arbitrario PartCrafter.
4. Probar sin clipping frontal/perfil/espalda/carrera/salto/ataque. Publicar en Pages **solo tras** revisión artística.

## Licencias, sin costes
El repositorio y pesos PartCrafter están publicados como MIT. El script oficial descarga automáticamente `briaai/RMBG-1.4` incluso si no se usa; es un componente **sujeto a una licencia no comercial**. El cuaderno parchea el script para no descargarlo/usarlo al no usar `--rmbg`; la imagen se monta sobre fondo blanco usando Pillow. Verificar las licencias de datasets, imágenes de entrada y cualquier otra dependencia de IA antes de comercializar.

## Regla fija
NO bodypaint, NO armadura nativa Knight recoloreada, NO cascos flotantes. Se conserva el Warrior original. No modificación del juego ni del Pages publicado. HIGHFLY SUPREME SKIN FACTORY recibirá armaduras completas NUEVAS cuando superen los gates de arte y rig.
