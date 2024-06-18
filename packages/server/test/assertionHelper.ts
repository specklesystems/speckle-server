/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybeAsync, ensureError } from '@speckle/shared'
import { AssertionError } from 'chai'

export const expectToThrow = async (fn: () => MaybeAsync<any>) => {
  try {
    await fn()
  } catch (err) {
    return ensureError(err)
  }

  throw new AssertionError("Function was expected to throw, but didn't")
}
