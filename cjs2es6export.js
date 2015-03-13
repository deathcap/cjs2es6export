'use strict';

var acorn = require('acorn');
var walk = require('acorn/util/walk');
var walkall = require('walkall');
var escodegen = require('escodegen');
var object_assign = require('object.assign');

// Delete all properties from an object, like obj={} but retains identity TODO: modularize?
var object_clear = function(obj) {
  for (var prop in obj) {
    delete obj[prop];
  }
};

module.exports = function(src, opts) {
  opts = opts || {};
  opts.encode = opts.encode || function(moduleName) { return moduleName };
  var parseOpts = {ecmaVersion: 6};
  var ast = opts.ast || acorn.parse(src, parseOpts);

  // module.exports =
  var isExportAssignment = function(node) {
    if (node.type !== 'AssignmentExpression') return false;

    return node.left.type === 'MemberExpression' &&
      node.left.object.type === 'Identifier' && node.left.object.name === 'module' &&
      node.left.property.type === 'Identifier' && node.left.property.name === 'exports';
    // TODO: detect module.exports.foo = (or exports.foo =) property assignments, non-default exports
  };

  walk.simple(ast, walkall.makeVisitors(function(anode) {
    if (!isExportAssignment(anode))
      return;

    if (anode.right.type === 'FunctionExpression') {
      var f = anode.right;
      object_clear(anode);

      // export default function()
      anode.type = 'ExportDeclaration';
      anode.default = true;
      anode.declaration = f;

    }

    //console.log('anode=',anode);
  }), walkall.traversers);

  if (opts.returnAst) return ast;

  var newSrc = escodegen.generate(ast);

  return newSrc;
};

