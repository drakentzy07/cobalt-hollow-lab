# HIGHFLY ORIGIN — ADR FOUNDATION-02: Android-first + actualizaciones selectivas
**Decisión de producto aprobada:** 2026-10-19.
**Estado:** contrato arquitectónico / no es funcionalidad implementada.
**Rama:** `highfly-origin-foundation-clean-20261019`.
**Base de producto:** HIGHFLY construido sobre fuente editada y consolidada del donor ClaudeCraft congelado.
**Plataforma objetivo:** Android apaisado, Samsung Galaxy S23 Ultra como dispositivo principal de pruebas.

## 1. Proyecto actualizable, no fork congelado para siempre

HIGHFLY conservará su identidad y sus módulos mientras podrá incorporar aportes nuevos del upstream World of ClaudeCraft. **Regla: importar selectivamente, nunca actualizar automáticamente el upstream en producción.**

### Protocolo "UPSTREAM INTAKE"
1. Mantener `UPSTREAM.lock` con repositorio, etiqueta, commit aprobado y fecha; lock diferente para producción vs. candidato.
2. Detectar nuevas versiones mediante revisión manual/programada opcional. No modificar app por el mero hecho de detectar nueva release.
3. Abrir rama temporal `intake/claudecraft-<version>` a partir de un tag HIGHFLY estable, con dos refs explícitas (donor anterior y candidato).
4. Generar comparación de cambios por carpetas relevantes: render, input Android, editor modular, VFX, AI, contenido, seguridad, assets, THREE, animación y persistence. Registrar *qué cambia*, *licencias* y *qué problema resuelve*.
5. Clasificar cada mejora como **adoptar**, **adaptar**, **posponer** o **rechazar**. No merge/cherry-pick global ni re-aplicar la vieja cadena R20–R40.
6. Adaptar solo las mejoras aprobadas a los contratos internos de HIGHFLY, sin perder un único Hunter, Training Core, MP/Stamina, skills sin clase, guardados ni controles GOLDEN.
7. Probar diff con unit, integration Sim, WebGL build, pruebas Android táctiles, cámara y perfiles/guardados legados. Verificar licencias de *código y media*, hashes y costo de paquete.
8. Crear release candidata versionada, migraciones reversibles o recuperación por backup y rollback plan. Publicar solo tras autorización expresa y QA en dispositivo.

**Nunca** mezclar una actualización de upstream con una migración mayor de inventario, jugador o balance en el mismo release. Las mejoras se promocionan por lotes delimitados y medibles.

## 2. Identidad de HIGHFLY por encima del upstream

Una única identidad de Hunter con evolución y controles propios. Las nueve clases originales se conservan como fuente de técnicas y compatibilidad interna, pero **no** son nueve avatares jugables ni requisitos universales de equipo.
- `HunterIdentity` y `HunterProgression` son propiedad de HIGHFLY.
- `TrainingCore` es autoridad de STR/AGI/VIT/PER/INT. XP/level/quest/loot hacen transición por una autoridad del Sim y no duplican recursos ni premios.
- `CombatActionGraph`, `AimContracts`, `EquipmentAdapters`, `SaveVersioning` deben ser interfaces estables para que futuras mejoras de upstream no obliguen a reconstruir todo el juego.
- Editor original `appearance_customizer.ts` y `modular.ts` se reutilizan; adaptador elimina dependencia visible del `PlayerClass` y preserva Rig_Medium.

## 3. ANDROID-FIRST: producto, UX y presupuesto de build
**HIGHFLY no desarrolla ni lanza versión desktop nativa.**
- Producto principal: Android horizontal. Primero el laboratorio móvil WebGL/PWA offline-first servido desde GitHub Pages aislado; empaquetado Android con Capacitor/aplicación nativa cuando el release lo requiera. Ambas superficies usan el **mismo** gameplay y controles Android; no son juegos distintos.
- Samsung Galaxy S23 Ultra pantalla horizontal es el dispositivo de aceptación prioritario. Usar otros Android para compatibilidad de gama media en fases finales.
- Input táctil como diseño principal, no como adaptación de teclado/mouse: joystick camera-relative 360°, cámara independiente, hold/drag/release para skills, multitouch, Android back, notches/insets, rotación bloqueada, pausas/reanudar, safe areas y accesibilidad.
- Rendimiento prioritario: CPU/GPU móvil, consumo térmico y batería, FPS medidos, memoria WebGL y texturas, draw calls, carga progresiva, peso de recursos, offline cache/actualización y restauración de sesión.
- **No invertir en** empaquetado Electron, Windows, Linux/macOS desktop, UI específica mouse/keyboard, Steam, iOS, ni build de servidores de PC sólo por defecto. Si el servicio online o backend es requerido más adelante, se diseñará separadamente del cliente Android.
- Conservar Linux/Node y navegador desktop para edición, compilación de WebGL, tests Sim/TS, inspección de logs y depuración remota Android. **Desarrollar en PC no significa lanzar en PC**.
- CI de F0 en adelante: smoke rápido unit/tsc + build Android-target WebGL; browser móvil emulado; gate de dispositivo físico S23 antes de aprobar. No repetir 103 etapas de CI históricas como parte de cada entrega.

## 4. Build/Release versionados y recuperables
- Separar `core_version`, `content_version`, `save_schema_version` y `approved_upstream_sha`. Registrar el artefacto exacto que ejecuta Android y contenido cargado.
- Nunca sobreescribir un save anterior con esquema incompatible; migración gradual, snapshot/restore y tests de carga de versiones previas.
- No activar una nueva build ni descargas grandes sin probar PWA cache/service worker; invalidación con versión/hashes para evitar código mezclado y activos antiguos.
- Mantener manifests de assets y lock de licencias; los modelos, sonidos y animaciones se actualizan por lotes verificables.
- Para APK/AAB futuro: configurar versiones Android, canal beta separado, instalación/actualización y firma estable antes del primer release. La implementación de esa etapa NO está hecha.

## 5. Gate de aceptación Fase 0 relacionado
- Reconstrucción SOURCE y CLEAN funciona sin R39/R40 overlays en el runtime de CI.
- Artefacto inicial WebGL está disponible para auditoría. **No es aún una fuente consolidada persistente en la rama y no certifica gameplay físico**.
- Crear fuente editable con contratos de integración claros, tests y una única ruta de build Android-target WebGL.
- Documentar inventario de capacidades reutilizables del editor original y clases, sin añadir selector de clase en la experiencia HIGHFLY.
- Confirmación del usuario para deploy/publicación; main/Pages quedan intactos.

## 6. Estado de evidencia (2026-10-19)
- Primera ejecución FOUNDATION-00 #39247299390 falló TypeScript por incluir tests legacy Electron/desktop y onEvade obsoleto: **corregida la selección de tests**.
- Segunda ejecución FOUNDATION-00 #39247682205: **success** en reconstrucción CLEAN, inventario del editor y nueve escuelas, paquete de fuente, TSC, cinco tests objetivo y build WebGL. Artefacto #12184465882.
- No se ha certificado en Samsung físico, no hay release Android nativo, ni se ha materializado aún el árbol `src/` final y permanente en la rama.
