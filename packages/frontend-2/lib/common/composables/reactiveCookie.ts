import { CookieOptions } from '#app'
import { useScopedState } from '~/lib/common/composables/scopedState'

/**
 * Makes useCookie() synchronized across the app so that a change to it from one place
 * will also update other references elsewhere
 */
export const useSynchronizedCookie = <CookieValue = string>(
  name: string,
  opts?: CookieOptions<CookieValue>
) =>
  useScopedState(`synchronizedCookiesState-${name}`, () =>
    useCookie<CookieValue>(name, opts)
  )
