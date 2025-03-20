import { describe, expect, test } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import { vi } from 'vitest'
import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Item } from '../types/types.js'
import { Cache } from './interfaces.js'
import ServerDownloader from './server-downloader.js'

describe('downloader', () => {
  test('download batch of one', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = { baseId: 'id', base: { id: 'id' } }
    fetchMocker.mockResponseOnce('id\t' + JSON.stringify(i.base) + '\n')
    const results = new AsyncGeneratorQueue<Item>()
    const db = {
      async write(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as Cache
    const downloader = new ServerDownloader(
      db,
      results,
      'http://speckle.test',
      'streamId',
      'objectId',
      'token',
      {
        fetch: fetchMocker,
        maxDownloadSize: 5,
        maxDownloadBatchWait: 200
      }
    )
    downloader.initializePool(1)
    downloader.add('id')
    await downloader.finish()
    results.finish()
    const r = []
    for await (const x of results.consume()) {
      r.push(x)
    }

    expect(r.length).toBe(1)
    expect(JSON.stringify(r[0])).toBe(JSON.stringify(i))
  })

  test('download batch of two', async () => {
    const fetchMocker = createFetchMock(vi)
    const i1: Item = { baseId: 'id1', base: { id: 'id1' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id2' } }
    fetchMocker.mockResponseOnce(
      'id1\t' + JSON.stringify(i1.base) + '\nid2\t' + JSON.stringify(i2.base) + '\n'
    )
    const results = new AsyncGeneratorQueue<Item>()
    const db = {
      async write(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as Cache
    const downloader = new ServerDownloader(
      db,
      results,
      'http://speckle.test',
      'streamId',
      'objectId',
      'token',
      {
        fetch: fetchMocker,
        maxDownloadSize: 5,
        maxDownloadBatchWait: 200
      }
    )
    downloader.initializePool(2)
    downloader.add('id')
    await downloader.finish()
    results.finish()
    const r = []
    for await (const x of results.consume()) {
      r.push(x)
    }

    expect(r.length).toBe(2)
    expect(JSON.stringify(r[0])).toBe(JSON.stringify(i1))
    expect(JSON.stringify(r[1])).toBe(JSON.stringify(i2))
  })

  test('download single exists', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = { baseId: 'id', base: { id: 'id', __closure: { childIds: 1 } } }
    fetchMocker.mockResponseOnce(JSON.stringify(i.base))
    const results = new AsyncGeneratorQueue<Item>()
    const db = {
      async write(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as Cache
    const downloader = new ServerDownloader(
      db,
      results,
      'http://speckle.test',
      'streamId',
      i.baseId,
      'token',
      {
        fetch: fetchMocker,
        maxDownloadSize: 5,
        maxDownloadBatchWait: 200
      }
    )
    const x = await downloader.downloadSingle()
    expect(JSON.stringify(x)).toBe(JSON.stringify(i))
  })
})
