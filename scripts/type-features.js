import {conditionEffects} from './conditions.js';

// These are builder defaults, not universal D&D creature-type rules.
export const TYPE_PROFILES = {
    Aberration: {saves: ['int', 'wis'], name: 'Psychic Resistance',
        rules: 'The creature has resistance to Psychic damage.', resistance: ['psychic']},
    Beast: {saves: ['str', 'dex'], name: 'Pack Tactics',
        rules: "The creature has Advantage on an attack roll against a target if at least one of its allies is within 5 feet of the target and that ally is not Incapacitated. The GM selects Advantage when the condition is met."},
    Celestial: {saves: ['wis', 'cha'], name: 'Magic Resistance',
        rules: 'The creature has Advantage on saving throws against spells and other magical effects. The GM selects Advantage for qualifying saves.'},
    Construct: {saves: ['str', 'con'], name: 'Construct Resilience',
        rules: 'The creature is immune to Poison and Psychic damage and the Poisoned condition.',
        immunity: ['poison', 'psychic'], conditions: ['poisoned']},
    Dragon: {saves: ['dex', 'wis'], name: 'Fear Aura',
        rules: "While the creature is not Incapacitated, it projects a 20-foot aura. An enemy that starts its turn in the aura must succeed on a Wisdom saving throw (DC {dc}) or be Frightened until the start of that enemy's next turn. On a successful save, that enemy is immune to this creature's aura for 24 hours. The GM invokes the save for each eligible enemy and manages the condition's ending and immunity."},
    Elemental: {saves: ['con', 'cha'], name: 'Elemental Resilience',
        rules: 'The creature is immune to Poison damage and the Poisoned condition.',
        immunity: ['poison'], conditions: ['poisoned']},
    Fey: {saves: ['dex', 'wis'], name: 'Fey Ancestry',
        rules: 'The creature has Advantage on saving throws to avoid or end the Charmed condition. The GM selects Advantage for qualifying saves.'},
    Fiend: {saves: ['wis', 'cha'], name: 'Magic Resistance',
        rules: 'The creature has Advantage on saving throws against spells and other magical effects. The GM selects Advantage for qualifying saves.'},
    Giant: {saves: ['str', 'con'], name: 'Extended Reach',
        rules: 'The creature has a reach of 10 feet with its generated melee attacks.'},
    Humanoid: {saves: ['dex', 'wis'], name: 'Parry',
        rules: 'When hit by a melee attack while holding a weapon, the creature can use its Reaction to gain +2 AC against that attack, potentially causing it to miss. The GM checks the weapon requirement and resolves the attack against the increased AC.'},
    Monstrosity: {saves: ['str', 'con'], name: 'Bloodied Fury',
        rules: 'While at half its maximum Hit Points or fewer, the creature has Advantage on attack rolls. The GM selects Advantage while this threshold is met.'},
    Ooze: {saves: ['str', 'con'], name: 'Corrosive Form',
        rules: 'When a creature hits this creature with a melee attack, the attacker takes {pb} Acid damage, equal to this creature\'s proficiency bonus. The GM invokes the damage after each qualifying hit.'},
    Plant: {saves: ['con', 'wis'], name: 'Rooted Resilience',
        rules: 'The creature is immune to the Prone condition.', conditions: ['prone']},
    Undead: {saves: ['con', 'wis'], name: 'Undead Fortitude',
        rules: 'When damage reduces the creature to 0 Hit Points, it makes a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is Radiant or from a Critical Hit. On a success, it has 1 Hit Point instead. The GM rolls its Constitution save against that DC and sets its Hit Points to 1 on a success.'}
};

export function typeProfile(type) {
    const profile = TYPE_PROFILES[type.name];
    if (!profile) throw new Error('Unknown monster type.');
    return profile;
}

export function typeFeatureRules(type, stats) {
    return typeProfile(type).rules.replaceAll('{dc}', String(stats.DC ?? stats.ACDC))
        .replaceAll('{pb}', String(Number(stats.PAB)));
}

export function applyTypeFeature(actor, type, stats) {
    const profile = typeProfile(type);
    actor.system.traits = {
        dr: {value: [...(profile.resistance ?? [])]},
        di: {value: [...(profile.immunity ?? [])]},
        ci: {value: [...(profile.conditions ?? [])]}
    };
    const item = {
        name: profile.name, type: 'feat', img: 'icons/svg/shield.svg',
        flags: {'lazy-monster-builder': {typeFeature: type.name.toLowerCase()}},
        system: {type: {value: 'monster'}, description: {value: `<p>${typeFeatureRules(type, stats)}</p>`}, activities: {}}
    };
    const id = 'lmbTypeActivity1';
    const activity = {
        _id: id, name: profile.name, type: 'utility',
        activation: {type: 'special', value: 1},
        consumption: {spellSlot: false, targets: []},
        target: {affects: {type: 'self'}, prompt: false, override: true}
    };
    if (type.name === 'Dragon') {
        item.effects = conditionEffects(['frightened']);
        Object.assign(activity, {
            type: 'save',
            activation: {type: 'special', value: 1, condition: 'An enemy starts its turn within 20 feet while this creature is not Incapacitated.'},
            save: {ability: ['wis'], dc: {calculation: '', formula: String(stats.DC ?? stats.ACDC)}},
            damage: {onSave: 'none', parts: []},
            range: {value: '20', units: 'ft', override: true},
            target: {affects: {type: 'enemy', count: '1'}, prompt: false, override: true},
            effects: item.effects.map(effect => ({_id: effect._id, onSave: false}))
        });
        item.system.activities[id] = activity;
    } else if (type.name === 'Ooze') {
        Object.assign(activity, {
            type: 'damage',
            activation: {type: 'special', value: 1, condition: 'A creature hits this creature with a melee attack.'},
            damage: {parts: [{bonus: String(Number(stats.PAB)), custom: {enabled: false, formula: ''}, types: ['acid']}]},
            target: {affects: {type: 'creature', count: '1'}, prompt: false, override: true}
        });
        item.system.activities[id] = activity;
    } else if (type.name === 'Humanoid' || type.name === 'Undead') {
        activity.activation.type = type.name === 'Humanoid' ? 'reaction' : 'special';
        activity.activation.condition = type.name === 'Humanoid'
            ? 'Hit by a melee attack while holding a weapon.'
            : 'Reduced to 0 HP by damage other than Radiant or a Critical Hit; roll a Constitution save against DC 5 + damage taken.';
        if (type.name === 'Humanoid') activity.roll = {formula: '2', name: 'Bonus AC', prompt: false, visible: false};
        else item.system.description.value += '<p>Roll the save: [[/save con]]. The GM compares the result with DC 5 + damage taken.</p>';
        item.system.activities[id] = activity;
    }
    if (type.name === 'Giant') {
        for (const weapon of actor.items) {
            for (const attack of Object.values(weapon.system.activities ?? {})) {
                if (attack.type !== 'attack' || attack.attack.type.value !== 'melee') continue;
                weapon.system.range = {reach: 10, units: 'ft'};
                attack.range = {value: '10', units: 'ft', override: true};
            }
        }
    }
    actor.items.push(item);
}
