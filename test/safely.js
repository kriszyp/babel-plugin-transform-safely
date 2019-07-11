var obj = {foo: 'bar'}
var empty = null
var hasFunc = {
  someFunction: function(msg) {
    return { msg: msg }
  }
}
var func = null
var maybeArray = null
var safelyPlugin = require('../lib')
var assert = require('assert')

var tests = {
  basic: {
    test: function() {
      return safely(empty.b.c)
    },
    output: `test = function () {
      var _object;
      return (_object = empty == null ? void 0 : empty.b) == null ? void 0 : _object.c;
    };`,
    result: undefined
  },
  assign: {
    test: function () {
      return safely(empty.b.c.d = 'hi')
    },
    output: `test = function () {
      var _object, _object2;
      return ((_object2 = (_object = empty || (empty = {})).b || (_object.b = {})).c || (_object2.c = {})).d = 'hi';
    };`,
    result: 'hi',
    assert: function() {
      assert.deepEqual(empty, { b: { c: { d: 'hi' } } })
    }
  },
  notEmpty: {
    test: function() {
      return safely(empty.b.c.d)
    },
    output: `test = function () {
      var _object, _object2;
      return (_object = (_object2 = empty == null ? void 0 : empty.b) == null ? void 0 : _object2.c) == null ? void 0 : _object.d;
    };`,
    result: 'hi'
  },
  call: {
    test: function () {
      return safely(empty.b.someFunction('hi').c)
    },
    output: `test = function () {
      var _object, _object2;
      return (_object = (_object2 = empty == null ? void 0 : empty.b) == null ? void 0 : _object2.someFunction ? _object2.someFunction('hi') : void 0) == null ? void 0 : _object.c;
    };`,
    result: undefined
  },
  callAssignNonExistent: {
    test: function () {
      return safely(empty.b.someFunction('hi').c = 'assigned')
    },
    output: `test = function () {
      var _object;
      return ((_object = empty == null ? void 0 : empty.b) == null ? void 0 : _object.someFunction ? _object.someFunction('hi') : void 0).c = 'assigned';
    };`,
    exception: TypeError
  },
  callAssignExisting: {
    test: function () {
      return safely(hasFunc.someFunction('hi').c = 'assigned')
    },
    output: `test = function () {
      return (hasFunc == null ? void 0 : hasFunc.someFunction ? hasFunc.someFunction('hi') : void 0).c = 'assigned';
    };`,
    result: 'assigned'
  },
  computedMember: {
    test: function () {
      return safely(empty[obj.foo].b)
    },
    output: `test = function () {
      var _object;
      return (_object = empty == null ? void 0 : empty[obj == null ? void 0 : obj.foo]) == null ? void 0 : _object.b;
    };`,
    result: undefined
  },
  computedMemberAssignment: {
    test: function () {
      return safely(empty[obj.foo].b  = 'foo.bar')
    },
    output: `test = function () {
      var _object;
      return ((_object = empty || (empty = {}))[obj == null ? void 0 : obj.foo] || (_object[obj == null ? void 0 : obj.foo] = {})).b = 'foo.bar';
    };`,
    result: 'foo.bar',
    assert: function() {
      assert.deepEqual(empty, { b: { c: { d: 'hi' } }, bar: { b: 'foo.bar' }})
    }
  },
  simpleCall: {
    test: function () {
      return safely(func(3))
    },
    output: `test = function () {
      return func ? func(3) : void 0;
    };`,
    result: undefined
  },
  funcExpr: {
    test: function() {
      return safely((obj && func)(3))
    },
    output: `test = function () {
      var _func;
      return (_func = obj && func) ? _func(3) : void 0;
    };`,
    result: undefined
  },
  numericAssignment: {
    test: function () {
      return safely(maybeArray[0] = 'hi')
    },
    output: `test = function () {
      return (maybeArray || (maybeArray = []))[0] = 'hi';
    };`,
    result: 'hi',
    assert: function() {
      assert.deepEqual(maybeArray, ['hi'])
    }
  },
  push: {
    test: function() {
      return safely(maybeArray.subArray.push('hello'))
    },
    output: `test = function () {
      var _object;
      return ((_object = maybeArray || (maybeArray = {})).subArray || (_object.subArray = [])).push('hello');
    };`,
    assert: function(val) {
      var expected = ['hi']
      expected.subArray = ['hello']
      assert.deepEqual(maybeArray, expected)
    }
  },
  combo1: {
    test: function () {
      return safely(empty.b = obj.foo.bar(func.c))
    },
    output: `test = function () {
      var _object;
      return (empty || (empty = {})).b = (_object = obj == null ? void 0 : obj.foo) == null ? void 0 : _object.bar ? _object.bar(func == null ? void 0 : func.c) : void 0;
    };`,
    result: undefined,
    assert: function(val) {
      assert(val == undefined)
      assert(empty.b == undefined)
    }
  },
  arrow: {
    test: function () {
      return {
        get: (row) => safely(row.SelectedOutcome.FieldType)
      }
    },
    output: `test = function () {
      return {
        get: row => {
          var _object;
          return (_object = row == null ? void 0 : row.SelectedOutcome) == null ? void 0 : _object.FieldType;
        }
      };
    };`,
    assert: function (val) {
      assert(typeof val == 'object')
      assert(!!val.get)
      assert(typeof val.get == 'function')
      assert(val.get(null) == undefined)
      assert(val.get({SelectedOutcome:{FieldType: 'f'}}) == 'f')
    }
  },
  thisAssignment: {
    test: function () {
      return safely(this.obj['a'] = 'b')
    },
    output: `test = function () {
      var _object;
      return ((_object = this).obj || (_object.obj = {}))['a'] = 'b';
    };`,
    result: 'b'
  }
}

var testCfg
var test
var expectedOutput
var returnVal
var err
for (var testName in tests) {
  testCfg = tests[testName]
  test = testCfg.test
  expectedOutput = testCfg.output
  var result = require("babel-core").transform('test=' + test.toString(), {
    plugins: [safelyPlugin]
  })
  if (expectedOutput != null) {
    console.assert(expectedOutput.replace(/\s+/g, '') == result.code.replace(/\s+/g, ''), testName + ":\r\n'" + result.code + "'\r\n!=\r\n'" + expectedOutput + "'")
  }
  err = null
  try {
    returnVal = eval(result.code)()
    if ('result' in testCfg) {
      console.assert(returnVal == testCfg.result, testName + ": Incorrect return value: '" + returnVal + "' != '" + testCfg.result + "'")
    }
    if ('assert' in testCfg) {
      testCfg.assert(returnVal)
    }
  } catch (e) {
    err = e
  }
  if (err) {
    if (!testCfg.exception) {
      console.log(testName + ':')
      throw err
    }
    if (testCfg.exception !== true) {
      if (!(err instanceof testCfg.exception)) {
        throw new Error(testName + ': Unexpected exception: ' + err)
      }
    }
  } else if (testCfg.exception) {
    throw new Error(testName + ': Expected exception: ' + testCfg.exception)
  }
}

