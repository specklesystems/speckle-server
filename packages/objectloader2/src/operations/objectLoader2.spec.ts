import { describe, expect, test } from 'vitest'
import ObjectLoader2 from './objectLoader2.js'
import { Base, Item } from '../types/types.js'
import { Cache, Downloader } from './interfaces.js'
import Queue from '../helpers/queue.js'
import { MemoryDatabase } from './memoryDatabase.js'
import { MemoryDownloader } from './memoryDownloader.js'
import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'

describe('objectloader2', () => {
  test('can get a root object from cache', async () => {
    const root = { baseId: 'baseId' } as unknown as Item
    const cache = {
      getItem(params: { id: string }): Promise<Item> {
        expect(params.id).toBe(root.baseId)
        return Promise.resolve(root)
      }
    } as Cache
    const downloader = {} as Downloader
    const loader = new ObjectLoader2({
      serverUrl: 'a',
      streamId: 'b',
      objectId: root.baseId,
      cache,
      downloader
    })
    const x = await loader.getRootObject()
    expect(x).toMatchSnapshot()
  })

  test('can get a root object from downloader', async () => {
    const root = { baseId: 'baseId' } as unknown as Item
    const cache = {
      getItem(params: { id: string }): Promise<Item | undefined> {
        expect(params.id).toBe(root.baseId)
        return Promise.resolve<Item | undefined>(undefined)
      },
      add(item: Item): Promise<void> {
        expect(item).toBe(root)
        return Promise.resolve()
      }
    } as Cache
    const downloader = {
      downloadSingle(): Promise<Item> {
        return Promise.resolve(root)
      }
    } as Downloader
    const loader = new ObjectLoader2({
      serverUrl: 'a',
      streamId: 'b',
      objectId: root.baseId,
      cache,
      downloader
    })
    const x = await loader.getRootObject()
    expect(x).toMatchSnapshot()
  })

  test('can get single object from cache using iterator', async () => {
    const rootId = 'baseId'
    const rootBase: Base = { id: 'baseId', speckle_type: 'type' }
    const root = { baseId: rootId, base: rootBase } as unknown as Item
    const cache = {
      getItem(params: { id: string }): Promise<Item | undefined> {
        expect(params.id).toBe(rootId)
        return Promise.resolve(root)
      }
    } as Cache
    const downloader = {} as Downloader
    const loader = new ObjectLoader2({
      serverUrl: 'a',
      streamId: 'b',
      objectId: rootId,
      cache,
      downloader
    })
    const r = []
    for await (const x of loader.getObjectIterator()) {
      r.push(x)
    }

    expect(r).toMatchSnapshot()
  })

  test('can get root/child object from cache using iterator', async () => {
    const child1Base = { id: 'child1Id' }
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

    const cache = {
      getItem(params: { id: string }): Promise<Item | undefined> {
        expect(params.id).toBe(root.baseId)
        return Promise.resolve(root)
      },
      processItems(params: {
        ids: string[]
        foundItems: Queue<Item>

        notFoundItems: Queue<string>
      }): Promise<void> {
        expect(params.ids.length).toBe(1)
        expect(params.ids[0]).toBe(child1.baseId)
        params.foundItems.add(child1)
        return Promise.resolve()
      },
      disposeAsync(): Promise<void> {
        return Promise.resolve()
      }
    } as Cache
    const downloader = {
      initializePool(params: { total: number }): void {
        expect(params.total).toBe(1)
      },
      disposeAsync(): Promise<void> {
        return Promise.resolve()
      }
    } as Downloader
    const loader = new ObjectLoader2({
      serverUrl: 'a',
      streamId: 'b',
      objectId: root.baseId,
      cache,
      downloader
    })
    const r = []
    for await (const x of loader.getObjectIterator()) {
      r.push(x)
    }
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
    } as unknown as Item

    const records: Record<string, Base> = {}
    records[root.baseId] = rootBase
    records[child1.baseId] = child1Base

    const loader = new ObjectLoader2({
      serverUrl: 'a',
      streamId: 'b',
      objectId: root.baseId,
      cache: new MemoryDatabase({ items: records }),
      downloader: new MemoryDownloader(rootId, records)
    })
    const r = []
    const obj = loader.getObject({ id: child1.baseId })
    for await (const x of loader.getObjectIterator()) {
      r.push(x)
    }

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

    const records: Record<string, Base> = {}
    records[root.baseId] = rootBase
    records[child1.baseId] = child1Base

    const results: AsyncGeneratorQueue<Item> = new AsyncGeneratorQueue<Item>()
    const loader = new ObjectLoader2({
      serverUrl: 'a',
      streamId: 'b',
      objectId: root.baseId,
      results,
      cache: new MemoryDatabase(),
      downloader: new MemoryDownloader(rootId, records, results)
    })
    const r = []
    const obj = loader.getObject({ id: child1.baseId })
    for await (const x of loader.getObjectIterator()) {
      r.push(x)
    }

    expect(obj).toBeDefined()
    expect(r).toMatchSnapshot()
    const obj2 = await obj
    expect(obj2).toBe(child1Base)
    expect(obj2).toMatchSnapshot()
  })

  test('add extra header', async () => {
    const root = { baseId: 'baseId' } as unknown as Item
    const cache = {
      getItem(params: { id: string }): Promise<Item> {
        expect(params.id).toBe(root.baseId)
        return Promise.resolve(root)
      }
    } as Cache
    const downloader = {} as Downloader
    const headers = new Headers()
    headers.set('x-test', 'asdf')
    const loader = new ObjectLoader2({
      serverUrl: 'a',
      streamId: 'b',
      objectId: root.baseId,
      headers,
      cache,
      downloader
    })
    const x = await loader.getRootObject()
    expect(x).toBe(root)
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
    expect(r).toMatchSnapshot()
  })
})
