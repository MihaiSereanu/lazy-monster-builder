# Validation

Validated on 2026-11-02 with Foundry Virtual Tabletop 14.369 and D&D 5e 6.0.6
in a disposable local world. Existing installed worlds were not used.

- All 41 challenge-rating and preset rows passed native actor validation with all 11 features.
- Derived proficiency, HP, embedded items, attack bonuses, and damage formulas matched the tables.
- Persisted CR 1/8, CR 30, and Brute NPCs rolled attacks and damage through native activities.
- Transferred energy damage bonuses and burst save DCs were checked.
- NPC sheets opened without browser exceptions.
- The sidebar button opened the dialog; CR selection, saves, features, and preset selection updated its preview.
- Creating an NPC through the dialog persisted its items and proficiency after reloading the browser.
- Repeated sidebar rendering produced one generator button.
- At a 540px viewport, the dialog fitted without internal horizontal overflow and its footer remained reachable by scrolling.
- Nine Node test cases cover table rows, CR parsing, fixed feature values, native targets, cumulative attack reductions, and independent repeated generation.
- The release builder includes the manifest at the archive root, all 14 token images, source, templates, styles, license, and attribution.

These checks cover this isolated environment. Other modules and existing campaign data may affect behavior.

## Version 1.0.1 feature audit

The original checks validated stored formulas and main attack rolls but did not
exercise every feature independently. That gap allowed incomplete activity
settings and cumbersome half-damage labels to pass.

The expanded native suite in `tests/foundry-features.mjs` checks each of the 11
features separately and all features together across all 41 profiles: 492
combinations and 410 damage configurations. It checks native fixed-damage labels,
rolled totals, transferred weapon bonuses, spell-attack exclusions, teleport
metadata, and preparation warnings.

A persisted CR 30 Undead produced native damage rolls and chat cards with Aura
31, Reflection 31, and Burst 156. The actor sheet displayed 31 in the Formula
column, and these labels plus its three-attack count survived reload. Screenshots
were inspected in the disposable world. No browser exceptions were reported.

To run the native suite, load `tests/foundry-features.mjs` in an isolated browser
session with the module enabled and call `checkFoundryFeatures()`. It creates a
disposable actor and native chat messages, and returns their IDs for inspection.
This suite must not be run in a campaign world.
