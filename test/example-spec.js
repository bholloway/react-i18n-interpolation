import test from 'tape';
import 'raf/polyfill';
import 'jsdom-global/register';
import React from 'react';
import {mount, shallow, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import {gettextDefault, ngettextDefault} from '../src/index';
import {StrongText, AnchorText} from '../example/simple-inline';
import {PaginationControl} from '../example/pagination-control';
import {IncorrectUse, CorrectUse} from '../example/misuse';

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

test('example: pagination-control', (t) => {
  t.equal(
    mount(
      <PaginationControl
        gettext={gettextDefault}
        ngettext={ngettextDefault}
        pageSize={5}
      />
    ).html(),
    null,
    'degenerate case should render correctly'
  );

  t.equal(
    mount(
      <PaginationControl
        gettext={gettextDefault}
        ngettext={ngettextDefault}
        currentSize={5}
        totalSize={20}
        pageSize={5}
      />
    ).html(),
    '<div>Show <a href="">5 more</a></div>',
    'minimal case should render correctly'
  );

  t.equal(
    mount(
      <PaginationControl
        gettext={gettextDefault}
        ngettext={ngettextDefault}
        currentSize={6}
        totalSize={20}
        pageSize={5}
      />
    ).html(),
    '<div>Show <a href="">5 more</a> or <a href="">one less</a></div>',
    'minimal limited case should render correctly'
  );

  t.equal(
    mount(
      <PaginationControl
        gettext={gettextDefault}
        ngettext={ngettextDefault}
        currentSize={20}
        totalSize={21}
        pageSize={5}
      />
    ).html(),
    '<div>Show <a href="">one more</a> or <a href="">5 less</a></div>',
    'maximal limited case should render correctly'
  );

  t.equal(
    mount(
      <PaginationControl
        gettext={gettextDefault}
        ngettext={ngettextDefault}
        currentSize={20}
        totalSize={20}
        pageSize={5}
      />
    ).html(),
    '<div>Show <a href="">5 less</a></div>',
    'maximal case should render correctly'
  );

  t.end();
});

test('example: misuse', (t) => {
  t.throws(
    () => shallow(
      <IncorrectUse ngettext={ngettextDefault} num={10} />
    ),
    /Expected an integer quantity/,
    'ngettext misuse should throw error'
  );

  t.doesNotThrow(
    () => shallow(
      <CorrectUse ngettext={ngettextDefault} num={10} />
    ),
    'ngettext correct use should not throw error'
  );

  t.end();
});
