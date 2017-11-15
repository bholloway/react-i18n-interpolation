# react-i18n-interpolation

String interpolation of translated text and React components.

Intended for [gettext](https://www.npmjs.com/search?q=gettext) or similar translation APIs (where the key is the intended text in the developer's locale).

## TLDR

- Two functions
  - `gettext`
    - Simple translation with template string as translation lookup key
  - `ngettext`
    - Singular/Plural aware translation with template string as translation lookup key
- Two ways of invoking
  - direct substitutions (simple values)
    - Immediately substituted, same as normal template literals.
    - Occurs **before** translation.
    - Only permitted for primitives `string`, `number`, `boolean`, etc.
  - object substitutions (single `key`/`value`)
    - The `key` gives your translator context (and needs to survive translation).
    - The `value` is substituted after **translation**.
### `gettext`

- Without Substitution:

```js
gettext`foo`
```

- With Substitution:

```js
gettext`Welcome to ${{location: 'Jurassic Park'}}`
```

- jsx:

```js
gettext`For more ${{link: <a href="http://google.com">{gettext`information`}</a>}}`
```

### `ngettext`

- Without Substitution:

```js
ngettext(planets)`Hello world!|Hello worlds!`
```
|   | input | output |
|---|----|----|
| **singular** | `planets === 1`  | "Hello World!"  |
| **plural**   | `planets > 1`    | "Hello Worlds!" |
<!-- Basic logic: If `planets > 1`  return "Hello world" otherwise -->

- With Substitution:

```js
ngettext(daysLeft)`Only one day to go!|${{daysLeft}} days to go!`
```

|   | input | output |
|---|----|----|
| **singular** | `daysLeft === 1`  | "Only one day to go!"  |
| **plural**   | `daysLeft > 1`    | "9 days to go!"        |

### In Greater Depth

For a more detailed examination of usage, the projects motivation and other options see [this documentation](docs/InDepth.md) or check out the examples directory.

## Installation

Install the package

```bash
$ npm install --save react-i18-interpolation
```

Choose a translation package, for example [node-gettext](https://www.npmjs.com/search?q=gettext).

```bash
$ npm install --save node-gettext
```

## Setup

Setup in your application.

```javascript
import NodeGettext from 'node-gettext';
import {factory} from 'react-i18-interpolation';

const nodeGettext = new NodeGettext();
nodeGettext.addTextdomain(...);
nodeGettext.textdomain(...);

const {gettext, ngettext} = factory({gettext: nodeGettext});
```

We recommend you distribute these method(s) to components by `redux`, or failing that but `context`. Using `redux` allows your UI to respond to changes in text domain real-time.
