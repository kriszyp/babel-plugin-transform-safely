var obj = {foo: 'bar'}
var empty = null
var func = null
var tests = {
  basic: function() {
    console.assert(safely(empty.b.c) === undefined)
  },
  assign: function() {
    safely(empty.b.c.d = 'hi')
  },
  call: function() {
    safely(empty.b.someFunction('hi').c)
  },
  computedMember: function() {
    safely(empty[obj.foo].b)
  },
  simpleCall: function() {
    safely(func(3))
  },
  funcExpr: function() {
    safely((obj && func)(3))
  },
  combo1: function() {
    safely(empty.b = obj.foo.bar(func.c))
  }
}
var test
for (let testName in tests) {
  var result = require("babel-core").transform('test=' + tests[testName].toString(), {
    plugins: ["transform-safely"]
  })
  console.log('transformed', result.code)
  eval(result.code)()
}

