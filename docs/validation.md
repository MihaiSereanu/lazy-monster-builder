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

## Version 1.1.0 conditions and resource controls

Thirteen Node test cases pass. The source-table fixture was captured from the
user-supplied `mshea/lazy_gm_tools/fof_stats.html` on 2026-11-02; all 34 CR rows
match its AC/DC, HP/range, attack/proficiency, attack count, DPR, damage amount,
and dice expression. Preset stat blocks were not replaced.

The expanded native feature suite again passed 492 combinations and 410 damage
configurations. `tests/foundry-conditions.mjs` verified all 12 native conditions
through the D&D 5e chat effect application path, condition immunity, movement
changes for Grappled/Restrained, and native condition removal. All six custom
reminders were checked for no status, movement, or Active Effect change automation.
The source monster acquired none of its target conditions. Global native status
configuration remained unchanged.

The native chat tray reuses an existing application effect when reapplied. Rider
conditions are only collected on creation, so removing a condition alone initially
prevented reapplication. A module-scoped deletion hook now clears matching
application reminders when the actual native condition is removed. The exact
remove-and-reapply sequence passed after that change.

The browser created a CR 30 Undead with 700 HP, Necrotic damage, Prone, and a
Fatigue reminder. HP/type/conditions persisted after reload. Knockdown and
Restraining Grab offered and applied their native effects from chat cards.
Typed Energy Weapons retained both damage parts and Necrotic typing.
Desktop and 540px viewport screenshots were inspected; the dialog fitted without
horizontal overflow and the footer remained reachable. The removed summary and
copy controls were absent. No browser exceptions were reported.
