import { describe, test, expect } from 'vitest'
import { TIME_MS } from '@speckle/shared'
import { ObjectLoader2Factory } from '../core/objectLoader2Factory.js'
import { Base } from '../types/types.js'
import * as crossFetch from 'cross-fetch'

describe('e2e (pure node)', () => {
  test.each(['native fetch', 'cross-fetch'])(
    'download small model w/o needing extra deps %s)',
    async (fetchType) => {
      let fetchImplementation: typeof fetch
      switch (fetchType) {
        case 'native fetch':
        default:
          fetchImplementation = fetch
          break
        case 'cross-fetch': {
          fetchImplementation = crossFetch.fetch
          break
        }
      }

      // Revit sample house (good for bim-like stuff with many display meshes)
      //const resource = 'https://app.speckle.systems/streams/da9e320dad/commits/5388ef24b8'
      const loader = ObjectLoader2Factory.createFromUrl({
        serverUrl: 'https://app.speckle.systems',
        streamId: 'da9e320dad',
        objectId: '31d10c0cea569a1e26809658ed27e281',
        options: {
          fetch: fetchImplementation
        }
      })

      const getObjectPromise = loader.getObject({
        id: '1708a78e057e8115f924c620ba686db6'
      })

      const bases: Base[] = []
      for await (const obj of loader.getObjectIterator()) {
        bases.push(obj)
      }

      expect(await loader.getTotalObjectCount()).toBe(1328)
      expect(bases.length).toBe(1328)
      const base = await getObjectPromise
      expect(base).toBeDefined()
      expect(base.id).toBe('1708a78e057e8115f924c620ba686db6')
      const base2 = await loader.getObject({ id: '3841e3cbc45d52c47bc2f1b7b0ad4eb9' })
      expect(base2).toBeDefined()
      expect(base2.id).toBe('3841e3cbc45d52c47bc2f1b7b0ad4eb9')
    },
    10 * TIME_MS.second
  )
})
