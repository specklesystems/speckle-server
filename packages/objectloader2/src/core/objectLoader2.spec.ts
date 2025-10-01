import { describe, test, expect } from 'vitest'
import { Base, Item } from '../types/types.js'
import { ObjectLoader2 } from './objectLoader2.js'
import { IndexedDatabase } from './stages/indexedDatabase.js'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { MemoryDatabase } from './stages/memory/memoryDatabase.js'
import { MemoryDownloader } from './stages/memory/memoryDownloader.js'
import { DefermentManager } from '../deferment/defermentManager.js'

describe('objectloader2', () => {
  test('can get a root object from cache', async () => {
    const rootId = 'baseId'
    const rootBase: Base = { id: 'baseId', speckle_type: 'type' }
    const downloader = new MemoryDownloader(
      rootId,
      new Map<string, Base>([[rootId, rootBase]])
    )
    const loader = new ObjectLoader2({
      rootId,
      downloader,
      deferments: new DefermentManager(() => {}),
      database: new IndexedDatabase({
        indexedDB: new IDBFactory(),
        keyRange: IDBKeyRange
      })
    })
    const x = await loader.getRootObject()
    await loader.disposeAsync()
    expect(x).toMatchSnapshot()
  })

  test('can get a root object from downloader', async () => {
    const rootId = 'baseId'
    const rootBase: Base = { id: 'baseId', speckle_type: 'type' }
    const downloader = new MemoryDownloader(
      rootId,
      new Map<string, Base>([[rootId, rootBase]])
    )
    const loader = new ObjectLoader2({
      rootId,
      downloader,
      deferments: new DefermentManager(() => {}),
      database: new IndexedDatabase({
        indexedDB: new IDBFactory(),
        keyRange: IDBKeyRange
      })
    })
    const x = await loader.getRootObject()
    await loader.disposeAsync()
    expect(x).toMatchSnapshot()
  })

  test('can get single object from cache using iterator', async () => {
    const rootId = 'baseId'
    const rootBase: Base = { id: 'baseId', speckle_type: 'type' }

    const downloader = new MemoryDownloader(
      rootId,
      new Map<string, Base>([[rootId, rootBase]])
    )
    const loader = new ObjectLoader2({
      rootId,
      downloader,
      deferments: new DefermentManager(() => {}),
      database: new IndexedDatabase({
        indexedDB: new IDBFactory(),
        keyRange: IDBKeyRange
      })
    })
    const r = []
    for await (const x of loader.getObjectIterator()) {
      r.push(x)
      if (r.length >= 1) {
        break
      }
    }
    await loader.disposeAsync()

    expect(r).toMatchSnapshot()
  })

  test('can get root/child object from memory cache using iterator and getObject', async () => {
    const child1Base = { id: 'child1Id', speckle_type: 'type' } as Base
    const child1 = { baseId: 'child1Id', base: child1Base } as unknown as Item

    const rootId = 'rootId'
    const rootBase: Base = {
      id: 'rootId',
      speckle_type: 'type',
      __closure: { child1Id: 100 }
    }
    const root = {
      baseId: rootId,
      base: rootBase
    } as Item

    const records: Map<string, Base> = new Map<string, Base>()
    records.set(root.baseId, rootBase)
    records.set(child1.baseId, child1Base)

    const loader = new ObjectLoader2({
      rootId: root.baseId,
      downloader: new MemoryDownloader(rootId, records),
      database: new MemoryDatabase({ items: records }),
      deferments: new DefermentManager(() => {})
    })

    const r = []
    const obj = loader.getObject({ id: child1.baseId })
    for await (const x of loader.getObjectIterator()) {
      r.push(x)
      if (r.length >= 2) {
        break
      }
    }
    await loader.disposeAsync()

    expect(obj).toBeDefined()
    expect(r).toMatchSnapshot()
    const obj2 = await obj
    expect(obj2).toBe(child1Base)
    expect(obj2).toMatchSnapshot()
  })

  test('can get root/child object from memory downloader using iterator and getObject', async () => {
    const child1Base = { id: 'child1Id', speckle_type: 'type' } as Base
    const child1 = { baseId: 'child1Id', base: child1Base } as unknown as Item

    const rootId = 'rootId'
    const rootBase: Base = {
      id: 'rootId',
      speckle_type: 'type',
      __closure: { child1Id: 100 }
    }
    const root = {
      baseId: rootId,
      base: rootBase
    } as unknown as Item

    const records: Map<string, Base> = new Map<string, Base>()
    records.set(root.baseId, rootBase)
    records.set(child1.baseId, child1Base)

    const loader = new ObjectLoader2({
      rootId: root.baseId,
      downloader: new MemoryDownloader(rootId, records),
      database: new MemoryDatabase({ items: records }),
      deferments: new DefermentManager(() => {})
    })
    const r = []
    const obj = loader.getObject({ id: child1.baseId })
    for await (const x of loader.getObjectIterator()) {
      r.push(x)
      if (r.length >= 2) {
        break
      }
    }
    await loader.disposeAsync()

    expect(obj).toBeDefined()
    expect(r).toMatchSnapshot()
    const obj2 = await obj
    expect(obj2).toBe(child1Base)
    expect(obj2).toMatchSnapshot()
  })

  test('add extra header', async () => {
    const rootId = 'rootId'
    const rootBase: Base = {
      id: 'rootId',
      speckle_type: 'type',
      __closure: { child1Id: 100 }
    }
    const root = {
      baseId: rootId,
      base: rootBase
    } as Item

    const records: Map<string, Base> = new Map<string, Base>()
    records.set(root.baseId, rootBase)
    const headers = new Headers()
    headers.set('x-test', 'asdf')
    const loader = new ObjectLoader2({
      rootId: root.baseId,
      downloader: new MemoryDownloader(rootId, records),
      database: new IndexedDatabase({
        indexedDB: new IDBFactory(),
        keyRange: IDBKeyRange
      }),
      deferments: new DefermentManager(() => {})
    })
    const x = await loader.getRootObject()
    await loader.disposeAsync()
    expect(x).toMatchSnapshot()
  })

  test('createFromJSON test', async () => {
    const root = `{
  "list": [{
    "speckle_type": "reference",
    "referencedId": "0e61e61edee00404ec6e0f9f594bce24",
    "__closure": null
  }],
  "list2": [{
    "speckle_type": "reference",
    "referencedId": "f70738e3e3e593ac11099a6ed6b71154",
    "__closure": null
  }],
  "arr": null,
  "detachedProp": null,
  "detachedProp2": null,
  "attachedProp": null,
  "crazyProp": null,
  "applicationId": "1",
  "speckle_type": "Speckle.Core.Tests.Unit.Models.BaseTests+SampleObjectBase2",
  "dynamicProp": 123,
  "id": "efeadaca70a85ae6d3acfc93a8b380db",
  "__closure": {
    "0e61e61edee00404ec6e0f9f594bce24": 100,
    "f70738e3e3e593ac11099a6ed6b71154": 100
  }
}`

    const list1 = `{
  "data": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
  "applicationId": null,
  "speckle_type": "Speckle.Core.Models.DataChunk",
  "id": "0e61e61edee00404ec6e0f9f594bce24"
}`

    const list2 = `{
  "data": [1.0, 10.0],
  "applicationId": null,
  "speckle_type": "Speckle.Core.Models.DataChunk",
  "id": "f70738e3e3e593ac11099a6ed6b71154"
}`
    const rootObj = JSON.parse(root) as Base
    const list1Obj = JSON.parse(list1) as Base
    const list2Obj = JSON.parse(list2) as Base

    const loader = ObjectLoader2.createFromObjects([rootObj, list1Obj, list2Obj])
    const r = []
    for await (const x of loader.getObjectIterator()) {
      r.push(x)
    }
    await loader.disposeAsync()
    expect(r).toMatchSnapshot()
  })
})
