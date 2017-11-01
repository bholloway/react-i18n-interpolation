import React from 'react';
import describe from 'tape-bdd';
import sinon from 'sinon';
import {defaultNgettext} from '../src/defaults';
import {ngettextFactory} from '../src/index';
import {parametric, pair, permute} from './helpers';

const SIMPLE_TYPES = [undefined, '', 'bar', false, true, 12, NaN];

const COMPLEX_TYPES = [null, {}, Symbol('bar'), () => {}];

const NON_NUMERIC_TYPES = [undefined, '', 'bar', false, true, null, {}, Symbol('bar'), () => {}];

const createSpy = () => {
  const spy = sinon.spy();
  const ngettext = (...args) => {
    spy(...args);
    return defaultNgettext(...args);
  };

  return {spy, gettext: {ngettext}};
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

  it('should throw on bad gettext instance', (assert) => {
    const template = ngettextFactory({gettext: {}});

    assert.throws(() => template(1)`foo`, /missing ngettext/);
  });

  it('should throw on delimiter count mismatch', (assert) => {
    const template = ngettextFactory();

    assert.throws(() => template()`foo`);
  });

  it('should permit delimiter count mismatch in production', (assert) => {
    const template = ngettextFactory({NODE_ENV: 'production'});

    assert.doesNotThrow(() => template()`foo`);
  });

  describe('plural forms', (it) => {
    const gettext = {
      ngettext(s, p1, p2, q) {
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
      }
    };

    it('should support multiple forms', parametric(() => {
      const template = ngettextFactory({gettext, numPlural: 3});

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
      const template = ngettextFactory({gettext, numPlural: 3});

      assert.throws(() => template()`foo|bar`);
    });
  });


  describe('with plain substitution', (it) => {

    it('should return string for simple-typed substitutions', parametric(() => {
      const template = ngettextFactory();
      const testSet = permute([1, 2])(pair(SIMPLE_TYPES));

      return testSet.map(([v1, v2, q]) => [
        template(q)`foo ${v1}|bar ${v2}`,
        (q === 1) ? `foo ${v1}` : `bar ${v2}`
      ]);
    }));

    it('should return Array for complex-typed substitutions', parametric(() => {
      const template = ngettextFactory();
      const testSet = permute([1, 2])(pair(COMPLEX_TYPES));

      return testSet.map(([v1, v2, q]) => [
        template(q)`foo ${v1}|bar ${v2}`,
        (q === 1) ? ['foo ', v1] : ['bar ', v2]
      ]);
    }));

    it('should collapse adjacent string elements', parametric(() => {
      const template = ngettextFactory();

      return [
        [template(1)`1${'2'}3${null}4|5${'2'}6${null}7`, ['123', null, '4']],
        [template(2)`1${'2'}3${null}4|5${'2'}6${null}7`, ['526', null, '7']]
      ];
    }));

    it('should retain whitespace substitutions (unlike normal literals)', parametric(() => {
      const template = ngettextFactory();

      return [
        [template(1)`${' '}${2}${' '}|${' '}${3}${' '}`, ' 2 '],
        [template(2)`${' '}${2}${' '}|${' '}${3}${' '}`, ' 3 ']
      ];
    }));

    it('should substitute before translation', parametric(() => {
      const {spy, gettext} = createSpy();
      const template = ngettextFactory({gettext});
      const testSet = permute([1, 2])(pair([...SIMPLE_TYPES, ...COMPLEX_TYPES]));

      // spy is called as a side-effect
      testSet.forEach(([v1, v2, q]) =>
        template(q)`foo ${v1}|bar ${v2}`
      );

      return testSet.map(([v1, v2, q], i) => [
        spy.getCall(i).args,
        [`foo ${String(v1)}`, `bar ${String(v2)}`, q]
      ]);
    }));
  });

  describe('with key-value substitution', (it) => {

    it('should use the hash value', parametric(() => {
      const template = ngettextFactory();

      return [
        ...permute([1, 2])(pair(SIMPLE_TYPES))
          .map(([v1, v2, q]) => [
            template(q)`foo ${{a: v1}}|bar ${{b: v2}}`,
            (q === 1) ? `foo ${v1}` : `bar ${v2}`
          ]),
        ...permute([1, 2])(pair(COMPLEX_TYPES))
          .map(([v1, v2, q]) => [
            template(q)`foo ${{a: v1}}|bar ${{b: v2}}`,
            (q === 1) ? ['foo ', v1] : ['bar ', v2]
          ]),
      ];
    }));

    it('should use the hash key in the translation', parametric(() => {
      const {spy, gettext} = createSpy();
      const template = ngettextFactory({gettext});
      const testSet = permute([1, 2])(pair([...SIMPLE_TYPES, ...COMPLEX_TYPES]));

      // spy is called as a side-effect
      testSet.forEach(([v1, v2, q]) =>
        template(q)`foo ${{a: v1}}|bar ${{b: v2}}`
      );

      return testSet.map(([v1, v2, q], i) => [
        spy.getCall(i).args,
        ['foo __a__', 'bar __b__', q]
      ]);
    }));

    it('should not generate empty string elements', parametric(() => {
      const template = ngettextFactory();
      const testSet = permute([1, 2])(pair(COMPLEX_TYPES));

      return [
        ...testSet.map(([v1, v2, q]) => [
          template(q)`${{w: v1}}${{x: v2}}|${{y: v1}}${{z: v2}}`,
          [v1, v2]
        ]),
        ...testSet.map(([v1, v2, q]) => [
          template(q)`a${{w: v1}}${{x: v2}}|a${{y: v1}}${{z: v2}}`,
          ['a', v1, v2]
        ]),
        ...testSet.map(([v1, v2, q]) => [
          template(q)`${{w: v1}}b${{x: v2}}|${{y: v1}}b${{z: v2}}`,
          [v1, 'b', v2]
        ]),
        ...testSet.map(([v1, v2, q]) => [
          template(q)`${{w: v1}}${{x: v2}}c|${{y: v1}}${{z: v2}}c`,
          [v1, v2, 'c']
        ])
      ];
    }));

    it('should collapse adjacent string elements', parametric(() => {
      const template = ngettextFactory();

      return [
        [template(1)`1${{a: '2'}}3${{b: null}}4|5${{a: '2'}}6${{b: null}}7`, ['123', null, '4']],
        [template(2)`1${{a: '2'}}3${{b: null}}4|5${{a: '2'}}6${{b: null}}7`, ['526', null, '7']]
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
      const result = template(1)`foo ${{a: element}}|bar ${{b: element}}`;

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

      assert.deepLooseEqual([
        template(1)`foo ${{a: element}}|bar ${{b: element}}`,
        template(2)`foo ${{a: element}}|${{b: element}} bar`
      ], [
        ['foo ', {...element, key: 'a-1'}],
        [{...element, key: 'b-0'}, ' bar']
      ]);
    });

    it('should not overwrite element key', (assert) => {
      const template = ngettextFactory();
      const element = React.createElement('span', {key: 'baz', foo: 'bar'});

      assert.deepLooseEqual([
        template(1)`foo ${{a: element}}|bar ${{b: element}}`,
        template(2)`foo ${{a: element}}|${{b: element}} bar`
      ], [
        ['foo ', {...element, key: 'baz'}],
        [{...element, key: 'baz'}, ' bar']
      ]);
    });
  });
});
