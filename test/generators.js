import {gen} from 'tape-check';

// testcheck has problems with uniqueness of undefined and null
const undef = {};
const nul = {};
const uniqueFn = v =>
  ((v === undefined) ? undef : (v === null) ? nul : v);

// exclude the default ngettext delimiter, subtitute it at your own peril
export const anyPrimitive = gen.primitive
  .suchThat(v => !String(v).includes('|'));

export const anySymbolOrFunctionRef = gen.oneOf([
  gen.undefined.then(() => Symbol('Symbol')),
  gen.undefined.then(() => (() => undefined))
]);

export const anyEmptyObjectOrArray = gen.oneOf([
  gen.undefined.then(() => ({})),
  gen.undefined.then(() => ([]))
]);

export const anyValue = gen.oneOfWeighted([
  [10, anyPrimitive],
  [1, anySymbolOrFunctionRef],
  [1, anyEmptyObjectOrArray]
]);

export const anyNonEmptyAlphaNumericString = gen.alphaNumString
  .suchThat(v => (v.trim().length > 0));

// not exhaustive
export const anyIllegalString = gen.substring('()`~!@#$%^&*+=\\{}[]:;"\'<>,.?/');

export const anyEnumerableWithSingleEmptyKey = gen.object({
  '': anyValue
});

export const anyEnumerableWithMultipleKeys = gen.object({
  x: anyValue,
  y: anyValue
});

/**
 * The set of values that don't have valid keys and are considered non-primitive
 * @type {Generator<any>}
 */
export const anyUnkeyedComplexSubstitution = gen.oneOf([
  anySymbolOrFunctionRef,
  anyEmptyObjectOrArray,
  anyEnumerableWithSingleEmptyKey,
  anyEnumerableWithMultipleKeys
]);

/**
 * key-value pair of a single primitive value with a valid key
 * @type {Generator<any>}
 */
export const anyKeyedPrimitiveSubstitutionKV = gen.object({
  k: anyNonEmptyAlphaNumericString,
  v: anyPrimitive
});

/**
 * key-value pair of a single non-primitive value with a valid key
 * @type {Generator<any>}
 */
export const anyKeyedComplexSubstitutionKV = gen.object({
  k: anyNonEmptyAlphaNumericString,
  v: gen.oneOf([anySymbolOrFunctionRef, anyEmptyObjectOrArray])
});

/**
 * key-value pair of a single primitive value with an invalid key
 * @type {Generator<any>}
 */
export const anyIllegalPrimitiveSubstitutionKV = gen.object({
  k: anyIllegalString.notEmpty(),
  v: anyPrimitive
});

/**
 * key-value pair of a single non-primitive value with an invalid key
 * @type {Generator<any>}
 */
export const anyIllegalComplexSubstitutionKV = gen.object({
  k: anyIllegalString.notEmpty(),
  v: gen.oneOf([anySymbolOrFunctionRef, anyEmptyObjectOrArray])
});

/**
 * The set of substitutions which we expect to remain as separate elements in the final result
 * @type {Generator<any>}
 */
export const anyObjectLikeSubstitution = anyKeyedComplexSubstitutionKV
  .then(({k, v}) => ({[k]: v}));

/**
 * The set of substitutions which we expect to become strings in the final result
 * @type {Generator<any>}
 */
export const anyStringLikeSubstitution = gen.oneOf([
  anyPrimitive,
  anyUnkeyedComplexSubstitution,
  anyKeyedPrimitiveSubstitutionKV.then(({k, v}) => ({[k]: v}))
]);

// pre-generate all the necessary elements to ensure they are unique
const genUniqueTokens = ({minSize, maxSize}) =>
  gen.intWithin(minSize, maxSize)
    .then(size => gen.object({
      size,
      strings: gen.uniqueArray(anyNonEmptyAlphaNumericString, {size: size * 3}),
      values: gen.uniqueArray(anyValue, uniqueFn, {size})
    }))
    .then(({size, strings, values}) => (new Array(size)).fill()
      .map((_, i) => ({
        label: strings[i * 3],
        key: strings[i * 3 + 1],
        name: strings[i * 3 + 2],
        value: values[i]
      }))
    );

// generate some array indices in ascending order
const genIndices = ({minSize, maxSize}) =>
  ((maxSize < minSize) ?
    gen.undefined.then(() => []) :
    gen.uniqueArray(gen.intWithin(0, maxSize - 1), {minSize, maxSize})
      .then(arr => arr.sort()));

// take the elements of some array and group them into N nested arrays, by grouping each Nth element
// cull any groups that are less than 2 elements
const groupElements = ({maxGroups}) => array =>
  gen.intWithin(1, maxGroups)
    .then(numGroups => array
      .reduce(
        (groups, element, i) => {
          groups[i % numGroups].push(element);
          return groups;
        },
        (new Array(numGroups)).fill().map(() => [])
      )
      .filter(group => (group.length > 1))
    );

const genGroupedIndicesForTokens = ({maxGroups}) => uniqueTokens =>
  gen.object({
    uniqueTokens,
    groupedIndices: genIndices({minSize: 0, maxSize: uniqueTokens.length})
      .then(groupElements({maxGroups}))
  });

// adjust the tokens for each of the groups so that there are duplicates based on the first token
// in the group
const createDuplicatesIn = field => ({uniqueTokens, groupedIndices, ...rest}) => ({
  ...rest,
  uniqueTokens,
  groupedIndices,
  tokens: uniqueTokens.map((token, i) => {
    const j = groupedIndices.findIndex(indices => indices.includes(i));
    const reference = (j in groupedIndices) && uniqueTokens[groupedIndices[j][0]] || token;
    return {...token, [field]: reference[field]};
  })
});

/**
 * Generator for between 2 and 9 tokens with some conflicting values.
 *
 * Tokens have conflicting values within the same sets. The `groupedIndices` gives the indices of
 * the tokens in each set.
 *
 * @type {Generator}
 */
export const genTokensWithDuplicateValues =
  genUniqueTokens({minSize: 2, maxSize: 9})
    .then(genGroupedIndicesForTokens({maxGroups: 3}))
    .then(createDuplicatesIn('value'));

/**
 * Generator for between 2 and 9 tokens with some conflicting names.
 *
 * Tokens have conflicting names within the same sets. The `groupedLabels` gives the labels of the
 * tokens in each set.
 *
 * @type {Generator}
 */
export const genTokensWithDuplicateNames =
  genUniqueTokens({minSize: 2, maxSize: 9})
    .then(genGroupedIndicesForTokens({maxGroups: 3}))
    .then(createDuplicatesIn('name'))
    .then(({tokens, groupedIndices, ...rest}) => ({
      ...rest,
      tokens,
      groupedLabels: groupedIndices.map(indices => tokens
        .filter((_, i) => indices.includes(i))
        .map(({label}) => label)
      )
    }));

/**
 * Generate a number of substitution values which might imply objects or strings in the final
 * result. The `objIndicies` indicate those indices  where we would expect objects to appear in the
 * final output.
 *
 * @param {int} size Quantity to generate
 * @returns {Generator}
 */
export const genMixOfStringAndObjectSubstitutions = ({size}) =>
  gen.object({
    objIndices: genIndices({minSize: 0, maxSize: size}),
    objLikeSubstitutions: gen.array(anyObjectLikeSubstitution, {size}),
    strLikeSubstitutions: gen.array(anyStringLikeSubstitution, {size})
  })
    .then(({objIndices, objLikeSubstitutions, strLikeSubstitutions}) => {
      const objectPool = objLikeSubstitutions.slice();
      const stringPool = strLikeSubstitutions.slice();
      const values = (new Array(size)).fill()
        .map((_, i) => (objIndices.includes(i) ? objectPool.pop() : stringPool.pop()));
      return {objIndices, values};
    });
