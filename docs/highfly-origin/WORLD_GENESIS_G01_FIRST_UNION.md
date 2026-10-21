# HIGHFLY ORIGIN WORLD — G01 FIRST UNION (21 October 2026)

## Rules
- This is a source-only **NO DEPLOY** first union, NOT a released or playable RG Poly map.
- Branch: `highfly-world-genesis-g01-integration-20261021`, based on confirmed unified `2cec633c`.
- No edits to public main, Pages, legacy Draken or DrakenLAB saves. One native Sim will remain authoritative when attached.
- No classes: new Hunter domain carries only id/name/body and five-stat training/adventure ledger. KayKit rig is a visual donor, not a Warrior/Paladin/Mage.
- A weight of 1.0 for Training vs 0.25 for in-world practice is **experimental and not activated in-game**. XP and learned technique mastery remain independent native concepts.
- The original five-stat Training scorer is a future read/adapter source only: DO NOT import historical awakening/class affinity into the new Hunter.
- World assets are *not currently present*: G1 map loader is ready to reject missing/empty glTF. Do not say "map playable" without an exported GLB, collision and physical Samsung QA.

## Recovered code contracts
- RG Poly from NEXUS branch `highfly/world-w1-1-real-interiors-water-v01`, commit `6d37c76b`.
  - Source Unity demo: `Assets/Stylized Medieval Kingdom URP/Scenes/Demo Stylized Medieval.unity`.
  - Source importer: `Assets/Highfly/Editor/HighflyCombatLabBuilder.RgPoly.cs`.
  - Bindings: `Assets/Highfly/Editor/HighflyRgPolyW1Layout.cs` (Smithy / Inn / House 7).
  - World catalog: `Assets/Highfly/Resources/World/W0W1Catalog.json`.
  - Scripts and Unity render pipeline are **not** portable to Three.js; export mesh/texture into GLB and use data-only anchor manifest.
- KayKit donor: use original authored male/female compatible assets only after rig, license and animation audit.
- Existing native Fireball: `src/sim/content/classes.ts` (legacy skill eligibility must be adapted).
- Existing wolf template + loot: `src/sim/content/zone1.ts`, id `forest_wolf`.
- Existing blacksmith behavior template: same file, id `smith_haldren`; NEW HIGHFLY npc identity reserved `hf_g01_blacksmith`.
- Existing Training Core: `src/highfly/training` as *algorithm/reference*, not its class-bound identity/authority.

## First G1–G3 real-play gates (not yet complete)
1. Produce licensed RG Poly City01 GLB and texture manifest, preserve positions; budget and collision/nav test on S23.
2. KayKit unique Hunter in Three.js with physical joystick, camera, walk/run/jump/dash and profile-backed five-stat viewer; NO hidden PlayerClass or class-based stat seed.
3. Native Fireball uses one Sim command and hit accounting. Class-based spell gating removed via universal-learning contract, not silently bypassed through mage/warrior.
4. One wolf has native template + visual + detection + hit + kill + one native loot item.
5. One HIGHFLY NPC uses native interaction contract with TALK via independent USAR.
6. Integration E2E: world and LAB isolated, no double damage engine, no double stat/save authority.

## CI interpretation
- GREEN in G01 means **domain contract/typecheck/legacy save regression**, not world geometry exported, gameplay certified, or live Android tested.
- G01 workflow does no Pages/APK publication.
