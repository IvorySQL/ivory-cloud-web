// Explicit boundary: a real Vuex store with only the token getter needed by
// request.js. This does not load the webpack require.context application store.
const Vue = require('vue')
const Vuex = require('vuex')
Vue.use(Vuex)
module.exports = new Vuex.Store({
  state: { token: '' },
  getters: { token: state => state.token }
})
