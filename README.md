# react-i18n-interpolation

String interpolation of translated text and React components.

Intended for [gettext](https://www.npmjs.com/search?q=gettext) or similar translation APIs (where the key is the intended text in the developer's locale).

## Concept

### Tagged Template Literals

This library leverages [Tagged Template Literals](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals) interpolation functions.

Template Literals allow **substitutions**.

Normally, substitutions are passed **by value**. And such a function would look like this.

**(BAD)**
```javascript
const tag = (template, ...substitutions) => ...
const substitution = 10;

tag`Some statement that can use ${substitution}`
// => Some statement that can use 10
```

In this form we are not able to infer a sensible **token name**.

Presuming we use the substitution index we would be left with a translation like this.

```
msgid "Some statement that can use __0__"
msgstr ...
```

Obviously `__0__` is **not** a good placeholder. We need something more descriptive.

We need to be equally explicit about the **token name** and **token value**.

**(GOOD)**

```javascript
tag`Some statement that can use ${{num: substitution}}`
// => Some statement that can use 10
```

We provide an `object` with single key-value and achieve a translation like this.

```
msgid "Some statement that can use __num__"
msgstr ...
```

While this may feel a little contrived we feel it is the most explicit solution.

### with plain values

By default we require that all substitutions be object key-value as shown above.

Any substitution passed **by value** will be treated like a normal Template Literal and will **appear in your translation**.

```
const substitution = 'foo';
tag`Some simple ${substitution}`
```

Results in:

```
msgid "Some simple foo"
msgstr ...
```

### with React

Consider a React `Paginator` component where `More` and `Less` anchors will allow more or fewer results to be shown.

```html
<span>Show <a>10 More</a> or <a>5 Less</a></span>
```

The anchors themselves would need to be separate HTML elements, nested in the overall statement. And the number of more or less items may vary. So it is reasonable to assume they would be nested React components.

In a perfect world we could use a **Tagged Template Literal** to compose idiomatically.

```
<span>
  {tag`Show
    ${{more: <More {...{numMore, onMore}} />} or
    ${{less: <Less {...{numLess, onLess}} />}`}
</span>
```

Presumably we will translate the `<More/>` and `<Less/>` components separately. But we will want our translation to still show some context.

```
msgid "Show __more__ or __less__"
msgstr ...
```

We can achieve this if our interpolator function returns `Array` any time we have one or more non-string **token value**. React will then treat this array as `{children}`.

So long as all elements have a `key` then React is happy. So we make sure we do this for you under the hood.

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
  
const gettext = gettextFactory({
  gettext: nodeGettext.gettext
});
const ngettext = ngettextFactory({
  ngettext: nodeGettext.ngettext
});
```

We recommend you distribute these method(s) to components by `redux`, or failing that but `context`. Using `redux` allows your UI to respond to changes in text domain real-time.


### API

#### gettext

The simple form is `gettext`.

It is used directly as a Tag.

```javascript
gettext`Some statement`
```

#### ngettext

> WORK IN PROGRESS, DO NOT USE

The plural-capable form is `ngettext`.

This is a function where the only argument is the `condition`. The result of the function call is used as a Tag.

```javascript
ngettext(condition)`Singular statement|Plural statement`
```

Think of the `condition` as the **quantity** in your plural statement.

The template needs to have pipe-delimited `singular|plural` forms. The singular form is used where `condition === 1`, and the plural form is used otherwise.

Substitutions must be made explicitly (the quantity is not added automatically).

There must be exactly one delimiter, and the translation must preserve it, or else an `Error` will be thrown.

#### advanced (generalised) usage

For `ngettext` you may alternatively pass `condition` as a function of the untranslated text `string`. It should return an integer `index`. 

```javascript
condition: (untranslated:string) => number
```

With a `condition` of this form you are permitted **any number** of pipe-delimited forms in the template. Where only one is selected by the zero-based `index`.

There must be a sufficient number of delimited forms to satisfy any given `index`, or an (out-of-bounds) `Error` will be thrown.

The translation must also preserve the number of delimiters or an `Error` will be thrown.

## Example

Here is our paginator example.

```javascript
import {gettextDefault} from 'react-i18-interpolation';

export const Paginator = ({numMore, onMore, numLess, onLess, gettext}) => (
  <span>
    {gettext`Show
      ${{more: <More {...{numMore, onMore}} />}} or
      ${{less: <Less {...{numLess, onLess}} />}}`}
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

The `More` and `Less` components will need the plural-capable form `ngettext`.

```javascript
import {ngettextDefault} from 'react-i18-interpolation';

export const More = ({numMore, onMore, ngettext}) => (
  <a onClick={onMore}>
    {ngettext(numMore)`Show one more|Show ${{num: numMore}} more`}
  </a>
);

More.propTypes = {
  ...,
  ngettext: React.PropTypes.func
};

More.defaultProps = {
  ngettext: ngettextDefault
};
```

Be careful to avoid your variable name appearing in your translation.

```
msgid "Show one more|Show __num__ more"
msgstr ...
```

## Customisation

### `toToken`

`gettext`, `ngettext`

Substitutions are each passed through a `toToken` function which you can override.

This function infers `{name, key, value}` for any given substitution. It also ensures any React element `value` has a valid `key`.
 
By overriding it you can change each substitution token. Such as:
* Change the `__name__` that appears in the untranslated `msgid` text.
* Change the `key` that is assigned to React elements.
* Change the `value` by injecting props, converting text to elements, etc.

### `delimiter`

`ngettext`

Explicitly specify the delimiter character. 