import React from 'react';
import describe from 'tape-bdd';
import sinon from 'sinon';
import {gettextFactory} from '../src/index';
import {parametric} from './helpers';

const SIMPLE_TYPES = [undefined, '', 'bar', false, true, 12, NaN];

const COMPLEX_TYPES = [null, {}, Symbol('bar'), () => {}];


const createSpy = () => {
  const spy = sinon.spy();
  const gettext = (text) => {
    spy(text);
    return text;
  };

  return {spy, gettext};
};


describe('gettext', (unused, describe) => {

  describe('with plain substitution', (it) => {

    it('should allow identity', parametric(() => {
      const template = gettextFactory();
      return [
        [template`foo`, 'foo']
      ];
    }));

    it('should return string for simple-typed substitutions', parametric(() => {
      const template = gettextFactory();

      return [
        ...SIMPLE_TYPES.map(v => [template`foo ${v}`, `foo ${v}`])
      ];
    }));

    it('should return Array for complex-typed substitutions', parametric(() => {
      const template = gettextFactory();

      return COMPLEX_TYPES
        .map(v => [template`foo ${v}`, ['foo ', v]]);
    }));

    it('should collapse adjacent string elements', parametric(() => {
      const template = gettextFactory();

      return [
        [template`1${'2'}3${null}4`, ['123', null, '4']]
      ];
    }));

    it('should retain whitespace substitutions (unlike normal template literals)', parametric(() => {
      const template = gettextFactory();

      return [
        [template`${' '}${2}${' '}`, ' 2 ']
      ];
    }));

    it('should substitute before translation', parametric(() => {
      const {spy, gettext} = createSpy();
      const template = gettextFactory({gettext});

      // spy is called as a side-effect
      [...SIMPLE_TYPES, ...COMPLEX_TYPES]
        .forEach(v => template`foo ${v}`);

      return [...SIMPLE_TYPES, ...COMPLEX_TYPES]
        .map((v, i) => [spy.getCall(i).args[0], `foo ${String(v)}`]);
    }));
  });

  describe('with key-value substitution', (it) => {

    it('should use the hash value', parametric(() => {
      const template = gettextFactory();

      return [
        ...SIMPLE_TYPES.map(v => [template`foo ${{a: v}}`, `foo ${v}`]),
        ...COMPLEX_TYPES.map(v => [template`foo ${{a: v}}`, ['foo ', v]])
      ];
    }));

    it('should use the hash key in the translation', parametric(() => {
      const {spy, gettext} = createSpy();
      const template = gettextFactory({gettext});

      // spy is called as a side-effect
      [...SIMPLE_TYPES, ...COMPLEX_TYPES]
        .forEach(v => template`foo ${{a: v}}`);

      return [...SIMPLE_TYPES, ...COMPLEX_TYPES]
        .map((v, i) => [spy.getCall(i).args[0], 'foo __a__']);
    }));

    it('should not generate empty string elements', parametric(() => {
      const template = gettextFactory();

      return [
        ...COMPLEX_TYPES.map(v => [template`${{a: v}}${{a: v}}${{a: v}}`, [v, v, v]]),
        ...COMPLEX_TYPES.map(v => [template`a${{a: v}}${{a: v}}${{a: v}}`, ['a', v, v, v]]),
        ...COMPLEX_TYPES.map(v => [template`${{a: v}}b${{a: v}}${{a: v}}`, [v, 'b', v, v]]),
        ...COMPLEX_TYPES.map(v => [template`${{a: v}}${{a: v}}c${{a: v}}`, [v, v, 'c', v]]),
        ...COMPLEX_TYPES.map(v => [template`${{a: v}}${{a: v}}${{a: v}}d`, [v, v, v, 'd']])
      ];
    }));

    it('should collapse adjacent string elements', parametric(() => {
      const template = gettextFactory();

      return [
        [template`1${{a: '2'}}3${{b: null}}4`, ['123', null, '4']]
      ];
    }));

    it('should retain whitespace substitutions', parametric(() => {
      const template = gettextFactory();

      return [
        [template`${{a: ' '}}${{b: 2}}${{c: ' '}}`, ' 2 ']
      ];
    }));

    it('should throw where duplicate keys mismatch value', (assert) => {
      const template = gettextFactory();

      assert.throws(() => template`${{a: 'foo'}}${{a: 'bar'}}`);
    });

    it('should permit duplicate keys with matching value', (assert) => {
      const template = gettextFactory();

      assert.doesNotThrow(() => template`${{a: 'foo'}}${{a: 'foo'}}`);
    });
  });

  describe('with react component substitution', (it) => {

    it('should use the hash value', (assert) => {
      const template = gettextFactory();
      const element = React.createElement('span', {foo: 'bar'});
      const result = template`foo ${{a: element}}`;

      assert.ok(React.isValidElement(result[1]));
    });

    it('should clone the hash value', (assert) => {
      const template = gettextFactory();
      const element = React.createElement('span', {foo: 'bar'});
      const result = template`foo ${{a: element}}`;

      assert.notEqual(result[1], element);
    });

    it('should assign element key where empty', (assert) => {
      const template = gettextFactory();
      const element = React.createElement('span', {foo: 'bar'});
      const result = template`foo ${{a: element}}`;

      assert.looseEqual(result[1], {...element, key: 'a'});
    });

    it('should not overwrite element key', (assert) => {
      const template = gettextFactory();
      const element = React.createElement('span', {key: 'baz', foo: 'bar'});
      const result = template`foo ${{a: element}}`;

      assert.looseEqual(result[1], {...element, key: 'baz'});
    });
  });
});
