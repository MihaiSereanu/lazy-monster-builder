"""Build an installable module archive from an explicit file allowlist."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
FILES = ['module.json', 'README.md', 'LICENCE', 'ATTRIBUTION.md',
         'scripts/module.js', 'scripts/actor-data.js', 'scripts/conditions.js', 'scripts/type-features.js', 'scripts/lib/monsters.js',
         'styles/module.css', 'templates/generator.hbs']
FILES += [p.relative_to(ROOT).as_posix() for p in sorted((ROOT / 'tokens').glob('*')) if p.is_file()]


def main():
    manifest = json.loads((ROOT / 'module.json').read_text(encoding='utf-8'))
    assert manifest['license'] in FILES
    assert all((ROOT / name).is_file() for name in FILES)
    assert '#{' not in json.dumps(manifest), 'Unresolved manifest placeholder'
    DIST.mkdir(exist_ok=True)
    (DIST / 'module.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    with ZipFile(DIST / 'module.zip', 'w', ZIP_DEFLATED) as archive:
        for name in FILES:
            archive.write(ROOT / name, name)
    print(f"Built {manifest['id']} {manifest['version']}: {len(FILES)} files")


if __name__ == '__main__':
    main()
