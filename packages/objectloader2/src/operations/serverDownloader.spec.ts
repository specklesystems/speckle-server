import { describe, expect, test } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import { vi } from 'vitest'
import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Item } from '../types/types.js'
import { Cache } from './interfaces.js'
import ServerDownloader from './serverDownloader.js'

describe('downloader', () => {
  test('download batch of one', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = { baseId: 'id', base: { id: 'id', speckle_type: 'type' } }
    fetchMocker.mockResponseOnce('id\t' + JSON.stringify(i.base) + '\n')
    const results = new AsyncGeneratorQueue()
    const db = {
      async add(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as Cache
    const downloader = new ServerDownloader({
      database: db,
      results,
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',

      fetch: fetchMocker
    })
    downloader.initializePool({ total: 1, maxDownloadBatchWait: 200 })
    downloader.add('id')
    await downloader.disposeAsync()
    results.dispose()
    const r = []
    for await (const x of results.consume()) {
      r.push(x)
    }

    expect(r).toMatchSnapshot()
  })

  test('download batch of two', async () => {
    const fetchMocker = createFetchMock(vi)
    const i1: Item = { baseId: 'id1', base: { id: 'id1', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id2', speckle_type: 'type' } }
    fetchMocker.mockResponseOnce(
      'id1\t' + JSON.stringify(i1.base) + '\nid2\t' + JSON.stringify(i2.base) + '\n'
    )
    const results = new AsyncGeneratorQueue()
    const db = {
      async add(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as Cache
    const downloader = new ServerDownloader({
      database: db,
      results,
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',

      fetch: fetchMocker
    })
    downloader.initializePool({ total: 2, maxDownloadBatchWait: 200 })
    downloader.add('id')
    await downloader.disposeAsync()
    results.dispose()
    const r = []
    for await (const x of results.consume()) {
      r.push(x)
    }

    expect(r).toMatchSnapshot()
  })

  test('download single exists', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = {
      baseId: 'id',
      base: { id: 'id', speckle_type: 'type', __closure: { childIds: 1 } }
    }
    fetchMocker.mockResponseOnce(JSON.stringify(i.base))
    const results = new AsyncGeneratorQueue()
    const db = {
      async add(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as Cache
    const downloader = new ServerDownloader({
      database: db,
      results,
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: i.baseId,
      token: 'token',

      fetch: fetchMocker
    })
    const x = await downloader.downloadSingle()
    expect(x).toMatchSnapshot()
  })

  test('add extra header', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = {
      baseId: 'id',
      base: { id: 'id', speckle_type: 'type', __closure: { childIds: 1 } }
    }
    fetchMocker.mockResponseIf(
      (req) => req.headers.get('x-test') === 'asdf',
      JSON.stringify(i.base)
    )
    const results = new AsyncGeneratorQueue()
    const db = {
      async add(): Promise<void> {
        return Promise.resolve()
      }
    } as unknown as Cache
    const headers = new Headers()
    headers.set('x-test', 'asdf')
    const downloader = new ServerDownloader({
      database: db,
      results,
      serverUrl: 'http://speckle.test',
      headers,
      streamId: 'streamId',
      objectId: i.baseId,
      token: 'token',

      fetch: fetchMocker
    })
    const x = await downloader.downloadSingle()
    expect(x).toMatchSnapshot()
  })
})
