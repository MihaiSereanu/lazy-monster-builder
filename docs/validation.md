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
- Five Node test cases cover every table row, CR parsing, feature formulas, attack reduction, and independent repeated generation.
- The release builder includes the manifest at the archive root, all 14 token images, source, templates, styles, license, and attribution.

These checks cover this isolated environment. Other modules and existing campaign data may affect behavior.
