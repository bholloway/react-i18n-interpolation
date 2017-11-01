import {defaultToToken, defaultFinaliseToken} from './token';
import {getTemplate, makeSubstitutions} from './template';
import {defaultNgettext, defaultSplitPlural} from './defaults';
import {assertGettextInstance, assertTokens, assertPluralForms} from './assert';


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
 * Customisation of the `toToken` and `finaliseToken` functions is for advanced users only. Make
 * reference to the source code.
 *
 * @throws Error On substitutions with duplicate `name`
 * @param {{gettext: function}} [gettext] Optional gettext instance that contains gettext function
 * @param {function} [toToken] Optional custom token inference function yields {label, name, value}
 * @param {function} [finaliseToken] Optional transform of token to final value
 * @param {string} [NODE_ENV] Reserved for testing
 * @returns {function(array, ...string):array|string} Template string interpolator
 */
export const gettextFactory = ({
  gettext = {gettext: x => x},
  toToken = defaultToToken,
  finaliseToken = defaultFinaliseToken,
  NODE_ENV = process.env.NODE_ENV
} = {}) => (strings, ...substitutions) => {

  // get a msgid template with sensible token names
  const tokens = substitutions.map(toToken);
  const msgid = getTemplate(strings, tokens);

  // validate unless production
  if (NODE_ENV !== 'production') {
    const message = `Error in gettext\`${msgid}\``;
    assertGettextInstance(gettext, 'gettext', message);
    assertTokens(tokens, message);
  }

  // translate and substitute
  //  we need to call from the gettext parent object in case gettext() uses 'this'
  const msgstr = gettext.gettext(msgid);
  return makeSubstitutions({msgstr, tokens, finaliseToken});
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
 * If you need more forms for development then pass explict `numPlural` and a custom `splitPlural`
 * implementation.
 *
 * Customisation of the `toToken` and `finaliseToken` functions is for advanced users only. Make
 * reference to the source code.
 *
 * @throws Error On substitutions with duplicate `name`, or on insufficent plural forms
 * @param {{ngettext: function}} [gettext] Optional gettext instance that contains ngettext function
 * @param {function} [toToken] Optional custom token inference function yields {label, name, value}
 * @param {function} [finaliseToken] Optional transform of token to final value
 * @param {function} [splitPlural] Optional split string to plural forms, yeilds Array
 * @param {Number} [numPlural] Optional expected number of plurals (expected delimiters + 1)
 * @param {string} [NODE_ENV] Reserved for testing
 * @returns {function(quantity:int):function} Factory for a template string interpolator
 */
export const ngettextFactory = ({
  gettext = {ngettext: defaultNgettext},
  toToken = defaultToToken,
  finaliseToken = defaultFinaliseToken,
  splitPlural = defaultSplitPlural,
  numPlural = 2,
  NODE_ENV = process.env.NODE_ENV
} = {}) => (...quantity) => (strings, ...substitutions) => {

  // get a msgid template with sensible token names and split by the delimiter
  const tokens = substitutions.map(toToken);
  const msgid = getTemplate(strings, tokens);
  const msgidForms = splitPlural(msgid);

  // validate unless production
  if (NODE_ENV !== 'production') {
    const message = `Error in ngettext(${quantity.map(String).join(', ')})\`${msgid}\``;
    assertGettextInstance(gettext, 'ngettext', message);
    assertTokens(tokens, message);
    assertPluralForms(numPlural, msgidForms.length, message);
  }

  // translate and make substitutions
  //  we need to call from the gettext parent object in case ngettext() uses 'this'
  const msgstr = gettext.ngettext(...msgidForms, ...quantity);
  return makeSubstitutions({msgstr, tokens, finaliseToken});
};


/**
 * Create a hash of all methods using shared options.
 *
 * @param {{gettext:{gettext: function, ngettext: function}, toToken: function,
 * finaliseToken: function, splitPlural: function, numPlural: Number,
 * NODE_ENV: string}} [options] Shared options to pass to method factories
 */
export const factory = options => ({
  gettext: gettextFactory(options),
  ngettext: ngettextFactory(options)
});


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
