/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import { MaybeAsync } from '@/modules/shared/helpers/typeHelper'
import { isArray, isFunction } from 'lodash'
import mock from 'mock-require'
import { ConditionalPick } from 'type-fest'

export type MockedFunctionImplementation = (...args: any[]) => MaybeAsync<any>

/**
 * Mock a module's exported functions with the possibility to conditionally disable & change the mock
 * @param {string|string[]} modulePaths Absolute & relative paths to the module being mocked or if you sometimes require
 * with the '/index' suffix and sometimes don't you need to specify both options. Multiple options are required
 * because of a limitation of mock-require - it doesn't understand that all of these point to the same thing.
 * @param {string|string[]} dependencyPaths Paths to modules that use the mocked module and that you
 * want to re-require so that if they are already loaded in memory, they're re-required with the new mock. Basically,
 * if you've mocked a module, but it's not being used, debug the test and see if the mocked module is maybe required
 * by another module that you haven't specified in this list.
 */
export function mockRequireModule<
  MockType extends Record<string, any> = Record<string, any>
>(
  modulePaths: string | string[],
  dependencyPaths: string | string[] = [],
  params: { preventDestroy?: boolean } = {}
) {
  type MockTypeFunctionsOnly = ConditionalPick<MockType, MockedFunctionImplementation>
  type MockTypeFunctionProp = keyof MockTypeFunctionsOnly

  type MockedFunc<F extends MockTypeFunctionProp> = (
    ...args: Parameters<MockTypeFunctionsOnly[F]>
  ) => ReturnType<MockTypeFunctionsOnly[F]>

  const { preventDestroy } = params
  modulePaths = isArray(modulePaths) ? modulePaths : [modulePaths]
  dependencyPaths = isArray(dependencyPaths) ? dependencyPaths : [dependencyPaths]

  let isDisabled = false
  let functionReplacements: Partial<
    Record<MockTypeFunctionProp, MockedFunc<MockTypeFunctionProp>>
  > = {}

  const originalModule = require(modulePaths[0]) as MockType
  const mockDefinition = new Proxy<MockType>(originalModule, {
    get(target, prop) {
      const realProp = prop as keyof MockTypeFunctionsOnly
      const propVal = target[realProp]

      if (!isFunction(propVal)) return propVal
      return function (this: unknown, ...args: Parameters<typeof propVal>[]) {
        const potentialReplacement = functionReplacements[realProp] as typeof propVal
        if (isDisabled || !potentialReplacement || !isFunction(potentialReplacement)) {
          return propVal.apply(this, args)
        }

        return potentialReplacement.apply(this, args)
      }
    }
  })

  // Initialize mock with all paths (relative path, absolute alias path - both need to be specified
  // cause of a limitation in mock-require)
  for (const modulePath of modulePaths) {
    mock(modulePath, mockDefinition)
  }

  /**
   * Re-requires the specified modules, in case they were required before the mock was set up
   * and thus don't have the mocked module
   */
  const reRequireDependencies = () => {
    for (const dependencyPath of dependencyPaths) {
      mock.reRequire(dependencyPath)
    }
  }
  reRequireDependencies()

  const core = {
    /**
     * Set (or unset) a mocked implementation of a function
     */
    mockFunction<F extends MockTypeFunctionProp>(
      functionName: F,
      implementation: MockedFunc<F>
    ) {
      if (implementation) {
        functionReplacements[functionName] = implementation
      } else {
        delete functionReplacements[functionName]
      }
    },
    /**
     * Remove all mocked function implementations
     */
    resetMockedFunctions() {
      functionReplacements = {}
    },
    /**
     * Remove a single function mock
     */
    resetMockedFunction(functionName: MockTypeFunctionProp) {
      delete functionReplacements[functionName]
    },
    /**
     * Temporarily disable the mock, sending all function calls to the real implementations
     */
    disable() {
      isDisabled = true
    },
    /**
     * Re-enable the mock, if it's been disabled before
     */
    enable() {
      isDisabled = false
    },
    /**
     * Unmock entirely
     * Note: All requires done before this point will still point to the mocks
     */
    destroy(reRequireDeps = true) {
      if (preventDestroy) {
        isDisabled = true
        return
      }

      for (const modulePath of modulePaths) {
        mock.stop(modulePath)
      }

      if (reRequireDeps) reRequireDependencies()
    },
    /**
     * Re-require specified dependencies
     */
    reRequireDependencies
  }

  const helpers = {
    /**
     * Mock a function temporarily
     *
     * Set 'times' parameter to control how many times will the function be invoked
     * with the mocked implementation
     *
     * Use args & results arrays in result object to see the passed in arguments and function return values
     * that were collected
     */
    hijackFunction<F extends MockTypeFunctionProp>(
      functionName: F,
      implementation: MockedFunc<F>,
      params: { times: number } = { times: 1 }
    ) {
      let { times } = params
      if (!isFunction(implementation))
        throw new Error('Implementation must be a function')

      const collectedReturns: Array<ReturnType<MockedFunc<F>>> = []
      const collectedArgs: Array<Parameters<MockedFunc<F>>> = []

      core.enable()
      core.mockFunction(
        functionName,
        function (this: unknown, ...args: Parameters<MockedFunc<F>>) {
          const returnVal = implementation.apply(this, args)
          times--

          if (times <= 0) {
            core.resetMockedFunction(functionName)
          }

          collectedArgs.push(args)
          collectedReturns.push(returnVal)

          return returnVal
        }
      )

      return {
        /**
         * Arguments that were used to call the mocked function. Each entry in this array is an array of arguments, so use the first array dimension to choose
         * the invocation and the 2nd dimension to choose the specific argument.
         */
        args: collectedArgs,
        /**
         * Return values that were returned from the mocked function.
         */
        returns: collectedReturns,
        /**
         * Get the amount of invocations
         */
        length: () => collectedArgs.length
      }
    }
  }

  return {
    ...core,
    ...helpers
  }
}

export type MockApiType = ReturnType<typeof mockRequireModule>

/**
 * Create global mock. Essentially the same as mockRequireModule() but simplified
 * with safeguards so that you can't destroy it and break it in other tests
 *
 * Note: Global mocks should be registered in test/hooks.js before everything else!
 */
export function createGlobalMock<MockType extends object = Record<string, unknown>>(
  modulePath: string
) {
  const globalMock = mockRequireModule<MockType>([modulePath], [], {
    preventDestroy: true
  })
  const { hijackFunction, resetMockedFunctions } = globalMock

  return {
    hijackFunction,
    resetMockedFunctions
  }
}
