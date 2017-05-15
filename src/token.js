import {isValidElement, cloneElement} from 'react';


/**
 * Convert a substitution into a record.
 *
 * @param {*} candidate A substitution
 * @param {number} i Array index
 * @return {{label: string, name: string, key: string, value: *}}
 */
export const defaultToToken = (candidate, i) => {

  // establish the candidate is valid
  const isObject = !!candidate && (typeof candidate === 'object');
  const fields = isObject ? Object.keys(candidate) : [];
  const isValid = (fields.length === 1);
  const key = fields[0];

  // label is human readable, name is for msgid, key for react, value must be unadulterated until
  //  after substitution
  const label = isValid ? `${i}:"${key}"` : i;
  const name = isValid ? `__${key}__` : String(candidate);
  const value = isValid ? candidate[key] : candidate;

  return {label, name, key, value};
};


/**
 * Convert a token into a final substitution value.
 *
 * React elements are cloned with a unique key. However existing keys are not overwritten.
 *
 * @param {string} key A key implied by the toToken function
 * @param {*} value A substitution value, possibly non-unique
 * @param {number} i The index in which the token will appear, subject to string consolidation
 * @returns {*} A unique value
 */
export const defaultFinaliseToken = ({key, value}, i) => (
  isValidElement(value) && !value.key ?
    cloneElement(value, {key: `${key}-${i}`}) :
    value
);


/**
 * Calculate which tokens have a name collision.
 *
 * @param {Array.<{name :string, value: *}>} tokens A number of tokens
 * @returns {Array.<string>} An array of collision statements, possibly empty but never null
 */
export const calculateCollisions = tokens =>
  tokens
    .map((token, i, arr) => {
      const collidesWith = arr.slice(i + 1)
        .map(other => ((other.name === token.name) && (other.value !== token.value) && other))
        .filter(Boolean);
      return !!collidesWith.length &&
        [token].concat(collidesWith)
          .map(x => x.label)
          .join(' vs ');
    })
    .filter(Boolean)
    .filter((msg, i, arr) => !arr.slice(0, i).find(prev => (prev.indexOf(msg) >= 0)));
