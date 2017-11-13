import test from 'tape';
import sinon from 'sinon';
import React from 'react';
import {check, gen} from 'tape-check';

import {times, requireSrc} from './helpers';
import {
  anyPrimitive, anyValue, anyUnkeyedComplexSubstitution,
  anyKeyedPrimitiveSubstitutionKV, anyKeyedComplexSubstitutionKV,
  anyIllegalPrimitiveSubstitutionKV, anyIllegalComplexSubstitutionKV,
  genTokensWithDuplicateNames, genMixOfStringAndObjectSubstitutions
} from './generators';

const {defaultNgettext} = requireSrc('defaults');
const {ngettextFactory} = requireSrc('index');


const createSpy = () => {
  const spy = sinon.spy();
  const ngettext = (...args) => {
    spy(...args);
    return defaultNgettext(...args);
  };

  return {spy, gettext: {ngettext}};
};


test('gettext: created with bad gettext instance', (t) => {
  const devTemplate = ngettextFactory({NODE_ENV: 'development', gettext: {}});

  t.throws(
    () => devTemplate()`foo|bar`,
    /Gettext instance is missing ngettext/,
    'should throw descriptive error in development env'
  );

  const prodTemplate = ngettextFactory({NODE_ENV: 'production', gettext: {}});

  t.throws(
    () => prodTemplate()`foo|bar`,
    /TypeError/,
    'should throw a less descriptive error in production env (not robust to this misuse)'
  );

  t.end();
});


const genMismatchedTemplateStrings = ({numForms}) =>
  gen.posInt
    .notEmpty()
    .suchThat(n => (n !== numForms)) /* avoid correct number of plural forms */
    .then(size => gen.uniqueArray(
      gen.string.suchThat(v => !v.includes('|')), /* only avoid template delimiter */
      {size}
    ));

test('ngettext: mismatched template and number of plural forms', check(
  times(5),
  gen.posInt,
  genMismatchedTemplateStrings({numForms: 2}),
  (t, n, strings) => {
    const {spy, gettext} = createSpy();
    const devTemplate = ngettextFactory({NODE_ENV: 'development', gettext});
    const text = strings.join('|');

    t.throws(
      () => devTemplate(n)([text]),
      new RegExp(`expected 2 plural forms, saw ${strings.length}`),
      'should throw wrong number of plural forms in development env'
    );
    t.notOk(
      spy.called,
      'should throw before translation in development env'
    );

    const prodTemplate = ngettextFactory({NODE_ENV: 'production', gettext});

    t.doesNotThrow(
      () => prodTemplate(n)([text]),
      'should not throw wrong number of plural forms in production env'
    );
    t.deepEqual(
      spy.firstCall.args,
      [...strings, n],
      'should pass all plural forms to translation in production env'
    );

    t.end();
  }
));


test('ngettext: non-integer invocation', check(
  times(5),
  gen.oneOf([
    anyValue.suchThat(v => (typeof v !== 'number')),
    gen.number.notEmpty().suchThat(v => (v % 1 !== 0)), /* avoid integers and NaN */
  ]),
  (t, n) => {
    const {spy, gettext} = createSpy();
    const devTemplate = ngettextFactory({NODE_ENV: 'development', gettext});

    t.throws(
      () => devTemplate(n)`singular|plural`,
      /Expected an integer quantity/,
      'should throw invalid quantity error in development env'
    );
    t.notOk(
      spy.called,
      'should throw before translation in development env'
    );

    const prodTemplate = ngettextFactory({NODE_ENV: 'production', gettext});

    t.doesNotThrow(
      () => prodTemplate(n)`singular|plural`,
      'should not throw error in production env'
    );
    t.deepEqual(
      spy.firstCall.args,
      ['singular', 'plural', n],
      'should pass invalid quantity to translation in production env'
    );

    t.end();
  }
));


test('ngettext: invoked with additional arguments', check(
  times(5),
  gen.object({
    head: gen.posInt,
    rest: gen.array(anyValue, {minSize: 1})
  }).then(({head, rest}) => [head, ...rest]),
  (t, args) => {
    const {spy, gettext} = createSpy();
    const devTemplate = ngettextFactory({NODE_ENV: 'development', gettext});

    t.throws(
      () => devTemplate(...args)`singular|plural`,
      /Expected no additional arguments/,
      'should throw unexpected arguments error in development env'
    );
    t.notOk(
      spy.called,
      'should throw before translation in development env'
    );

    const prodTemplate = ngettextFactory({NODE_ENV: 'production', gettext});

    t.doesNotThrow(
      () => prodTemplate(...args)`singular|plural`,
      'should not throw error in production env'
    );
    t.deepEqual(
      spy.firstCall.args,
      ['singular', 'plural', args[0]],
      'should not pass additional arguments to translation in production env'
    );

    t.end();
  }
));


test('ngettext: degenerate case without substitutions', check(
  times(5),
  gen.posInt,
  (t, n) => {
    const {spy, gettext} = createSpy();
    const template = ngettextFactory({gettext});

    t.equal(
      template(n)`singular|plural`,
      (n === 1) ? 'singular' : 'plural',
      'should behave transparently on 2 plural forms'
    );
    t.deepEqual(
      spy.firstCall.args,
      ['singular', 'plural', n],
      'should pass 2 plural forms to translation'
    );
    t.end();
  }
));


test('ngettext: direct primitive substitution', check(
  times(20),
  gen.posInt,
  gen.array(anyPrimitive, {size: 2}),
  (t, n, [v1, v2]) => {
    const {spy, gettext} = createSpy();
    const template = ngettextFactory({gettext});

    t.equal(
      template(n)`foo ${v1}|bar ${v2}`,
      (n === 1) ? `foo ${String(v1)}` : `bar ${String(v2)}`, /* Symbol needs explicit conversion */
      'should return string'
    );
    t.deepEqual(
      spy.firstCall.args,
      [`foo ${String(v1)}`, `bar ${String(v2)}`, n],
      'should substitute before translation'
    );
    t.end();
  }
));


test('ngettext: direct complex substitution', check(
  times(20),
  gen.posInt,
  gen.array(anyUnkeyedComplexSubstitution, {size: 2}),
  (t, n, [v1, v2]) => {
    const {spy, gettext} = createSpy();
    const devTemplate = ngettextFactory({gettext, NODE_ENV: 'development'});

    t.throws(
      () => devTemplate(n)`foo ${v1}|bar ${v2}`,
      /All non-primitive substitutions must be "keyed"/,
      'should throw error in development env'
    );
    t.notOk(
      spy.called,
      'should throw before translation in development env'
    );

    const prodTemplate = ngettextFactory({gettext, NODE_ENV: 'production'});

    t.doesNotThrow(
      () => prodTemplate(n)`foo ${v1}|bar ${v2}`,
      'should not throw error in production env'
    );
    t.equal(
      prodTemplate(n)`foo ${v1}|bar ${v2}`,
      (n === 1) ? `foo ${String(v1)}` : `bar ${String(v2)}`, /* Symbol needs explicit conversion */
      'should return string in production env'
    );
    t.deepEqual(
      spy.firstCall.args,
      [`foo ${String(v1)}`, `bar ${String(v2)}`, n],
      'should substitute before translation in production env'
    );

    t.end();
  }
));


test('ngettext: keyed primitive substitution', check(
  times(20),
  gen.posInt,
  gen.array(anyKeyedPrimitiveSubstitutionKV, {size: 2}),
  (t, n, [{k: k1, v: v1}, {k2, v: v2}]) => {
    const {spy, gettext} = createSpy();
    const template = ngettextFactory({gettext});

    t.equal(
      template(n)`foo ${{[k1]: v1}}|bar ${{[k2]: v2}}`,
      (n === 1) ? `foo ${String(v1)}` : `bar ${String(v2)}`, /* Symbol needs explicit conversion */
      'should return string'
    );
    t.deepEqual(
      spy.firstCall.args,
      [`foo __${k1}__`, `bar __${k2}__`, n], /* this is white-box but an important detail */
      'should use token name in the translation'
    );
    t.end();
  }
));


test('ngettext: illegally keyed primitive substitution', check(
  times(10),
  gen.posInt,
  gen.array(anyIllegalPrimitiveSubstitutionKV, {size: 2}),
  (t, n, [{k: k1, v: v1}, {k2, v: v2}]) => {
    const {spy, gettext} = createSpy();
    const devTemplate = ngettextFactory({gettext, NODE_ENV: 'development'});

    t.throws(
      () => devTemplate(n)`foo ${{[k1]: v1}}|bar ${{[k2]: v2}}`,
      /Keys must be alphanumeric/,
      'should throw error in development env'
    );
    t.notOk(
      spy.called,
      'should throw before translation in development env'
    );

    const prodTemplate = ngettextFactory({gettext, NODE_ENV: 'production'});

    t.doesNotThrow(
      () => prodTemplate(n)`foo ${{[k1]: v1}}|bar ${{[k2]: v2}}`,
      'should not throw error in development env'
    );
    t.equal(
      prodTemplate(n)`foo ${{[k1]: v1}}|bar ${{[k2]: v2}}`,
      (n === 1) ? `foo ${String(v1)}` : `bar ${String(v2)}`, /* Symbol needs explicit conversion */
      'should return string in production env'
    );
    t.deepEqual(
      spy.firstCall.args,
      [`foo __${k1}__`, `bar __${k2}__`, n], /* this is white-box but an important detail */
      'should use (illegal) token name in the translation in production env'
    );

    t.end();
  }
));


test('ngettext: keyed complex substitution', check(
  times(20),
  gen.posInt,
  gen.array(anyKeyedComplexSubstitutionKV, {size: 2}),
  (t, n, [{k: k1, v: v1}, {k2, v: v2}]) => {
    const {spy, gettext} = createSpy();
    const template = ngettextFactory({gettext});

    t.deepEqual(
      template(n)`foo ${{[k1]: v1}}|bar ${{[k2]: v2}}`,
      (n === 1) ? ['foo ', v1] : ['bar ', v2],
      'should return Array'
    );
    t.deepEqual(
      spy.firstCall.args,
      [`foo __${k1}__`, `bar __${k2}__`, n], /* this is white-box but an important detail */
      'should use token name in the translation'
    );
    t.end();
  }
));


test('ngettext: illegally keyed complex substitution', check(
  times(10),
  gen.posInt,
  gen.array(anyIllegalComplexSubstitutionKV, {size: 2}),
  (t, n, [{k: k1, v: v1}, {k2, v: v2}]) => {
    const {spy, gettext} = createSpy();
    const devTemplate = ngettextFactory({gettext, NODE_ENV: 'development'});

    t.throws(
      () => devTemplate(n)`foo ${{[k1]: v1}}|bar ${{[k2]: v2}}`,
      /Keys must be alphanumeric/,
      'should throw error in development env'
    );
    t.notOk(
      spy.called,
      'should throw before translation in development env'
    );

    const prodTemplate = ngettextFactory({gettext, NODE_ENV: 'production'});

    t.doesNotThrow(
      () => prodTemplate(n)`foo ${{[k1]: v1}}|bar ${{[k2]: v2}}`,
      'should not throw error in production env'
    );
    t.deepEqual(
      prodTemplate(n)`foo ${{[k1]: v1}}|bar ${{[k2]: v2}}`,
      (n === 1) ? ['foo ', v1] : ['bar ', v2],
      'should return Array in production env'
    );
    t.deepEqual(
      spy.firstCall.args,
      [`foo __${k1}__`, `bar __${k2}__`, n], /* this is white-box but an important detail */
      'should use (illegal) token name in the translation in production env'
    );

    t.end();
  }
));


test('ngettext: mix of keyed and non-keyed substitutions', check(
  times(20),
  gen.posInt,
  genMixOfStringAndObjectSubstitutions({size: 3}),
  (t, n, {objIndices, values: [v1, v2, v3]}) => {
    const template = ngettextFactory({NODE_ENV: 'production'});
    const result = template(n)`1${v1}2${v2}${v3}3|4${v1}5${v2}${v3}6`;

    t.ok(
      objIndices.length ? Array.isArray(result) : (typeof result === 'string'),
      'should return string where there is full string collapse or Array otherwise'
    );
    t.equal(
      [].concat(result).length,
      1 + objIndices.length * 2 - Number(objIndices.includes(1) && objIndices.includes(2)),
      'should collapse all primitive substitutions into fewer strings'
    );
    t.end();
  }
));


test('ngettext: keyed substitution with duplicate names', check(
  times(20),
  gen.posInt,
  genTokensWithDuplicateNames, /* all tokens throw, but for some it is because they are unkeyed */
  (t, n, {tokens}) => {
    const {spy, gettext} = createSpy();
    const devTemplate = ngettextFactory({gettext, NODE_ENV: 'development'});
    const strings = (new Array(tokens.length + 1)).fill('');

    t.throws(
      () => devTemplate(n)(strings, ...tokens),
      /All non-primitive substitutions must be "keyed"/,
      'should throw error in development env'
    );
    t.notOk(
      spy.called,
      'should throw before translation in development env'
    );

    const prodTemplate = ngettextFactory({gettext, NODE_ENV: 'production'});

    t.doesNotThrow(
      () => prodTemplate((new Array(tokens.length + 1)).fill(''), ...tokens),
      'should not throw error in production env'
    );
    t.end();
  }
));


test('ngettext: keyed React element substitution', (t) => {
  const template = ngettextFactory();

  const unkeyedElement = React.createElement('span', {foo: 'bar'});
  const unkeyedResult = template(1)`foo ${{a: unkeyedElement}}|baz`;

  t.ok(
    React.isValidElement(unkeyedResult[1]),
    'should maintain valid react elements'
  );

  t.notEqual(
    unkeyedResult[1],
    unkeyedElement,
    'should clone the element where key is missing'
  );

  t.deepLooseEqual(
    [
      template(1)`foo ${{a: unkeyedElement}}|baz`,
      template(1)`${{b: unkeyedElement}} bar|baz`
    ], [
      ['foo ', {...unkeyedElement, key: 'a-1'}],
      [{...unkeyedElement, key: 'b-0'}, ' bar']
    ],
    'should generate an element key where key is missing'
  );

  const keyedElement = React.createElement('span', {foo: 'bar', key: 'baz'});
  const keyedResult = template(1)`foo ${{a: keyedElement}}|blit`;

  t.equal(
    keyedResult[1],
    keyedElement,
    'should not clone the element where key is present'
  );

  t.looseEqual(
    keyedResult[1],
    {...keyedElement, key: 'baz'},
    'should not overwrite element key where key is present'
  );

  t.end();
});
