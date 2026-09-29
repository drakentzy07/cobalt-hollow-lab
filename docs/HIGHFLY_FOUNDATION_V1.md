# HIGHFLY FOUNDATION V1

Status: ACTIVE FOUNDATION BRANCH

## Frozen parent

- Repository: `drakentzy07/cobalt-hollow-lab`
- Frozen RUN0.9.3 branch: `run0.9.3-green-freeze`
- Frozen green SHA: `b40a9b68d1bac946976878d788cf21771cc8c0d3`
- Upstream ClaudeCraft: `levy-street/world-of-claudecraft`
- Upstream pin: `9b57e49c9676d75962700f828cc00a50a9a988b5`

Foundation V1 starts from the exact validated RUN0.9.3 behavior. It is not a rewrite.

## GOLDEN behavior that must not regress

1. Mobile left side controls movement only.
2. Mobile right side controls free camera X/Y/diagonal.
3. Camera vertical direction is the approved non-inverted behavior.
4. Multitouch remains functional.
5. 360-degree movement remains functional.
6. Double jump remains functional.
7. Evade/Dash remains functional.
8. Mobile HUD and large menu remain functional.
9. Persistent Hunter/multislot save remains functional.
10. World/spawn persistence remains functional.
11. Basic attack is discrete action combat, never generic ClaudeCraft continuous auto-attack.
12. Basic combo cadence is `1 -> 2 -> 3 -> short recovery -> 1`.
13. Soft-target acquisition remains enabled for basic attack.
14. Reacquisition remains functional.
15. Manual LOCK remains authoritative and functional.
16. Skin Lab work must not modify Foundation/gameplay behavior.

## Known debt deliberately not blocking Foundation V1

### Creator cold preview

Real-device Samsung S23 Ultra cold preview can take roughly 24 seconds before the Hunter first appears. Once assets are warm, switching characters is fast.

This remains a performance debt. Do not re-open camera/combat/HUD code to solve it blindly. Diagnose asset/network/decode scheduling separately.

## Foundation rule

No new gameplay system may require changing GOLDEN behavior just to fit the new system. New systems integrate through explicit seams/adapters.

## Next integration order

1. Foundation V1 no-regression guard.
2. AIM Contract V1 (data contract only; no targeting replacement).
3. Training Core profile/runtime.
4. Training Bridge behind feature flags.
5. AIM Runtime.
6. Premium skill batches.

## Training ownership boundary

Training Core is the only authority allowed to persistently raise HIGHFLY Core Stats:

- STR
- AGI
- VIT
- PER
- INT

Class, subclass, equipment, loot, quests, world XP and consumables must not directly grant permanent Core Stats.

Training Core must bridge into the existing RPG/combat model rather than replacing it.

## Acceptance gate

Foundation V1 is green only when:

- source/type checks pass;
- bundle build passes;
- persistence smoke passes;
- RUN0.9.3 preview + combo + soft-target smoke passes;
- the frozen upstream SHA is unchanged.
