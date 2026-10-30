import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const require = createRequire(import.meta.url)
const sourceRoot = process.env.QUERY_SOURCE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Load the ENTIRE unchanged-or-patched ESM source. No extraction or copied parser.
const source = await readFile(path.join(sourceRoot, 'src/utils/index.js'), 'utf8')
const utilities = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
const mockUtilities = require(path.join(sourceRoot, 'mock/utils.js'))
assert.equal(typeof utilities.parseTime, 'function')
assert.equal(typeof utilities.formatTime, 'function')

const cases = [
  ['encoded ampersand in value', '?q=a%26b%3Dc', { q: 'a&b=c' }],
  ['encoded ampersand in name', '?na%26me=value', { 'na&me': 'value' }],
  ['encoded equals in name', '?na%3Dme=value', { 'na=me': 'value' }],
  ['encoded literal plus in value', '?q=%2B', { q: '+' }],
  ['encoded literal plus in name', '?na%2Bme=value', { 'na+me': 'value' }],
  ['space and literal plus remain distinct', '?q=one+two%2Bthree', { q: 'one two+three' }],
  ['Unicode with encoded separator', '?q=%E6%B5%8B%E8%AF%95%26%E4%B8%AD%E6%96%87', { q: '测试&中文' }],
  ['ordinary separate parameters', '?name=bill&age=29', { name: 'bill', age: '29' }],
  ['ordinary encoded Unicode', '?key=%E6%B5%8B%E8%AF%95', { key: '测试' }],
  ['unescaped plus represents space', '?first+name=Alice+Smith', { 'first name': 'Alice Smith' }],
  ['empty value', '?q=', { q: '' }],
  ['equals retained inside value', '?field=dGVzdA==', { field: 'dGVzdA==' }],
  ['no query', '', {}]
]

for (const [moduleName, parse] of [
  ['src/utils/index.js', utilities.param2Obj],
  ['mock/utils.js', mockUtilities.param2Obj]
]) {
  for (const [description, query, expected] of cases) {
    test(`${moduleName}: ${description}`, () => {
      const url = 'https://example.test/table/list' + query
      // Native WHATWG parser is an independent oracle for unique, valid pairs.
      // Repeated names, prototype names, key-only pairs and broken escapes are
      // intentionally outside these fixtures and this production change.
      const oracle = Object.fromEntries(new URL(url).searchParams.entries())
      assert.deepEqual(oracle, expected)
      assert.deepEqual(parse(url), expected)
    })
  }
}
