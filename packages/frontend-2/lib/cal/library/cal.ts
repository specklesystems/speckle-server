import type { CalApi } from '~/lib/cal/types/cal'

declare global {
  interface Window {
    Cal: CalApi
  }
}

/**
 * Initialize Cal.com, linting is diabled to not modify the code too much
 * @returns Cal object
 */
export function initCal() {
  const scriptUrl = 'https://app.cal.com/embed/embed.js'

  /* eslint-disable */
  ;(function (C, A, L) {
    // @ts-ignore
    const p = function (a, ar) {
      a.q.push(ar)
    }
    const d = C.document
    C.Cal =
      C.Cal ||
      function () {
        const cal = C.Cal
        const ar = arguments
        if (!cal.loaded) {
          cal.ns = {}
          cal.q = cal.q || []
          d.head.appendChild(d.createElement('script')).src = A
          cal.loaded = true
        }
        if (ar[0] === L) {
          const api = function () {
            p(api, arguments)
          }
          const namespace = ar[1]
          // @ts-ignore
          api.q = api.q || []
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api
            p(cal.ns[namespace], ar)
            p(cal, ['initNamespace', namespace])
          } else p(cal, ar)
          return
        }
        p(cal, ar)
      }
  })(window, scriptUrl, 'init')

  return window.Cal
}
