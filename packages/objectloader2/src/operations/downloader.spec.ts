import { describe, expect, test } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import { vi } from 'vitest'
import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Item } from '../types/types.js'
import Downloader from './downloader.js'
import { ICache } from './interfaces.js'

describe('downloader', () => {
  test('download batch', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = { baseId: 'id', base: { id: 'id' } }
    fetchMocker.mockResponseOnce('id\t' + JSON.stringify(i.base) + '\n')
    const results = new AsyncGeneratorQueue<Item>()
    const db = {
      async write(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as ICache
    const downloader = new Downloader(
      db,
      results,
      'http://speckle.test',
      'streamId',
      'objectId',
      'token',
      {
        fetch: fetchMocker,
        batchMaxSize: 5,
        batchMaxWait: 200
      }
    )
    downloader.add('id')
    await downloader.finish()
    results.finish()
    const r = []
    for await (const x of results.consume()) {
      r.push(x)
    }

    expect(r.length).toBe(1)
  })

  test('download single', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = { baseId: 'id', base: { id: 'id', __closure: { childIds: 1 } } }
    fetchMocker.mockResponseOnce(JSON.stringify(i.base))
    const results = new AsyncGeneratorQueue<Item>()
    const db = {
      async write(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as ICache
    const downloader = new Downloader(
      db,
      results,
      'http://speckle.test',
      'streamId',
      i.baseId,
      'token',
      {
        fetch: fetchMocker,
        batchMaxSize: 5,
        batchMaxWait: 200
      }
    )
    const x = await downloader.downloadSingle()
    expect(JSON.stringify(x)).toBe(JSON.stringify(i))

    await downloader.finish()
    results.finish()
    const r = []
    for await (const x of results.consume()) {
      r.push(x)
    }

    expect(r.length).toBe(0)
  })
})
