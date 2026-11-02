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
features. Review the preview, then select **Create Monster**.

The generated NPC includes its token image, hit points, flat AC, table proficiency,
attack activity, attack count, and selected features. Attacks use the table's exact
attack bonus and damage formula. Damage types remain unspecified where the
resource leaves them to the GM; edit the resulting activity to choose a type.
Descriptive features require the GM to adjudicate their stated conditions.

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
