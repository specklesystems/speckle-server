import { describe, it, expect, beforeEach } from 'vitest'
import KeyedQueue from './keyedQueue.js'

describe('KeyedQueue', () => {
  let queue: KeyedQueue<string, number>

  beforeEach(() => {
    queue = new KeyedQueue<string, number>()
  })

  describe('enqueue', () => {
    it('should add a key-value pair to the queue', () => {
      const result = queue.enqueue('key1', 1)

      expect(result).toBe(true)
      expect(queue.size).toBe(1)
      expect(queue.get('key1')).toBe(1)
    })

    it('should return false when trying to add a key that already exists', () => {
      queue.enqueue('key1', 1)
      const result = queue.enqueue('key1', 2)

      expect(result).toBe(false)
      expect(queue.size).toBe(1)
      expect(queue.get('key1')).toBe(1) // Value should not be updated
    })
  })

  describe('enqueueAll', () => {
    it('should add multiple key-value pairs to the queue', () => {
      const keys = ['key1', 'key2', 'key3']
      const values = [1, 2, 3]

      const count = queue.enqueueAll(keys, values)

      expect(count).toBe(3)
      expect(queue.size).toBe(3)
      expect(queue.get('key1')).toBe(1)
      expect(queue.get('key2')).toBe(2)
      expect(queue.get('key3')).toBe(3)
    })

    it('should skip keys that already exist and return the count of added items', () => {
      queue.enqueue('key1', 1)

      const keys = ['key1', 'key2', 'key3']
      const values = [10, 2, 3]

      const count = queue.enqueueAll(keys, values)

      expect(count).toBe(2)
      expect(queue.size).toBe(3)
      expect(queue.get('key1')).toBe(1) // Original value preserved
      expect(queue.get('key2')).toBe(2)
      expect(queue.get('key3')).toBe(3)
    })
  })

  describe('get', () => {
    it('should return the value for a given key', () => {
      queue.enqueue('key1', 1)

      expect(queue.get('key1')).toBe(1)
    })

    it('should return undefined for a non-existent key', () => {
      expect(queue.get('nonexistent')).toBeUndefined()
    })
  })

  describe('has', () => {
    it('should return true if the key exists', () => {
      queue.enqueue('key1', 1)

      expect(queue.has('key1')).toBe(true)
    })

    it('should return false if the key does not exist', () => {
      expect(queue.has('nonexistent')).toBe(false)
    })
  })

  describe('size', () => {
    it('should return the number of items in the queue', () => {
      expect(queue.size).toBe(0)

      queue.enqueue('key1', 1)
      expect(queue.size).toBe(1)

      queue.enqueue('key2', 2)
      expect(queue.size).toBe(2)
    })
  })

  describe('spliceValues', () => {
    it('should remove and return values from the queue', () => {
      queue.enqueue('key1', 1)
      queue.enqueue('key2', 2)
      queue.enqueue('key3', 3)
      queue.enqueue('key4', 4)

      const result = queue.spliceValues(1, 2)

      expect(result).toEqual([2, 3])
      expect(queue.size).toBe(2)
      expect(queue.has('key1')).toBe(true)
      expect(queue.has('key2')).toBe(false)
      expect(queue.has('key3')).toBe(false)
      expect(queue.has('key4')).toBe(true)
    })

    it('should handle splicing at the beginning of the queue', () => {
      queue.enqueue('key1', 1)
      queue.enqueue('key2', 2)

      const result = queue.spliceValues(0, 1)

      expect(result).toEqual([1])
      expect(queue.size).toBe(1)
      expect(queue.has('key1')).toBe(false)
      expect(queue.has('key2')).toBe(true)
    })

    it('should handle splicing at the end of the queue', () => {
      queue.enqueue('key1', 1)
      queue.enqueue('key2', 2)

      const result = queue.spliceValues(1, 1)

      expect(result).toEqual([2])
      expect(queue.size).toBe(1)
      expect(queue.has('key1')).toBe(true)
      expect(queue.has('key2')).toBe(false)
    })

    it('should return an empty array when deleting zero elements', () => {
      queue.enqueue('key1', 1)

      const result = queue.spliceValues(0, 0)

      expect(result).toEqual([])
      expect(queue.size).toBe(1)
    })
  })
})
