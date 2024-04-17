import type { CookieOptions } from 'nuxt/dist/app/composables/cookie'
import dayjs from 'dayjs'
import { useScopedState } from '~~/lib/common/composables/scopedState'
import { isUndefined } from 'lodash-es'

/**
 * Makes useCookie() synchronized across the app so that a change to it from one place
 * will also update other references elsewhere.
 *
 * Defaults to an expiration date of 1 year
 *
 * IMPORTANT NOTE: Both Safari & Brave limit client-side cookie max-age to 7 days. If your cookie is important, evaluate how to
 * ensure that the cookie is written to from the server-side (either SSR render or API route)
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    const cookie = useCookie<CookieValue>(name, finalOpts as any)

    // there's a bug in nuxt where a default value doesn't get set if useCookie is only invoked in CSR
    // TODO: https://github.com/nuxt/nuxt/issues/26701
    if (isUndefined(cookie.value) && opts?.default) {
      cookie.value = unref(opts.default())
    }

    return cookie
  })
