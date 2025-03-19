import { beforeEach, describe, expect, test } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import { vi } from 'vitest'
import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Item } from '../types/types.js'
import Downloader from './downloader.js'
import CacheDatabase from './database.js'

const fetchMocker = createFetchMock(vi)

// sets globalThis.fetch and globalThis.fetchMock to our mocked version
fetchMocker.enableMocks()

describe('downloader', () => {
  beforeEach(() => {
    fetchMocker.resetMocks()
  })
  test('download batch', async () => {
    const i: Item = { id: 'id', obj: { id: 'id' } }
    fetchMocker.mockResponseOnce('id\t' + JSON.stringify(i) + '\n')
    const results = new AsyncGeneratorQueue<Item>()
    const db: CacheDatabase = {
      async write(): Promise<void> {
        return Promise.resolve()
      }
    }
    const downloader = new Downloader(
      db,
      results,
      'http://speckle.test',
      'streamId',
      'objectId',
      'token',
      {
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
})
