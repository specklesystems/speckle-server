/* eslint-disable @typescript-eslint/no-var-requires */
import { MaybeAsync } from '@/modules/shared/helpers/typeHelper'
import { isArray, isFunction } from 'lodash'
import mock from 'mock-require'

export type MockedFunctionImplementation = (...args: unknown[]) => MaybeAsync<unknown>

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
export function mockRequireModule<MockType extends object = Record<string, unknown>>(
  modulePaths: string | string[],
  dependencyPaths: string | string[] = [],
  params: { preventDestroy?: boolean } = {}
) {
  const { preventDestroy } = params
  modulePaths = isArray(modulePaths) ? modulePaths : [modulePaths]
  dependencyPaths = isArray(dependencyPaths) ? dependencyPaths : [dependencyPaths]

  let isDisabled = false
  let functionReplacements: Partial<Record<keyof MockType, MockType[keyof MockType]>> =
    {}

  const originalModule = require(modulePaths[0]) as MockType
  const mockDefinition = new Proxy<MockType>(originalModule, {
    get(target, prop) {
      const realProp = prop as keyof MockType
      const propVal = target[realProp]

      if (!isFunction(propVal)) return propVal
      return function (this: unknown, ...args: unknown[]) {
        const potentialReplacement = functionReplacements[realProp]
        if (
          isDisabled ||
          !functionReplacements[realProp] ||
          !isFunction(potentialReplacement)
        ) {
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
    mockFunction(
      functionName: keyof MockType,
      implementation: MockType[keyof MockType]
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
    resetMockedFunction(functionName: keyof MockType) {
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
     * Short-cut to mock a function temporarily
     *
     * Set 'times' parameter to control how many times will the function be invoked
     * with the mocked implementation
     */
    hijackFunction(
      functionName: keyof MockType,
      implementation: MockType[keyof MockType],
      params: { times: number } = { times: 1 }
    ) {
      let { times } = params
      if (!isFunction(implementation))
        throw new Error('Implementation must be a function')

      core.enable()
      core.mockFunction(functionName, function (this: MockType, ...args: unknown[]) {
        const returnVal = implementation.apply(this, args)
        times--

        if (times <= 0) {
          core.resetMockedFunction(functionName)
        }

        return returnVal
      } as unknown as MockType[keyof MockType])
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
