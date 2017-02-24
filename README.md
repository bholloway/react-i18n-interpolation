# react-i18n-interpolation

String interpolation of translated text and React components.

Intended for [gettext](https://www.npmjs.com/search?q=gettext) or similar translation APIs where the
key is the intended text in the developer's locale.

## Rationale

Consider a React `Paginator` component where `More` and `Less` anchors will allow more or fewer results to be shown.

We want:

```html
<span>Show <a>10 More</a> or <a>5 Less</a></span>
```

In a perfect world we could use a Tagged Template Literal to compose this idiomatically.

```
<span>
  {i18n`Show
    ${<More key="more" {...{numMore, onMore}} />} or
    ${<Less key="less" {...{numLess, onLess}} />}`}
</span>
```

Presumably we will translate the `<More/>` and `<Less/>` components separately.

However we still need the overall translation to look sensible, such as:

```
msgid "Show __more__ or __less__"
msgstr ...
```

Actually we can achieve this with a custom Tagged Template Literal.

Where the substitutions are non-strings we return an `Array`. So long as the substitutions all have a `key` then React is happy.

These `key`s also give sensible tokens in our translation string. 

## Usage

### Installation

Install the package

```bash
$ npm install --save react-i18-interpolation
```

Choose a translation package, for example [node-gettext](https://www.npmjs.com/search?q=gettext).

```bash
$ npm install --save node-gettext
```

### Setup

Setup in your application.

```javascript
import NodeGettext from 'node-gettext';
import {gettextFactory, ngettextFactory} from 'react-i18-interpolation';

const nodeGettext = new NodeGettext();
nodeGettext.addTextdomain(...);
nodeGettext.textdomain(...);
  
const gettext = gettextFactory(nodeGettext.gettext);
const ngettext = ngettextFactory(nodeGettext.gettext);
```

We recommend you distribute these method(s) to components by `redux`, or failing that but `context`. Using `redux` allows your UI to respond to changes in text domain real-time.


### Components

Then as a component, here is our paginator example.

```javascript
import {gettextDefault} from 'react-i18-interpolation';

export const Paginator = ({numMore, onMore, numLess, onLess, gettext}) => (
  <span>
    {gettext`Show
      ${<More key="more" {...{numMore, onMore}} />} or
      ${<Less key="less" {...{numLess, onLess}} />}`}
  </span>
);

Paginator.propTypes = {
  ...,
  gettext: React.PropTypes.func
};

Paginator.defaultProps = {
  gettext: gettextDefault
};
```

Don't be confused by the `react-i18-interpolation` import. This only gives us the default (degenerate) implementation. Which you can choose to omit anyhow.

As stated above, where translation is available it is best distributed through `redux`.
