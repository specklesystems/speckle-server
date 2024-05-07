import type { Nullable } from '@speckle/shared'
import { get, isObjectLike } from 'lodash-es'

export const abortControllerManager = () => {
  let abortController: Nullable<AbortController> = null

  const pop = () => {
    // Abort old
    if (abortController) abortController.abort()
    abortController = null

    // Create new
    abortController = new AbortController()
    return abortController
  }

  return {
    pop,
    popOnlyInCSR: () => {
      if (process.server) return null
      return pop()
    },
    popOnlyInSSR: () => {
      if (process.client) return null
      return pop()
    }
  }
}

export const isAbortError = (error: unknown): error is DOMException =>
  isObjectLike(error) && get(error, 'name') === 'AbortError'
