const { isString } = require('lodash')

/**
 * Factories have to be wrapped with this, cause we have to be able to tell which are factories
 * during runtime
 */
const factory = (fac) => {
  fac.isFactory = true
  return fac
}

const add = (a, b) => a + b
const subtract = (a, b) => a - b
const addThenSubtract = factory((deps) => {
  return (a, b, c) => deps.subtract(deps.add(a, b), c)
})
const addThenSubtractXTimes = factory((deps) => {
  return (a, b, c, times) => {
    let result = a
    for (let i = 0; i < times; i++) {
      result = deps.addThenSubtract(result, b, c)
    }
    return result
  }
})

const container = (depConfig) => {
  const innerContainer = {}
  const containerProxy = new Proxy(innerContainer, {
    get(target, prop) {
      if (prop in target) {
        return target[prop]
      } else {
        throw new Error(`Dependency not found: ${prop}`)
      }
    }
  })

  const depConfigEntries = Object.entries(depConfig)
  for (const [key, val] of depConfigEntries) {
    if (!val.isFactory) {
      innerContainer[key] = val
    }
  }

  for (const [key, val] of depConfigEntries) {
    if (val.isFactory) {
      innerContainer[key] = val(containerProxy)
    }
  }

  const inject = (factory) => {
    if (isString(factory)) {
      return innerContainer[factory]
    }

    if (!factory.isFactory) {
      return factory
    }

    return factory(containerProxy)
  }

  return {
    inject
  }
}

const c = container({
  add,
  subtract,
  addThenSubtract,
  addThenSubtractXTimes
})

const test1 = c.inject(addThenSubtractXTimes)
const test2 = c.inject('addThenSubtractXTimes')
console.log(test1(10, 3, 2, 3)) // 13
console.log(test2(10, 3, 2, 3)) // 13

/**
 * TypeScript support issues:
 * It's impossible to type-check the container and slow erorrs if the container doesn't have the required dependencies for the thing that you're trying to inject.
 * A missing dependency can only be a run-time error, but usually you would notice those during development
 * Invalid dependency types in the container (e.g. {add: noop}, instead of putting in the real function) wouldn't even be a (clear) run-time error, cause there's no way to validate that during runtime,
 * the engine would just try to execute the wrong dep and fail with potentially weird errors
 */
