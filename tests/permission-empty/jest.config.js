const path = require('path')
const { createRequire } = require('module')
const sourceRoot = process.env.PERMISSION_SOURCE_ROOT
const dependencyRoot = process.env.PERMISSION_DEPENDENCY_ROOT
if (!sourceRoot || !dependencyRoot) throw new Error('Set PERMISSION_SOURCE_ROOT and PERMISSION_DEPENDENCY_ROOT')
const dep = createRequire(path.join(dependencyRoot, 'package.json'))
module.exports = {
  rootDir: sourceRoot,
  roots: [__dirname, sourceRoot],
  testMatch: [path.join(__dirname, 'permission-empty.spec.js').replace(/\\/g, '/')],
  testEnvironment: dep.resolve('jest-environment-jsdom'),
  testURL: 'http://localhost/',
  modulePaths: [path.join(dependencyRoot, 'node_modules')],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.js$': path.join(__dirname, 'babel-transform.js'),
    '^.+\\.vue$': dep.resolve('vue-jest')
  },
  globals: {
    'vue-jest': {
      babelConfig: {
        babelrc: false,
        configFile: false,
        plugins: [dep.resolve('@babel/plugin-transform-modules-commonjs')]
      }
    }
  },
  maxWorkers: 1
}
