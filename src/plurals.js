/**
 * Ngettext implementation that performs no translation.
 *
 * @param {string} singular A msgid for when `quantity === 1`
 * @param {string} plural A msgid for when `quantity !== 1`
 * @param {number} quantity A quantity that indicates plural
 * @returns Either the singular or plural msgstr
 */
export const defaultNgettext = (singular, plural, quantity) =>
  ((typeof quantity !== 'number') || isNaN(quantity) || (quantity === 1) ? singular : plural);


/**
 * Split template by a delimiter into multiple msgid forms.
 *
 * @param {string} msgid The template string to split
 * @returns {Array.<string>} A number of plural forms of msgid, split by the delimiter
 */
export const defaultSplitPlural = msgid =>
  msgid.split('|');


/**
 *
 * @throws Error on incorrect number of plural forms
 * @param {number|*} expected Expected number of plural forms, possibly non-numeric where disabled
 * @param {number} actual Actual number of plural forms found
 * @param {string} message A title for the error
 */
export const assertPluralForms = (expected, actual, message) => {
  if (!isNaN(expected) && (expected > 0) && (actual !== expected)) {
    throw new Error(`${message}: expected ${expected} plural forms, saw ${actual}`);
  }
};
