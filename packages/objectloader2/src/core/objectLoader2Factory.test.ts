/* eslint-disable camelcase */
import { describe, it, expect, beforeEach } from 'vitest'
import { ObjectLoader2Factory } from './objectLoader2Factory.js'
import { Base } from '../types/types.js'

describe('ObjectLoader2Factory', () => {
  let testObjects: Base[]

  beforeEach(() => {
    testObjects = [
      {
        id: 'root-id',
        speckle_type: 'Base',
        __closure: {
          'child-1': 1,
          'child-2': 2
        }
      },
      {
        id: 'child-1',
        speckle_type: 'Base'
      },
      {
        id: 'child-2',
        speckle_type: 'Base'
      }
    ]
  })

  describe('createFromObjects', () => {
    it('should create ObjectLoader2 from array of objects', async () => {
      const loader = ObjectLoader2Factory.createFromObjects(testObjects)

      expect(loader).toBeDefined()

      // Test that we can get the root object
      const rootObject = await loader.getRootObject()
      expect(rootObject?.baseId).toBe('root-id')
      expect(rootObject?.base?.speckle_type).toBe('Base')

      await loader.disposeAsync()
    })

    it('should use first object as root', async () => {
      const loader = ObjectLoader2Factory.createFromObjects(testObjects)

      const rootObject = await loader.getRootObject()
      expect(rootObject?.baseId).toBe('root-id')
      expect(rootObject?.base?.__closure).toEqual({
        'child-1': 1,
        'child-2': 2
      })

      await loader.disposeAsync()
    })

    it('should allow iteration over all objects', async () => {
      const loader = ObjectLoader2Factory.createFromObjects(testObjects)

      const objects: Base[] = []
      for await (const obj of loader.getObjectIterator()) {
        objects.push(obj)
      }

      expect(objects).toHaveLength(3)
      expect(objects[0].id).toBe('root-id')

      await loader.disposeAsync()
    })

    it('should get total object count correctly', async () => {
      const loader = ObjectLoader2Factory.createFromObjects(testObjects)

      const totalCount = await loader.getTotalObjectCount()
      expect(totalCount).toBe(3) // root + 2 children

      await loader.disposeAsync()
    })

    it('should handle empty objects array', () => {
      expect(() => {
        ObjectLoader2Factory.createFromObjects([])
      }).toThrow()
    })

    it('should get individual objects by id', async () => {
      const loader = ObjectLoader2Factory.createFromObjects(testObjects)

      const rootObj = await loader.getObject({ id: 'root-id' })
      expect(rootObj.id).toBe('root-id')
      expect(rootObj.speckle_type).toBe('Base')

      const child1 = await loader.getObject({ id: 'child-1' })
      expect(child1.id).toBe('child-1')

      const child2 = await loader.getObject({ id: 'child-2' })
      expect(child2.id).toBe('child-2')

      await loader.disposeAsync()
    })

    it('should get individual objects by id that does not exist', async () => {
      const loader = ObjectLoader2Factory.createFromObjects(testObjects)

      const rootObj = await loader.getObject({ id: 'root-id' })
      expect(rootObj.id).toBe('root-id')
      expect(rootObj.speckle_type).toBe('Base')

      const getObjectPromise = loader.getObject({ id: 'child-11111' })
      await expect(getObjectPromise).rejects.toThrow()

      await loader.disposeAsync()
    })
  })

  describe('createFromJSON', () => {
    it('should create ObjectLoader2 from JSON string', async () => {
      const json = JSON.stringify(testObjects)
      const loader = ObjectLoader2Factory.createFromJSON(json)

      expect(loader).toBeDefined()

      const rootObject = await loader.getRootObject()
      expect(rootObject?.baseId).toBe('root-id')

      await loader.disposeAsync()
    })

    it('should handle invalid JSON', () => {
      expect(() => {
        ObjectLoader2Factory.createFromJSON('invalid json')
      }).toThrow()
    })
  })
})
