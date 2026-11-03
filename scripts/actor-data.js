import {conditionEffects} from './conditions.js';
import {applyTypeFeature, typeProfile} from './type-features.js';

const MODULE_PATH = 'modules/lazy-monster-builder';
const ACTIVITY_ID = 'lmbActivity00001';
export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export function parseCR(value) {
    const match = String(value).match(/^(\d+)(?:\/(\d+))?$/);
    if (!match || Number(match[2]) === 0) throw new Error('Invalid challenge rating.');
    return Number(match[1]) / Number(match[2] ?? 1);
}

export function attackCount(stats, features) {
    return Math.max(0, Number(stats.NoA) - features.filter(f => f.reduceAtk).length);
}

export function fixedFeatureDamage(stats, perRound = false) {
    const dice = String(stats.DpACalc).match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (!dice) throw new Error('Unsupported damage formula in monster resource table.');
    const average = Number(dice[1]) * (Number(dice[2]) + 1) / 2 + Number(dice[3] ?? 0);
    const perAttack = Number(stats.DpA ?? average);
    return Math.floor((perRound ? Number(stats.DpR ?? average * Number(stats.NoA)) : perAttack) / 2);
}

function damagePart(formula, fixed = false) {
    if (fixed) return {bonus: String(formula), custom: {enabled: false, formula: ''}, types: []};
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
    const fixed = ['Damaging Aura', 'Damage Reflection', 'Damaging Burst'].includes(feature.name);
    const formula = fixed ? fixedFeatureDamage(stats, feature.name === 'Damaging Burst') : stats.DpACalc;

    if (feature.name === 'Damage Reflection') {
        data = {...activity('damage', 'special'), damage: {parts: [damagePart(formula, true)]}};
        data.activation.condition = 'When a creature within 5 feet hits this creature with a melee attack.';
    } else if (feature.name === 'Misty Step') {
        data = {...activity('teleport', 'bonus'), teleport: {override: true, value: '30', units: 'ft'}};
    } else if (feature.name === 'Restraining Grab') {
        data = activity('utility', 'special');
        data.activation.condition = 'After hitting the target with a melee attack.';
    } else if (legacy.actionType === 'save') {
        data = {
            ...activity('save', activation),
            save: {
                ability: [legacy.save.ability],
                dc: feature.hasSave
                    ? {calculation: '', formula: String(stats.DC ?? stats.ACDC)}
                    : {calculation: legacy.save.scaling, formula: ''}
            },
            damage: {onSave: feature.isDmg ? 'half' : 'none',
                parts: feature.isDmg ? [damagePart(formula, fixed)] : []}
        };
    } else if (feature.isDmg && legacy.actionType?.endsWith('ak')) {
        data = attackActivity({...stats, DpACalc: formula}, legacy.actionType);
    } else if (feature.isDmg && !feature.isEffect) {
        data = {...activity('damage', activation), damage: {parts: [damagePart(formula, fixed)]}};
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
        if (feature.name === 'Damaging Aura') {
            data.activation = {type: 'special', condition: "When another creature starts its turn within 10 feet."};
            data.range = {units: 'self', override: true};
            data.target = {template: {type: 'sphere', size: '10', units: 'ft'},
                affects: {type: 'creature'}, prompt: false, override: true};
        } else if (['Damage Reflection', 'Knockdown', 'Restraining Grab'].includes(feature.name)) {
            data.range = {value: '5', units: 'ft', override: true};
            data.target = {affects: {type: 'creature', count: '1'}, prompt: false, override: true};
        } else if (feature.name === 'Misty Step') {
            data.range = {units: 'self', override: true};
            data.target = {affects: {type: 'self'}, prompt: false, override: true};
        }
    }

    item.system = {
        description: legacy.description,
        type: legacy.type ?? {value: item.type === 'weapon' ? 'natural' : 'monster'},
        activities: data ? {[ACTIVITY_ID]: data} : {}
    };
    if (legacy.properties) item.system.properties = structuredClone(legacy.properties);
    if (item.type === 'weapon') {
        item.system.equipped = true;
        item.system.proficient = 0;
    }
    if (feature.isEffect) {
        item.effects = [{
            name: item.name, img: item.img, type: 'base', transfer: true,
            system: {changes: ['mwak', 'rwak'].map(key => ({
                key: `system.rolls.damage.${key}.bonus`, type: 'add',
                value: String(stats.DpACalc), phase: 'initial'
            }))}
        }];
    }
    return item;
}

export function selectedHP(stats, value) {
    if (value === undefined || value === '') return Number(stats.HP);
    const hp = Number(value);
    const minimum = Number(stats.HPLow ?? stats.HP);
    const maximum = Number(stats.HPHigh ?? stats.HP);
    if (!Number.isInteger(hp) || hp < minimum || hp > maximum) throw new Error(`HP must be between ${minimum} and ${maximum}.`);
    return hp;
}

export function buildMonsterData({stats, type, features = [], saves = typeProfile(type).saves, hp, damageType = '', conditions = []}) {
    const name = `${stats.name ? `${stats.name} ` : ''}${type.name} - (CR ${stats.CR})`;
    const img = `${MODULE_PATH}/tokens/${type.name.toLowerCase()}.png`;
    const count = attackCount(stats, features);
    const actor = {
        name, type: 'npc', img,
        system: {
            attributes: {
                ac: {flat: Number(stats.ACDC), calc: 'flat'},
                hp: {value: selectedHP(stats, hp), max: selectedHP(stats, hp)},
                movement: {walk: Number(stats.speed ?? 30), units: 'ft'}
            },
            abilities: Object.fromEntries(ABILITIES.map(key => [key, {
                ...structuredClone(stats.abilities?.[key] ?? {value: 10}),
                proficient: saves.includes(key) ? 1 : 0
            }])),
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
    for (const item of actor.items) {
        for (const data of Object.values(item.system.activities ?? {})) {
            for (const part of data.damage?.parts ?? []) part.types = damageType ? [damageType] : [];
            if (data.type === 'attack') {
                const effects = conditionEffects(conditions);
                if (effects.length) {
                    item.effects = [...(item.effects ?? []), ...effects];
                    data.effects = effects.map(effect => ({_id: effect._id}));
                }
            } else if (item.name === 'Knockdown' || item.name === 'Restraining Grab') {
                const effects = conditionEffects(item.name === 'Knockdown' ? ['prone'] : ['grappled', 'restrained']);
                item.effects = effects;
                data.effects = effects.map(effect => ({_id: effect._id, ...(data.type === 'save' ? {onSave: false} : {})}));
            }
        }
        const energy = item.effects?.find(effect => effect.name === 'Energy Weapons (bonus damage)');
        if (energy && damageType) {
            for (const change of energy.system.changes) change.value = `${stats.DpACalc}[${damageType}]`;
        }
    }
    // Apply type features after optional attack typing: Corrosive Form is always Acid.
    applyTypeFeature(actor, type, stats);
    return actor;
}
