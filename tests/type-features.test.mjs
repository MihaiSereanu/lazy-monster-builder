import assert from 'node:assert/strict';
import test from 'node:test';
import {ABILITIES, buildMonsterData} from '../scripts/actor-data.js';
import {TYPE_PROFILES} from '../scripts/type-features.js';
import {MONSTERS_STATS, MONSTERS_ARCHETYPES, MONSTERS_TYPE, MONSTERS_FEATURES} from '../scripts/lib/monsters.js';

const profiles = [...MONSTERS_STATS, ...MONSTERS_ARCHETYPES];
const features = MONSTERS_FEATURES.filter(Boolean);
const expectedSaves = {
    Aberration: ['int', 'wis'], Beast: ['str', 'dex'], Celestial: ['wis', 'cha'],
    Construct: ['str', 'con'], Dragon: ['dex', 'wis'], Elemental: ['con', 'cha'],
    Fey: ['dex', 'wis'], Fiend: ['wis', 'cha'], Giant: ['str', 'con'],
    Humanoid: ['dex', 'wis'], Monstrosity: ['str', 'con'], Ooze: ['str', 'con'],
    Plant: ['con', 'wis'], Undead: ['con', 'wis']
};
const typeItem = actor => actor.items.find(item => item.flags?.['lazy-monster-builder']?.typeFeature);
const activities = item => Object.values(item.system.activities ?? {});

test('all 14 types add their free combat feature and two saves to every CR and preset', () => {
    assert.equal(MONSTERS_TYPE.length, 14);
    const before = JSON.stringify({profiles, types: TYPE_PROFILES});
    for (const type of MONSTERS_TYPE) {
        for (const stats of profiles) {
            const actor = buildMonsterData({stats, type});
            assert.equal(actor.items.length, 3);
            assert.ok(typeItem(actor), `${type.name} ${stats.CR}: missing free feature`);
            assert.equal(actor.items[1].name, `${stats.NoA} attack(s)`);
            assert.equal(actor.system.details.cr, Number(stats.CR.includes('/') ? stats.CR.split('/').reduce((a, b) => a / b) : stats.CR));
            assert.deepEqual(ABILITIES.filter(key => actor.system.abilities[key].proficient).sort(), [...expectedSaves[type.name]].sort());
            for (const key of ABILITIES) assert.equal(actor.system.abilities[key].value, stats.abilities?.[key].value ?? 10);
        }
    }
    assert.equal(JSON.stringify({profiles, types: TYPE_PROFILES}), before);
});

test('GM save choices replace defaults, including zero or all saves, in both modes', () => {
    for (const stats of profiles) {
        for (const saves of [[], ['cha'], ABILITIES]) {
            const actor = buildMonsterData({stats, type: {name: 'Giant'}, saves});
            assert.deepEqual(ABILITIES.filter(key => actor.system.abilities[key].proficient), saves);
        }
    }
});

test('each optional feature retains its original attack cost for every type', () => {
    for (const type of MONSTERS_TYPE) {
        for (const stats of profiles) {
            for (const feature of features) {
                const cost = ['Damage Reflection', 'Damaging Aura'].includes(feature.name) ? 1 : 0;
                const actor = buildMonsterData({stats, type, features: [feature]});
                assert.equal(actor.items[1].name, `${Math.max(0, Number(stats.NoA) - cost)} attack(s)`);
            }
            const actor = buildMonsterData({stats, type, features});
            assert.equal(actor.items[1].name, `${Math.max(0, Number(stats.NoA) - 2)} attack(s)`);
        }
    }
});

test('native traits provide the approved damage and condition protections', () => {
    const build = name => buildMonsterData({stats: MONSTERS_STATS[0], type: {name}}).system.traits;
    assert.deepEqual(build('Aberration').dr.value, ['psychic']);
    assert.deepEqual(build('Construct').di.value, ['poison', 'psychic']);
    assert.deepEqual(build('Construct').ci.value, ['poisoned']);
    assert.deepEqual(build('Elemental').di.value, ['poison']);
    assert.deepEqual(build('Elemental').ci.value, ['poisoned']);
    assert.deepEqual(build('Plant').ci.value, ['prone']);
    for (const name of ['Beast', 'Celestial', 'Fey', 'Fiend', 'Monstrosity']) {
        const actor = buildMonsterData({stats: MONSTERS_STATS[0], type: {name}});
        assert.equal(actor.effects.length, 1, 'Conditional advantage must not become a blanket effect.');
    }
});

test('Giant reach applies to melee attacks and leaves ranged attacks unchanged', () => {
    const actor = buildMonsterData({stats: MONSTERS_STATS[0], type: {name: 'Giant'}, features});
    for (const item of actor.items) for (const activity of activities(item)) {
        if (activity.type !== 'attack') continue;
        if (activity.attack.type.value === 'melee') {
            assert.equal(item.system.range.reach, 10);
            assert.equal(activity.range.value, '10');
        } else assert.notEqual(activity.range?.value, '10');
    }
});

test('Fear Aura offers a table-DC Wisdom save and Frightened only on failure', () => {
    for (const stats of profiles) {
        const item = typeItem(buildMonsterData({stats, type: {name: 'Dragon'}}));
        const [activity] = activities(item);
        assert.equal(activity.type, 'save');
        assert.deepEqual(activity.save.ability, ['wis']);
        assert.equal(activity.save.dc.formula, String(stats.DC ?? stats.ACDC));
        assert.equal(activity.range.value, '20');
        assert.equal(activity.target.affects.type, 'enemy');
        assert.deepEqual(activity.damage.parts, []);
        assert.deepEqual(item.effects[0].system.rider.statuses, ['frightened']);
        assert.equal(activity.effects[0].onSave, false);
    }
});

test('Corrosive Form keeps Acid typing and PB damage regardless of attack damage type', () => {
    for (const stats of profiles) {
        const actor = buildMonsterData({stats, type: {name: 'Ooze'}, damageType: 'fire', conditions: ['prone']});
        const [corrosion] = activities(typeItem(actor));
        assert.deepEqual(corrosion.damage.parts[0].types, ['acid']);
        assert.equal(corrosion.damage.parts[0].bonus, String(Number(stats.PAB)));
        assert.equal(corrosion.effects, undefined);
        assert.deepEqual(activities(actor.items[0])[0].damage.parts[0].types, ['fire']);
    }
});

test('Parry is a reaction and Fortitude preserves its damage-dependent save rule', () => {
    const stats = MONSTERS_STATS[0];
    const parry = typeItem(buildMonsterData({stats, type: {name: 'Humanoid'}}));
    assert.equal(activities(parry)[0].activation.type, 'reaction');
    assert.equal(parry.effects, undefined, 'Parry must not permanently increase AC.');
    const fortitude = typeItem(buildMonsterData({stats, type: {name: 'Undead'}}));
    assert.match(fortitude.system.description.value, /5 \+ the damage taken/);
    assert.equal(activities(fortitude)[0].type, 'utility', 'Fortitude must not use a guessed fixed DC.');
});
