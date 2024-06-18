import { LocalStorageKeys } from '@/helpers/mainConstants'
import { Optional, SafeLocalStorage } from '@speckle/shared'

const expirationDateInSeconds = 60 * 5 // 5 min

type PostAuthRedirectState = {
  /**
   * Path with querystring
   */
  pathWithQuery: string
  date: number
}

export function setPostAuthRedirect(params: { pathWithQuery: string }) {
  const { pathWithQuery } = params
  const state: PostAuthRedirectState = {
    pathWithQuery,
    date: Date.now()
  }

  SafeLocalStorage.set(LocalStorageKeys.ShouldRedirectTo, JSON.stringify(state))
}

export function getPostAuthRedirect(): Optional<PostAuthRedirectState> {
  const stateString = SafeLocalStorage.get(LocalStorageKeys.ShouldRedirectTo)
  if (!stateString) return undefined

  let state: Optional<PostAuthRedirectState> = undefined
  try {
    state = JSON.parse(stateString) as PostAuthRedirectState
    if (!state?.pathWithQuery || !state.date) {
      throw new Error('Invalid state struct')
    }

    const currentTimestamp = Date.now()
    if (state.date < currentTimestamp - expirationDateInSeconds * 1000) {
      throw new Error('Expired state')
    }
  } catch (e) {
    // wipe
    deletePostAuthRedirect()
  }

  return state
}

export function deletePostAuthRedirect() {
  SafeLocalStorage.remove(LocalStorageKeys.ShouldRedirectTo)
}
