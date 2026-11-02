import assert from 'node:assert/strict';
import test from 'node:test';
import {buildMonsterData, parseCR, attackCount} from '../scripts/actor-data.js';
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
    assert.equal(burst.damage.parts[0].custom.formula,
        `floor((${Array(Number(stats.NoA)).fill(stats.DpACalc).join('+')})/2)`);
    assert.equal(activity(find('Knockdown')).save.dc.calculation, 'str');
    assert.equal(activity(find('Cunning Action')).activation.type, 'bonus');
    const energy = find('Energy Weapons (bonus damage)').effects[0];
    assert.equal(energy.transfer, true);
    assert.equal(energy.system.changes.length, 4);
    assert.ok(energy.system.changes.every(c => c.value === stats.DpACalc && c.type === 'add'));
});

test('attack reduction applies once and cannot become negative', () => {
    const reducing = [feature('Damage Reflection'), feature('Damaging Aura')];
    assert.equal(attackCount({NoA: 3}, reducing), 2);
    assert.equal(attackCount({NoA: 1}, reducing), 0);
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
