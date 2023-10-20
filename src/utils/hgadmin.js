import Cookies from 'js-cookie'

const session = 'pga4_session'

const instanceId = 'INSTANCE_ID'
export function getToken() {
  return Cookies.get(session)
}

export function setToken(token) {
  return Cookies.set(session, token)
}

export function removeToken() {
  return Cookies.remove(session)
}

export function getInstanceId() {
  return Cookies.get(instanceId)
}
