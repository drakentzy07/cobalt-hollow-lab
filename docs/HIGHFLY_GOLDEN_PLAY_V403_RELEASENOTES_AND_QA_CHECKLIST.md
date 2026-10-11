# HIGHFLY GOLDEN PLAY V4-03 — QUÉ ESTÁ INSTALADO, QUÉ VER Y QUÉ QUEDA

**Corte documental: 11/10/2026** · repositorio ÚNICO autorizado `drakentzy07/cobalt-hollow-lab`.  
**NEXUS / NEXT-CORE prohibidos:** no se usan como runtime, fuente de assets, contenido, hosting ni repositorio de salida. El intento anterior fue cancelado antes de publicar.

## Dos versiones distintas: NUNCA confundir
### STABLE en Pages — ya utilizable
- La web actual pública es **https://drakentzy07.github.io/cobalt-hollow-lab/v4-02/** y el shell **https://drakentzy07.github.io/cobalt-hollow-lab/**; ambos HTTP 200 el 11/10/2026 en run read-only [38136465158](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38136465158).
- Esta es la demo GOLDEN anterior disponible hoy. No inferir de la última rama la versión desplegada.
- Qué verificar al entrar: creador Offline en español, nueve clases, personaje modular real, joystick izquierdo/cámara derecha, HUD móvil GOLDEN, combo, Training Core, inventario, forja y botón GEM según V4-02 PR18/19.
- No asumir que los monstruos P09, los portales P06–P07 ni el inventario LV21–99 están publicados sólo porque una rama GREEN los contiene.

### PLAY V4-03 GOLDEN — rama release candidate no publicada
- Fuente: `highfly-play-v403-release-candidate`, congelación P10 GREEN [RUN 38141812753](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38141812753), SIN Nexus. Materializa el **donor ClaudeCraft v0.44.0 SHA 9b57e49** más la capa GOLDEN CLEAN + PF6, PR1–PR16, P07–P09. No otro cliente/Sim.
- Se incorporó `release/highfly_play_v403_legacy_saves.py`: espacio nuevo y permanente de partidas `highfly-play`, fallback de lectura **solo** desde `highfly-offline` V4-02 y `highfly.offline.primary.v1`. El anterior no se edita ni borra. Un autosave moderno crea su copia nueva; próximas versiones 4.04/4.05 deben seguir usando las MISMAS claves `highfly-play`, NO namespace por versión.
- `release/highfly_play_v403_save_migration.test.ts` cubre 9 clases × guardado V4-02 en localStorage → READ ONLY → guardado PLAY → reconstrucción del mismo Hunter. FALTA prueba física de IndexedDB real y export/import; no certificar aún guardados reales de usuarios.
- P10: nueve clases, un mismo Hunter y `Sim`, Training STR/AGI/VIT/PER/INT real separado, nivel máximo NORMAL 99, classes, movimiento GOLDEN, cámaras y HUD editables, combo original 1-2-3, Fuego/Hielo/Rayo y cuarto ataque CON gema; profesiones nativas y expansión PR1–PR13, gemas PR14–PR16, loot cadáver/forja/guardado nativo, zonas originales ClaudeCraft conservadas, ocho expediciones LV21–99, 16 campamentos/32 enemigos outdoor opt-in, 64 plantillas normales + 16 élites/capitanes P09 (NO son 80 modelos 3D independientes), modo de desafío 6 normales+1 élite+1 capitán por instancia. NO cinco legendarios especiales ni skins premium.
- Al comenzar LV1: se ve contenido original donado, los ocho accesos LV21–99 están BLOQUEADOS (sin atajo gratuito). En LV21+: botón **Más → Cacerías** expone 8 entradas, portales caminables y enemigos adecuados a cada tramo. El test CI usa `sim.setPlayerLevel(21)` SOLO en fixture, jamás en runtime.
- UI S23 esperada: Nine-class selector, preview modular Warrior, joystick 360°, cámara independiente táctil, Attack, Jump, Evade, diez slots y botón Training visible; GEM/guía de tres elementos y selector compacto de profesiones/crafting. La URL de preview aún NO existe públicamente.
- V4-03 no está balanceado 100%: P11 auditó 212 recetas integradas con nivel de receta nominal máximo 42, 10 oficios/profesiones hasta skill 125, 80 variantes monstruos y 8/11 tramos con brechas. Las profesiones 125 NO son Hunter LV125. Extended 100+ sigue desactivado, máximo NORMAL 99.
- Actual P10 GOLDEN mobile emulado pasa CI; NO equivale a FPS/p95 medidos en Galaxy S23 Ultra físico. Ocho biomas P02I de laboratorio NO son ocho escenarios 3D artísticos definitivos.

## Ruta exacta para actualizar sin romper
1. Nunca tocar V4-02, Pages, saves, Monster Lab y Skin Lab hasta tener snapshot íntegro/hash de TODA la web.
2. **GOLDEN PLAY V4-03 test CI**: `.github/workflows/highfly-play-v403-golden-release-qa.yml` compila WebGL real y prueba navegador S23 emulado; artefacto únicamente NO DEPLOY.
3. **Pages asset audit**: `.github/workflows/highfly-play-v403-pages-asset-audit.yml` reutiliza el build P10 GREEN y compara remotamente archivos 3D para estimar si un `/v4-03-preview/` bajo el MISMO sitio puede compartir assets sin superar 1 GB ni tocar otras rutas.
4. **Gate final**: Chrome IndexedDB cross-build V4-02→V4-03 real, comprobar nombre/clase/XP/items/gemas/profesiones/Training, copia original y rollback; luego snapshot completo de Pages, límites de bytes y assets con SHA, y sólo después lanzamiento URL.
5. DEV permanente `highfly-dev-main` trabaja la expansión de contenido/recetas/economía LV50–99 según P11, combat sim P10 y futuras skins/monster legendary en carriles separados. Nada se integra a PLAY sin pruebas y sin un Hunter nuevo.

## Guía de reporte para cada entrega
**Versión:** {PLAY publicado / PLAY candidato / DEV}.  
**RUN + HEAD SHA:** {solo GREEN si Actions lo confirma}.  
**Enlace jugable:** {Pages SOLO si HTTP 200 y game smoke}.  
**Qué debería verse:** {3–8 verificaciones visuales y funcionales}.  
**Qué NO está aún:** {contenido/balance pendientes}.  
**Guardado y rollback:** {migración probada vs no probada}.  

Nunca anunciar candidato de artifacts como publicada en Pages. Este archivo acompaña la rama PLAY, no dispara despliegues.
