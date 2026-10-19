# FOUNDATION-00 — Editor de personaje ClaudeCraft: evaluación de rescate
**Fecha:** 2026-10-19. **Tipo:** análisis estático directo de ClaudeCraft v0.44.0 pin `9b57e49c9676d75962700f828cc00a50a9a988b5`. **Sin modificaciones de gameplay**.

## Resultado de lectura de fuentes: REUSE, NOT REWRITE

### Componente correcto
- `src/ui/appearance_customizer.ts` es el verdadero editor de apariencia: su cabecera describe tabs Body / Face / Hair / Style / Share; exporta `mountAppearanceCustomizer(host, options)`, `AppearanceCustomizerOptions` con `onChange(next: ModularAppearance)`, y controles gender male/female. El componente comunica cambios normalizados a vista previa.
- `src/render/characters/modular.ts` declara `ModularAppearance`, `Gender = 'male' | 'female'`, partes de pelo, rostro, estructura corporal, armaduras y `MODULAR_WARRIOR_KEY = 'player_warrior_modular'`. Usa el mismo `Rig_Medium` modular. Reconstrucción de piezas conservando skeleton, animaciones, skins y sockets.
- `src/ui/charselect_redesign.ts` YA monta `mountAppearanceCustomizer` para rediseño y maneja draft/cancel/save; su `previewModular(..., cls: PlayerClass, ...)` y `classArmorSet(c.class)` prueban que la vista y armadura aún dependen de clase.
- `src/render/characters/preview_appearance.ts` usa `PreviewAppearance.cls: PlayerClass` y deriva visual/layout a partir de clase; requiere adaptador de apariencia y presentación del Hunter universal.
- `src/ui/character_appearance.ts` es un selector histórico de skins de clase / mech, NO el creador modular principal. Evitar confundirlo con el editor.
- `src/sim/content/classes.ts` aloja catálogo nativo de nueve clases y habilidades. No borrarlo ni globalmente alterar la enumeración `PlayerClass` en F1.

### Plan de integración del editor en la Fase 1
1. Preservar componentes de UI y núcleo modular originales sin duplicarlos.
2. Introducir `OriginHunterIdentity` (ID estable + apariencia `ModularAppearance` y versión de esquema) y adaptador de entrada/preview independiente de elección de clase.
3. Tomar una clase *carrier* interna de compatibilidad sólo donde el Sim legado lo exija, no visible ni seleccionable por usuario; no confundir carrier con identidad o permisos reales de habilidad.
4. Separar clase original de configuración visual/armadura. Render del equipo se define por piezas equipadas, rig y slots; las armaduras originales podrán reutilizarse y adaptar sus modelos antes de quitar gates de clase.
5. Una sola ruta de creación -> preview -> confirmación -> un Hunter en el mundo -> guardar/cargar y volver al mismo avatar; no pantalla doble de ENTRAR ni personaje de prueba duplicado.
6. Compatibilidad de guardados: no mutar saves legacy sin migración versionada, backups y tests. Guardar JSON/estado real con las mismas fuentes de verdad Sim/Training.

### Criterios de aceptación futuros
- Masculino y femenino: editor completo abre, manipula los controles y mantiene el `Rig_Medium` en escena.
- Cambio de pelo, rostro, colores y equipamiento consistente, sin huecos ni bodypaint.
- Persistencia exacta de apariencia tras Save/Reload sin crear otro personaje.
- No hay selector de las nueve clases en creación; pero las nueve escuelas existen en biblioteca y no fueron borradas del donante.
- Tests de UI/preview y pruebas visuales Samsung S23 Ultra 844x390 horizontal. Emulador solo NO certifica hardware físico.
- En F0 sólo verificamos existencias, rutas y build. Nada de esto se declarará terminado hasta implementar F1.

## Riesgos identificados
- El `charselect_redesign.ts` usa `classArmorSet(c.class)`: esconder el selector sin cambiar esta dependencia dejaría apariencia y armaduras ligadas a clase.
- Los modelos de armadura no son automáticamente compatibles con todos los cuerpos; surface conform y sockets requieren QA.
- Los guardados legados usan campos de clase: conservar su formato y migrar con fallback tipado, no eliminar de golpe.
- Los mundos/nivel/AI/casting legacy aún consumen `PlayerClass`; separamos identidad visible del carrier de compatibilidad, no hacemos replace global de nueve clases.

**Decisión:** salvar 100% del sistema editor que sea compatible y realizar un adaptador Hunter; evaluar cambios de origen en unidades probadas, no mediante insertos de texto de R39/R40.
