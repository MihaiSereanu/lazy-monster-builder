# Lazy Monster Builder 1.0.1

Fixes generated feature damage and activity settings in Foundry v14/D&D 5e 6.0.6.

- Aura, Damage Reflection, and Burst use native fixed damage. CR 30 values are 31, 31, and 156 respectively.
- Aura describes creatures in a 10-foot radius instead of targeting its owner.
- Damage Reflection has a damage activity; Misty Step has a 30-foot bonus-action teleport.
- Knockdown targets one creature within melee reach.
- Energy Weapons adds damage to weapon attacks, preserving magical properties.
- Each attack-reducing feature removes one attack. Aura plus Reflection leaves a CR 30 monster with three attacks.

Validated 492 native profile/feature combinations and 410 damage configurations,
plus persisted activity rolls, native chat cards, sheet labels, and browser reload.
Nine Node test cases passed.

Existing NPCs retain their stored data. Recreate them or edit their activities to
apply the new values. Aura/Reflection triggers remain manually invoked; damage
types remain the GM's choice.
