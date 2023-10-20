export default function TimerContinue(result) {
  // console.log('Get results, then stop the father\'s timer!')
  const _this = this
  window.clearInterval(_this.clock)
  _this.clock = null
  if (result) {
    _this.setTimer()
    // console.log('This result is from reset button, then restart the father\'s timer!')
  }
}
