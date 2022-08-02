const { isArray, isFunction } = require('lodash')
const mock = require('mock-require')

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
function mockRequireModule(modulePaths, dependencyPaths = []) {
  modulePaths = isArray(modulePaths) ? modulePaths : [modulePaths]
  dependencyPaths = isArray(dependencyPaths) ? dependencyPaths : [dependencyPaths]

  let disabled = false
  let functionReplacements = {}

  const originalModule = require(modulePaths[0])
  const mockDefinition = new Proxy(originalModule, {
    get(target, prop) {
      if (!isFunction(target[prop])) return target[prop]
      return function (...args) {
        if (disabled || !functionReplacements[prop]) {
          return target[prop].apply(this, args)
        }

        return functionReplacements[prop].apply(this, args)
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

  return {
    /**
     * Set (or unset) a mocked implementation of a function
     * @param {string} functionName
     * @param {Function | null | undefined} implementation
     */
    mockFunction(functionName, implementation) {
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
     * Temporarily disable the mock, sending all function calls to the real implementations
     */
    disable() {
      disabled = true
    },
    /**
     * Re-enable the mock, if it's been disabled before
     */
    enable() {
      disabled = false
    },
    /**
     * Unmock entirely
     * Note: All requires done before this point will still point to the mocks
     */
    destroy(reRequireDeps = true) {
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
}

module.exports = {
  mockRequireModule
}
