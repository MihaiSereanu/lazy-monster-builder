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
    "rules": "<ul>\n <li>A confused creature can't take reactions.</li>\n <li>On its turn a confused creature rolls a d8 to determine what it does. \n <ul>\n <li>On a 1 to 4, a confused creature does nothing. </li>\n <li>On a 5 or 6, a confused creature takes no action or bonus action and uses all its movement to move in a randomly determined direction. </li>\n <li>On a 7 or 8, a confused creature makes a melee attack against a randomly determined creature within its reach or does nothing if it can't make such an attack.</li>\n </ul>\n </li>\n </ul>"
  },
  {
    "id": "doomed",
    "name": "Doomed",
    "custom": true,
    "rules": "<ul>\n<li>A doomed creature dies at a time determined by the GM, or within 13 (2d12) hours.</li>\n<li>A doomed creature continues to be doomed even after it dies. Magic equivalent to a 7th-level or higher spell can remove the doomed condition (such as regenerate cast on a living creature, resurrection, true resurrection, or wish).</li>\n</ul>"
  },
  {
    "id": "rattled",
    "name": "Rattled",
    "custom": true,
    "rules": "<ul>\n <li>A rattled creature cannot take reactions.</li>\n <li>A creature that is immune to being stunned is immune to being rattled.</li>\n </ul>"
  },
  {
    "id": "slowed",
    "name": "Slowed",
    "custom": true,
    "rules": "<ul>\n <li>A slowed creature's Speed is halved.</li>\n <li>A slowed creature takes a −2 penalty to AC and Dexterity saving throws.</li>\n <li>A slowed creature cannot take reactions.</li>\n <li>On its turn, a slowed creature can take either an action or a bonus action, not both. In addition, it can't make more than one melee or ranged attack during its turn.</li>\n </ul>"
  },
  {
    "id": "fatigue",
    "name": "Fatigue",
    "custom": true,
    "rules": "<p>Various challenges, obstacles, and magics can lead to either fatigue or strife. An effect can give a creature one or more levels of fatigue or strife (detailed in the effect's description).</p>\n <p>If a creature suffering from fatigue or strife fails to resist another effect that causes a level of the tracked condition, its current level increases by the amount specified in the effect's description.</p>\n <p>A creature suffers the effect of its current level in a tracked condition as well as all lower levels. For example, a creature suffering level 3 fatigue has its Speed halved, it cannot Sprint, and it makes Strength, Dexterity, and Constitution checks with disadvantage.</p>\n <p>An effect that removes a tracked condition reduces its level as specified in the effect's description, with all tracked condition effects ending when a creature's condition level is reduced below 1.</p>\n <p>Finishing a long rest reduces a creature's fatigue and strife levels by 1.</p>\n<p>Fatigue represents exhaustion, exposure, hunger, injuries, and other physical factors which gradually wear a creature down. A creature which reaches the 7th level of the fatigue track becomes doomed and dies.</p>\n <p><strong>Fatigue Level Effects</strong></p>\n <ol>\n <li>Cannot dash.</li>\n <li>Disadvantage on Strength, Dexterity, and Constitution checks.</li>\n <li>Speed halved.</li>\n <li>Disadvantage on attack rolls and saving throws using Strength, Dexterity, or Constitution.</li>\n <li>Hit Dice halved.</li>\n <li>Speed reduced to 5 ft.</li>\n <li>Doomed.</li>\n </ol>"
  },
  {
    "id": "strife",
    "name": "Strife",
    "custom": true,
    "rules": "<p>Various challenges, obstacles, and magics can lead to either fatigue or strife. An effect can give a creature one or more levels of fatigue or strife (detailed in the effect's description).</p>\n <p>If a creature suffering from fatigue or strife fails to resist another effect that causes a level of the tracked condition, its current level increases by the amount specified in the effect's description.</p>\n <p>A creature suffers the effect of its current level in a tracked condition as well as all lower levels. For example, a creature suffering level 3 fatigue has its Speed halved, it cannot Sprint, and it makes Strength, Dexterity, and Constitution checks with disadvantage.</p>\n <p>An effect that removes a tracked condition reduces its level as specified in the effect's description, with all tracked condition effects ending when a creature's condition level is reduced below 1.</p>\n <p>Finishing a long rest reduces a creature's fatigue and strife levels by 1.</p>\n<p>Strife represents corruption, despair, fear, loss of resolve, and other mental factors which gradually undo a creature's very soul. A creature which reaches the 7th level of the strife track suffers a special, permanent effect, which is either randomly selected or decided by the GM. This might involve the creature shutting down completely, or being impacted in such a way that it is forever changed.</p>\n <p><strong>Strife Level Effects</strong></p>\n <ol>\n<li>Disadvantage on Intelligence, Wisdom, and Charisma checks.</li>\n <li>Disadvantage on concentration checks.</li>\n <li>Can only take a bonus action or action each turn (not both).</li>\n <li>Disadvantage on attack rolls and saving throws using Intelligence, Wisdom, and Charisma.</li>\n <li>Suffer the effects of a randomly determined short-term mental stress effect.</li>\n <li>Cannot cast spells (but can cast cantrips).</li>\n <li>Suffer the effects of a randomly determined long-term mental stress effect.</li>\n </ol>"
  }
];

export function conditionEffects(ids = []) {
    return [...new Set(ids)].map(id => {
        const index = CONDITIONS.findIndex(condition => condition.id === id);
        if (index < 0) throw new Error('Unknown attack condition.');
        const condition = CONDITIONS[index];
        return {
            _id: `lmbCond${String(index).padStart(9, '0')}`,
            name: condition.name + (condition.custom ? ' (reminder)' : ''),
            img: 'icons/svg/aura.svg', type: 'base', transfer: false,
            flags: {'lazy-monster-builder': {condition: condition.id, native: !condition.custom}},
            description: condition.custom
                ? `<p><strong>Custom condition reminder.</strong> The GM manages its timing, levels, and consequences.</p>${condition.rules}`
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
