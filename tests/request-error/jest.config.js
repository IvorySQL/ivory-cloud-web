const path = require('path')
const { createRequire } = require('module')
const sourceRoot = process.env.REQUEST_SOURCE_ROOT
const dependencyRoot = process.env.REQUEST_DEPENDENCY_ROOT
if (!sourceRoot || !dependencyRoot) throw new Error('Set REQUEST_SOURCE_ROOT and REQUEST_DEPENDENCY_ROOT')
const dep = createRequire(path.join(dependencyRoot, 'package.json'))
module.exports = {
  rootDir: sourceRoot,
  roots: [__dirname, sourceRoot],
  testMatch: [path.join(__dirname, 'request-error.spec.js').replace(/\\/g, '/')],
  testEnvironment: dep.resolve('jest-environment-jsdom'),
  testURL: 'http://localhost/',
  modulePaths: [path.join(dependencyRoot, 'node_modules')],
  moduleNameMapper: {
    '^@/store$': path.join(__dirname, 'token-store-fixture.js'),
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: { '^.+\\.js$': path.join(__dirname, 'babel-transform.js') },
  maxWorkers: 1
}
