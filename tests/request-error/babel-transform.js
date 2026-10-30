const path = require('path')
const { createRequire } = require('module')
const dependencyRoot = process.env.REQUEST_DEPENDENCY_ROOT
if (!dependencyRoot) throw new Error('REQUEST_DEPENDENCY_ROOT must identify existing project dependencies')
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
