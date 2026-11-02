import assert from 'node:assert/strict';
import test from 'node:test';
import {buildMonsterData, parseCR, attackCount, fixedFeatureDamage} from '../scripts/actor-data.js';
import {MONSTERS_STATS, MONSTERS_ARCHETYPES, MONSTERS_FEATURES} from '../scripts/lib/monsters.js';

const type = {name: 'Undead'};
const features = MONSTERS_FEATURES.filter(Boolean);
const activity = item => Object.values(item.system.activities)[0];
const feature = name => features.find(f => f.name === name);

test('all CR and archetype rows retain numeric stats and fixed attack/damage formulas', () => {
    for (const stats of [...MONSTERS_STATS, ...MONSTERS_ARCHETYPES]) {
        const actor = buildMonsterData({stats, type, saves: ['dex']});
        assert.equal(actor.system.attributes.hp.value, Number(stats.HP));
        assert.equal(actor.system.attributes.ac.flat, Number(stats.ACDC));
        assert.equal(actor.effects[0].system.changes[0].value, Number(stats.PAB));
        assert.equal(actor.system.details.type.value, 'undead');
        assert.equal(activity(actor.items[0]).attack.bonus, String(stats.atkBonus ?? stats.PAB));
        assert.equal(activity(actor.items[0]).attack.flat, true);
        assert.match(activity(actor.items[0])._id, /^[A-Za-z0-9]{16}$/);
        assert.equal(activity(actor.items[0]).damage.parts[0].custom.formula, stats.DpACalc);
        assert.equal(actor.system.abilities.dex.proficient, stats.abilities?.dex.proficient ?? 1);
    }
});

test('fractional challenge ratings are parsed without executing text', () => {
    assert.equal(parseCR('1/8'), 0.125);
    assert.equal(parseCR('1/4'), 0.25);
    assert.equal(parseCR('1/2'), 0.5);
    assert.throws(() => parseCR('1/0'));
    assert.throws(() => parseCR('globalThis.x=1'));
});

test('features preserve burst damage, save DC, timing, and transferred energy bonuses', () => {
    const stats = MONSTERS_STATS.find(s => Number(s.NoA) >= 3);
    const actor = buildMonsterData({stats, type, features});
    const find = name => actor.items.find(i => i.name === name);
    const burst = activity(find('Damaging Burst'));
    assert.equal(burst.type, 'save');
    assert.equal(burst.save.dc.formula, String(stats.ACDC));
    assert.equal(burst.damage.onSave, 'half');
    assert.equal(burst.damage.parts[0].bonus, String(Math.floor(Number(stats.DpR) / 2)));
    assert.equal(burst.damage.parts[0].custom.enabled, false);
    assert.equal(activity(find('Knockdown')).save.dc.calculation, 'str');
    assert.equal(activity(find('Cunning Action')).activation.type, 'bonus');
    const energy = find('Energy Weapons (bonus damage)').effects[0];
    assert.equal(energy.transfer, true);
    assert.equal(energy.system.changes.length, 2);
    assert.ok(energy.system.changes.every(c => c.value === stats.DpACalc && c.type === 'add'));
    assert.deepEqual(energy.system.changes.map(c => c.key), ['system.rolls.damage.mwak.bonus', 'system.rolls.damage.rwak.bonus']);
});

test('each reducing feature removes one attack and the count cannot become negative', () => {
    const reducing = [feature('Damage Reflection'), feature('Damaging Aura')];
    assert.equal(attackCount({NoA: 5}, reducing), 3);
    assert.equal(attackCount({NoA: 3}, reducing), 1);
    assert.equal(attackCount({NoA: 1}, reducing), 0);
});

test('CR 30 half-damage features use readable native fixed values', () => {
    const stats = MONSTERS_STATS.at(-1);
    const actor = buildMonsterData({stats, type, features});
    for (const [name, value] of [['Damaging Aura', 31], ['Damage Reflection', 31], ['Damaging Burst', 156]]) {
        const part = activity(actor.items.find(i => i.name === name)).damage.parts[0];
        assert.equal(part.bonus, String(value));
        assert.equal(part.custom.enabled, false);
        assert.equal(part.custom.formula, '');
    }
    assert.equal(fixedFeatureDamage(MONSTERS_ARCHETYPES.find(s => s.name === 'Brute')), 4);
    assert.equal(fixedFeatureDamage(MONSTERS_ARCHETYPES.find(s => s.name === 'Brute'), true), 9);
});

test('all half-damage values are calculated from the resource columns or preset dice averages', () => {
    for (const stats of MONSTERS_STATS) {
        assert.equal(fixedFeatureDamage(stats), Math.floor(Number(stats.DpA) / 2));
        assert.equal(fixedFeatureDamage(stats, true), Math.floor(Number(stats.DpR) / 2));
    }
    for (const stats of MONSTERS_ARCHETYPES) {
        const [, number, die, bonus = '0'] = stats.DpACalc.match(/^(\d+)d(\d+)([+-]\d+)?$/);
        const mean = Number(number) * (Number(die) + 1) / 2 + Number(bonus);
        assert.equal(fixedFeatureDamage(stats), Math.floor(mean / 2));
        assert.equal(fixedFeatureDamage(stats, true), Math.floor(mean * Number(stats.NoA) / 2));
    }
});

test('affected creatures, trigger timing, and teleport distance match each feature', () => {
    const actor = buildMonsterData({stats: MONSTERS_STATS.at(-1), type, features});
    const find = name => activity(actor.items.find(i => i.name === name));
    const aura = find('Damaging Aura');
    assert.equal(aura.target.affects.type, 'creature');
    assert.equal(aura.target.template.size, '10');
    assert.equal(aura.range.units, 'self');
    assert.equal(aura.activation.type, 'special');
    const reflection = find('Damage Reflection');
    assert.equal(reflection.type, 'damage');
    assert.equal(reflection.target.affects.count, '1');
    assert.equal(reflection.range.value, '5');
    assert.equal(reflection.activation.type, 'special');
    assert.equal(find('Knockdown').target.affects.type, 'creature');
    const teleport = find('Misty Step');
    assert.equal(teleport.type, 'teleport');
    assert.equal(teleport.activation.type, 'bonus');
    assert.equal(teleport.teleport.value, '30');
    assert.equal(teleport.teleport.units, 'ft');
    assert.equal(teleport.target.affects.type, 'self');
});

test('each feature can be generated independently for every CR and preset', () => {
    const expected = {'Cunning Action': 'utility', 'Damaging Blast': 'attack', 'Damage Reflection': 'damage',
        'Damaging Aura': 'damage', 'Damaging Burst': 'save', 'Energy Weapons (extra attack)': 'attack',
        'Knockdown': 'save', 'Misty Step': 'teleport'};
    for (const stats of [...MONSTERS_STATS, ...MONSTERS_ARCHETYPES]) {
        for (const entry of features) {
            const actor = buildMonsterData({stats, type, features: [entry]});
            const item = actor.items[2];
            assert.equal(item.name, entry.name);
            assert.equal(activity(item)?.type, expected[entry.name], `${stats.CR}: ${entry.name}`);
            if (['Damaging Aura', 'Damage Reflection', 'Damaging Burst'].includes(entry.name)) {
                assert.match(activity(item).damage.parts[0].bonus, /^\d+$/);
            }
        }
    }
});

test('repeated generation never mutates the source tables or previous actors', () => {
    const original = JSON.stringify(features);
    const a = buildMonsterData({stats: MONSTERS_STATS[0], type, features});
    const aSnapshot = JSON.stringify(a);
    const b = buildMonsterData({stats: MONSTERS_STATS.at(-1), type, features});
    b.items[2].system.description.value = 'changed';
    assert.equal(JSON.stringify(features), original);
    assert.equal(JSON.stringify(a), aSnapshot);
});
