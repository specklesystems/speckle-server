import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isBase,
  isReference,
  isScalar,
  take,
  getFeatureFlag,
  ObjectLoader2Flags
} from './functions.js'

describe('isBase', () => {
  it('should return true for valid Base objects', () => {
    expect(isBase({ id: '123', speckle_type: 'Base' })).toBe(true)
  })

  it('should return false for objects without an id', () => {
    expect(isBase({ speckle_type: 'Base' })).toBe(false)
  })

  it('should return false for objects with a non-string id', () => {
    expect(isBase({ id: 123, speckle_type: 'Base' })).toBe(false)
  })

  it('should return false for null or undefined', () => {
    expect(isBase(null)).toBe(false)
    expect(isBase(undefined)).toBe(false)
  })

  it('should return false for non-objects', () => {
    expect(isBase('a string')).toBe(false)
    expect(isBase(123)).toBe(false)
  })
})

describe('isReference', () => {
  it('should return true for valid Reference objects', () => {
    expect(isReference({ referencedId: '456' })).toBe(true)
  })

  it('should return false for objects without a referencedId', () => {
    expect(isReference({ id: '456' })).toBe(false)
  })

  it('should return false for objects with a non-string referencedId', () => {
    expect(isReference({ referencedId: 456 })).toBe(false)
  })

  it('should return false for null or undefined', () => {
    expect(isReference(null)).toBe(false)
    expect(isReference(undefined)).toBe(false)
  })

  it('should return false for non-objects', () => {
    expect(isReference('a string')).toBe(false)
    expect(isReference(123)).toBe(false)
  })
})

describe('isScalar', () => {
  it('should return true for scalar values', () => {
    expect(isScalar('hello')).toBe(true)
    expect(isScalar(123)).toBe(true)
    expect(isScalar(true)).toBe(true)
    expect(isScalar(BigInt(9007199254740991))).toBe(true)
    expect(isScalar(Symbol('id'))).toBe(true)
    expect(isScalar(undefined)).toBe(true)
    expect(isScalar(null)).toBe(true)
  })

  it('should return false for non-scalar values', () => {
    expect(isScalar({})).toBe(false)
    expect(isScalar([])).toBe(false)
    expect(isScalar(() => {})).toBe(false)
  })
})

describe('take', () => {
  it('should take the specified number of items from an iterator', () => {
    const arr = [1, 2, 3, 4, 5]
    const iterator = arr[Symbol.iterator]()
    expect(take(iterator, 3)).toEqual([1, 2, 3])
  })

  it('should take all items if count is larger than the number of items', () => {
    const arr = [1, 2]
    const iterator = arr[Symbol.iterator]()
    expect(take(iterator, 5)).toEqual([1, 2])
  })

  it('should take no items if count is 0', () => {
    const arr = [1, 2, 3]
    const iterator = arr[Symbol.iterator]()
    expect(take(iterator, 0)).toEqual([])
  })

  it('should work with an empty iterator', () => {
    const arr: number[] = []
    const iterator = arr[Symbol.iterator]()
    expect(take(iterator, 3)).toEqual([])
  })
})

describe('getFeatureFlag', () => {
  describe('in a non-browser environment', () => {
    it('should return the default value', () => {
      expect(getFeatureFlag(ObjectLoader2Flags.USE_CACHE)).toBe('true')
    })

    it('should return undefined when useDefault is false', () => {
      expect(getFeatureFlag(ObjectLoader2Flags.USE_CACHE, false)).toBe(undefined)
    })
  })

  describe('in a browser environment', () => {
    const mockWindow = {
      document: {},
      location: {
        search: ''
      }
    }

    beforeEach(() => {
      vi.stubGlobal('window', mockWindow)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should return the parameter value from the URL', () => {
      mockWindow.location.search = '?debug=value'
      expect(getFeatureFlag(ObjectLoader2Flags.DEBUG)).toBe('value')
    })

    it('should return the default value if the parameter is not in the URL', () => {
      mockWindow.location.search = '?otherparam=value'
      expect(getFeatureFlag(ObjectLoader2Flags.DEBUG)).toBe('false')
    })

    it('should return the default value if the URL has no query string', () => {
      mockWindow.location.search = ''
      expect(getFeatureFlag(ObjectLoader2Flags.DEBUG)).toBe('false')
    })

    it('should return undefined if useDefault is false and parameter is not in URL', () => {
      mockWindow.location.search = '?otherparam=value'
      expect(getFeatureFlag(ObjectLoader2Flags.DEBUG, false)).toBe(undefined)
    })

    it('should still return the parameter value from URL when useDefault is false', () => {
      mockWindow.location.search = '?debug=custom'
      expect(getFeatureFlag(ObjectLoader2Flags.DEBUG, false)).toBe('custom')
    })
  })
})
