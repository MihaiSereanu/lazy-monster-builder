/** Run in a disposable Foundry D&D 5e world. Creates actors and chat messages. */
export async function checkFoundryConditions() {
    const root = new URL('modules/lazy-monster-builder/scripts/', document.baseURI);
    const {buildMonsterData} = await import(new URL('actor-data.js', root).href);
    const {CONDITIONS} = await import(new URL('conditions.js', root).href);
    const {MONSTERS_STATS, MONSTERS_FEATURES} = await import(new URL('lib/monsters.js', root).href);
    const assert = (ok, message) => {if (!ok) throw new Error(message);};
    const report = {native: [], reminders: [], reapplication: false};
    const statusConfig = JSON.stringify(CONFIG.statusEffects);
    const stats = MONSTERS_STATS.at(-1);
    const source = await Actor.create(buildMonsterData({stats, type: {name: 'Undead'},
        features: MONSTERS_FEATURES.filter(Boolean), conditions: CONDITIONS.map(c => c.id), damageType: 'necrotic', hp: 700}));
    const target = await Actor.create(buildMonsterData({stats: MONSTERS_STATS[0], type: {name: 'Humanoid'}}));
    try {
        assert(source.statuses.size === 0, 'Source monster inherited its attack conditions.');
        const item = source.items.getName('Attack');
        const activity = item.system.activities.contents[0];
        const damage = activity.getDamageConfig().rolls[0];
        const typedRoll = await new CONFIG.Dice.DamageRoll(damage.parts.join(' + '), damage.data, damage.options).evaluate({minimize: true});
        assert(typedRoll.options.types.includes('necrotic'), 'Energy weapon damage lost its selected type.');
        assert(typedRoll.total === 70, 'Energy weapon damage did not retain both damage parts.');
        const usage = await activity.use({create: {measuredTemplate: false}}, {configure: false});
        assert(usage.message, 'Attack did not create a native chat card.');
        const offered = await usage.message.system.getEffects();
        assert(offered.length === 18, 'Chat card did not offer all selected conditions.');
        const tray = document.createElement('effect-application');
        tray.chatMessage = usage.message;
        const clear = async () => {
            if (target.effects.size) await target.deleteEmbeddedDocuments('ActiveEffect', target.effects.contents.map(e => e.id));
        };
        for (const [index, condition] of CONDITIONS.entries()) {
            const profile = item.effects.get(`lmbCond${String(index).padStart(9, '0')}`);
            assert(profile && !profile.transfer, 'Condition profile missing or transferred.');
            await clear();
            const applied = await tray._applyEffectToActor(profile, target);
            if (condition.custom) {
                assert(target.statuses.size === 0, `Reminder changed statuses: ${condition.name}`);
                assert(target.system.attributes.movement.walk === 30, 'Reminder changed speed.');
                assert(applied.system.changes.length === 0, 'Reminder contains mechanical changes.');
                report.reminders.push(condition.name);
                continue;
            }
            assert(target.statuses.has(condition.id), `Native status missing: ${condition.name}`);
            const native = target.effects.find(effect => effect.type === 'condition' && effect.system.type === condition.id);
            assert(native, `Condition was not created by the native system: ${condition.name}`);
            if (condition.id === 'grappled' || condition.id === 'restrained') {
                assert(target.system.attributes.movement.walk === 0, `${condition.name} did not stop movement.`);
            }
            await clear();
            assert(!target.statuses.has(condition.id), 'Condition did not clear.');
            await target.update({'system.traits.ci.value': [condition.id]});
            await tray._applyEffectToActor(profile, target);
            assert(!target.statuses.has(condition.id), `Condition immunity failed: ${condition.name}`);
            await clear();
            await target.update({'system.traits.ci.value': []});
            report.native.push(condition.name);
        }
        await clear();
        const proneProfile = item.effects.find(effect => effect.name === 'Prone');
        await tray._applyEffectToActor(proneProfile, target);
        await target.toggleStatusEffect('prone', {active: false});
        assert(!target.statuses.has('prone'), 'Native condition removal failed.');
        for (let attempt = 0; attempt < 30 && target.effects.some(effect => effect.getFlag('lazy-monster-builder', 'condition') === 'prone'); attempt++) {
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        await tray._applyEffectToActor(proneProfile, target);
        for (let attempt = 0; attempt < 30 && !target.statuses.has('prone'); attempt++) {
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        report.reapplication = target.statuses.has('prone');
        assert(report.reapplication, 'Condition did not reapply after native removal.');
        assert(JSON.stringify(CONFIG.statusEffects) === statusConfig, 'Global native status configuration changed.');
        assert(source.system.attributes.hp.max === 700, 'Chosen HP was not stored.');
        report.sourceId = source.id;
        report.typedEnergyDamage = {formula: typedRoll.formula, minimum: typedRoll.total, types: typedRoll.options.types};
        return report;
    } finally {
        await target.delete();
        await source.delete();
    }
}
