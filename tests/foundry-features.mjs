/** Run inside an isolated Foundry D&D 5e world with this module enabled. */
export async function checkFoundryFeatures() {
    const {buildMonsterData, fixedFeatureDamage} = await import(new URL('modules/lazy-monster-builder/scripts/actor-data.js', document.baseURI).href);
    const {MONSTERS_STATS, MONSTERS_ARCHETYPES, MONSTERS_FEATURES} = await import(new URL('modules/lazy-monster-builder/scripts/lib/monsters.js', document.baseURI).href);
    const features = MONSTERS_FEATURES.filter(Boolean);
    const profiles = [...MONSTERS_STATS, ...MONSTERS_ARCHETYPES];
    const expected = {'Cunning Action': 'utility', 'Damaging Blast': 'attack', 'Damage Reflection': 'damage',
        'Damaging Aura': 'damage', 'Damaging Burst': 'save', 'Energy Weapons (extra attack)': 'attack',
        'Knockdown': 'save', 'Misty Step': 'teleport', 'Restraining Grab': 'utility'};
    const halfDamage = new Set(['Damaging Aura', 'Damage Reflection', 'Damaging Burst']);
    const report = {core: game.version, system: game.system.version, combinations: 0, damageRolls: 0, persisted: []};
    const assert = (ok, message) => {if (!ok) throw new Error(message);};

    for (const stats of profiles) {
        for (const selection of [...features.map(feature => [feature]), features]) {
            const actor = new CONFIG.Actor.documentClass(buildMonsterData({stats, type: {name: 'Undead'}, features: selection}), {strict: true});
            assert(actor.validate(), `Actor validation failed: ${stats.name ?? stats.CR}`);
            assert(actor._preparationWarnings.length === 0, 'Actor has preparation warnings.');
            for (const feature of selection) {
                const item = actor.items.getName(feature.name);
                const activity = item.system.activities.contents[0];
                assert(activity?.type === expected[feature.name], `Missing activity: ${feature.name}`);
                if (!activity) continue;
                if (halfDamage.has(feature.name)) {
                    const damage = fixedFeatureDamage(stats, feature.name === 'Damaging Burst');
                    assert(activity.labels.damages[0].formula === String(damage), `Unclean label: ${feature.name}`);
                    assert(!activity.damage.parts[0].custom.enabled, 'Fixed damage uses a custom formula.');
                }
                if (activity.type === 'teleport') {
                    assert(activity.teleport.value === 30 && activity.activation.type === 'bonus', 'Incorrect teleport.');
                }
                for (const config of activity.getDamageConfig?.().rolls ?? []) {
                    const roll = await new CONFIG.Dice.DamageRoll(config.parts.join(' + '), config.data, config.options).evaluate({minimize: true});
                    assert(Number.isFinite(roll.total), `Invalid damage roll: ${feature.name}`);
                    if (halfDamage.has(feature.name)) {
                        assert(roll.total === fixedFeatureDamage(stats, feature.name === 'Damaging Burst'), 'Fixed damage has an unexpected modifier.');
                    }
                    report.damageRolls++;
                }
            }
            if (selection.includes(features.find(f => f.isEffect))) {
                assert(!actor.system.rolls.damage.msak?.bonus && !actor.system.rolls.damage.rsak?.bonus, 'Energy bonus affects spell attacks.');
                assert(actor.system.rolls.damage.mwak.bonus.includes(stats.DpACalc), 'Weapon energy bonus is missing.');
            }
            report.combinations++;
        }
    }

    const actor = await Actor.create(buildMonsterData({stats: MONSTERS_STATS.at(-1), type: {name: 'Undead'}, features}));
    try {
        for (const [name, damage] of [['Damaging Aura', 31], ['Damage Reflection', 31], ['Damaging Burst', 156]]) {
            const activity = actor.items.getName(name).system.activities.contents[0];
            const rolls = await activity.rollDamage({}, {configure: false}, {create: false});
            assert(rolls.length === 1 && rolls[0].total === damage, `Wrong persisted roll: ${name}`);
            const usage = await activity.use({create: {measuredTemplate: false}}, {configure: false});
            assert(usage.message, `Native chat card missing: ${name}`);
            report.persisted.push({name, formula: rolls[0].formula, total: rolls[0].total,
                chatCard: usage.message.id, activation: activity.activation.type});
        }
        const mistyStep = actor.items.getName('Misty Step').system.activities.contents[0];
        assert(mistyStep.teleport.value === 30 && mistyStep.target.affects.type === 'self', 'Persisted teleport data is incorrect.');
        assert(actor.items.getName('3 attack(s)'), 'Combined reductions did not produce three attacks.');
        await actor.sheet.render({force: true});
        report.actorId = actor.id;
    } catch (error) {
        await actor.delete();
        throw error;
    }
    return report;
}
