/** Run only in a disposable Foundry D&D 5e world. Creates test actors and chat cards. */
export async function checkFoundryTypes() {
    const root = new URL('modules/lazy-monster-builder/scripts/', document.baseURI);
    const {buildMonsterData} = await import(new URL('actor-data.js', root).href);
    const {MONSTERS_STATS, MONSTERS_ARCHETYPES, MONSTERS_TYPE, MONSTERS_FEATURES} = await import(new URL('lib/monsters.js', root).href);
    const {TYPE_PROFILES} = await import(new URL('type-features.js', root).href);
    const assert = (ok, message) => {if (!ok) throw new Error(message);};
    const report = {core: game.version, system: game.system.version, combinations: 0, persisted: [], chats: []};
    const profiles = [...MONSTERS_STATS, ...MONSTERS_ARCHETYPES];
    for (const type of MONSTERS_TYPE) for (const stats of profiles) {
        const actor = new CONFIG.Actor.documentClass(buildMonsterData({stats, type, features: MONSTERS_FEATURES.filter(Boolean)}), {strict: true});
        assert(actor.validate(), `Invalid ${type.name}, ${stats.CR}`);
        assert(actor._preparationWarnings.length === 0, `Preparation warnings: ${type.name}, ${stats.CR}`);
        assert(actor.items.some(item => item.getFlag('lazy-monster-builder', 'typeFeature')), 'Missing type feature.');
        const actualSaves = Object.entries(actor.system.abilities).filter(([, data]) => data.proficient).map(([key]) => key).sort();
        assert(JSON.stringify(actualSaves) === JSON.stringify([...TYPE_PROFILES[type.name].saves].sort()), 'Incorrect default saves.');
        report.combinations++;
    }
    const created = [];
    try {
        for (const type of MONSTERS_TYPE) {
            const actor = await Actor.create(buildMonsterData({stats: MONSTERS_STATS.at(-1), type, damageType: 'fire', saves: ['cha']}));
            created.push(actor);
            assert(actor.system.abilities.cha.proficient === 1 && actor.system.abilities.con.proficient === 0, 'Save override was lost.');
            const item = actor.items.find(item => item.getFlag('lazy-monster-builder', 'typeFeature'));
            const activity = item.system.activities.contents[0];
            if (type.name === 'Aberration') assert(actor.system.traits.dr.value.has('psychic'), 'Psychic resistance missing.');
            if (type.name === 'Construct') assert(actor.system.traits.di.value.has('psychic') && actor.system.traits.di.value.has('poison') && actor.system.traits.ci.value.has('poisoned'), 'Construct immunities missing.');
            if (type.name === 'Elemental') assert(actor.system.traits.di.value.has('poison') && actor.system.traits.ci.value.has('poisoned'), 'Elemental immunities missing.');
            if (type.name === 'Plant') assert(actor.system.traits.ci.value.has('prone'), 'Plant immunity missing.');
            if (type.name === 'Giant') assert(actor.items.getName('Attack').system.range.reach === 10, 'Giant reach missing.');
            if (type.name === 'Ooze') {
                const rolls = await activity.rollDamage({}, {configure: false}, {create: false});
                assert(rolls[0].total === Number(MONSTERS_STATS.at(-1).PAB), 'Wrong corrosion damage.');
                assert(rolls[0].options.types.includes('acid'), 'Corrosion lost Acid typing.');
                report.corrosion = {total: rolls[0].total, types: rolls[0].options.types};
            }
            if (activity) {
                const usage = await activity.use({create: {measuredTemplate: false}}, {configure: false});
                assert(usage.message, `No chat card: ${type.name}`);
                report.chats.push(usage.message.id);
                if (type.name === 'Dragon') {
                    assert(activity.save.dc.value === Number(MONSTERS_STATS.at(-1).ACDC), 'Fear Aura DC lost.');
                    const offered = await usage.message.system.getEffects();
                    assert(offered.length === 1, 'Fear Aura must offer Frightened.');
                    const target = created.find(entry => entry.system.details.type.value === 'beast');
                    const tray = document.createElement('effect-application');
                    tray.chatMessage = usage.message;
                    await tray._applyEffectToActor(item.effects.contents[0], target);
                    assert(target.statuses.has('frightened') && !actor.statuses.has('frightened'), 'Fear applied to wrong creature.');
                }
            }
            report.persisted.push({id: actor.id, type: type.name, feature: item.name});
        }
        // Exercise native condition immunity, not just stored trait values.
        const source = await Actor.create(buildMonsterData({stats: MONSTERS_STATS[0], type: {name: 'Beast'}, conditions: ['poisoned', 'prone']}));
        created.push(source);
        const usage = await source.items.getName('Attack').system.activities.contents[0].use({}, {configure: false});
        report.chats.push(usage.message.id);
        const tray = document.createElement('effect-application');
        tray.chatMessage = usage.message;
        for (const [type, condition] of [['construct', 'poisoned'], ['elemental', 'poisoned'], ['plant', 'prone']]) {
            const target = created.find(actor => actor.system.details.type.value === type);
            const effect = source.items.getName('Attack').effects.find(effect => effect.getFlag('lazy-monster-builder', 'condition') === condition);
            await tray._applyEffectToActor(effect, target);
            assert(!target.statuses.has(condition), `Native immunity failed: ${type}`);
        }
        return report;
    } finally {
        for (const actor of created) await actor.delete();
        // Keep chat cards for inspection; deleting a card during Foundry's popup
        // animation causes a core #postNotification error. Clean up after reload.
    }
}
