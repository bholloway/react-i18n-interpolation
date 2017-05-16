import {calculateCollisions} from './token';


/**
 * Throw where the object[fieldname] is not a function.
 *
 * @throws Error on object does not contain a function
 * @param {object} obj An object that should contain a function member
 * @param {string} fieldname The name of the member expected to be a function
 * @param {string} message A title for the error
 */
export const assertGettextInstance = (obj, fieldname, message) => {
  const isValid = (obj !== null) && (typeof obj === 'object') &&
    (fieldname in obj) && (typeof obj[fieldname] === 'function');
  if (!isValid) {
    throw new Error(`${message}: Gettext instance is missing ${fieldname}() member`);
  }
};


/**
 * Throw on token name collisions.
 *
 * @throws Error on name collision
 * @param {Array.<{name :string, value: *}>} tokens A number of tokens
 * @param {string} message A title for the error
 */
export const assertTokens = (tokens, message) => {
  const collisions = calculateCollisions(tokens);
  if (collisions.length) {
    throw new Error(
      `${message}: substitution with the same name must have the same value: ${collisions}`);
  }
};


/**
 * Throw on incorrect number of plural forms.
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
