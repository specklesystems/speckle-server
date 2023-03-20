import { Optional } from '@speckle/shared'
import { reduce } from 'lodash-es'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { CookieKeys } from '~~/lib/common/helpers/constants'

const usePostAuthRedirectCookie = () =>
  useSynchronizedCookie<Optional<string>>(CookieKeys.PostAuthRedirect, {
    maxAge: 60 * 5 // 5 mins
  })

export const usePostAuthRedirect = () => {
  const cookie = usePostAuthRedirectCookie()
  const router = useRouter()

  const deleteState = () => (cookie.value = undefined)
  const set = (pathWithQuery: string, force?: boolean) => {
    const currVal = cookie.value
    if (currVal && !force) return
    cookie.value = pathWithQuery
  }
  const popAndFollowRedirect = () => {
    const pathWithQuery = cookie.value
    if (!pathWithQuery) return

    const url = new URL(pathWithQuery, 'http://notimportant.com')
    router.replace({
      path: url.pathname,
      query: reduce(
        [...url.searchParams.entries()],
        (result, entry) => {
          result[entry[0]] = entry[1]
          return result
        },
        {} as Record<string, string>
      )
    })
    deleteState()
  }

  return {
    set,
    deleteState,
    popAndFollowRedirect
  }
}
