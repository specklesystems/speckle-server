/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybeAsync, ensureError } from '@speckle/shared'
import { AssertionError } from 'chai'
import { it } from 'mocha'

export const expectToThrow = async (fn: () => MaybeAsync<any>) => {
  try {
    await fn()
  } catch (err) {
    return ensureError(err)
  }

  throw new AssertionError("Function was expected to throw, but didn't")
}

/**
 * Create parameterizable test cases for each element in an array
 */
export const itEach = <T>(
  testCases: Array<T> | ReadonlyArray<T>,
  name: (test: T) => string,
  testHandler: (test: T) => MaybeAsync<void>
) => {
  testCases.forEach((testCase) => {
    it(name(testCase), testHandler.bind(null, testCase))
  })
}
