/**
 * get search result function
 * in MainTable/index.vue
 * @param value
 * @param result
 * @author Jianan
 */
export default function getSearchResult(value, result) {
  const _this = this
  _this.list = value
  _this.flag = true

  this.$emit('TimerContinue', result)
}
