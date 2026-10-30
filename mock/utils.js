/**
 * @param {string} url
 * @returns {Object}
 */
function param2Obj(url) {
  const search = url.split('?')[1]
  if (!search) {
    return {}
  }
  const obj = {}
  const searchArr = search.split('&')
  searchArr.forEach(v => {
    const index = v.indexOf('=')
    if (index !== -1) {
      const name = decodeURIComponent(v.substring(0, index).replace(/\+/g, ' '))
      const val = decodeURIComponent(v.substring(index + 1, v.length).replace(/\+/g, ' '))
      obj[name] = val
    }
  })
  return obj
}

module.exports = {
  param2Obj
}
