import {isValidElement, cloneElement} from 'react';


export const defaultToToken = (candidate, i) => {
  // establish the candidate is valid
  const isObject = !!candidate && (typeof candidate === 'object');
  const keys = isObject ? Object.keys(candidate) : [];
  const isValid = (keys.length === 1);

  // determine key and name
  const key = isValid ? keys[0] : i;
  const name = isValid ? `__${key}__` : String(candidate);

  // react elements must have a valid key
  const pending = isValid ? candidate[key] : candidate;
  const value = isValidElement(pending) && !pending.key ?
    cloneElement(pending, {key}) :
    pending;

  return {name, key, value};
};


export const assertTokens = (tokens, message) => {
  const errors = tokens
    .filter((token, i, arr) =>
      arr.slice(i + 1).some(following =>
        (following.key === token.key) && (following.value !== token.value)
      ))
    .map(token => token.key);

  if (errors.length) {
    throw new Error(`${message}: substitution must be unique or have unique key: ${errors}`);
  }
};
