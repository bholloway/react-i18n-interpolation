import test from 'tape';
import 'raf/polyfill';
import 'jsdom-global/register';
import React from 'react';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import {gettextDefault} from '../src/index';
import {StrongText, AnchorText} from '../example/simple-inline';

configure({adapter: new Adapter()});

test('example: simple-inline', (t) => {
  t.equal(
    mount(
      <StrongText gettext={gettextDefault} />
    ).html(),
    '<h1>This heading has some <strong>important</strong> text</h1>',
    'strong text should render correctly'
  );

  t.equal(
    mount(
      <AnchorText gettext={gettextDefault} />
    ).html(),
    '<p>Click <a href="http://google.com">here</a></p>',
    'anchor text should render correctly'
  );

  t.end();
});
