# react-i18n-interpolation

String interpolation of translated text and React components.

Intended for [gettext](https://www.npmjs.com/search?q=gettext) or similar translation APIs (where the key is the intended text in the developer's locale).

## TLDR

- Two functions
  - `gettext`
    - Simple translation with language strng as lookupkey
  - `ngettext`
    - Singular/Plural aware translation with language strng as lookupkey
- Two ways of invoking
  - simple values
    - The argument/string is used as the lookup id
  - object
    - The key is used as the lookup id
### `gettext`

Simple Values:

```js
gettext`foo`
```

key/val:

```js
gettext`Welcome to ${{location: 'hell'}}`
```

jsx (nested call):

```js
gettext`For more ${{link: <a href="http://google.com">{gettext`information`}</a>}}`
```

### `ngettext`

- simple value:

```js
ngettext(planets)`Hello world!|Hello worlds!`
```
|   | input | output |
|---|----|----|
| **singular** | planets <= 1  | "Hello World!"  |
| **plural**   | otherwise     | "Hello Worlds!" |
<!-- Basic logic: If `planets > 1`  return "Hello world" otherwise -->

- Object:

```js
ngettext(daysLeft)`Only one day to go!|${{daysLeft}} days to go!`
```

|   | input | output |
|---|----|----|
| **singular** | `{daysLeft: 1}`  | "Only one day to go!"  |
| **plural**   | `{daysLeft: 9}`  | "9 days to go!" |


For more details on usage and the projects motivation see [this documentation](docs/InDepth.md) or check out the examples directory.

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
