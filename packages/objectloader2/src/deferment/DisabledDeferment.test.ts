import { describe, it, expect, beforeEach } from 'vitest'
import { DisabledDeferment } from './DisabledDeferment.js'

describe('DisabledDeferment', () => {
  let disabledDeferment: DisabledDeferment

  beforeEach(() => {
    disabledDeferment = new DisabledDeferment()
  })

  describe('constructor', () => {
    it('should create an instance', () => {
      const deferment = new DisabledDeferment()
      expect(deferment).toBeDefined()
      expect(deferment).toBeInstanceOf(DisabledDeferment)
    })

    it('should not require any parameters', () => {
      expect(() => new DisabledDeferment()).not.toThrow()
    })
  })

  describe('defer', () => {
    it('should always return rejected promise and false', async () => {
      const [promise, wasInCache] = disabledDeferment.defer({ id: 'test-id' })

      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow('Deferment is disabled: test-id')
    })

    it('should include the id in the error message', async () => {
      const testId = 'specific-test-id-12345'
      const [promise] = disabledDeferment.defer({ id: testId })

      await expect(promise).rejects.toThrow(`Deferment is disabled: ${testId}`)
    })

    it('should handle empty string id', async () => {
      const [promise, wasInCache] = disabledDeferment.defer({ id: '' })

      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow('Deferment is disabled: ')
    })

    it('should handle special characters in id', async () => {
      const specialId = 'test@#$%^&*()_+-={}[]|\\:";\'<>?,./'
      const [promise, wasInCache] = disabledDeferment.defer({ id: specialId })

      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow(`Deferment is disabled: ${specialId}`)
    })

    it('should handle unicode characters in id', async () => {
      const unicodeId = 'test-🚀-中文-émojis'
      const [promise, wasInCache] = disabledDeferment.defer({ id: unicodeId })

      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow(`Deferment is disabled: ${unicodeId}`)
    })

    it('should handle very long ids', async () => {
      const longId = 'a'.repeat(1000)
      const [promise, wasInCache] = disabledDeferment.defer({ id: longId })

      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow(`Deferment is disabled: ${longId}`)
    })

    it('should return new promise instances on each call', async () => {
      const [promise1] = disabledDeferment.defer({ id: 'test-id' })
      const [promise2] = disabledDeferment.defer({ id: 'test-id' })

      expect(promise1).not.toBe(promise2)

      // Both should reject with the same message
      await expect(promise1).rejects.toThrow('Deferment is disabled: test-id')
      await expect(promise2).rejects.toThrow('Deferment is disabled: test-id')
    })

    it('should consistently return false for wasInCache regardless of id', () => {
      const testIds = ['id1', 'id2', '', 'very-long-id-with-many-characters']

      testIds.forEach((id) => {
        const [, wasInCache] = disabledDeferment.defer({ id })
        expect(wasInCache).toBe(false)
      })
    })

    it('should return Error instances in rejected promises', async () => {
      const [promise] = disabledDeferment.defer({ id: 'test-id' })

      try {
        await promise
        // Should not reach this point
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Deferment is disabled: test-id')
      }
    })
  })

  describe('undefer', () => {
    it('should be a no-op function', () => {
      // Since undefer is documented as a no-op, we just verify it can be called
      // without throwing
      expect(() => disabledDeferment.undefer()).not.toThrow()
    })

    it('should be callable multiple times without effect', () => {
      expect(() => {
        disabledDeferment.undefer()
        disabledDeferment.undefer()
        disabledDeferment.undefer()
      }).not.toThrow()
    })

    it('should not affect defer behavior', async () => {
      // Call undefer
      disabledDeferment.undefer()

      // Verify defer still works as expected
      const [promise, wasInCache] = disabledDeferment.defer({ id: 'test-id' })
      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow('Deferment is disabled: test-id')
    })
  })

  describe('dispose', () => {
    it('should be a no-op function', () => {
      // Since dispose is documented as a no-op, we just verify it can be called
      // without throwing
      expect(() => disabledDeferment.dispose()).not.toThrow()
    })

    it('should be callable multiple times without effect', () => {
      expect(() => {
        disabledDeferment.dispose()
        disabledDeferment.dispose()
        disabledDeferment.dispose()
      }).not.toThrow()
    })

    it('should not affect defer behavior', async () => {
      // Call dispose
      disabledDeferment.dispose()

      // Verify defer still works as expected
      const [promise, wasInCache] = disabledDeferment.defer({ id: 'test-id' })
      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow('Deferment is disabled: test-id')
    })
  })

  describe('integration scenarios', () => {
    it('should maintain consistent behavior across multiple operations', async () => {
      const testIds = ['id1', 'id2', 'id3']
      const promises: Promise<unknown>[] = []

      // Call defer multiple times
      testIds.forEach((id) => {
        const [promise, wasInCache] = disabledDeferment.defer({ id })
        expect(wasInCache).toBe(false)
        promises.push(promise)
      })

      // Call no-op methods
      disabledDeferment.undefer()
      disabledDeferment.dispose()

      // Verify all promises reject as expected
      for (let i = 0; i < promises.length; i++) {
        await expect(promises[i]).rejects.toThrow(
          `Deferment is disabled: ${testIds[i]}`
        )
      }
    })

    it('should work correctly with concurrent defer calls', async () => {
      const concurrentPromises = Array.from({ length: 10 }, (_, i) => {
        const [promise, wasInCache] = disabledDeferment.defer({ id: `concurrent-${i}` })
        expect(wasInCache).toBe(false)
        return promise
      })

      // All should reject
      const results = await Promise.allSettled(concurrentPromises)

      results.forEach((result, index) => {
        expect(result.status).toBe('rejected')
        if (result.status === 'rejected') {
          expect((result.reason as Error).message).toBe(
            `Deferment is disabled: concurrent-${index}`
          )
        }
      })
    })

    it('should handle mixed operations sequence', async () => {
      // Start with some defer calls
      const [promise1, wasInCache1] = disabledDeferment.defer({ id: 'first' })
      expect(wasInCache1).toBe(false)

      // Call no-op methods
      disabledDeferment.undefer()

      const [promise2, wasInCache2] = disabledDeferment.defer({ id: 'second' })
      expect(wasInCache2).toBe(false)

      disabledDeferment.dispose()

      const [promise3, wasInCache3] = disabledDeferment.defer({ id: 'third' })
      expect(wasInCache3).toBe(false)

      // All should reject properly
      await expect(promise1).rejects.toThrow('Deferment is disabled: first')
      await expect(promise2).rejects.toThrow('Deferment is disabled: second')
      await expect(promise3).rejects.toThrow('Deferment is disabled: third')
    })
  })

  describe('edge cases', () => {
    it('should handle whitespace-only ids', async () => {
      const whitespaceIds = [' ', '  ', '\t', '\n', '\r', '\r\n']

      for (const id of whitespaceIds) {
        const [promise, wasInCache] = disabledDeferment.defer({ id })
        expect(wasInCache).toBe(false)
        await expect(promise).rejects.toThrow(`Deferment is disabled: ${id}`)
      }
    })

    it('should handle numeric-like string ids', async () => {
      const numericIds = ['123', '0', '-456', '3.14159', 'Infinity', 'NaN']

      for (const id of numericIds) {
        const [promise, wasInCache] = disabledDeferment.defer({ id })
        expect(wasInCache).toBe(false)
        await expect(promise).rejects.toThrow(`Deferment is disabled: ${id}`)
      }
    })

    it('should be stateless across multiple instances', async () => {
      const deferment1 = new DisabledDeferment()
      const deferment2 = new DisabledDeferment()

      const [promise1, wasInCache1] = deferment1.defer({ id: 'test' })
      const [promise2, wasInCache2] = deferment2.defer({ id: 'test' })

      expect(wasInCache1).toBe(false)
      expect(wasInCache2).toBe(false)

      await expect(promise1).rejects.toThrow('Deferment is disabled: test')
      await expect(promise2).rejects.toThrow('Deferment is disabled: test')

      // Operations on one instance shouldn't affect the other
      deferment1.dispose()
      const [promise3] = deferment2.defer({ id: 'test2' })
      await expect(promise3).rejects.toThrow('Deferment is disabled: test2')
    })
  })
})
