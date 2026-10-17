# HIGHFLY ORIGIN — CLEAN COMBAT R1 · auditoría técnica y plan seguro
**Fecha:** 2026-10-17  
**Estado:** AUDITADO / rama aislada creada; **NO DEPLY**, **NO BORRAR**, **NO MIGRACIÓN AUTOMÁTICA**.  
**Repositorio:** `drakentzy07/cobalt-hollow-lab`. **Donante congelado:** `levy-street/world-of-claudecraft` commit `9b57e49c9676d75962700f828cc00a50a9a988b5`.  
**Rama de trabajo:** `highfly-origin-clean-combat-r1`, cortada de `highfly-origin-r23-multitouch-buffs` (certificado GREEN: Actions #38839051624).  
**NO** cambiar `main`, el sitio público, ninguna partida anterior ni los laboratorios históricos hasta aprobación explícita.

## 1. Veredicto sobre las bases

- **R23 = base táctica de recuperación:** compila con mundo completo integrando los parches GOLDEN/V15, HP/MP/Stamina, profesiones, monstruos y HUD Android con joystick/cámara, ataque manual, habilidades originales y bancos B1–B8. Certificado en el CI de integración #38839051624, **no equivale a aceptación en Samsung físico**.
- **R32 = fuente de ideas y pruebas, no base del HUD CLEAN:** su overlay `overlays/highfly_origin_r32_p2_playable.py` reubica `#actionbar`, inyecta estilos `!important`, y monta un equipo desechable de 4 skills. La ejecución #39032884915 acaba GREEN en Chrome emulado, sin prueba física suficiente. **No aplicar** ese overlay ni sus reglas CSS al nuevo HUD.
- **Clean V1 = respaldo histórico, no base de lanzamiento:** es anterior a muchos sistemas que preservamos.
- Diferencia R23 → R32: unas 100 confirmaciones adicionales en el historial del comparador y 52 archivos cambiados/añadidos, en su mayoría laboratorios, workflows y módulos de estudio posteriores. Importar novedades una por una con pruebas, no cherry-pick masivo.

## 2. Diseño de entrada y personaje

1. **Una sola identidad ORIGIN Hunter, sin selector de nueve clases.** Las nueve clases donantes son escuelas aprendibles, no identidades del jugador. El donante técnico puede conservar un valor `PlayerClass` interno por compatibilidad; nunca convertirlo en restricción de escuela.
2. Entrada única: **nombre + aspecto masculino/femenino**. El perfil actual del laboratorio guarda por nombre (`KEY_PREFIX` en `game/c1/highfly_origin_trial_runtime.ts`); **todavía permite múltiples registros al variar el nombre**. Hace falta una clave de identidad persistente única y un proceso explícito para migrar viejos nombres, SIN sobreescribirlos.
3. Hunter nuevo nivel 1: sin equipo de arma/escudo/pechera; modelo modular con `M_Loin` o `F_Loin` + `F_Top`. `src/render/characters/modular.ts` compone ropa interior ya incluida cuando `worn={}`. **El Sim no nace desarmado:** `src/sim/sim.ts`, `addPlayer`, asigna `classDef.startWeapon`, `startChest` y opcional `startOffhand`. Adaptar esta ruta SOLO para Hunter ORIGIN NUEVO y verificar que la barra de equipo autoritativa y el renderer concuerden; no ocultar armas solo con CSS.
4. **Primera misión «Descubrí tu identidad»:** hablar con el guía/activar el panel, abrir `Personaje → Apariencia`, editar y pulsar **Guardar**. Solo guardar válido completa misión; abrir, cancelar y cambiar la UI no cuentan. La recompensa es cosmética/tutorial, no un aumento artificial de STR/AGI/VIT/PER/INT.
5. Reutilizar `src/ui/appearance_customizer.ts` (`mountAppearanceCustomizer`) y `CharacterPreview.setModular` originales. NO copiar un segundo editor. El original admite cabello/rostro/ojos/género/color/accesorios/outfit; el panel de rediseño de selección (`src/ui/charselect_redesign.ts`) es un token de **un solo uso**, no un editor libre intramundo. HIGHFLY necesita un adaptador propio de personaje que autorice cambios repetidos.
6. Importante persistencia: el donante online guarda la apariencia en la columna `characters.appearance`, NO en `CharacterState`; `Sim.addPlayer` recibe `opts.appearance`. El Hunter offline ya escribe `OriginTrialSave.appearance` separadamente. Debe comprobarse roundtrip visual+estado y que nunca altere gear ni inventario ni maestrías.
7. Mantener la adaptación modular KayKit/Rig_Medium, clips, sockets, escalas y materiales; NO generar cuerpo o ropa interior externos.

## 3. Combate/HUD: simplificar sin destruir

- **HUD fijo visible:** siete skills normales **S1–S7**, ATK manual 1-2-3-4 elemental (golpe 4 solo con gema compatible), salto/doble salto, dash, USAR, GEM, consumibles y HP/MP/Energía. Joystick 360° a izquierda y cámara independiente a derecha, ambas simultáneas. Mantener menú nativo «Más».
- Buffs/soportes en banco independiente existente B1–B8 o interfaz de apoyo compacta validada; no contaminar S1–S7. Las dos pasivas son internas, no botones.
- **Tres ÚNICAS secretas:** en el juego inicial **NO crear slots visibles, candados, espacios, contadores ni etiquetas E1–E3**. Instanciar visualmente cada poder solo cuando se desbloquee. El modelo de datos puede reservar capacidad sin pintar controles.
- Hoy R23 conserva 18 slots (S1–S10/B1–B8); `game/c1/highfly_origin_r17_hud.ts` y `highfly_origin_r18_loadout.ts` contienen el modelo heredado. NO `display:none` indiscriminado a `#actionbar`; usar su anillo móvil real para slots 1..7 y ocultar/retirar SOLO 8..10 de interfaz tras verificar sus listeners, el `mobile action ring` y accesibilidad táctil. No usar el P3 `#actionbar` reparent al `body`.
- Migración SIN PERDER: snapshot de 18 slots, respaldo recuperable de S8–S10 si contienen habilidades, reaplicación a S1–S7 por elección del usuario (si ocupados), nunca mutación silenciosa del guardado. Validar dos recargas, rollback, buffs, combate y cooldown.
- La clasificación actual `originSkillRole` y R19 restringen temporalmente identidad/condiciones. No remover el contrato autoritativo `Sim.castAbility`, daño, apuntado, LOS, cooldown, costes ni validaciones de armas. Los R24–R31 se portan opt-in SOLO después del R1 UI GREEN.

## 4. Escuelas y recursos

- Nueve escuelas libres: Warrior/Paladin/Hunter/Rogue/Priest/Shaman/Mage/Warlock/Druid. Descubrir, aprender, entrenar, dominar; no adquirir automáticamente todo al crear Hunter. `highfly_origin_native_spellbook.ts` y `highfly_origin_hunter_profile.ts` ya dan puente de derechos y progreso, pero son aún incompletos para la maestría M0–M5.
- **HP permanece nativo**. **MP = Maná**; **`stamina` interna = «Energía» visible en español**. Clasificación inicial: habilidades físicas gastan Energía, mágicas Maná (`originCostDecision`); no renombrar la variable `stamina` ni el esquema de guardado todavía.
- Restricciones mecánicas especiales (Ira como combustible de efecto, cargas, Focus, devotion, fragmentos, transformaciones, habilidades `onNextSwing`, `spendsAllResource`, `gainResource`, `charge` etc.) necesitan **adaptador por habilidad** y cobertura de simulador. **Prohibido** admitir una habilidad bloqueada solo cambiándole `cost` o suprimiendo el guard.
- Mantener escalado nativo, animaciones, VFX, arma, alcance, escuela, requisito de quest, stealth, LOS, procs, semántica de impacto. Toda skill transversal necesita autenticación servidor + test de gasto + daño real + cast intercalado con ATK.
- El `highfly_origin_r19_selection` es catálogo de prueba acotado, no biblioteca universal definitiva. Ampliar después con auditoría por skill y rechazo seguro de excepciones.

## 5. Mundo, otros sistemas y guardados

Conservar assets donante, mundo, 64 monstruos LV21–99 + 16 élites/capitanes donde apliquen las ramas aprobadas, campamentos, profesiones/forja/gemas, recetas, loot, zonas y progresión 1–99. **Cuidado:** pasar CI de R23 verifica el ensamblado auditado allí; no demuestra automáticamente que todas las incorporaciones futuras de otras ramas ya estén incluidas. Comparar contenido y contar definiciones por módulos antes de prometer paridad.
No tocar profile, experiencia, training-core, slots multisave previos, inventario, misiones originales ni hashes de equipamiento; toda migración se hace con copia, esquema versionado, roundtrip y restore. La misión de apariencia obtiene marca propia en el save ORIGIN y debe poder reiniciarse en prueba sin duplicar recompensas.

## 6. Espacio de GitHub — observaciones verificadas

- Repositorio REST GitHub `size`: **34054 KB** reportados (~33.3 MiB), no es el tamaño de cada versión de Pages.
- Publicación R32 Pages `38984404410`: **951100528 bytes sin comprimir, 6789 archivos**. `github-pages` artifact del mismo RUN: **736797162 bytes comprimidos** (~702.7 MiB). Otra publicación previa #38980358902 contenía artifact ~699.9 MiB. **Artefacto, repositorio y web se cuentan por separado.**
- El workflow de publicación fija gate propio `total>=995000000` que bloquea a partir de ~995 MB; margen respecto al último report: **43.90 MB decimales**, no una cuota de 44 MB para el repo Git.
- El último deploy añadió solo **4 JS nuevos**; más de 6600 rutas fueron idénticas al artefacto descargado. Esto sugiere buscar duplicados de laboratorios y recursos, pero NO autoriza asumir que las rutas son borrables.
- Auditoría complementaria activa: `scripts/highfly_clean_pages_footprint_audit.py` + workflow `highfly-origin-clean-combat-pages-footprint.yml`, leyendo el artifact Pages verificado #38984404410. Inventario por subcarpeta, archivo, extensión y SHA-256 de duplicados **SIN** extraer, borrar ni publicar. Esperar su JSON antes de proponer lista concreta de eliminación.
- No fue posible obtener un saldo completo de cuota de Actions del usuario desde el endpoint permitido. Duplicados de outputs no equivalen a almacenamiento consumido por ramas Git. Mantener hashes/fuentes congeladas.
- Primer plan de limpieza (NO EJECUTAR): clasificar labs en público, rollback, descontinuados y experimentales; determinar URLs enlazadas por el launcher/PWA; construir manifest, copias/redirects si procede, solicitar aprobación por nombre; emitir Pages en CI con contador + hash de archivos protegidos y comprobar con Android. Separar reducción de retención de Actions.

## 7. Orden de implementación y puertas de aceptación

**P0 (este commit):** rama aislada R23 + auditoría independiente y contrato; ningún deploy/ninguna limpieza destructiva.

**P1 (primer playable):** Hunter nuevo hombre/mujer, mismo perfil, sin gear y sin creador obligatorio; original modular underwear. Probar hombre/mujer S23 + persistencia sin alterar saves anteriores.

**P2 (primera misión):** reutilizar editor original DENTRO del mundo, guardar apariencia en ruta correcta, meta de misión solo al SAVE, replay/cancel, sin token online de rediseño heredado.

**P3 (HUD seguro):** mantener anillo R23 vivo y reducible a S1–S7; ATK/USAR/GEM/joystick/dash/salto y menús; backups de 18 slots, sin UI de únicas secretas; probar táctil/visibilidad/hit testing/overlap en 844×390 y Samsung físico.

**P4 (nueve escuelas/maná/energía):** ampliar biblioteca y portear recursos excepcionales por skill con test nativo. No sacar guard de servidor a ciegas.

**P5 (paridad+limpieza):** QA completa de mundo/profesiones/loot/progreso y save roundtrip; comparar sitio nuevo vs público por hash y decidir propuesta de limpieza SIN borrado preventivo. Publicar solo tras todos los gates y aceptación humana.

### GATES de verdad

- TypeScript + Vitest + compilación WebGL GREEN; tests de servidor de costes/known/equipo, formato de guardado y migración; boots en Chrome Android landscape: **todos los 7 botones visibles y táctiles**, 2 pulgares, cámara sin rebotes, buffs aparte, ATK 1-2-3-4 con gema, **USAR responde**.
- Screenshot con personaje masculino y femenino sin arma ni pechera; la primera quest se marca solo al guardar; partida restaurada conserva rostro, cuerpo, equipo ganado, materiales y posición.
- ÚNICAS ausentes del DOM/layout antes de desbloquear. No hacer visible E1–E3 por defecto.
- Patrón de publicación: nuevo sublab o Pages preservando versión anterior, nunca sobrescribir el público original por un RUN de prueba; auditar presupuesto de tamaño ANTES de distribuir WebGL.
- **GREEN en emulador NO equivale a aprobación en S23 físico.**

## Referencias de auditoría

- R23 GREEN: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38839051624
- R32 GREEN solo automatizado: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39032884915
- Pages R32 deploy verificado: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38984404410
- Claude donor `src/ui/appearance_customizer.ts`, `src/ui/charselect_redesign.ts`, `src/render/characters/modular.ts`, `src/sim/sim.ts`
- Repo `overlays/highfly_origin_r15_r16_playable_trial.py`, `game/c1/highfly_origin_trial_runtime.ts`, `highfly_origin_r17_hud.ts`, `highfly_origin_r18_loadout.ts`, `highfly_origin_universal_resources.ts`, `docs/highfly-origin/ADR-001-hunter-nueve-escuelas-7-mas-3.md`.
