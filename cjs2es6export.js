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
  var ast = acorn.parse(src, parseOpts);

  // module.exports =
  var isExportAssignment = function(node) {
    if (node.type !== 'AssignmentExpression') return false;

    return node.left.type === 'MemberExpression' &&
      node.left.object.type === 'Identifier' && node.left.object.name === 'module' &&
      node.left.property.type === 'Identifier' && node.left.property.name === 'exports';
  };

  walk.simple(ast, walkall.makeVisitors(function(anode) {
    if (!isExportAssignment(anode))
      return;

    console.log("ANODE",anode);

    if (anode.right.type === 'FunctionExpression') {
      var f = anode.right;
      object_clear(anode);
      object_assign(anode, f);
      console.log("NEW",anode);
    }


    //console.log('Found node type',anode.type,anode);
    //console.log(escodegen.generate(node));

    if (anode.type !== 'VariableDeclaration') {
      return;
    }

    var newNodes = [];

    anode.declarations.forEach(function(node) {
      if (node.id.type !== 'Identifier') {
        //console.log('Ignoring non-identifier variable identifier: ',node);
        return;
      }

      var varName = node.id.name;

      if (isRequire(node.init)) {
        if (node.init.arguments.length) {
          if (node.init.arguments[0].type === 'Literal') {
            var moduleName = node.init.arguments[0].value;

            //console.log('Found require:', varName, moduleName);
            //console.log('Old node=',node);

            delete node.id;
            delete node.init;
            node.type =  'ImportDeclaration';
            node.source = {type: 'Literal', value: opts.encode(moduleName)}

            node.specifiers = [
              {
                type: 'ImportDefaultSpecifier',
                id: {type: 'Identifier', name: varName},
              }
            ];

            newNodes.push(node);

            //console.log('New node=',node);
          } else {
            //console.log('Ignored non-string require:',node.init.arguments[0]);
            // Pass it through unchanged, not much we can do TODO: support subset of expression evaluations like browserify
            newNodes.push(node);
          }
        }
      }
    });

    anode.type = 'Program';
    anode.body = newNodes;
    delete anode.kind;
    delete anode.declarations;
    //console.log('anode=',anode);
    //

  }), walkall.traversers);

  var newSrc = escodegen.generate(ast);

  return newSrc;
};

