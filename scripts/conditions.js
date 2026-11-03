// Source: mshea/lazy_gm_tools/fof_stats.html. Notices are preserved in ATTRIBUTION.md.
export const CONDITIONS = [
  {
    "id": "blinded",
    "name": "Blinded",
    "custom": false
  },
  {
    "id": "charmed",
    "name": "Charmed",
    "custom": false
  },
  {
    "id": "frightened",
    "name": "Frightened",
    "custom": false
  },
  {
    "id": "grappled",
    "name": "Grappled",
    "custom": false
  },
  {
    "id": "incapacitated",
    "name": "Incapacitated",
    "custom": false
  },
  {
    "id": "paralyzed",
    "name": "Paralyzed",
    "custom": false
  },
  {
    "id": "petrified",
    "name": "Petrified",
    "custom": false
  },
  {
    "id": "poisoned",
    "name": "Poisoned",
    "custom": false
  },
  {
    "id": "prone",
    "name": "Prone",
    "custom": false
  },
  {
    "id": "restrained",
    "name": "Restrained",
    "custom": false
  },
  {
    "id": "stunned",
    "name": "Stunned",
    "custom": false
  },
  {
    "id": "unconscious",
    "name": "Unconscious",
    "custom": false
  },
  {
    "id": "confused",
    "name": "Confused",
    "custom": true,
    "rules": "<p>No Reactions. On each turn, roll a d8:</p><ul><li>1?4: Do nothing.</li><li>5?6: Take no Action or Bonus Action; use all movement in a random direction.</li><li>7?8: Make a melee attack against a random creature within reach, or do nothing if no attack is possible.</li></ul>"
  },
  {
    "id": "doomed",
    "name": "Doomed",
    "custom": true,
    "rules": "<p>Die after 13 (2d12) hours, or at a time set by the GM. Doomed persists after death. Removing it requires magic equivalent to a level 7 or higher spell, such as Regenerate on a living creature, Resurrection, True Resurrection, or Wish.</p>"
  },
  {
    "id": "rattled",
    "name": "Rattled",
    "custom": true,
    "rules": "<p>No Reactions. Immunity to Stunned also grants immunity to Rattled.</p>"
  },
  {
    "id": "slowed",
    "name": "Slowed",
    "custom": true,
    "rules": "<p>Speed is halved. Take ?2 to AC and Dexterity saves. No Reactions. Each turn, take an Action or a Bonus Action, and make no more than one melee or ranged attack.</p>"
  },
  {
    "id": "fatigue",
    "name": "Fatigue",
    "custom": true,
    "rules": "<p>Fatigue levels accumulate. Apply the current level and all lower levels. Effects add or remove the stated number of levels; below level 1, all Fatigue effects end. A Long Rest removes one level.</p><ol><li>Cannot Dash.</li><li>Disadvantage on Strength, Dexterity, and Constitution checks.</li><li>Speed halved.</li><li>Disadvantage on attack rolls and saves using Strength, Dexterity, or Constitution.</li><li>Hit Dice halved.</li><li>Speed reduced to 5 feet.</li><li>Doomed; the creature dies.</li></ol>"
  },
  {
    "id": "strife",
    "name": "Strife",
    "custom": true,
    "rules": "<p>Strife levels accumulate. Apply the current level and all lower levels. Effects add or remove the stated number of levels; below level 1, all Strife effects end. A Long Rest removes one level.</p><ol><li>Disadvantage on Intelligence, Wisdom, and Charisma checks.</li><li>Disadvantage on Concentration checks.</li><li>Take an Action or a Bonus Action each turn, not both.</li><li>Disadvantage on attack rolls and saves using Intelligence, Wisdom, or Charisma.</li><li>A random short-term mental stress effect.</li><li>Cannot cast spells other than cantrips.</li><li>A permanent effect chosen by the GM or determined randomly, such as a long-term mental stress effect.</li></ol>"
  }
];

export function conditionEffects(ids = []) {
    return [...new Set(ids)].map(id => {
        const index = CONDITIONS.findIndex(condition => condition.id === id);
        if (index < 0) throw new Error('Unknown attack condition.');
        const condition = CONDITIONS[index];
        return {
            _id: `lmbCond${String(index).padStart(9, '0')}`,
            name: condition.name,
            img: 'icons/svg/aura.svg', type: 'base', transfer: false,
            flags: {'lazy-monster-builder': {condition: condition.id, native: !condition.custom}},
            description: condition.custom
                ? `<p>The GM manages its timing, levels, and consequences.</p>${condition.rules}`
                : `<p>Apply &Reference[${condition.id}] using the world's native D&amp;D 5e rules. The GM determines its duration.</p>`,
            system: {changes: [], rider: {statuses: condition.custom ? [] : [condition.id]}}
        };
    });
}

// End this module's application reminders when their native condition is removed.
// A later use can then create a fresh application through the native chat tray.
export async function clearConditionApplications(effect, _options, userId) {
    if (userId !== game.user.id || effect.parent?.documentName !== 'Actor' || effect.type !== 'condition') return;
    const actor = effect.parent;
    const applications = actor.effects.filter(entry => entry.getFlag('lazy-monster-builder', 'native')
        && entry.getFlag('lazy-monster-builder', 'condition') === effect.system.type);
    if (applications.length) await actor.deleteEmbeddedDocuments('ActiveEffect', applications.map(entry => entry.id));
}
