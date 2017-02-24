import {getTemplate, makeSubstitutions} from './lib/template';
import {calculateDelimiters} from './lib/delimited';


/**
 * Gettext as a tagged template string interpolator.
 *
 * For the interpolator, substitutions should be plain text or React elements with a string `key`.
 * Where all `substitutions` are `string` then a `string` is returned. Otherwise an `Array` is
 * returned.
 *
 * The entire template is translated and substitutions will be named per the React elements.
 *
 * Failure to pass a `translate` function will result in no translation but no error will occur.
 *
 * @param {function} [translate] Optional translation function, required for translation to occur
 * @returns {function(array, ...string):array|string} Template string interpolator
 */
export const gettext = translate => (strings, ...substitutions) => {
  const {keys, untranslated} = getTemplate(strings, substitutions);
  const translated = (typeof translate === 'function') ? translate(untranslated) : untranslated;
  const {substituted, isText} = makeSubstitutions({text: translated, keys, substitutions});
  return isText ? substituted.join('') : substituted;
};

/**
 * NGettext as a tagged template string interpolator.
 *
 * The function must be closed with a `condition` value in order to create an interpolator. Normally
 * this `condition` would be a number that indicates singular (condition === 1) or plural otherwise.
 *
 * Singular and plural text are contained in the same template and delimited by a pipe `|`
 * character. The entire template is translated before the singular or plural is chosen.
 * There must be exactly one pipe in the template. Substitutions will be named per React element
 * `keys.
 *
 * The `condition` may alternatively be a function of the untranslated and translated template text
 * `function(string, string):number`. In this case there can be any number of delimiters.
 *
 * For the interpolator, substitutions should be plain text or React elements with a string `key`.
 * Where all `substitutions` are `string` then a `string` is returned. Otherwise an `Array` is
 * returned.
 *
 * Failure to pass a `translate` function will result in no translation but no error will occur.
 *
 * @param {function} [translate] Optional translation function, required for translation to occur
 * @returns {function(function|number):function} Factory for a template string interpolator
 */
export const ngettext = translate => condition => (strings, ...substitutions) => {
  const isConditionFn = (typeof condition === 'function');

  // get a template where react component keys determine the substitution tags
  const {keys, untranslated} = getTemplate(strings, substitutions);

  // translate
  const translated = (typeof translate === 'function') ? translate(untranslated) : untranslated;

  // process and validate delimiters
  const {lengthUntranslated, lengthTranslated, collated} =
    calculateDelimiters({delimiter: '|', strings, translated, keys, substitutions});

  if (lengthUntranslated !== lengthTranslated) {
    throw new Error('ngettext : translation does not preserve the number of pipe "|" characters');
  } else if (lengthUntranslated === 1) {
    throw new Error('ngettext : must contain a pipe "|" character');
  } else if (!isConditionFn && (lengthUntranslated > 2)) {
    throw new Error(
      `ngettext : number condition implies 1 pipe "|" character, saw ${lengthUntranslated - 1}`
    );
  }

  // calculate and validate index
  const index = isConditionFn ? condition(untranslated, translated) : Number(condition !== 1);
  if (!(index in collated)) {
    throw new Error('ngettext : condition must evaluate to an integer within template bounds');
  }

  // evaluate just the singular or plural
  const {substituted, isText} = makeSubstitutions(collated[index]);
  return isText ? substituted.join('') : substituted;
};

/**
 * Get both gettext and ngettext in an object.
 * @param {function} [translate] Optional translation function, required for translation to occur
 * @returns {{gettext:function, ngettext:function}} Hash of methods
 */
export const i18n = translate => ({
  gettext: gettext(translate),
  ngettext: ngettext(translate)
});

export const defaultGettext = gettext();
