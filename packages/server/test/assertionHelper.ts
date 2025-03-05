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
  testHandler: (test: T) => MaybeAsync<void>,
  options?: Partial<{
    /**
     * Mark tests as skipped
     */
    skip: boolean
  }>
) => {
  testCases.forEach((testCase) => {
    const itFn = options?.skip ? it.skip : it
    itFn(name(testCase), testHandler.bind(null, testCase))
  })
}

/**
 * Create pararmeterizable describe blocks for each element in an array
 */
export const describeEach = <T>(
  describeCases: Array<T> | ReadonlyArray<T>,
  name: (describe: T) => string,
  describeHandler: (describe: T) => void,
  options?: Partial<{
    /**
     * Mark tests as skipped
     *
     */
    skip: boolean
  }>
) => {
  describeCases.forEach((testCase) => {
    const describeFn = options?.skip ? describe.skip : describe
    describeFn(name(testCase), describeHandler.bind(null, testCase))
  })
}
