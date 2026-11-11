// YGF ingredient video band: the <source> elements render without a file (nothing downloads on load), and the
// play button gives each one its file from the component's own list, matched by type.
// Run: `vp test run apps/ygfliege/components/mkt/MktVideoBand.nuxt.test.ts`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mountSuspended } from '@nuxt/test-utils/runtime'

const { default: MktVideoBand } = await import('./MktVideoBand.vue')

let unmount: (() => void) | undefined
const load = vi.fn<() => void>()

beforeEach(() => {
  // Motion allowed (so the play button shows), no viewport entry: only the button loads the clip.
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
    },
  )
  load.mockClear()
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(load)
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
})
afterEach(() => {
  unmount?.()
  unmount = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('MktVideoBand', () => {
  it('renders the sources without a file, then sets each one by type when play is pressed', async () => {
    const wrapper = await mountSuspended(MktVideoBand, { attachTo: document.body })
    unmount = () => {
      wrapper.unmount()
    }
    const sources = () =>
      wrapper
        .findAll('source')
        .map((s) => ({ type: s.attributes('type'), src: s.attributes('src') }))
    expect(sources()).toEqual([
      { type: 'video/webm', src: undefined },
      { type: 'video/mp4', src: undefined },
    ])

    await wrapper.get('[data-testid="video-toggle"]').trigger('click')

    expect(sources()).toEqual([
      { type: 'video/webm', src: expect.stringMatching(/\/videos\/ingredients-loop\.webm$/u) },
      { type: 'video/mp4', src: expect.stringMatching(/\/videos\/ingredients-loop\.mp4$/u) },
    ])
    expect(load).toHaveBeenCalledOnce()
  })
})
