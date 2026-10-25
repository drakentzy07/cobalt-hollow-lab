# HIGHFLY CLEAN REBORN — ESTADO DE INTEGRACIÓN
Fecha: 2026-10-24/25. Rama: `highfly-clean-reborn-0447`.
Repositorio: `drakentzy07/cobalt-hollow-lab`.

## Validado en GitHub Actions
- C0 `40146298387` SUCCESS: recuperar upstream exacto v0.44.7 `493c35a108cef6c8aa290e8793107b1cd117886e`, integrar GOLDEN 360° + doble salto + FURY intent y Training Core, preservar **todos los archivos del directorio público**, TypeScript/Build.
- C2 `40146985401` SUCCESS: portar físicamente dash/evadir de F263 mediante parche mínimo `reborn/c2_f263_dash_patch.py`, agregar botón de prueba Android y señal de dirección de segundo salto. El Sim original conserva colisiones.
- C3 `40147157459` SUCCESS: poses 3D F263 en `src/render/characters/visual.ts`, vía `reborn/c3_flip_presentation.py` y función pura `reborn/c3_flip_pose.ts`; pruebas de 4 direcciones y retorno al estado neutro. Compilación y tests de Training Core VERDES.
- Los builds **NO se publicaron**, no se copiaron GLB/PNG de terceros al repositorio HIGHFLY ni se editaron los archivos originales del directorio `public` en CI.

## No está validado todavía
- Android S23 Ultra: HUD/escala/fullscreen, visualización sin errores, dash tangible, mortal visible 360° y dirección, multitouch, colisiones, persistencia de guardados; GREEN CI no significa GREEN Android.
- Hunter verdaderamente sin clases y equipamiento universal (se recuperó el Training Core, no el sistema universal completo).
- ATK aéreo/corriendo + cuatro skills propias.
- Auditoría legal total: el inventario preliminar C0 informa 940 iconos/modelos marcados a sustituir y 1837 ilustraciones para clasificación; son grupos conservadores, **no** afirmaciones de ilegalidad para todos esos archivos. Los recursos `With the project only` están autorizados dentro del fork, pero no como biblioteca suelta. No distribuir nada marcado `No, permission required`.
- Campana del tutorial: identificar clave exacta antes de concluir su licencia. `tolling_bell` figura en créditos como `With the project only`.

## Pages
- `main` conserva G6 y la vista `/c204/`; **no se borró ningún Pages**.
- No hay incompatibilidad técnica que requiera borrarlos mientras REBORN sea rama aislada.
- No publicar REBORN hasta cerrar activos restringidos, abrir entrada apropiada y aprobar S23.
- Cuando se publique REBORN, reemplazar selectivamente el sitio actual y retirar laboratorios viejos innecesarios en publicación única; mantener copia fuente y no borrar guardados/localStorage.

## Enlaces de verificación
- C0 https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40146298387
- C2 https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40146985401
- C3 https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40147157459

## Próxima prioridad
1. C4: cerrar la whitelist de recursos con rutas exactas y sustitutos propios/CC0; no usar sanitizer G6 ni placeholders de una única imagen azul.
2. C5: Hunter universal, creador/menu, guardados aislados, HP/Mana/Energía.
3. C6: preparar preview legalmente publicable y visualmente consistente; comparar S23 con versión GOLDEN anterior; validar 4 skills y después seguir expandiendo.
