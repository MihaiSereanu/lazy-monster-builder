import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {CONDITIONS, conditionEffects} from '../scripts/conditions.js';
import {buildMonsterData, selectedHP} from '../scripts/actor-data.js';
import {MONSTERS_STATS, MONSTERS_ARCHETYPES, MONSTERS_FEATURES} from '../scripts/lib/monsters.js';

test('all CR rows agree with the supplied Forge of Foes snapshot', async () => {
    const reference = JSON.parse(await readFile(new URL('./fixtures/fof-stats.json', import.meta.url)));
    for (const stats of MONSTERS_STATS) {
        const row = reference[`CR ${stats.CR}`];
        assert.equal(Number(stats.ACDC), row['AC/DC']);
        assert.equal(`${stats.HP} (${stats.HPLow}-${stats.HPHigh})`, row.HP);
        assert.equal(stats.PAB, row['Atk/Prof']);
        assert.equal(stats.NoA, row['# Atks']);
        assert.equal(stats.DpR, row['Damage Per Round']);
        assert.equal(`${stats.DpA} (${stats.DpACalc})`, row.Dmg.replaceAll(' ', '').replace('(', ' ('));
    }
});

test('HP selection preserves defaults, accepts range endpoints, and rejects invalid values', () => {
    for (const stats of MONSTERS_STATS) {
        assert.equal(selectedHP(stats), Number(stats.HP));
        assert.equal(selectedHP(stats, stats.HPLow), Number(stats.HPLow));
        assert.equal(selectedHP(stats, stats.HPHigh), Number(stats.HPHigh));
        assert.throws(() => selectedHP(stats, Number(stats.HPLow) - 1));
        assert.throws(() => selectedHP(stats, Number(stats.HPHigh) + 1));
        assert.throws(() => selectedHP(stats, 1.5));
    }
    assert.throws(() => selectedHP(MONSTERS_ARCHETYPES[0], 999));
});

test('native effects use status riders and custom effects remain reminders', () => {
    assert.equal(CONDITIONS.filter(c => !c.custom).length, 12);
    assert.equal(CONDITIONS.filter(c => c.custom).length, 6);
    const effects = conditionEffects(CONDITIONS.map(c => c.id));
    assert.equal(new Set(effects.map(e => e._id)).size, 18);
    for (const [index, effect] of effects.entries()) {
        assert.match(effect._id, /^[A-Za-z0-9]{16}$/);
        assert.equal(effect.transfer, false);
        assert.deepEqual(effect.system.changes, []);
        assert.deepEqual(effect.system.rider.statuses, CONDITIONS[index].custom ? [] : [CONDITIONS[index].id]);
        if (CONDITIONS[index].custom) assert.ok(effect.description.includes('GM manages'));
    }
    assert.throws(() => conditionEffects(['invalid']));
    assert.equal(conditionEffects(['prone', 'prone']).length, 1);
});

test('selected conditions attach to attacks, and built-in condition features link their own effects', () => {
    const actor = buildMonsterData({stats: MONSTERS_STATS.at(-1), type: {name: 'Undead'},
        features: MONSTERS_FEATURES.filter(Boolean), damageType: 'necrotic', conditions: ['prone', 'rattled'], hp: 700});
    assert.equal(actor.system.attributes.hp.max, 700);
    for (const item of actor.items) {
        for (const activity of Object.values(item.system.activities ?? {})) {
            for (const part of activity.damage?.parts ?? []) assert.deepEqual(part.types, ['necrotic']);
            if (activity.type === 'attack') {
                assert.equal(activity.effects.length, 2);
                assert.ok(activity.effects.every(e => item.effects.some(source => source._id === e._id)));
            }
        }
    }
    const knockdown = actor.items.find(i => i.name === 'Knockdown');
    assert.deepEqual(knockdown.effects[0].system.rider.statuses, ['prone']);
    assert.equal(Object.values(knockdown.system.activities)[0].effects[0].onSave, false);
    const grab = actor.items.find(i => i.name === 'Restraining Grab');
    assert.deepEqual(grab.effects.flatMap(e => e.system.rider.statuses), ['grappled', 'restrained']);
});

