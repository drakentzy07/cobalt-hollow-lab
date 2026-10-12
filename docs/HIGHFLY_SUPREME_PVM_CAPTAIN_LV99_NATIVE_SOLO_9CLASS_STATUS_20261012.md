# HIGHFLY SUPREME — PvM Captain LV99 / honest 9-class acceptance

Date: 2026-10-12. DEV ONLY; not a production balance patch.
Source: GitHub Actions run 38304732259 (SUCCESS), commit d11dadaee3d749ec2a155e116a065cfc1ceac0d7.
QA file: `monsters/integration/highfly_supreme_internal_real_economy_tactical.test.ts`.
Published SUPREME remains a separate full WebGL artifact from run 38290551744.

## Unambiguous actual benchmark

19 native spec pilots / 9 original player classes / 300 simulated game-second cap.
**7/9 classes achieved a native solo WIN** (not 9/9).
The **game/test did NOT** overwrite captain max/current HP, mint real-world Training points,
nerf boss damage, boost player stats outside normal spec/equipment rules,
grant secret combat abilities or replace game AI.
Test setup DID directly select LV99, provide craftable/equippable legal gear and
three original healing potions; this is **NOT** proof of earning those items or
playing naturally from LV1. Only one deterministic RNG seed per spec variant.
The 9/9 two-player simulations are **not** evidence of network co-op bookability.

| Original class | Best measured spec (native setSpec) | Outcome | Time (game seconds) | Captain HP remaining | Hero HP remaining |
| --- | --- | --- | ---: | ---: | ---: |
| Warrior | Arms | WIN | 37.25 | 0% | 2191 |
| Paladin | Retribution | WIN | 50.05 | 0% | 1965 |
| Hunter | Survival | WIN | 34.25 | 0% | 2025 |
| Rogue (dual daggers) | Assassination | WIN | 16.25 | 0% | 3159 |
| Priest | Shadow | WIN | 109.70 | 0% | Recorded in class telemetry |
| Priest | Holy | WIN | 171.50 | 0% | 1646 |
| Shaman | Restoration | WIN | 79.00 | 0% | 1254 |
| Mage | Fire | LOSS | 33.40 | 26.58% | 0 |
| Warlock | Demonology | WIN | 47.65 | 0% | 4147 |
| Druid | Restoration | LOSS | 131.90 | 18.32% | 0 |

**19 trial audit:** Hunter Marksmanship and Beast Mastery lose with repeated native
captain evade resets; Hunter Survival wins without a boss reset.
Priest Shadow AND Holy both win; Priest Discipline loses 12.20% remaining.
Warlock Demonology wins with native minion/pet contribution (direct player
damage event alone is 126; do not misreport it as the total raid damage).
Warlock Destruction comes within 0.47% but loses — it does NOT count as WIN.
Druid Balance loses with 35.28%, Feral with 53.23%, Restoration with 18.32%.
Mage Frost loses 45.52%, Fire 26.58%, Arcane 75.20%.

## Native boss mechanics (unchanged, inspected in source)

Original frozen encounter `monsters/lv99/highfly_hunt_encounters.ts`:
`hardLeashRadius=38` meters; 
`bigCast=Onda de amenaza`, 2.5 sec windup, radius 5m, cadence every 19sec;
boss enrages below 30% health. No weakening.

## Next check: true movement/telegraph pilot only

Commit `67ea06cac37ae7bde08af9d7740597f8fbc6ffa0`,
run [38305911280](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38305911280).
Mage and ranged Druid now test native move inputs toward a controlled
~7.5–10.5m engagement ring, respond to the telegraphed pulse, and remain
within an 18m player distance of the spawn anchor. They can cancel a
hard-cast by moving just as a real player would. No new combat mechanic
or production behavior is created.

## Criteria before honest final '9/9 BALANCED'

1. One or more fully **legal**, repeatable solo win paths for EVERY original class.
2. Validate several RNG seeds and the real boss patterns, not cherry-picked luck.
3. Record legal skill execution, damage attribution (including pets), potion
   consumptions and role-appropriate mechanics.
4. Ensure item/crafting and training preconditions are achievable in normal play.
5. Test manual dash, parry, movement and HUD on physical Samsung S23 Ultra;
   synthetic Playwright mobile smoke is NOT that test.
6. Extended 100+ remains future and must not be asserted functional before enabled.
7. Record failures honestly; a green CI asserts that the diagnostic test
   ran correctly, not that every build succeeded.

Principles: nine **original** classes; cooperative-first with solo skill expression;
PvP deferred; no hidden stats, no artificial invulnerability,
no boss HP overrides. Game main/public Pages unchanged by PvM QA patches.
