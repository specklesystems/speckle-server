import { describe, test, expect } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import ObjectLoader2 from '../operations/objectLoader2.js'
import { Base } from '../types/types.js'

describe('e2e', () => {
  test('download small model', async () => {
    // Revit sample house (good for bim-like stuff with many display meshes)
    //const resource = 'https://app.speckle.systems/streams/da9e320dad/commits/5388ef24b8'
    const loader = new ObjectLoader2({
      serverUrl: 'https://app.speckle.systems',
      streamId: 'da9e320dad',
      objectId: '31d10c0cea569a1e26809658ed27e281',
      indexedDB: new IDBFactory(),
      keyRange: IDBKeyRange
    })

    const bases: Base[] = []
    for await (const obj of loader.getBases()) {
      bases.push(obj)
    }
    expect(bases.length).toBe(1328)
  })
})
