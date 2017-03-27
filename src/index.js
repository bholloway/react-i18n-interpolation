import {defaultToToken, assertTokens} from './token';
import {getTemplate, makeSubstitutions} from './template';
import {defaultSplitPlural, assertPluralForms} from './plurals';


/**
 * Gettext as a tagged template string interpolator.
 *
 * For the interpolator, substitutions should be objects with a single key-value pair. The key
 * gives the `key` and `name` for the token and the `value` gives the value. Substitutions with the
 * same `name` must have `value` or an Error with result.
 *
 * Where all `substitutions` are `string` then a `string` is returned. Otherwise an `Array` is
 * returned. This allows React elements as substitutions. Elements must have an explicit `key` or
 * they will be assigned one automatically.
 *
 * Failure to pass a `gettext` function will not result in an error, but no translation will
 * occur.
 *
 * Customisation of the `toToken` function is for advanced users only. Make reference to the source
 * code.
 *
 * @throws Error On substitutions with duplicate `name`
 * @param {function} [gettext] Optional translation function, required for translation to occur
 * @param {function} [toToken] Optional custom token inference function, yields {name, key, value}
 * @param {string} [NODE_ENV] Reserved for testing
 * @returns {function(array, ...string):array|string} Template string interpolator
 */
export const gettextFactory = ({
  gettext = x => x,
  toToken = defaultToToken,
  NODE_ENV = (process.env || {}).NODE_ENV
} = {}) => (strings, ...substitutions) => {
  // get a msgid template with sensible token names
  const tokens = substitutions.map(toToken);
  const {names, values, msgid} = getTemplate(strings, tokens);

  // validate unless production
  if (NODE_ENV !== 'production') {
    assertTokens(tokens, `Error in gettext\`${msgid}\``);
  }

  // translate and substitute
  const msgstr = gettext(msgid);
  return makeSubstitutions({msgstr, names, values});
};


/**
 * NGettext as a tagged template string interpolator.
 *
 * The function is a factory and must be closed with a `quantity` value in order to create an
 * interpolator. Normally this `quantity` would be a number that indicates singular (quantity === 1)
 * or plural otherwise.
 *
 * For the interpolator, substitutions should be objects with a single key-value pair. The key
 * gives the `key` and `name` for the token and the `value` gives the value.
 *
 * Singular and plural forms are contained in the same template and delimited by `delimiter`, by
 * default this is the pipe `|` character.
 *
 * The underlying `ngettext` implementation will choose a single form. It is passed the delimited
 * strings followed by all arguments to the outer function. Validation of arguments is the
 * concern of `ngettext` and the user must either ensure that the `quantity` is singular or provide
 * an `ngettext` that performs validation.
 *
 * Where all `substitutions` are `string` then a `string` is returned. Otherwise an `Array` is
 * returned. This allows React elements as substitutions. Elements must have an explicit `key` or
 * they will be assigned one automatically.
 *
 * Failure to pass a `ngettext` function will not result in an error, but no translation will
 * occur. This degenerate case supports exactly 2 plural forms which may not suit some developers.
 * If you need more forms for development then pass a custom `splitPlural` implementation.
 *
 * Customisation of the `toToken` function is for advanced users only. Make reference to the source
 * code.
 *
 * @throws Error On substitutions with duplicate `name`, or on insufficent plural forms
 * @param {function} [ngettext] Optional translation function, required for translation to occur
 * @param {function} [toToken] Optional custom token inference function, yeilds {name, key, value}
 * @param {function} [splitPlural] Optional split string to plural forms, yeilds Array
 * @param {string} [NODE_ENV] Reserved for testing
 * @returns {function(quantity:int):function} Factory for a template string interpolator
 */
export const ngettextFactory = ({
  ngettext = (s, p, q) => ((typeof q !== 'number') || isNaN(q) || (q === 1) ? s : p),
  toToken = defaultToToken,
  splitPlural = defaultSplitPlural,
  NODE_ENV = (process.env || {}).NODE_ENV
} = {}) => (...quantity) => (strings, ...substitutions) => {
  // get a msgid template with sensible token names and split by the delimiter
  const tokens = substitutions.map(toToken);
  const {names, values, msgid} = getTemplate(strings, tokens);
  const msgidForms = splitPlural(msgid);

  // validate
  if (NODE_ENV !== 'production') {
    const message = `Error in ngettext(${quantity.map(String).join(', ')})\`${msgid}\``;
    assertTokens(tokens, message);
    assertPluralForms(splitPlural.expect, msgidForms.length, message);
  }

  // translate and make substitutions
  const msgstr = ngettext(...msgidForms, ...quantity);
  return makeSubstitutions({msgstr, names, values});
};


/**
 * Gettext as a degenerate template string interpolator.
 * @type {*}
 */
export const gettextDefault = gettextFactory();


/**
 * NGettext as a degenerate template string interpolator.
 * @type {*}
 */
export const ngettextDefault = ngettextFactory();
