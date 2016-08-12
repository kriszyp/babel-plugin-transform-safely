module.exports = function ({ types: t }) {

  function getObjectReference(path, name) {
    if (!path.objectRefId) {
      path.objectRefId = path.scope.generateDeclaredUidIdentifier(name || 'object')
    }
    return path.objectRefId
  }

  function getTempId(scope) {
    let id = scope.path.getData("functionBind");
    if (id) return id;

    id = scope.generateDeclaredUidIdentifier("context");
    return scope.path.setData("functionBind", id);
  }

  function markAsSafe(node) {
    node.isSafe = node
    return node
  }

  function ensureObject(path, isArray) {
    let { node } = path
    if (t.isIdentifier(node)) {
      // (object || (object = {})).property = right
      path.replaceWith(t.logicalExpression('||', node, t.assignmentExpression('=', node, isArray ? t.arrayExpression([]) : t.objectExpression([]))))
      return path.node
    } else if (t.isMemberExpression(node)) {
      let ensuredObject = ensureObject(path.get('object'), t.isNumericLiteral(node.property))
      if (!ensuredObject) {
        // var _gen1 = expr;
      }
      let objectRef = getObjectReference(path.get('object'))
      path.replaceWith(t.logicalExpression('||',
        markAsSafe(t.memberExpression(t.assignmentExpression('=', objectRef, ensuredObject), node.property, node.computed)),
        markAsSafe(t.assignmentExpression('=', markAsSafe(t.memberExpression(objectRef, node.property, node.computed)), isArray ? t.arrayExpression([]) : t.objectExpression([])))))

      return path.node
    }
    // else can't be ensured
  }

  const safelyVisitors = {
    AssignmentExpression(path) {
      let { node } = path
      let { left, right } = node
      if (node.isSafe) {
        return
      }
      if (t.isMemberExpression(left)) {
        ensureObject(path.get('left').get('object'), t.isNumericLiteral(left.property))
        markAsSafe(left)
//        else
          // expr == null ? void 0 : expr.property = right
      }

    },
    MemberExpression(path) {
      let { node } = path
      if (node.isSafe) {
        return
      }
      let object = node.object
      let objectRef = object
      if (!t.isIdentifier(object)) {
        object = markAsSafe(t.assignmentExpression('=', getObjectReference(path), object))
        objectRef = getObjectReference(path)
      }
      // object == null ? void 0 : object.property
      let safeMember = t.conditionalExpression(
        t.binaryExpression('==', object, t.nullLiteral()),
        t.unaryExpression('void', t.numericLiteral(0)),
        markAsSafe(t.memberExpression(objectRef, node.property, node.computed)))
      safeMember.isSafeMember = true
      path.replaceWith(safeMember)
    },
    CallExpression: {
      enter(path) {
        let { node } = path
        if (node.isSafe) {
          return
        }
        let { callee } = node
        if (t.isMemberExpression(callee) && (callee.property.name === 'push' || callee.property.name === 'unshift')) {
          // for push or unshift, we ensure an array rather than doing existence checks
          if (ensureObject(path.get('callee').get('object'), true)) {
            path.get('callee').node.isSafe = true
            path.node.isSafe = true
          }
        }
      },
      exit(path) {
        let { node } = path
        if (node.isSafe) {
          return
        }
        if (node.callee.isSafeMember) {
          // objectExpr.method == null ? void 0 : objectExpr.method ? objectExpr.method(args) : void 0
          let member = path.get('callee').get('alternate').node
          path.get('callee').get('alternate').replaceWith(
            t.conditionalExpression(
              member,
              markAsSafe(t.callExpression(member, node.arguments)),
              t.unaryExpression('void', t.numericLiteral(0))))
          path.replaceWith(node.callee)
        } else {
          // func == null ? void 0 : func()
          if (t.isIdentifier(node.callee)) {
            path.replaceWith(t.conditionalExpression(
              node.callee,
              markAsSafe(t.callExpression(node.callee, node.arguments)),
              t.unaryExpression('void', t.numericLiteral(0))))
          } else {
            let funcRef = getObjectReference(path.get('callee'), 'func')
            path.replaceWith(t.conditionalExpression(
              t.assignmentExpression('=', funcRef, node.callee),
              markAsSafe(t.callExpression(funcRef, node.arguments)),
              t.unaryExpression('void', t.numericLiteral(0))))

          }
        }
      }
    }
  }

  return {
    visitor: {
      CallExpression(path) {
        let { node, scope } = path
        let firstArg = node.arguments[0]
        let callee = node.callee
        if (callee.name === 'safely') {
          path.traverse(safelyVisitors)
          path.replaceWith(node.arguments[0])
        }
      }
    }
  };
}
