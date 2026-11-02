import {MONSTERS_FEATURES, MONSTERS_STATS, MONSTERS_TYPE, MONSTERS_ARCHETYPES} from './lib/monsters.js';
import {ABILITIES, attackCount, buildMonsterData} from './actor-data.js';

const MODULE_ID = 'lazy-monster-builder';
const FEATURES = MONSTERS_FEATURES.filter(Boolean);
let generator;

function canGenerate() {
    return game.system.id === 'dnd5e' && game.user.can('ACTOR_CREATE');
}

Hooks.on('renderActorDirectory', (_app, element) => {
    if (!canGenerate() || element.querySelector('.lmb-generate')) return;
    const create = element.querySelector('button.create-entry');
    if (!create) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lmb-generate';
    button.innerHTML = '<i class="fa-solid fa-dragon" inert></i> Generate Monster';
    button.addEventListener('click', () => showMonsterForm().catch(error => {
        console.error(`${MODULE_ID} |`, error);
        ui.notifications.error(`Could not open the monster builder: ${error.message}`);
    }));
    create.before(button);
});

export async function showMonsterForm() {
    if (!canGenerate()) return;
    if (generator?.rendered) return generator.bringToFront();
    const content = await foundry.applications.handlebars.renderTemplate(
        `modules/${MODULE_ID}/templates/generator.hbs`, {
            types: MONSTERS_TYPE, stats: MONSTERS_STATS, archetypes: MONSTERS_ARCHETYPES,
            features: FEATURES, abilities: ABILITIES
        }
    );
    let mode = 'cr';
    const selectedFeatures = [];
    const dialog = new foundry.applications.api.DialogV2({
        id: 'lmb-generator', classes: ['lmb-generator'],
        window: {title: 'Create a monster', resizable: true},
        position: {width: 680}, content,
        buttons: [{
            action: 'create', label: 'Create Monster', icon: 'fa-solid fa-dragon', default: true,
            callback: async (_event, _button, app) => {
                if (!canGenerate()) throw new Error('You do not have permission to create actors.');
                const root = app.element;
                const data = buildMonsterData({stats: currentStats(root),
                    type: MONSTERS_TYPE[Number(root.querySelector('[name="monsterType"]').value)],
                    features: selectedFeatures,
                    saves: ABILITIES.filter(key => root.querySelector(`[name="save-${key}"]`).checked)
                });
                try {
                    const actor = await Actor.create(data);
                    if (!actor) throw new Error('Actor creation was cancelled.');
                    ui.notifications.info(`Created ${actor.name}.`);
                    return actor;
                } catch (error) {
                    console.error(`${MODULE_ID} |`, error);
                    ui.notifications.error(`Could not create the monster: ${error.message}`);
                    throw error;
                }
            }
        }, {action: 'cancel', label: 'Cancel'}]
    });
    generator = dialog;

    function currentStats(root) {
        const field = mode === 'cr' ? 'challenge' : 'archetype';
        return (mode === 'cr' ? MONSTERS_STATS : MONSTERS_ARCHETYPES)[Number(root.querySelector(`[name="${field}"]`).value)];
    }

    function update(root) {
        const stats = currentStats(root);
        const type = MONSTERS_TYPE[Number(root.querySelector('[name="monsterType"]').value)];
        root.querySelector('.lmb-token').src = `modules/${MODULE_ID}/tokens/${type.name.toLowerCase()}.png`;
        const values = {
            hp: stats.HP, ac: stats.ACDC, proficiency: stats.PAB,
            damage: `${stats.DpACalc} × ${attackCount(stats, selectedFeatures)}`,
            attack: stats.atkBonus ?? stats.PAB, level: stats.ECL ?? '—'
        };
        for (const key of ABILITIES) values[key] = stats.abilities?.[key].value ?? 10;
        const saves = ABILITIES.filter(key => stats.abilities
            ? stats.abilities[key].proficient : root.querySelector(`[name="save-${key}"]`).checked);
        values.saves = saves.map(key => {
            const modifier = Math.floor(((stats.abilities?.[key].value ?? 10) - 10) / 2) + Number(stats.PAB);
            return `${key.toUpperCase()} ${modifier >= 0 ? '+' : ''}${modifier}`;
        }).join(', ') || 'None';
        for (const [key, value] of Object.entries(values)) root.querySelector(`[data-stat="${key}"]`).textContent = value;
        root.querySelector('.lmb-archetype-description').textContent = stats.desc ?? '';
        root.querySelector('.lmb-selected-features').replaceChildren(...selectedFeatures.map((feature, index) => {
            const row = document.createElement('li');
            const name = document.createElement('span');
            name.textContent = feature.name;
            name.title = feature.desc;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Remove';
            remove.setAttribute('aria-label', `Remove ${feature.name}`);
            remove.addEventListener('click', () => {selectedFeatures.splice(index, 1); update(root);});
            row.append(name, remove);
            return row;
        }));
    }

    dialog.addEventListener('render', () => {
        const root = dialog.element;
        root.addEventListener('change', () => update(root));
        root.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
            mode = button.dataset.mode;
            root.querySelectorAll('[data-mode]').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
            root.querySelectorAll('[data-panel]').forEach(panel => {panel.hidden = panel.dataset.panel !== mode;});
            update(root);
        }));
        root.querySelector('.lmb-add-feature').addEventListener('click', () => {
            selectedFeatures.push(FEATURES[Number(root.querySelector('[name="feature"]').value)]);
            update(root);
        });
        update(root);
    }, {once: true});
    dialog.addEventListener('close', () => {if (generator === dialog) generator = undefined;}, {once: true});
    await dialog.render({force: true});
    return dialog;
}
