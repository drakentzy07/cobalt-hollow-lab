# HIGHFLY ORIGIN P5 — primer test LAN privado en Samsung S23 Ultra

## Punto de partida inmutable
- Rama nueva `highfly-origin-v020-p5-local-s23-play-20261028` creada desde **ffd1b8dc56492335c171195adcb338162ecff94d**.
- Run base **[40776437532 GREEN](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40776437532)**, ART253 + FURY P4B; 253 iconos de reemplazo, mundo real, persistencia, controles FURY y compilación verde.
- Código upstream original v0.20.0 inmovilizado en `4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25` (tag `v0.20.0`). El `package.json` original declara versión 0.19.0 aun en el commit etiquetado como 0.20.0, por lo tanto comprobar **SHA** y no asumir que se instaló una versión distinta.

## Modalidad de prueba
Se preparó el paquete para Windows `HIGHFLY_ORIGIN_P5_PRUEBA_LOCAL_S23.zip` en la conversación.
Contiene:
- `DOBLE_CLICK_PROBAR_HIGHFLY.cmd`;
- `PREPARAR_Y_JUGAR.ps1`;
- `LEEME_PRUEBA_LOCAL.txt`.

El bootstrap local no copia los binarios del upstream en este repo ni publica assets. Descarga las dos fuentes con Git directamente a `%LOCALAPPDATA%\HIGHFLY_ORIGIN_P5_TEST_LOCAL` sobre la PC del usuario. Comprueba sus dos SHA, ejecuta las mismas capas `P2 → P3 → P4A → P4B → ART253`, corre TypeScript, `npm run build` y vuelve a ejecutar:
```
node origins/v020/art/apply_validate.mjs --verify-dist <upstream/dist>
node origins/v020/art/detect_originals.mjs --check <upstream/dist> <hash-originales-locales>
```
Ofrece, de manera **optativa**, una vista local en `http://<ip-private-PC>:4173/play.html?highfly_p3=1`, usando Vite `preview` y solo mientras la ventana está abierta. El parámetro `highfly_p3=1` evita el tutorial y salta al mapa original como Draken LV1 para validar controles del mundo real. La portada normal se abre en `http://<ip-private-PC>:4173/`.

## Riesgos y decisiones deliberadas
- **No activar Pages, despliegues de Vercel, releases de GitHub, APK ni artifacts de CI de este build**, dado que CREDITS.md documenta activos generados bajo licencias de otras cuentas (por ejemplo Meshy paid plan y panoramas "Project asset") y el tercer-party runtime Reown/WalletConnect tiene cláusulas distintas a MIT; derechos de distribución aún pendientes de auditoría.
- Muchos modelos y escenarios del upstream se acreditan a KayKit, Quaternius y Kenney CC0; eso no autoriza todo el conjunto por extensión.
- Servidor HTTP local LAN no equivale a publicación en Internet, pero cualquier dispositivo en la misma red podría abrir el puerto. Usar solo una Wi-Fi privada bajo control del usuario, **nunca red corporativa o pública** ni abrir puertos en router.
- Si el HTTP LAN no es aceptado por alguna API del navegador, será necesario mejorar el método de entrega de test en una iteración futura.
- Esta prueba NO garantiza fluidez ni render físico en S23; permite medirlo. No es el HUD premium final, no hay mortal animado de cuatro direcciones ni clase universal final.
- Si hay problemas de red, pedir los errores exactos del CMD antes de cambiar la rama GREEN.

## Siguientes pasos después de la prueba real
1. Recibir video y reproducir glitch de dash, segundo salto, cámara, input simultáneo y rendimiento en S23 horizontal.
2. Auditar licencias restantes elemento por elemento antes de cualquier distribución externa.
3. Sustituir recursos no redistribuibles y recién entonces plantear Pages y APK.
