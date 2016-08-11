# babel-plugin-transform-alkali
This babel plugin will transform expressions that use a `safely` keyword/call to produce safe property access and modification.

## Installation

```sh
$ npm install babel-plugin-safely
```

## Usage

The basic format of using the transform is to write reactive expressions in the form:
```
safely(expression)
```
For example:
```
safely(object.subObject.subProperty) // won't error out if object or subObject is null or undefined
safely(object.subObject.subProperty = 4) // will create the any missing objects in order to assign property
## Transform Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["safely"]
}
```

### Via CLI

```sh
$ babel --plugins safely
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["safely"]
});
```
