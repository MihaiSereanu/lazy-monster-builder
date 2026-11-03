# Lazy Monster Builder

Generate D&D 5e NPCs from challenge ratings or preset stat blocks in Foundry
Virtual Tabletop v14. Maintained by MihaiSereanu.

## Requirements

- Foundry Virtual Tabletop 14.367 or newer within v14.
- Dungeons & Dragons Fifth Edition 6.0.6 within the 6.x series.
- Permission to create actors.

## Install

In Foundry Setup, open **Add-on Modules**, choose **Install Module**, and paste:

```text
https://github.com/MihaiSereanu/lazy-monster-builder/releases/latest/download/module.json
```

Enable **Lazy Monster Builder** in your D&D 5e world.

## Use

Open the Actors directory and select **Generate Monster**. Choose a creature type,
challenge rating or preset stat block, saving throw proficiencies, and optional
features. Optionally choose hit points within the CR table's range, a damage
type, and attack conditions. Review the preview, then select **Create Monster**.

The generated NPC includes its token image, hit points, flat AC, table proficiency,
attack activity, attack count, and selected features. Attacks use the table's exact
attack bonus and damage formula. A chosen damage type applies to generated
attacks and damaging features; leaving it unset lets the GM choose later.
Aura, Damage Reflection, and Damaging Burst use fixed damage calculated from the
resource table. At CR 30, Aura and Reflection deal 31 damage; Burst deals 156
before a successful save. Presets without damage columns use their dice averages.
Each attack-reducing feature removes one attack, down to a minimum of zero.
Only Damaging Aura and Damage Reflection have this cost; the selector and preview
show it beside their names.

Each monster type adds a free combat feature and starts with two saving throw
proficiencies. Add or remove saves in either CR or preset mode. Changing type
loads its two defaults; changing CR or preset keeps your choices. Preset ability
scores are preserved. The type feature appears separately from optional features
and does not spend attacks or change the selected CR.

The type packages are house defaults adapted from D&D Modern Content, not
universal creature-type rules. Aberrations resist Psychic damage; Constructs
are immune to Poison and Psychic damage and Poisoned; Elementals are immune
to Poison damage and Poisoned; Plants are immune to Prone. Giants have 10-foot
melee reach. These use native actor and weapon fields.

Beasts receive Pack Tactics; Celestials and Fiends receive Magic Resistance;
Fey receive Fey Ancestry; Monstrosities receive Bloodied Fury. The GM selects
Advantage when their conditions apply. Dragon Fear Aura offers a Wisdom save
and Frightened from its chat card; the GM invokes its turn trigger and manages
condition endings and 24-hour immunity after a successful save. Humanoid Parry
provides a reaction card for its conditional +2 AC. Ooze Corrosive Form provides
a damage activity for Acid damage equal to proficiency, regardless of the chosen
attack damage type. Undead Fortitude provides its rule on a feature card; roll
a native Constitution save against 5 + damage taken and set HP to 1 on success.

Misty Step uses a native 30-foot bonus-action teleport. Aura and Reflection have
manually invoked damage activities; their turn and hit triggers are not automated.
Descriptive features require the GM to adjudicate their stated conditions.
Updating the module does not rewrite NPCs already created. Recreate an NPC to
use the new generated data, or edit its existing activities in Foundry.

## Conditions

Selected attack conditions appear in D&D 5e's native effect application controls
on attack chat cards. The GM decides when they apply and how long they last.
Knockdown offers Prone after a failed save; Restraining Grab offers Grappled and
Restrained after a hit. These features do not automatically determine hits,
saves, escape attempts, or condition endings.

The 12 standard conditions use the world's native D&D 5e rules. Removing a native
condition also removes this module's matching application reminder, allowing it
to be applied again. Removing only an application reminder leaves the native
condition active; remove the condition through Foundry's condition controls.

Confused, Doomed, Rattled, Slowed, Fatigue, and Strife are custom conditions with
concise reference text from the supplied Forge of Foes page. They do not change rolls,
movement, timers, or tracked levels. The GM manages those rules. Their
reference text is available in the generator and on the applied effect.

The CR table matches the supplied Forge of Foes page. Its preset stat blocks
remain separate. Updating the module does not rewrite existing NPCs.

## Development

Run `npm test` for the actor generation checks. Build the Foundry package with
`py -3 scripts/build_release.py` on Windows or `python3 scripts/build_release.py`
on other platforms. Installable files are written to `dist/module.json` and
`dist/module.zip`.

Version tags such as `v1.0.0` trigger the GitHub release workflow. Keep the version
in `module.json`, `package.json`, and the manifest download URL consistent with
the tag.

## License

[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
See [ATTRIBUTION.md](ATTRIBUTION.md) for original author and resource credits, and
[LICENCE](LICENCE) for the license text.
