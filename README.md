# cjs2es6export

Convert a subset of CommonJS/NodeJS [module.exports](https://nodejs.org/api/modules.html#modules_modules) assignments to
[ECMAScript 6 module export](http://www.2ality.com/2014/09/es6-modules-final.html) declarations.

Usage:

    var cjs2es6export = require('cjs2es6export');

    var src = "module.exports = function() { return 42; };"
    var newSrc = cjs2es6export(src); // "export default function() {\n return 42;\n};;"

Currently only direct assignment to `module.exports` (translated to `default export`) is supported.

See also [cjs2es6import](https://github.com/deathcap/cjs2es6import)

## License

MIT

