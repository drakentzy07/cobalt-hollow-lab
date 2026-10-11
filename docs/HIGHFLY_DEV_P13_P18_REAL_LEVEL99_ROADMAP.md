# HIGHFLY DEV — CADENA COMPLETA LV1–99 Y FUTURO EXTENDED 100+

Estado al 11/10/2026: P13 GREEN, pero NO publicado en Pages ni plenamente balanceado.
Regla: ClaudeCraft v0.44.0 congelado + HIGHFLY, un único Hunter/Sim, conservar V4-02 y entrenamiento físico como única fuente de STR/AGI/VIT/PER/INT.

## P13 — implementado y probado (RUN #38156197878)
- 15 armas LV50/60/70/80/90 y 15 recetas nativas de weaponcrafting, con gating de nivel de equipo, cinco niveles de skillReq 75–125 declarados, estación forge y aprendizaje entrenador.
- Las nueve clases entran en tres grupos de proficiencia: guerreros (warrior/paladin/shaman), exploradores (hunter/rogue) y hechiceros (mage/priest/warlock/druid).
- 100% sobre BASE_ITEMS/ITEMS, ALL_RECIPES, MOBS, LootEntry y canEquipItem originales, sin crear motor paralelo.
- Reactivos extraídos de las familias HIGHFLY o material básico del donante; probados presentes en enemigos LV50–99 correspondientes.
- Armas nuevas sin primary stats del entrenamiento; Soulbound y sin comercio hasta validar mercado y costos.
- ADVERTENCIA: test de registros, procedencia de materiales y equipabilidad, no todavía un ciclo completo de trainer→skill→forge→item→equip→save con recursos conseguidos legalmente.

## P14 — próximo: recetas, gemas y oficio reales
- Probar manual y automáticamente trainer/estación y skillReq alcanzable para 15 recetas P13, sin consumos fallidos ni economía infinita.
- Conectar P13 a UI/tooltip, materiales y modelo visual reutilizado; confirmar que todas las armas se ven correctamente en combate.
- Escalado de Fuego/Hielo/Rayo con 4º ataque, fuente legal de reactivos, conservación de gema al actualizar guardado y tuning por rango.

## P15 — profesiones LV1–99
- Mantener skill de oficio 125 independiente de nivel del Hunter; recetas de forja, cocina, minería, pesca, alquimia, encantamiento, joyería, textil y curtido.
- Cada etapa debe cerrar material → receta aprendida → estación → producto útil → equipar/consumir, con XP de oficio y no Training stat regaladas.

## P16 — loot y monstruos
- Conservar originales LV1–20; reutilizar 64 variantes HIGHFLY 21–99 y 16 élites/capitanes con IA, drops, cadáver, cobre y estadística diferenciados.
- Balancear tasa de drop, crafting sinks, pociones y materiales según TTK, energía y supervivencia reales por etapa.

## P17 — balance 9 clases x 11 bandas
- Simular con equipo legal (no fixtures gratuitos), nivel igual/superior, uso de habilidades, ATK4, curación/mana, dodge/parry, downtime, muerte y resurrección.
- Probar ascenso natural con sesiones de entrenamiento, XP, rangos y quests; no confundir bot limitado con balance total.

## P18 — publicación PLAY y después EXTENDED
- Publicar solamente tras preservar INTEGRALMENTE los archivos Pages GOLDEN V4-02 + laboratorios y confirmar nuevos links HTTP/browser.
- Antes de liberar actualizar Hunter: migración V4-02→V4-03 en IndexedDB real con Training y gemas, respaldo exportable/rollback.
- Medir WebGL en Samsung S23 Ultra físico, no sólo Chrome emulado; biomas especiales/skins no bloquean primera jugada.
- Extended nivel 100+ DESACTIVADO hasta certificar LV99 normal. No mezclar oficios 125 con nivel Hunter.

Referencias GREEN: P10 38148356731, P11 38142361089, P12 38145482382, P13 38156197878.
En cada actualización comunicar: versión publicada, candidato, nuevos sistemas verificables y pendientes; nunca afirmar GREEN de balance si sólo pasó unit test.
