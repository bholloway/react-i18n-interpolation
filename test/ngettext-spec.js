import React from 'react';
import describe from 'tape-bdd';
import sinon from 'sinon';
import {ngettextFactory} from '../src/index';
import {parametric} from './helpers';

const SIMPLE_TYPES = [undefined, '', 'bar', false, true, 12, NaN];

const COMPLEX_TYPES = [null, {}, Symbol('bar'), () => {}];

const NON_NUMERIC_TYPES = [undefined, '', 'bar', false, true, null, {}, Symbol('bar'), () => {}];

const createSpy = () => {
  const spy = sinon.spy();
  const ngettext = (text) => {
    spy(text);
    return text;
  };

  return {spy, ngettext};
};


describe('ngettext', (it, describe) => {

  it('should behave transparently on 2 plural forms (by default)', parametric(() => {
    const template = ngettextFactory();
    return [
      [template()`singular|plural`, 'singular'],
      ...NON_NUMERIC_TYPES.map(v => [template(v)`singular|plural`, 'singular']),
      [template(0)`singular|plural`, 'plural'],
      [template(1)`singular|plural`, 'singular'],
      [template(2)`singular|plural`, 'plural'],
      [template(3)`singular|plural`, 'plural'],
      [template(Number.MAX_SAFE_INTEGER)`singular|plural`, 'plural'],
      [template(Number.POSITIVE_INFINITY)`singular|plural`, 'plural']
    ];
  }));

  it('should throw on delimiter count mismatch', (assert) => {
    const template = ngettextFactory();

    assert.throws(() => template()`foo`);
  });

  it('should permit delimiter count mismatch in production', (assert) => {
    const template = ngettextFactory({NODE_ENV: 'production'});

    assert.doesNotThrow(() => template()`foo`);
  });

  describe('plural forms', (it) => {
    const splitPlural = msgid => msgid.split('|');
    splitPlural.expect = 3;

    const ngettext = (s, p1, p2, q) => {
      switch (true) {
        case (typeof q !== 'number'):
        case isNaN(q):
        case (q === 1):
          return s;
        case (q > 2):
          return p2;
        default:
          return p1;
      }
    };

    it('should support multiple forms', parametric(() => {
      const template = ngettextFactory({splitPlural, ngettext});

      return [
        [template()`singular|plural1|plural2`, 'singular'],
        ...NON_NUMERIC_TYPES.map(v => [template(v)`singular|plural1|plural2`, 'singular']),
        [template(0)`singular|plural1|plural2`, 'plural1'],
        [template(1)`singular|plural1|plural2`, 'singular'],
        [template(2)`singular|plural1|plural2`, 'plural1'],
        [template(3)`singular|plural1|plural2`, 'plural2'],
        [template(Number.MAX_SAFE_INTEGER)`singular|plural1|plural2`, 'plural2'],
        [template(Number.POSITIVE_INFINITY)`singular|plural1|plural2`, 'plural2']
      ];
    }));

    it('should throw on new delimiter count mismatch', (assert) => {
      const template = ngettextFactory({splitPlural, ngettext});

      assert.throws(() => template()`foo|bar`);
    });
  });


  describe('with plain substitution', (it) => {

    it('should return string for simple-typed substitutions', parametric(() => {
      const template = ngettextFactory();

      return [
        ...SIMPLE_TYPES.map(v => [template(1)`foo ${v}|blit`, `foo ${v}`])
      ];
    }));

    it('should return Array for complex-typed substitutions', parametric(() => {
      const template = ngettextFactory();

      return COMPLEX_TYPES
        .map(v => [template(1)`foo ${v}|blit`, ['foo ', v]]);
    }));

    it('should collapse adjacent string elements', parametric(() => {
      const template = ngettextFactory();

      return [
        [template(1)`1${'2'}3${null}4|blit`, ['123', null, '4']]
      ];
    }));

    it('should retain whitespace substitutions |blit`(unlike normal literals)', parametric(() => {
      const template = ngettextFactory();

      return [
        [template(1)`${' '}${2}${' '}|blit`, ' 2 ']
      ];
    }));

    it('should substitute before translation', parametric(() => {
      const {spy, ngettext} = createSpy();
      const template = ngettextFactory({ngettext});

      // spy is called as a side-effect
      [...SIMPLE_TYPES, ...COMPLEX_TYPES]
        .forEach(v => template(1)`foo ${v}|blit`);

      return [...SIMPLE_TYPES, ...COMPLEX_TYPES]
        .map((v, i) => [spy.getCall(i).args[0], `foo ${String(v)}`]);
    }));
  });

  describe('with key-value substitution', (it) => {

    it('should use the hash value', parametric(() => {
      const template = ngettextFactory();

      return [
        ...SIMPLE_TYPES.map(v => [template(1)`foo ${{a: v}}|blit`, `foo ${v}`]),
        ...COMPLEX_TYPES.map(v => [template(1)`foo ${{a: v}}|blit`, ['foo ', v]])
      ];
    }));

    it('should use the hash key in the translation', parametric(() => {
      const {spy, ngettext} = createSpy();
      const template = ngettextFactory({ngettext});

      // spy is called as a side-effect
      [...SIMPLE_TYPES, ...COMPLEX_TYPES]
        .forEach(v => template(1)`foo ${{a: v}}|blit`);

      return [...SIMPLE_TYPES, ...COMPLEX_TYPES]
        .map((v, i) => [spy.getCall(i).args[0], 'foo __a__']);
    }));

    it('should not generate empty string elements', parametric(() => {
      const template = ngettextFactory();

      return [
        ...COMPLEX_TYPES.map(v => [template(1)`${{a: v}}${{a: v}}${{a: v}}|blit`, [v, v, v]]),
        ...COMPLEX_TYPES.map(v => [template(1)`a${{a: v}}${{a: v}}${{a: v}}|blit`, ['a', v, v, v]]),
        ...COMPLEX_TYPES.map(v => [template(1)`${{a: v}}b${{a: v}}${{a: v}}|blit`, [v, 'b', v, v]]),
        ...COMPLEX_TYPES.map(v => [template(1)`${{a: v}}${{a: v}}c${{a: v}}|blit`, [v, v, 'c', v]]),
        ...COMPLEX_TYPES.map(v => [template(1)`${{a: v}}${{a: v}}${{a: v}}d|blit`, [v, v, v, 'd']])
      ];
    }));

    it('should collapse adjacent string elements', parametric(() => {
      const template = ngettextFactory();

      return [
        [template(1)`1${{a: '2'}}3${{b: null}}4|blit`, ['123', null, '4']]
      ];
    }));

    it('should retain whitespace substitutions', parametric(() => {
      const template = ngettextFactory();

      return [
        [template(1)`${{a: ' '}}${{b: 2}}${{c: ' '}}|blit`, ' 2 ']
      ];
    }));

    it('should throw where duplicate keys mismatch value', (assert) => {
      const template = ngettextFactory();

      assert.throws(() => template(1)`${{a: 'foo'}}${{a: 'bar'}}|blit`);
    });

    it('should permit duplicate keys with matching value', (assert) => {
      const template = ngettextFactory();

      assert.doesNotThrow(() => template(1)`${{a: 'foo'}}${{a: 'foo'}}|blit`);
    });

    it('should permit duplicate keys in production', (assert) => {
      const template = ngettextFactory({NODE_ENV: 'production'});

      assert.doesNotThrow(() => template(1)`${{a: 'foo'}}${{a: 'bar'}}|blit`);
    });
  });

  describe('with react component substitution', (it) => {

    it('should use the hash value', (assert) => {
      const template = ngettextFactory();
      const element = React.createElement('span', {foo: 'bar'});
      const result = template(1)`foo ${{a: element}}|blit`;

      assert.ok(React.isValidElement(result[1]));
    });

    it('should clone the hash value', (assert) => {
      const template = ngettextFactory();
      const element = React.createElement('span', {foo: 'bar'});
      const result = template(1)`foo ${{a: element}}|blit`;

      assert.notEqual(result[1], element);
    });

    it('should assign element key where empty', (assert) => {
      const template = ngettextFactory();
      const element = React.createElement('span', {foo: 'bar'});
      const result = template(1)`foo ${{a: element}}|blit`;

      assert.looseEqual(result[1], {...element, key: 'a'});
    });

    it('should not overwrite element key', (assert) => {
      const template = ngettextFactory();
      const element = React.createElement('span', {key: 'baz', foo: 'bar'});
      const result = template(1)`foo ${{a: element}}|blit`;

      assert.looseEqual(result[1], {...element, key: 'baz'});
    });
  });
});
