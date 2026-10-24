# HIGHFLY WORLD — reinicio limpio (24/10/2026)

## Punto de partida

- Fuente de juego: `levy-street/world-of-claudecraft` **v0.44.7**, commit exacto `493c35a108cef6c8aa290e8793107b1cd117886e`.
- Rama de HIGHFLY: `highfly-genesis-clean-0447`.
- Plataforma: Android (S23 Ultra) y WebGL por GitHub Pages.
- **La rama es un contenedor de herramientas/auditorías, no una copia de G0–G6.** La fuente de juego se descarga de upstream en cada RUN. Aunque la nueva rama nace del esqueleto Git del repo propio (`main`), jamás aplica ni usa los parches `highfly-world/g0..g6`.
- `main` y el sitio Pages que ya existe no se modifican durante el control inicial. Los guardados del navegador tampoco.

## Fase C0 — Verificar original antes de tocarlo

1. Descargar upstream por **SHA completo**, no por una etiqueta mutable.
2. Confirmar `HEAD`, que el árbol original está limpio y que su `CREDITS.md` contiene las **70 entradas registradas** con `No, permission required` (las mismas 70 en v0.44.0).
3. Calcular SHA-256 de una muestra de personajes KayKit, armas libres, monstruos, mapas de zona, retratos, ítems, e inventariar recursos.
4. Compilar el motor original en CI **sin aplicar overlay ni sanitizador**; validar tipado, WebGL y hashes del manifiesto de medios.
5. Guardar un manifiesto textual JSON de auditoría sin publicar la web ni distribuir los archivos de arte.

**Aceptación:** C0 debe dar verde sin modificar ni reemplazar un solo recurso. Un verde C0 prueba integridad y compilación; NO demuestra que funcione plenamente el HUD en Android.

## Fase C1 — Sustitución por licencias (después de C0)

- Conservar KayKit, Quaternius, Kenney, CC0 y los recursos etiquetados `With the project only` dentro del fork.
- Construir inventario **archivo por archivo** tomando `CREDITS.md` y mapeos de imágenes. Distinguir claramente `No, permission required`, `CC BY-NC` y recursos aún sin licencia clara.
- Por cada archivo restringido mantener la ruta con sustituto de formato válido o retirar deliberadamente TODAS sus referencias; nunca borrar un archivo que carga el motor.
- No convertir mapas regionales en cuadros planos, ni las armas KayKit en una sola espada, ni alterar el movimiento original.
- Construir y probar, y **solo después** plantear publicación vía `main` y QA en Samsung.

## Fases posteriores — una funcionalidad a la vez

1. Restaurar y medir nuestro Fury 360° / cámara GOLDEN; no aparece por arte de magia en v0.44.7.
2. Doble salto, dash y animaciones.
3. Hunter universal y guardados.
4. HUD/skills MOBA con apuntado.
5. Ampliaciones de mundo.

### Errores anteriores que no debemos repetir

- Sustituir indiscriminadamente `public/ui/**`.
- Sustituir indiscriminadamente `public/models/weapons/**`.
- Eliminar GLB obligatorios de NPC (Harbormaster).
- Cambiar el manifiesto de media después de generar los hashes.
- Usar rutas absolutas de /media en Pages sin contemplar /cobalt-hollow-lab.
- Interpretar "CI compila" como "Android funciona".
- Publicar desde la rama de desarrollo: el publicador Pages de esta instalación ya funcionó desde `main`.

**Estado:** C0 iniciada. La nueva rama no despliega y no borra el historial anterior.
