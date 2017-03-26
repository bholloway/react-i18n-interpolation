import {defaultToToken, assertTokens} from './token';
import {getTemplate, makeSubstitutions} from './template';
import {calculateDelimiters} from './delimited';


/**
 * Gettext as a tagged template string interpolator.
 *
 * For the interpolator, substitutions should be objects with a single key-value pair. The key
 * gives the `key` and `name` for the token and the `value` gives the value.
 *
 * Where all `substitutions` are `string` then a `string` is returned. Otherwise an `Array` is
 * returned. This allows React elements as substitutions. Elements must have an explicit `key` or
 * they will be assigned one automatically.
 *
 * Failure to pass a `translate` function will not result in an error, but no translation will
 * occur.
 *
 * @param {function} [gettext] Optional translation function, required for translation to occur
 * @param {function} [toToken] Optional custom token inference function, yeilds {name, key, value}
 * @returns {function(array, ...string):array|string} Template string interpolator
 */
export const gettextFactory = ({
  gettext = x => x,
  toToken = defaultToToken
} = {}) => (strings, ...substitutions) => {
  const tokens = substitutions.map(toToken);
  const {names, values, msgid} = getTemplate(strings, tokens);
  assertTokens(tokens, `Error in gettext(${msgid})`);
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
 * default this is the pipe `|` character. The entire template is translated before the singular or
 * plural form is chosen.
 *
 * Under normal conditions there must be exactly one delimiter in the template. However a custom
 * `choose` method allows any number of delimited forms, and any mapping between factory arguments
 * and the selected form.
 *
 * Where all `substitutions` are `string` then a `string` is returned. Otherwise an `Array` is
 * returned. This allows React elements as substitutions. Elements must have an explicit `key` or
 * they will be assigned one automatically.
 *
 * Failure to pass a `translate` function will not result in an error, but no translation will
 * occur.
 *
 * @param {function} [ngettext] Optional translation function, required for translation to occur
 * @param {function} [toToken] Optional custom token inference function, yeilds {name, key, value}
 * @param {string} [delimiter] Optional custom delimiter character
 * @returns {function():function} Factory for a template string interpolator
 */
export const ngettextFactory = ({
  ngettext = x => x,
  toToken = defaultToToken,
  delimiter = '|'
} = {}) => {
  /*
  const calc = calculateDelimiters(delimiter);

  return (...quantity) => (strings, ...substitutions) => {
    // construct a template with name->value tokens
    const tokens = substitutions.map(toToken);
    assertTokens(tokens, `Error in ngettext(${msgid})`);
    const {names, values, msgid} = getTemplate(strings, tokens);

    // translate
    const msgstr = ngettext(msgid/*, ...TBD*//*);

    // process delimiters
    const {lengthUntranslated, lengthTranslated, groups} = calc({strings, msgstr, names, values});

    // ensure translation preserves delimiters
    if (lengthUntranslated !== lengthTranslated) {
      throw new Error('ngettext : translation must preserve all delimiter characters');
    } else if (lengthUntranslated < 2) {
      throw new Error(`ngettext : must contain a delimiter character "${delimiter}"`);
    }

    // evaluate just the singular or plural
    const chosen = choose(groups, ...quantity);
    const {substituted, isText} = makeSubstitutions(chosen);
    return isText ? substituted.join('') : substituted;
  };
  */
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
