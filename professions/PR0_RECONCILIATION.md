# HIGHFLY PROFESSIONS — PR-0 reconciliation (frozen baseline)

## Source of truth and scope

- Project: `drakentzy07/cobalt-hollow-lab`.
- Isolated PR-0 branch: `highfly-professions-pr0-integration`.
- Certified PR-0 HEAD: `05e0c9b0f3fcc8cf08c2777910719a8d5628dcbe`.
- PR-0 GREEN: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37806459149
- Last known PF-6 GREEN: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37770166898
- Actual replayed donor (PINNED): `levy-street/world-of-claudecraft@9b57e49c9676d75962700f828cc00a50a9a988b5` (v0.44.0).
- Donor comparison audited: `f46f30f5849989e44d7aa1bf62b3b14e435bc2fe` (v0.44.4). 93 of 93 files in `src/sim/professions/` matched blob SHA across the two versions. `character_state.ts` and `sim.ts` DID change; do not merge them blindly.
- Frozen CLEAN V1 patch sha256: `b78ba81e52b10b2ddba7c6fa829d436f59ad4594ec2a0d0d5f0341ce26773cb9`.
- This inventory counts **authored recipe records in frozen donor src/sim/content/recipes.ts**, not all Enchant actions/formulas, nor new HIGHFLY content. Revalidate before downstream content changes.
- Specification documents: original MASTER 220 + ULTRA MASTER 500% (340 numbered sections).

## Reconciliation by system

| System | Claude donor frozen | HIGHFLY PR-0 baseline | Target/action |
|---|---|---|---|
| Weaponcrafting | 17 authored recipe records, max craft skill 125 | Reused with no separate implementation | Preserve IDs; new XP/Trials/GM proof in later PR |
| Armorcrafting | 17, max 125 | Reused | Preserve; Smith remains pair, not save merger |
| Engineering | 20, max 125, tools/field stations | Reused | Extend via PR-10 |
| Alchemy | 20, max 125, consumables/catalysts | Reused | Extend via PR-9 |
| Cooking | 33, max 125, Feasts | Reused | PR-6 pilot |
| Leatherworking | 21, max 125 | Reused | PR-11 |
| Tailoring | 22, max 125, bag/storage | Reused | PR-11 |
| Inscription | 9, max 125, Deed of Making | Reused | PR-12 |
| Enchanting | 4 `ProfessionRecipeRecord` records PLUS separate enchant definitions/actions | Reused, separate enchant catalog remains authoritative | PR-10; NEVER treat 4 as full enchant count |
| Jewelcrafting | 13, max 125, Prismglass Setting | Reused | PR-9; future Gem Core distinct |
| Mining | Existing gathering proficiency, cap 100 | Reused | PR-13 |
| Logging | Existing gathering proficiency, cap 100 | Reused | PR-13 |
| Herbalism | Existing gathering proficiency, cap 100 | Reused | PR-13 |
| Farming | Existing farming and proficiency, cap 100 | Reused | PR-13; preserve timers/no rot |
| Fishing | Existing fishing and proficiency, cap 200 | Reused | PR-13; no Character XP policy change |
| Monster Harvesting | Existing corpse harvesting, rights, preference, focus and specimens | Reused | Adapter only after RewardContext PR-14 |
| Gem Core | No HIGHFLY standard gem-core/normal socket engine certified | Not added | PR-22 Gem Core; PR-23 sockets, separate from Rift |

The above 10 craft counts total **176 authored records**, including Enchanting's four recipe-type records; Enchant actions are a distinct content system.

## Other existing authorities — preserved

- **Craft**: `src/sim/professions/wheel.ts`, `crafting.ts`, `archetype.ts`, `masterwork.ts`, `perfecting.ts` and `src/sim/content/recipes.ts`.
- **Character save**: `src/sim/character_state.ts`, and `Sim.addPlayer` / `Sim.serializeCharacter` in `src/sim/sim.ts`. The current keys `craftSkills`, `knownRecipes`, `gatheringProficiency`, `professions` (legacy dual write), `archetype`, `deeds`, `renown`, `reliquary`, `townFocus` must remain authoritative.
- **Archetypes**: ten adjacent craft pairs around `CRAFT_RING` plus Jack; initial historical attunement quest paths: Smith, Outfitter, Apothecary, Bombardier. The other six are design gaps pending PR-16, not certified live.
- **Combo recipes**: documented historical Smith pair (two) and Bombardier pair (one). Author further ten-pair completion only in PR-17.
- **Stations**: Forge, Kitchens, Apothecary, Tannery, Loom, Toolworks; existing mobile stations. Keep actual station IDs and recipes.
- **Work orders and commissions**: existing reusable request/order and commission mechanics; no second economy/claim system.
- **Progression**: Masterwork, Perfecting, Deeds, Renown, Reliquary already exist. `src/sim/professions/profession_xp.ts` is the preexisting **Character XP** reward path, not the future HIGHFLY explicit craft Profession XP.
- **Harvest**: `corpse_harvest_grant.ts`, harvest preference, Town Focus, claims/loot rights, specimens remain sole authority.
- **Freeze**: Nine combat classes, PF-6 LV1–99, immutable Permanent STR/AGI/VIT/PER/INT semantics; profession achievements do not add permanent core stats.

## Tests / actual PR-0 result

GREEN (run linked above):
- Frozen donor checksum and CLEAN patch verification.
- PF-6 gameplay overlay replay, profession/GAME-C2 invariants.
- All-source TypeScript.
- 22 focused test suites, including real PF-6 Sim E2E, professions, gathering, farming, fishing, commissions, perfecting, migration.
- Offline Vite build.
- Six inherited Perfecting worn-item fixtures require level **25** with PF-6's cap **99**, whereas original donor cap 20 had clamped recipe source-25 equip gates to level 20. Workflow rebases only those six test setup levels; all assertions and production rules remain unchanged.

## Open architectural constraints (NOT certified by baseline)

1. Current project content across other concurrent branches must be reconciled again before integration into gameplay/public branch.
2. PR-1 is **only** optional, sparse `highflyProfessions` save/load/normalization. Existing profession data must not be copied into it.
3. No extra craft XP, Trial gates, Knowledge, Discovery, Legendary, monster adapter, Gem Core or socket effects until their named PR.
4. Production SQL persistence and long-lived server deployments need end-to-end acceptance with realistic save fixtures before any public merge. CI exercises in-memory real `Sim` JSONB serialization, not a live database.
5. Other labs and public build are frozen/unmodified; passing this CI does not imply gameplay content is implemented.

## Acceptance and handoff

PR-0 certified the **baseline engineering gates**; the full 340-section master remains a forward implementation specification, not a claim that all those systems already exist. PR-1 proceeds on a distinct branch with source and tests isolated from the gameplay release.
