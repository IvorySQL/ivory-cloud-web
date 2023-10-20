import defaultSettings from '@/settings'

const { showSettings, fixedHeader, sidebarLogo, showRegister } = defaultSettings

const state = {
  showSettings: showSettings,
  fixedHeader: fixedHeader,
  sidebarLogo: sidebarLogo,
  showRegister: showRegister
}

const mutations = {
  CHANGE_SETTING: (state, { key, value }) => {
    state[`${key}`] = value
  }
}

const actions = {
  changeSetting({ commit }, data) {
    commit('CHANGE_SETTING', data)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

