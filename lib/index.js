module.exports = function ({ types: t }) {

  function getObjectReference(path) {
    if (!path.objectRefId) {
      path.objectRefId = path.scope.generateDeclaredUidIdentifier('object')
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

  function ensureObject(path) {
    let { node } = path
    if (t.isIdentifier(node)) {
      // (object || (object = {})).property = right
      path.replaceWith(t.logicalExpression('||', node, t.assignmentExpression('=', node, t.objectLiteral())))
      return path.node
    } else if (t.isMemberExpression(node)) {
      let ensuredObject = ensureObject(path.get('object'))
      if (!ensuredObject) {
        // var _gen1 = expr;
      }
      path.replaceWith(t.logicalExpression('||', t.memberExpression(ensuredObject, node.property), t.assignmentExpression('=', t.memberExpression(object, node.property), t.objectLiteral())))

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
        if (t.isIdentifier(left) || t.memberExpression(left)) {
          // ((object || (object = {})).property || (object.property = {}).subProperty = right
          path.get('left').replaceWith(

            )
        }
        else
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
        markAsSafe(t.memberExpression(objectRef, t.identifier(node.property.name))))
      safeMember.isSafeMember = true
      path.replaceWith(safeMember)
    },
    CallExpression: {
      exit(path) {
        let { node } = path
        if (node.isSafe) {
          return
        }
        if (node.callee.isSafeMember)) {
          // objectExpr.method == null ? void 0 : objectExpr.method(args)
          let member = path.get('callee').get('alternate')
          path.get('callee').get('alternate').replaceWith(markAsSafe(t.callExpression(member, node.arguments)))
          path.replaceWith(node.callee)
        } else {
          // func == null ? void 0 : func()
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
