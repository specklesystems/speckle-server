import { isSafari } from './os.js'

const shouldPolyfillIdleCallback = isSafari() || !globalThis.requestIdleCallback

/**
 * requestIdleCallback w/ proper polyfills
 */
export const requestIdleCallback: typeof globalThis.requestIdleCallback =
  shouldPolyfillIdleCallback
    ? function (cb: IdleRequestCallback) {
        const start = Date.now()
        return setTimeout(function () {
          cb({
            didTimeout: false,
            timeRemaining() {
              return Math.max(0, 50 - (Date.now() - start))
            }
          })
        }, 1) as unknown as number // Timer is actually a number at the end, just w/ extra bits on top of it
      }
    : globalThis.requestIdleCallback

export const cancelIdleCallback: typeof globalThis.cancelIdleCallback =
  shouldPolyfillIdleCallback ? clearTimeout : globalThis.cancelIdleCallback
