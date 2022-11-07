import { Optional } from '@speckle/shared'
import { CookieKeys } from '~~/lib/common/helpers/constants'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'

/**
 * Use this to read & write auth token
 */
export const useAuth = () =>
  useSynchronizedCookie<Optional<string>>(CookieKeys.AuthToken)
