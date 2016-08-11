# babel-plugin-transform-alkali
This babel plugin will transform expressions that use a `safely` keyword/call to produce safe property access and modification.

## Installation

```sh
$ npm install babel-plugin-safely
```

## Usage

The basic format of using the transform is to write object-checked, safe expressions (existential property access) in the form:
```
safely(expression)
```
We can then access properties on variables that may be set to null or undefined, and they won't error out. For example:
```
safely(object.subObject.subProperty) // will check for each object's existence before accessing property
```
Will be rewritten to:
```
var _object
(_object = object == null ? void 0 : object.subObject) == null ? void 0 : _object.subProperty
```
And we can assign properties to objects thay may not exist yet, and they will be created:
```
safely(object.subObject.subProperty = 4) // will create the any missing objects in order to assign property
```
And we can make function or method calls on functions may or may not exist as well:
```
safely(object.method(args)) // will only call if method exists
```
And of course you can combine any permutation of the above.

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
