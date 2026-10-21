# WORLD GENESIS G1 — RG Poly map extraction and game handoff

## Traceability / status
Paired export-only Unity branch in NEXUS:
`highfly/world-genesis-g1-export-rgpoly-20261021` (source base `6d37c76b`).
Game integration branch in cobalt-hollow-lab:
`highfly-world-genesis-g01-integration-20261021` (source base `2cec633c`).

- Exported **real geometry** requires successful source download, package digest verification, Unity scene import, glTFast export and GLB JSON validation.
- The official itch.io RG Poly download returned HTTP 522 on first run #39691760615. This is an upstream acquisition failure, not a G1 gameplay check.
- NEXUS now retries the **same official source** with bounded attempts; source digest must exactly match pinned `34e2bf4e...8a98d`. Never substitute a differently licensed or edited scene.
- The paired exporter emits `rgpoly-city01.glb` plus `rgpoly-city01.manifest.json` as a 30-day GitHub Actions artifact, not a public Pages build.
- The HIGHFLY Three.js side has a strict loader and manifest decoder. They reject missing assets, absent anchors or incomplete geometry. **Until a real artifact is delivered to `public/highfly/world-genesis/`, the city is NOT playable.**
- Original RG Poly stock demo provides visual scene meshes (map geometry), NEXUS supplies audited scene anchors. Unity's native controls / C# gameplay are excluded.
- 4 audited semantic anchors: guild, inn, forge, market; source spawn `Unity(0,13.35,-42)`.
- Position conversion `Unity(x,y,z) -> glTF(-x,y,z)` needs visual verification with glTFast 6.20.0 and production Three.js version.
- Unity colliders currently exported as world AABB **audit metadata only**. Mesh collider approximation, collision filtering and nav are future acceptance criteria; do not falsely claim physics complete.
- No public release, no original Draken save modification, no class-based Hunter migration; G1 remains map-first.

## Acceptance
1. Export source verified with SHA256, >100 real render meshes and no lost Unity Terrain.
2. Generated GLB has valid GLB 2.0 container with >50 mesh entries and manifest 4 anchors.
3. Copy/transfer artifact into WebGL asset tree only through a separate validated integration step.
4. Render in Three.js in isolated G1 preview and QA texture correctness / colliders / draw calls / Android performance.
5. Only then attach the standalone classless Hunter and move toward G2 Fireball + wolf + NPC.

## Important distinction
A source-only CI GREEN is not a rendered map. A Unity export GREEN is not S23 device certification.
