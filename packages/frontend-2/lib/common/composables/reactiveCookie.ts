import type { CookieOptions } from '#app'
import dayjs from 'dayjs'
import { useScopedState } from '~~/lib/common/composables/scopedState'

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
  useScopedState(`synchronizedCookiesState-${name}`, () =>
    useCookie<CookieValue>(name, {
      expires: dayjs().add(1, 'year').toDate(),
      ...(opts || {})
    })
  )
