/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { CookieOptions } from 'nuxt/dist/app/composables/cookie'
import dayjs from 'dayjs'
import { useScopedState } from '~~/lib/common/composables/scopedState'
import { isUndefined } from 'lodash-es'
import { isBraveOrSafari } from '@speckle/shared'
import { abortControllerManager, isAbortError } from '~/lib/common/utils/requests'

const aborts = abortControllerManager()

/**
 * Makes useCookie() synchronized across the app so that a change to it from one place
 * will also update other references elsewhere.
 *
 * Defaults to an expiration date of 1 year
 */
export const useSynchronizedCookie = <CookieValue = string>(
  name: string,
  opts?: CookieOptions<CookieValue>
) =>
  useScopedState(`synchronizedCookiesState-${name}`, () => {
    const finalOpts: CookieOptions<CookieValue> = {
      expires: dayjs().add(1, 'year').toDate(),
      ...(opts || {}),
      readonly: false,
      default: undefined
    }

    // something's off with nuxt's types here, have to use any
    const cookie = useCookie<CookieValue>(name, finalOpts as any)

    // Hack to resolve Safari & Brave limiting client-side cookies to 7 days - set temporary cookie to be read from server-side where it'll be fixed
    if (import.meta.client && isBraveOrSafari()) {
      const tmpCookie = useCookie(`tmp-${name}`, finalOpts as any)

      watch(cookie, (newVal) => {
        if (newVal) {
          tmpCookie.value = JSON.stringify({
            expires: finalOpts.expires?.toISOString(),
            maxAge: finalOpts.maxAge
          })
        } else {
          tmpCookie.value = undefined
        }

        // Fetch w/ abort of previous call, if any
        const controller = aborts.popOnlyInCSR()
        void fetch('/web-api/cookie-fix', {
          signal: controller?.signal
        }).catch((e) => {
          if (!isAbortError(e)) {
            throw e
          }
        })
      })
    }

    // there's a bug in nuxt where a default value doesn't get set if useCookie is only invoked in CSR
    // TODO: https://github.com/nuxt/nuxt/issues/26701
    if (isUndefined(cookie.value) && opts?.default) {
      cookie.value = unref(opts.default())
    }

    return cookie
  })
