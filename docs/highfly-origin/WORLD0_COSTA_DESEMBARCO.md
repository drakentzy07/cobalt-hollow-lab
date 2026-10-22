# HIGHFLY WORLD ZERO — Costa del Desembarco
A real ClaudeCraft 0.44 engine preset, NOT a replacement 3D renderer.

## Experience
- ALL source terrain regions and procedural biomes from BUILTIN_WORLD; no original NPCs/camps/objects/service props.
- Spawn by Eastbrook's coast (-104,-52), one greeting NPC, one real native \`forest_wolf\` with original AI/loot.
- Three original catalog GLB ships, dock, harbor house, native-path sendero to first city.
- City ~80x70 yard rectangle: 4 towers, gate opening, outer walls, inn + tavern. Wall blocker segments form matching opening.
- Editor can load WORLD0 template at \`editor.html?world0=1\`; game can directly enter through \`index.html?world0=1\`.
- Editor export/import of the MapDoc uses the existing map sanitizer. Server saves and production player character never touched.

## Warrior Compatibility carrier
- Canonical runtime uses \`ORIGIN_HUNTER_CARRIER_CLASS = 'warrior'\` and \`originUniversalHunter = true\` in this isolated world.
- This is NOT deleting Warrior skills or relaxing restrictions for other player classes.
- WORLD0's map and player are ephemeral; no Draken WORLD/LAB saves are loaded/written.
- Some skill trainer and custom combat HUD surfaces require separate, native integration.

## Limitations (not hidden)
The old engine's terrain contains authored site-pads & special local features. The original renderer may show hardcoded decorations outside WorldContent; this preset clears **data-driven** NPCs and mobs, but a full visual/scene blacklist of built-in town scripts is not certified. GLB placements use editor-normalization, so sizes, ground seating, ship waterline, gate opening and wall colliders must be checked in Chromium/S23; placement-only collision is approximate. Rigidly guarantee just one native wolf spawned initially by one camp; respawn or story-driven global actors may require disabling global events. No guaranteed playable website until Pages deployment and browser tests pass.

## No double engine
Render: \`src/render/renderer.ts\`. State: \`src/sim/sim.ts\`. Authoring: \`src/editor/*\`. Unity remains asset export tool only.
