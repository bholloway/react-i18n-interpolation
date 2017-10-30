import test from 'tape';
import {check, gen} from 'tape-check';

import {times, safeIsNaN} from './helpers';
import {
  anyValue, anyNonEmptyAlphaNumericString,
  anyEnumerableInvalidKey, anyEnumerableWithMultipleKeys,
  genTokensWithDuplicateValues, genTokensWithDuplicateNames
} from './generators';

import {defaultToToken, calculateCollisions} from '../src/token';


test('token parsing: direct substitutions or invalid keyed substitutions', check(
  times(50),
  gen.oneOfWeighted([
    [10, anyValue],
    [1, anyEnumerableInvalidKey],
    [1, anyEnumerableWithMultipleKeys]
  ]),
  gen.intWithin(0, 10),
  (t, substitution, i) => {
    const {key, label, name, value} = defaultToToken(substitution, i);

    t.equal(key, undefined, 'key should be undefined');
    t.ok(label.includes(String(i)), 'label should include the given index');
    t.equal(name, String(substitution), 'name should be the substitution cast to string');
    t.equal(value, String(substitution), 'value should be the substitution cast to string');
    t.end();
  }
));


test('token parsing: valid keyed substitutions', check(
  times(50),
  anyNonEmptyAlphaNumericString,
  anyValue,
  gen.intWithin(0, 10),
  (t, k, v, i) => {
    const {key, label, name, value} = defaultToToken({[k]: v}, i);

    t.equal(key, k, 'key is as specified');
    t.ok(label.includes(String(i)), 'label is something that includes the index');
    t.ok(label.includes(k), 'label is something that includes the key');
    t.ok(name.includes(k), 'name is something that includes the key');

    if (safeIsNaN(v)) {
      t.ok(safeIsNaN(value), 'value should be as specified');
    } else {
      t.equal(value, v, 'value should be as specified');
    }

    t.end();
  }
));


test('token validation: duplicate values', check(
  times(50),
  genTokensWithDuplicateValues,
  (t, {tokens}) => {
    t.deepEqual(
      calculateCollisions(tokens),
      [],
      'should allow duplicate values unconditionally'
    );
    t.end();
  }
));


test('token validation: duplicate names', check(
  times(50),
  genTokensWithDuplicateNames,
  (t, {tokens, groupedLabels}) => {
    t.deepEqual(
      calculateCollisions(tokens),
      groupedLabels.map(labels => labels.join(' vs ')),
      'should disallow same name different value, and identify all such sets by label'
    );
    t.end();
  }
));
