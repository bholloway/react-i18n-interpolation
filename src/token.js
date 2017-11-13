import {isValidElement, cloneElement} from 'react';

/**
 * Convert a substitution into a record.
 *
 * May indicate an `error` but must return reasonable properties regardless.
 *
 * This implementation is opinionated in that:
 *   * non-primitive substitutions must be presented in a {[key]:value} hash
 *   * where a {[key]:value} hash is present, the key must be alphanumeric
 *
 * @param {*} candidate A substitution
 * @param {number} i Array index
 * @return {{error: string, label: string, name: string, key: string, value: *}}
 */
export const defaultToToken = (candidate, i) => {

  // key is for react, only where candidate is a hash with single member
  const isObject = !!candidate && (typeof candidate === 'object');
  const fields = isObject ? Object.keys(candidate) : [];
  const key = (fields.length === 1) && fields[0] || undefined;

  // label is human readable
  const label = key ? `${i}:"${key}"` : String(i);

  // name appears in the msgid, it may just be the value of any simple substitution
  // problems can occur if the name has spaces
  const name = key ? `__${key}__` : String(candidate);

  // don't clone React elements here, values must be comparable by reference
  const value = key ? candidate[key] : String(candidate);

  // we are opinionated about tokens
  const isKeyRequired = !!candidate && ['object', 'function', 'symbol'].includes(typeof candidate);
  const error = key ?
    (!/^[a-zA-Z0-9_-]+$/.test(key) && 'Keys must be alphanumeric') :
    (isKeyRequired && 'All non-primitive substitutions must be "keyed" by word');

  return {error, label, name, key, value};
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
export const defaultFinaliseToken = ({key, value}, i) =>
  (isValidElement(value) && !value.key ?
    cloneElement(value, {key: `${key}-${i}`}) :
    value);

/**
 * Calculate a message for those tokens which indicated an error.
 *
 * @param {Array.<{label: string, name: string, value: *}>} tokens A number of tokens
 * @returns {Array.<string>} An array of error statements, possibly empty but never null
 */
export const calculateErrors = tokens =>
  tokens
    .map(({error}) => error)
    .filter(Boolean)
    .filter((v, i, a) => (a.indexOf(v) === i));

/**
 * Calculate a message for those tokens with a name collision.
 *
 * @param {Array.<{label: string, name: string, value: *}>} tokens A number of tokens
 * @returns {Array.<string>} An array of collision statements, possibly empty but never null
 */
export const calculateCollisions = tokens =>
  tokens
    .map((token, i, arr) => {
      const collidesWith = arr.filter((other, j) =>
        (j === i) || ((other.name === token.name) && (other.value !== token.value))
      );
      return (collidesWith.length > 1) && collidesWith.map(({label}) => label).join(' vs ');
    })
    .filter(Boolean)
    .filter((msg, i, arr) => (arr.indexOf(msg) === i));
