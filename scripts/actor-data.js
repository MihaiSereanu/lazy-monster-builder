const MODULE_PATH = 'modules/lazy-monster-builder';
const ACTIVITY_ID = 'lmbActivity00001';
export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export function parseCR(value) {
    const match = String(value).match(/^(\d+)(?:\/(\d+))?$/);
    if (!match || Number(match[2]) === 0) throw new Error('Invalid challenge rating.');
    return Number(match[1]) / Number(match[2] ?? 1);
}

export function attackCount(stats, features) {
    return Math.max(0, Number(stats.NoA) - (features.some(f => f.reduceAtk) ? 1 : 0));
}

function damagePart(formula) {
    return {custom: {enabled: true, formula: String(formula)}, types: []};
}

function activity(type, activation = 'action') {
    return {
        _id: ACTIVITY_ID, type,
        activation: {type: activation === 'none' ? '' : activation, value: 1},
        consumption: {spellSlot: false, targets: []}
    };
}

function attackActivity(stats, actionType = 'mwak') {
    return {
        ...activity('attack'),
        attack: {
            ability: 'none', flat: true, bonus: String(stats.atkBonus ?? stats.PAB),
            type: {value: actionType.startsWith('r') ? 'ranged' : 'melee',
                classification: actionType.endsWith('sak') ? 'spell' : 'weapon'}
        },
        damage: {includeBase: false, parts: [damagePart(stats.DpACalc)]}
    };
}

function buildFeature(feature, stats) {
    // Resource rows are shared by every dialog and must stay immutable.
    const item = structuredClone(feature.item);
    const legacy = item.system;
    const activation = legacy.activation?.type ?? '';
    let data;
    let formula = stats.DpACalc;
    if (feature.useDpR) formula = Array(Number(stats.NoA)).fill(formula).join('+');
    if (feature.divideDmg) formula = `floor((${formula})/${feature.divideDmg})`;

    if (legacy.actionType === 'save') {
        data = {
            ...activity('save', activation),
            save: {
                ability: [legacy.save.ability],
                dc: feature.hasSave
                    ? {calculation: '', formula: String(stats.DC ?? stats.ACDC)}
                    : {calculation: legacy.save.scaling, formula: ''}
            },
            damage: {onSave: feature.isDmg ? 'half' : 'none',
                parts: feature.isDmg ? [damagePart(formula)] : []}
        };
    } else if (feature.isDmg && legacy.actionType?.endsWith('ak')) {
        data = attackActivity({...stats, DpACalc: formula}, legacy.actionType);
    } else if (feature.isDmg && !feature.isEffect) {
        data = {...activity('damage', activation), damage: {parts: [damagePart(formula)]}};
    } else if (activation) {
        data = activity('utility', activation);
    }

    if (data) {
        data.name = item.name;
        if (legacy.range) data.range = {...legacy.range, override: true};
        if (legacy.target?.type === 'sphere') {
            data.target = {template: {type: 'sphere', size: Number(legacy.target.value), units: 'ft'},
                affects: {type: 'creature'}, prompt: true, override: true};
        } else if (legacy.target) {
            data.target = {affects: {type: legacy.target.type, count: legacy.target.value ? String(legacy.target.value) : ''},
                override: true};
        }
    }

    item.system = {
        description: legacy.description,
        type: legacy.type ?? {value: item.type === 'weapon' ? 'natural' : 'monster'},
        activities: data ? {[ACTIVITY_ID]: data} : {}
    };
    if (item.type === 'weapon') {
        item.system.equipped = true;
        item.system.proficient = 0;
    }
    if (feature.isEffect) {
        item.effects = [{
            name: item.name, img: item.img, type: 'base', transfer: true,
            system: {changes: ['mwak', 'rwak', 'msak', 'rsak'].map(key => ({
                key: `system.rolls.damage.${key}.bonus`, type: 'add',
                value: String(stats.DpACalc), phase: 'initial'
            }))}
        }];
    }
    return item;
}

export function buildMonsterData({stats, type, features = [], saves = []}) {
    const name = `${stats.name ? `${stats.name} ` : ''}${type.name} - (CR ${stats.CR})`;
    const img = `${MODULE_PATH}/tokens/${type.name.toLowerCase()}.png`;
    const count = attackCount(stats, features);
    return {
        name, type: 'npc', img,
        system: {
            attributes: {
                ac: {flat: Number(stats.ACDC), calc: 'flat'},
                hp: {value: Number(stats.HP), max: Number(stats.HP)},
                movement: {walk: Number(stats.speed ?? 30), units: 'ft'}
            },
            abilities: stats.abilities ? structuredClone(stats.abilities) : Object.fromEntries(
                ABILITIES.map(key => [key, {value: 10, proficient: saves.includes(key) ? 1 : 0}])
            ),
            skills: structuredClone(stats.skills ?? {}),
            details: {type: {value: type.name.toLowerCase()}, cr: parseCR(stats.CR)}
        },
        prototypeToken: {name, texture: {src: img}},
        effects: [{
            name: 'Proficiency', img: 'icons/sundries/books/book-rounded-red.webp', type: 'base',
            system: {changes: [{key: 'system.attributes.prof', type: 'override',
                value: Number(stats.PAB), phase: 'initial'}]}
        }],
        items: [{
            name: 'Attack', type: 'weapon', img: 'icons/skills/melee/strike-slashes-red.webp',
            system: {type: {value: 'natural'}, equipped: true, proficient: 0,
                activities: {[ACTIVITY_ID]: attackActivity(stats)}}
        }, {
            name: `${count} attack(s)`, type: 'feat',
            img: 'icons/skills/melee/maneuver-greatsword-yellow.webp',
            system: {type: {value: 'monster'}, description: {
                value: `<p>The creature can perform ${count} attack(s) per turn.</p>`
            }}
        }, ...features.map(feature => buildFeature(feature, stats))]
    };
}
