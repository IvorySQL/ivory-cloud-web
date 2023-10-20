// import { login, logout, getInfo ,subscribe} from '@/api/user'
import { getToken, setToken, removeToken, removeLocalstoragesSavedAsLogined } from '@/utils/auth'
import router, { resetRouter } from '@/router'
import { getInfo, subscribe } from '@/api/user'

const getDefaultState = () => {
  return {
    token: getToken(),
    name: '',
    avatar: '',
    roles: []
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  }
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-undef
      login({ userName: username.trim(), password: password }).then(response => {
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 订阅
  subscribe({ commit }, state) {
    return new Promise((resolve, reject) => {
      subscribe(state).then(response => {
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },
  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo(state.token).then(response => {
        const { data } = response

        if (!data) {
          return reject('Verification failed, please Login again.')
        }

        // eslint-disable-next-line no-unused-vars
        const { roles, name, avatar } = data

        commit('SET_NAME', name)
        commit('SET_AVATAR', avatar)
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
    //  logout(state.token).then(() => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeLocalstoragesSavedAsLogined()
      resetRouter()
      commit('RESET_STATE')

      resolve()
      // }).catch(error => {
      //   reject(error)
      // })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      removeToken() // must remove  token  first
      commit('RESET_STATE')
      resolve()
    })
  },

  // dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const token = role + '-token'

    commit('SET_TOKEN', token)
    setToken(token)

    const { roles } = await dispatch('getInfo')

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })
    // dynamically add accessible routes
    router.addRoutes(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  },

  // 获取用户名字
  setUserName({ commit }, name) {
    return new Promise((resolve) => {
      console.log('set userName: ======', name)
      commit('SET_NAME', name)
      resolve()
    })
  },
  // set permissions
  setRoles({ commit }, roles) {
    return new Promise(resolve => {
      // console.log('begin to set roles: ', roles)
      commit('SET_ROLES', roles)
      resolve()
    })
  },
  // user logout
  removeRoles({ commit, state }) {
    return new Promise((resolve, reject) => {
      commit('SET_ROLES', [])
      //  resetRouter()
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

