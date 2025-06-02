import { describe, expect, test } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import { vi } from 'vitest'
import { Item } from '../../types/types.js'
import ServerDownloader from './serverDownloader.js'
import { MemoryPump } from '../../helpers/memoryPump.js'

describe('downloader', () => {
  test('download batch of one', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = { baseId: 'id', base: { id: 'id', speckle_type: 'type' } }
    fetchMocker.mockResponseOnce('id\t' + JSON.stringify(i.base) + '\n')
    const pump = new MemoryPump()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',
      fetch: fetchMocker
    })
    downloader.initializePool({ results: pump, total: 1, maxDownloadBatchWait: 200 })
    downloader.add('id')
    await downloader.disposeAsync()
    const r = []
    for await (const x of pump.gather([i.baseId])) {
      r.push(x)
    }

    expect(r).toMatchSnapshot()
    await downloader.disposeAsync()
  })

  test('download batch of two', async () => {
    const fetchMocker = createFetchMock(vi)
    const i1: Item = { baseId: 'id1', base: { id: 'id1', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id2', speckle_type: 'type' } }
    fetchMocker.mockResponseOnce(
      'id1\t' + JSON.stringify(i1.base) + '\nid2\t' + JSON.stringify(i2.base) + '\n'
    )

    const pump = new MemoryPump()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',

      fetch: fetchMocker
    })
    downloader.initializePool({ results: pump, total: 2, maxDownloadBatchWait: 200 })
    downloader.add('id1')
    downloader.add('id2')
    await downloader.disposeAsync()
    const r = []
    for await (const x of pump.gather([i1.baseId, i2.baseId])) {
      r.push(x)
    }

    expect(r).toMatchSnapshot()
    await downloader.disposeAsync()
  })

  test('download batch of three', async () => {
    const fetchMocker = createFetchMock(vi)
    const i1: Item = { baseId: 'id1', base: { id: 'id1', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id2', speckle_type: 'type' } }
    const i3: Item = { baseId: 'id3', base: { id: 'id3', speckle_type: 'type' } }
    fetchMocker.mockResponseOnce(
      'id1\t' +
        JSON.stringify(i1.base) +
        '\nid2\t' +
        JSON.stringify(i2.base) +
        '\nid3\t' +
        JSON.stringify(i3.base) +
        '\n'
    )

    const pump = new MemoryPump()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',

      fetch: fetchMocker
    })
    downloader.initializePool({ results: pump, total: 3, maxDownloadBatchWait: 200 })
    downloader.add('id1')
    downloader.add('id2')
    downloader.add('id3')
    await downloader.disposeAsync()
    const r = []
    for await (const x of pump.gather([i1.baseId, i2.baseId, i3.baseId])) {
      r.push(x)
    }

    expect(r).toMatchSnapshot()
    await downloader.disposeAsync()
  })

  test('download single exists', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = {
      baseId: 'id',
      base: { id: 'id', speckle_type: 'type', __closure: { childIds: 1 } }
    }
    fetchMocker.mockResponseOnce(JSON.stringify(i.base))
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: i.baseId,
      token: 'token',

      fetch: fetchMocker
    })
    const x = await downloader.downloadSingle()
    expect(x).toMatchSnapshot()
    await downloader.disposeAsync()
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
    const headers = new Headers()
    headers.set('x-test', 'asdf')
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      headers,
      streamId: 'streamId',
      objectId: i.baseId,
      token: 'token',

      fetch: fetchMocker
    })
    const x = await downloader.downloadSingle()
    expect(x).toMatchSnapshot()
    await downloader.disposeAsync()
  })

  test('can dispose used', async () => {
    const fetchMocker = createFetchMock(vi)
    const headers = new Headers()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      headers,
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',

      fetch: fetchMocker
    })
    await downloader.disposeAsync()
  })
})
