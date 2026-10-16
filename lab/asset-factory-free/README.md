# HIGHFLY Asset Factory — R01 FREE (16 oct 2026)

## Estado

Primer laboratorio de ajuste visual independiente. **No reemplaza HIGHFLY ORIGIN ni actualiza el GitHub Pages público**. Fuente:

- Repo HIGHFLY: `drakentzy07/cobalt-hollow-lab`
- Upstream congelado: `levy-street/world-of-claudecraft` en `9b57e49c9676d75962700f828cc00a50a9a988b5`
- Lab web: [index.html](./index.html)

## Cero créditos de API

Este laboratorio no utiliza Tripo API ni ninguna generación comercial. Permite importar GLB locales, descargar opcionalmente el GLB base desde la fuente pública original, inspeccionar modelos, listar los huesos del rig, revisar clips, probar anclajes rígidos, modificar posición/rotación/escala, guardar capturas PNG y exportar los ajustes a JSON.

**Limitación central:** anclar una pieza a un nodo de la mano o torso NO transfiere pesos ni skinning. Un modelo `skinmodel` con nuevo rig tampoco es automáticamente el cuerpo modular exacto. Aún no produce armaduras 100% deformables/equipables. No confundir ajustes visuales con un AUTO-FIT completo.

## Abrir laboratorio

Para probarlo desde la rama sin tocar Pages:

1. Descargar el directorio `lab/asset-factory-free/` o usar el ZIP entregado en el chat.
2. Abrir terminal en la carpeta que contiene `index.html`.
3. Ejecutar `python -m http.server 8780`.
4. Visitar `http://localhost:8780/` desde Chrome de escritorio. Para Android, servir la carpeta desde una máquina en la misma red o publicarla como sitio estático cuando se autorice.
5. Pulsar **Cargar Warrior modular** (requiere Internet) o elegir un GLB local.
6. Importar casco/arma/armadura GLB y probar los anclajes mientras cambia de animación.
7. Descargar el montaje `highfly-fit-r01.json` y una captura.

Three.js y Meshopt se cargan desde CDN gratuita: **la herramienta no funciona completamente sin conexión a Internet salvo que se distribuyan esas librerías localmente**. El modelo demo se descarga de GitHub. Los GLB elegidos desde el disco se procesan en el navegador.

## Qué código hemos descubierto y verificado en ClaudeCraft

- [Asset pipeline](https://github.com/levy-street/world-of-claudecraft/blob/9b57e49c9676d75962700f828cc00a50a9a988b5/scripts/asset_pipeline/pipeline.mjs): `weapon`, `prop`, `creature`, `skin`, `skinmodel`, `rig-manual`, `preview`, `library`, `fit`.
- [Manual del pipeline](https://github.com/levy-street/world-of-claudecraft/blob/9b57e49c9676d75962700f828cc00a50a9a988b5/scripts/asset_pipeline/CLAUDE.md): capacidades, revisión y QA.
- [Rigging local sin Tripo](https://github.com/levy-street/world-of-claudecraft/blob/9b57e49c9676d75962700f828cc00a50a9a988b5/scripts/asset_pipeline/lib/manual_rig.mjs): asigna pesos a huesos de la referencia para mallas humanoides compatibles en pose T.
- [Wizard original](https://github.com/levy-street/world-of-claudecraft/blob/9b57e49c9676d75962700f828cc00a50a9a988b5/scripts/asset_pipeline/lib/wizard.mjs): usa un backend local y etapas con API. No funciona como generador gratuito de texto a 3D sin credenciales.

No se copiaron modelos, texturas ni recursos binarios de terceros a esta rama. La reutilización futura debe comprobar `LICENSE`, `CREDITS.md` y `THIRD_PARTY_NOTICES.md` individuales.

## Próximos controles técnicos (siempre free first)

- **R02:** ensayar `rig-manual` con GLB gratuito de PartCrafter, sin llamadas a Tripo y sobre copia de referencia KayKit. Validar T-pose y pesos.
- **R03:** superficie de ajuste por módulos M_Head, M_Torso, M_ArmL/R, M_HandL/R, M_LegL/R y M_FootL/R; colisiones e interpenetración.
- **R04:** exportador de armadura real y prueba de movimiento completa de los 22 clips; gate S23 horizontal.
- **R05 opcional:** sumar generación de modelos por un proveedor sin costo comercial que permita uso legal, una vez comprobados términos y límites.

Regla: **REUSE FIRST → AUDITAR → ADAPTAR → EXTENDER → TESTEAR → CONGELAR**. No tocar el juego principal ni Pages hasta tener pruebas manuales aprobadas.
