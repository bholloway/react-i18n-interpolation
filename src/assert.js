import {calculateErrors, calculateCollisions} from './token';


/**
 * Throw where the object[field] is not a function.
 *
 * @throws Error on object does not contain a function
 * @param {object} obj An object that should contain a function member
 * @param {string} field The name of the member expected to be a function
 * @param {string} message A title for the error
 */
export const assertGettextInstance = (obj, field, message) => {
  const isValid = (obj !== null) && (typeof obj === 'object') &&
    (field in obj) && (typeof obj[field] === 'function');
  if (!isValid) {
    throw new Error(`${message}: Gettext instance is missing ${field}() member`);
  }
};


/**
 * Throw on token problems.
 *
 * @throws Error on token problems
 * @param {Array.<{name :string, value: *}>} tokens A number of tokens
 * @param {string} message A title for the error
 */
export const assertTokens = (tokens, message) => {
  const errors = calculateErrors(tokens);
  if (errors.length) {
    throw new Error(`${message}: ${errors[0]}`);
  }

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
