/**
 * Gettext implementation that performs no translation.
 *
 * @param {string} msgid
 * @returns msgstr
 */
export const defaultGettext = msgid => msgid;


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
