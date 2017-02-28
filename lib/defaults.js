import {isValidElement, cloneElement} from 'react';

export const defaultToToken = (candidate, i) => {
  // establish the candidate is valid
  const isObject = !!candidate && (typeof candidate === 'object');
  const keys = isObject ? Object.keys(candidate) : [];
  const isValid = (keys.length === 1);

  // determine key and name
  const key = isValid ? keys[0] : i;
  const name = `__${key}__`;

  // react elements must have a valid key
  const pending = isValid ? candidate[key] : candidate;
  const value = isValidElement(pending) && !pending.key ?
    cloneElement(pending, {key}) :
    pending;

  return {name, key, value};
};

export const defaultChoose = (list, quantity) => {
  const index = Number(quantity !== 1);

  if (list.length > 2) {
    throw new Error(
      `ngettext : too many delimiters, expected 1 saw ${list.length - 1}`
    );
  } else if (!(index in list)) {
    throw new Error('ngettext : condition must evaluate to an integer within template bounds');
  } else {
    return list[index];
  }
};
