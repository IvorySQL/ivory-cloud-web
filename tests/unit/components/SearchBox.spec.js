import { shallowMount } from '@vue/test-utils'
import SearchBox from '@/components/SearchBox/index'

const flush = () => new Promise(resolve => setImmediate(resolve))

describe('SearchBox request ordering', () => {
  let wrapper
  let requests
  let reportError

  beforeEach(() => {
    requests = []
    reportError = jest.fn()
    wrapper = shallowMount(SearchBox, {
      stubs: ['el-row', 'el-select', 'el-option', 'el-input', 'el-button'],
      mocks: {
        axios: {
          get: url => url === '/clusters'
            ? Promise.resolve({ data: [] })
            : new Promise((resolve, reject) => requests.push({ resolve, reject }))
        },
        $message: { error: reportError }
      }
    })
  })

  afterEach(() => wrapper.destroy())

  it.each([
    ['btnSearch', 'btnSearch'],
    ['btnSearch', 'btnReset'],
    ['btnReset', 'btnSearch']
  ])('keeps the latest result for %s followed by %s', async(first, second) => {
    wrapper.vm[first]()
    wrapper.vm[second]()
    const latest = [{ id: 'latest' }]
    requests[1].resolve({ data: second === 'btnSearch' ? { data: latest } : latest })
    await flush()
    const stale = [{ id: 'stale' }]
    requests[0].resolve({ data: first === 'btnSearch' ? { data: stale } : stale })
    await flush()
    expect(wrapper.emitted('resultList')).toEqual([[latest, second === 'btnReset']])
  })

  it('ignores an old error but reports the current request error', async() => {
    wrapper.vm.btnSearch()
    wrapper.vm.btnReset()
    requests[0].reject(new Error('old request'))
    await flush()
    expect(reportError).not.toHaveBeenCalled()
    const currentError = new Error('current request')
    requests[1].reject(currentError)
    await flush()
    expect(reportError).toHaveBeenCalledWith(currentError)
  })
})
