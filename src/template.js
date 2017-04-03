/**
 * Combine the given strings and token names to give a msgid string.
 *
 * @param {Array.<string>} strings Template strings as given to the tagged template literal
 * @param {Array.<{name}>} tokens Tokens that contain a `name` field
 * @return {string} A msgid that contains `name` placeholders for substitutions
 */
export const getTemplate = (strings, tokens) => {
  const names = tokens
    .reduce((reduced, {name}) => [...reduced, name], []);

  return strings
    .map((v, i) => ((i < names.length) ? `${v}${names[i]}` : v))
    .join('')
    .replace(/\s{2,}/g, ' ');
};


/**
 * Make substitutions back into the translated string.
 *
 * @param {string} msgstr A translated string that contains token names
 * @param {Array.<{name, key, value}>} tokens Substitution tokens
 * @param {function} finaliseToken Transform of token to final value
 * @return {string|Array} A simple string or an Array of string and complex types
 */
export const makeSubstitutions = ({msgstr, tokens, finaliseToken}) => {
  const cast = (v) => {
    switch (typeof v) {
      case 'undefined':
      case 'boolean':
      case 'number':
      case 'string':
        return String(v);
      default:
        return v;
    }
  };

  const elements = tokens
    .reduce((reduced, {name}, i) => {
      if (name.length) {
        const completed = reduced.slice(0, -1);
        const remaining = reduced[reduced.length - 1] || '';
        const split = remaining.split(name);
        if (split.length > 1) {
          const unsplit = split.slice(1).join(name);
          return [...completed, split[0], i, unsplit];
        }
      }
      return reduced;
    }, [msgstr])
    .filter(v => (typeof v !== 'string') || v.length);

  const substituted = elements
    .reduce((reduced, v) => {
      const pending = cast(
        (typeof v === 'number') ? finaliseToken(tokens[v], reduced.length) : v
      );
      if (reduced.length === 0) {
        return [pending];
      } else {
        const rest = reduced.slice(0, -1);
        const last = reduced[reduced.length - 1];
        return (typeof pending === 'string') && (typeof last === 'string') ?
          [...rest, `${last}${pending}`] :
          [...rest, last, pending];
      }
    }, []);

  return substituted.every(v => (typeof v === 'string')) ?
    substituted.join('') :
    substituted;
};
