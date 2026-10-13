# HIGHFLY SF4 — Integración sin RUN (2026-10-13)

## Estado verificable
- Rama aislada: `highfly-sf4-native-fusion-safe-implementation` desde SF3 commit `8e753a2960d19cddb58b0cd157dbb06c5187fd5c`.
- Ningún cambio a la rama `main`, Pages o publicación de SUPREME.
- **No lanzar workflows** hasta autorización explícita del propietario.
- V9.1 tiene certificación previa 9/9 de Capitán LV99 **para el combate anterior**. **No** prueba las fusiones SF4.
- SF3 inventarió 9×7 donantes y creó definiciones experimentales, pero algunas definiciones solo clonaban la primera habilidad. Eso NO certifica la fusión.
- SF4 cierra la activación insegura de SF3: solo **2 prototipos nativos de Priest**. Las otras 61 habilidades siguen pendientes de adaptadores específicos. Las 27 pasivas aún son catálogo, no efectos funcionales.

## Código añadido (SIN EJECUTAR)
- `game/c1/highfly_sf4_safe_fusions.ts`: control fail-closed, validación de todos los IDs/clases antes de cualquier mutación, instalación experimental de solo `hf_priest_s2` y `hf_priest_s3`.
- `game/c1/highfly_sf4_native_pilots.test.ts`: expectativas de 9 clases, 63 declaradas, 61 bloqueadas, daño/DoT, absorb/HoT, ranks, entrenamiento intacto y registro atómico.
- `game/c1/highfly_sf4_diagnostics.ts`: diagnóstico para las 63 recetas por ID, objetivo, elemento, rango, tiempos, requisitos de forma/aura, efectos especiales.
- `game/c1/highfly_sf4_diagnostics.test.ts`: contrato de 9×7, sin donantes extranjeros y detección de errores conocidos.
- `game/c1/highfly_sf4_real_sim.test.ts`: **4 pruebas nuevas redactadas pero NO ejecutadas**: Azote daño/DoT/coste/CD, Escudo absorb/HoT, rechazo de rango y bloqueo de desbloqueo temprano. Reutiliza `Sim`, no crea combate paralelo.
- `overlays/highfly_sf4_native_pilots.py`: instalación opcional en *checkout desechable*, que sustituye el registro inseguro `installHighflySF3Fusions` por `installSf4NativePilots`; requiere `VITE_HIGHFLY_SF4=1` para habilitarlo. **No ejecutar sin permiso para probar.**

## V10 — controles y pruebas adicionales (NO ejecutados)
- Registro previo atómico: validar destino de las nueve clases y slots duplicados antes de escribir la primera habilidad.
- Comprobar que ningún donante tenga `learnLevel` superior al nivel de desbloqueo de la fusión.
- Verificar escuela, geometría de objetivo, rango, escalado, proyectiles y condiciones de lanzamiento.
- Detectar action replacements, habilidades con cargas, donantes de nivel futuro y variaciones de casteo por rango en la matriz 9×7.
- El overlay aislado instala opcionalmente `tests/highfly_sf4_real_sim.test.ts` para futuro test; **ninguna prueba se ha ejecutado en SF4/V10, ningún RUN fue lanzado**.

## Prototipos candidatos a simulación (NO certificados)
1. Priest S2, **Azote Mental** (`mind_blast` + `shadow_word_pain`): usa un impacto de sombra más 30% del daño periódico original del donante. La combinación hereda enfriamiento y coste del golpe principal; snapshots actualizados por rangos. No se asegura la activación de procs específicos de la definición vieja.
2. Priest S3, **Escudo Renovador** (`power_word_shield` + `renew`): absorb de escudo más 30% del HoT original. Los objetivos permanecen amistosos. No se asegura la activación de los procs de doctrina que dependan de la habilidad antigua.

**30% es valor provisional de equilibrio**, no una cifra certificada de daño/curación.

## Ejemplos de bloqueos reales que YA se detectaron
- Warrior S1: `heroic_strike` usa **on-next-swing**, no un golpe directo estándar.
- Hunter S3: `frostjaw_trap` crea una trampa mientras `concussive_shot` exige objetivo.
- Rogue S1: `backstab` necesita arma/espalda y `ambush` tiene condiciones propias.
- Priest S1: `scouring_mercy` requiere revisar redirecciones/curación propia.
- Shaman S4: `unleash_weapon` tiene `effects: []` y ruta de ejecución procedimental.
- Mage S1: **frost + fire** no mantiene ambos elementos copiando una lista de efectos.
- Warlock S5: `summon_imp` y `summon_voidwalker` reemplazan entre sí la mascota; no invocan dos simultáneamente por diseño original.
- Druid U1: `grove_awakening` y `wildwake` **resucitan**; no producen la zona ofensiva del PDF.

## Puertas para habilitarlo (TODAS PENDIENTES)
1. Revisar y ejecutar en laboratorio los tests de SF4; `tsc --noEmit` contra código ensamblado.
2. Verificar rutas de Sim para DoT/HoT y lanzamiento, con tests que gasten coste, apliquen efecto, respeten CD/rango y no modifiquen Training.
3. Desarrollar un adaptador **por familia mecánica**, nunca un segundo Sim: posiciones, melee/espalda, mascotas, formas, mezclas elementales, buffs, curación dual.
4. Sustituir progresivamente las 61 definiciones bloqueadas por fusiones realmente ejecutables. No registrar habilidades vacías o copiar el donante y llamarlo fusión.
5. Conectar desbloqueos LV1,5,10,15,20,25,30 y migraciones de guardado al HUD. Los personajes no pierden habilidades originales hasta que haya equivalencias reales.
6. Conectar 27 pasivas funcionales; gema/comida en mismo bloque inferior; dos medialunas×5, básico fijo a la derecha, tres ÚNICAS bloqueadas.
7. Terminar geometrías 3D y cancelación de apuntado Mobile Legends para cada tipo, sin redirección automática en fallos manuales.
8. Completar dominio M1–M10 sin otorgar STR/AGI/VIT/PER/INT.
9. Realizar **9/9 simulaciones NUEVAS** con uso verificable de las siete skills por clase y todas las variantes de combo, y luego QA físico S23 Ultra.
10. Mantener LV100+ y Pages deshabilitados hasta aprobación.

El objetivo es progresar en código sin declarar GREEN algo que todavía no fue ensayado.
