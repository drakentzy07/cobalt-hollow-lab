# HIGHFLY Skin Factory — Donor Staging

This directory is **laboratory-only**. No donor is integrated into the main game from here.

## Authority

- Upstream: `levy-street/world-of-claudecraft`
- Frozen commit: `9b57e49c9676d75962700f828cc00a50a9a988b5`
- Character: `public/models/chars/modular/warrior_modular.glb`
- Rig: `Rig_Medium`

## Rules

**REUSE FIRST · NO PROXY · NO RIG REPLACEMENT · NO GAMEPLAY CHANGES**

1. Prove ClaudeCraft's native Harbormaster rigid-wearable path first.
2. Treat external rigs as donor geometry until compatibility is demonstrated.
3. Rigid pieces may be fitted against a real bind-frame reference and bone-parented.
4. Flexible clothing/armor requires a later Rig_Medium weight-transfer phase.
5. Do not automate destructive weight transfer until the native rigid proof is GREEN.
6. Weapons reuse ClaudeCraft's existing KayKit/variant grip tables and handslot/stow path.
7. License status must be recorded before a donor may become a production asset.

## Audits

`audits.json` records exact fingerprints and the initial compatibility classification of the
uploaded CH0SAN and KayKit sources. It intentionally does **not** claim a CH0SAN license:
the supplied UnityPackage/README did not establish one during this audit.
