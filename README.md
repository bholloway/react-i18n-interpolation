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

The API is heavily influenced by [gettext](https://en.wikipedia.org/wiki/Gettext) translation package.

We may make reference to linux documentation and terminology from the GNU implementation.

#### gettext

The simple interpolator is `gettext`.

It is used directly as a Tag.

```javascript
gettext`Some statement`
```

It behaves as explained in the [concept section](#concept) above.

#### ngettext

> Plural forms are grammatical variants depending on the a number. Some languages have two forms, called singular and plural. Other languages have three forms, called singular, dual and plural. There are also languages with four forms.
> ([linux man-page](https://linux.die.net/man/3/ngettext))

The plural-capable interpolator is `ngettext`.

Normally the quantity is the 3rd parameter, meaning:
 
**(Tranditionally)**
```
ngettext(singular:string, plural:string, quantity:number)
```

For the interpolator we move this `quantity` to a factory function. The result of the function call is used as a Tag.

**(Tagged Template Literal)**
```javascript
ngettext(quantity)`Singular statement|Plural statement`
```

The template needs to have pipe-delimited `singular|plural` forms.

Note that the 3 traditional parameters are present and are passed to the underlying `ngettext` implementation you supplied during setup.

*We consider only those substitutions which are inherent to the template literal. Your underlying `ngettext` implementation may itself allow substitutions of the `quantity`.*

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

And translation.

```
msgid "Show __more__ or __less__"
msgstr ...
```

Don't be confused by the `react-i18-interpolation` import. This only gives us the default (degenerate) implementation. Which you can choose to omit anyhow. As stated above, where translation is available it is best distributed through `redux`.

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
msgid "Show one more"
msgid_plural "Show __num__ more"
msgstr[0] ...
msgstr[1] ...
```

## Options

### `gettext : function`

An underlying translation function that follows the signature of [gettext](https://linux.die.net/man/3/gettext). 

There is a default implementation that does not perform any translation. You will see it if you make use of `gettextDefault`.

### `ngettext : function`

An underlying translation function that follows the signature of [ngettext](https://linux.die.net/man/3/ngettext). 

There is a default implementation that expects exactly 2 plural forms and does not perform any translation. You will see it if you make use of `ngettextDefault`.

### `toToken : function`

Substitutions are each passed through a `toToken` function which you can override.

By overriding it you can change each substitution token.

All implementations must return the following:

* `label : string` that appears in validation errors
* `name : string` that serves as placeholder text in the untranslated `msgid` text.
* `key : string` the hash key of the substitution, if present.
* `value : *` the value from the substitution.

Validation of the tokens is made following `toToken`. Tokens may only share `name` where they have the same `value`. 

### `finaliseToken : function`

Once substitutions have been made it is possible that the same React element will appear twice.

At minimum, React requires these occurences to have a different `key`. The default implementation will clone these elements with a unique `key` where it is not already set.

### `splitPlural : function`

This function implements the split of `msgid` for [ngettext](https://linux.die.net/man/3/ngettext).

The default implementation is a rudimentary string split: `msgid => msgid.split('|')`.

If you require a different delimiter, or escaping of the delimiter, then you will need to provide a custom implementation.

### `numPlural : Number`

This validates the template splits into the correct number of plural forms.

The default value is `2` matches the default `ngettext` implementation. This means that we expect exactly 2 plural forms, meaning a single delimiter character, in each and every template.

Alternatively, set to `0` or `NaN` (or anything else which satisfieds `isNaN`) to inhibit this check.

## Environment

### `process.env.NODE_ENV`

The value `"production"` causes validation to be skipped.

This presumes that you have had sufficient development time to identify any problems in your specific use-case. There will be no checking of the substitutions or of the number of plural forms in the template.

Runtime errors may still result.
