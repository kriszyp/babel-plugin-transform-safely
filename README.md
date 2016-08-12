# babel-plugin-transform-safely
This babel plugin will transform expressions that use a `safely` keyword/call to produce safe property access and modification.

## Installation

```sh
$ npm install babel-plugin-transform-safely
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
So if `object` or `subObject` is not an object, the entire expression will return `undefined` (without an error).

And we can assign properties to objects thay may not exist yet, and they will be created:
```
safely(object.subObject.subProperty = 4) // will create the any missing objects in order to assign property
```
If `object` or `subObject` are not objects, they will be assigned an object.

And we can make function or method calls on functions may or may not exist as well:
```
safely(object.method(args)) // will only call if method exists
```
Again, this will return `undefined` if the method doesn't exist.

If you use a numeric index or the `push` or `unshift` method, the code will be transformed to create an array as necessary (rather than just doing an existence check). For example:
```
object.arrayProperty.push('hi')
```
If `arrayProperty` is not defined, an array will be created (and `push` called on it).

And of course you can combine any permutation of the above:
```
safely(empty.b.c = object[a]() || object[b](something.c.d))
```

## Transform Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["transform-safely"]
}
```

### Via CLI

```sh
$ babel --plugins transform-safely
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["transform-safely"]
});
```
