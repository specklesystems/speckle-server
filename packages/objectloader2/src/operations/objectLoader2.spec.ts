import { describe, expect, test } from 'vitest'
import ObjectLoader2 from './objectLoader2.js'
import { Base, Item } from '../types/types.js'
import { Cache, Downloader } from './interfaces.js'
import Queue from '../helpers/queue.js'

describe('objectloader2', () => {
  test('can get a root object from cache', async () => {
    const root = { baseId: 'baseId' } as unknown as Item
    const cache = {
      getItem(id: string): Promise<Item> {
        expect(id).toBe(root.baseId)
        return Promise.resolve(root)
      }
    } as Cache
    const downloader = {} as Downloader
    const loader = new ObjectLoader2('a', 'b', root.baseId, undefined, {
      cache,
      downloader
    })
    const x = await loader.getRootItem()
    expect(x).toBe(root)
  })

  test('can get a root object from downloader', async () => {
    const root = { baseId: 'baseId' } as unknown as Item
    const cache = {
      getItem(id: string): Promise<Item | undefined> {
        expect(id).toBe(root.baseId)
        return Promise.resolve<Item | undefined>(undefined)
      },
      write(i: Item): Promise<void> {
        expect(i).toBe(root)
        return Promise.resolve()
      }
    } as Cache
    const downloader = {
      downloadSingle(): Promise<Item> {
        return Promise.resolve(root)
      }
    } as Downloader
    const loader = new ObjectLoader2('a', 'b', root.baseId, undefined, {
      cache,
      downloader
    })
    const x = await loader.getRootItem()
    expect(x).toBe(root)
  })

  test('can get single object from cache using iterator', async () => {
    const rootId = 'baseId'
    const rootBase: Base = { id: 'baseId' }
    const root = { baseId: rootId, base: rootBase } as unknown as Item
    const cache = {
      getItem(id: string): Promise<Item | undefined> {
        expect(id).toBe(rootId)
        return Promise.resolve(root)
      }
    } as Cache
    const downloader = {} as Downloader
    const loader = new ObjectLoader2('a', 'b', rootId, undefined, {
      cache,
      downloader
    })
    const r = []
    for await (const x of loader.getBases()) {
      r.push(x)
    }

    expect(r.length).toBe(1)
    expect(r[0]).toBe(rootBase)
  })

  test('can get root/child object from cache using iterator', async () => {
    const child1Base =  { id: 'child1Id' } 
    const child1 = { baseId: 'child1Id', base: child1Base } as unknown as Item

    
    const rootId = 'rootId'
    const rootBase: Base = { id: 'rootId', __closure: { child1Id: 100 } }
    const root = {
      baseId: rootId,
      base: rootBase
    } as unknown as Item

    const cache = {
      getItem(id: string): Promise<Item | undefined> {
        expect(id).toBe(root.baseId)
        return Promise.resolve(root)
      },
      processItems(
        ids: string[],
        found: Queue<Item>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _notFound: Queue<string>
      ): Promise<void> {
        expect(ids.length).toBe(1)
        expect(ids[0]).toBe(child1.baseId)
        found.add(child1)
        return Promise.resolve()
      },
      finish(): Promise<void> {
        return Promise.resolve()
      }
    } as Cache
    const downloader = {
      finish(): Promise<void> {
        return Promise.resolve()
      }
    } as Downloader
    const loader = new ObjectLoader2('a', 'b', root.baseId, undefined, {
      cache,
      downloader
    })
    const r = []
    for await (const x of loader.getBases()) {
      r.push(x)
    }

    expect(r.length).toBe(2)
    expect(r[0]).toBe(rootBase)
    expect(r[1]).toBe(child1Base)
  })
})
