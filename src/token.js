import {isValidElement, cloneElement} from 'react';


export const defaultToToken = (candidate, i) => {
  // establish the candidate is valid
  const isObject = !!candidate && (typeof candidate === 'object');
  const fields = isObject ? Object.keys(candidate) : [];
  const isValid = (fields.length === 1);
  const field = isValid && fields[0];

  // label is human readable, name is for msgid, key i for React
  //  names can possibly repeat but it costs us nothing to ensure the label and key are more robust
  const label = isValid ? `${i}:${field}` : i;
  const name = isValid ? `__${field}__` : String(candidate);
  const key = isValid ? `${field}-${i}` : i;

  // react elements must have a valid key
  const pending = isValid ? candidate[field] : candidate;
  const value = isValidElement(pending) && !pending.key ?
    cloneElement(pending, {key}) :
    pending;

  return {label, name, key, value};
};


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
    .filter((msg, i, arr) =>
      !arr.slice(0, i).find(prev => (prev.indexOf(msg) >= 0))
    );


export const assertTokens = (tokens, message) => {
  const collisions = calculateCollisions(tokens);
  if (collisions.length) {
    throw new Error(
      `${message}: substitution with the same bane must have the same value: ${collisions}`);
  }
};
