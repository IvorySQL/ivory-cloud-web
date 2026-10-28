const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { JSDOM } = require('jsdom')

const setting = process.argv[2]
assert(['true', 'false'].includes(setting), 'Pass the supported disableNative true or false setting')
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator
global.localStorage = dom.window.localStorage
global.HTMLElement = dom.window.HTMLElement
global.Element = dom.window.Element
global.Node = dom.window.Node

// Evaluate the complete actual public configuration before production modules load.
// The only deployment input changed is its documented disableNative boolean.
const configPath = path.resolve(__dirname, '../../public/config.js')
const config = fs.readFileSync(configPath, 'utf8')
assert(/disableNative\s*=\s*false/.test(config), 'Unexpected baseline public configuration')
vm.runInThisContext(config.replace(/disableNative\s*=\s*false/, `disableNative = ${setting}`), {
  filename: configPath
})
const { store, constantRoutes, asyncCloudRoutesAdmin } = require('./.bundle/contract.js')

function assertRouteIdentity(actual, expected) {
  assert(Array.isArray(actual))
  assert.strictEqual(actual.length, expected.length)
  actual.forEach((route, index) => assert.strictEqual(route, expected[index]))
}

async function run() {
  let failures = 0
  for (const role of ['routine', 'admin']) {
    try {
      // Dispatch the production action through the complete real Vuex store.
      const routes = await store.dispatch('permission/generateRoutes', [role])
      if (setting === 'true') {
        assertRouteIdentity(routes, [])
        assertRouteIdentity(store.state.permission.addRoutes, [])
        assertRouteIdentity(store.state.permission.routes, constantRoutes)
      } else {
        assert(routes.some(route => route.path === '/Dashboard'))
        assert.strictEqual(store.state.permission.addRoutes, routes)
        assertRouteIdentity(store.state.permission.routes, constantRoutes.concat(routes))
        assert.strictEqual(new Set(routes.map(route => route.path)).size, routes.length)
        if (role === 'admin') {
          assertRouteIdentity(routes, asyncCloudRoutesAdmin)
          assert(!routes.some(route => route.path === '/nativeCloud/DBManage'))
        } else {
          const manage = routes.find(route => route.path === '/nativeCloud/DBManage')
          assert(manage.children.some(route => route.name === 'DBManage'))
        }
      }
      console.log(`PASS disableNative=${setting} role=${role}`)
    } catch (error) {
      failures++
      console.error(`FAIL disableNative=${setting} role=${role}`, error)
    }
  }
  dom.window.close()
  process.exitCode = failures ? 1 : 0
}
run().catch(error => {
  console.error(error)
  dom.window.close()
  process.exitCode = 1
})
