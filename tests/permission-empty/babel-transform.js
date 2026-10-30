const path = require('path')
const { createRequire } = require('module')
const dependencyRoot = process.env.PERMISSION_DEPENDENCY_ROOT
if (!dependencyRoot) throw new Error('Set PERMISSION_DEPENDENCY_ROOT to existing real dependencies')
const dep = createRequire(path.join(dependencyRoot, 'package.json'))
const babel = dep('@babel/core')
module.exports = {
  process(source, filename) {
    return babel.transformSync(source, {
      filename,
      babelrc: false,
      configFile: false,
      plugins: [dep.resolve('@babel/plugin-transform-modules-commonjs')]
    }).code
  }
}
