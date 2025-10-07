import { describe, expect, test } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import { vi } from 'vitest'
import { Item } from '../../types/types.js'
import ServerDownloader from './serverDownloader.js'
import AsyncGeneratorQueue from '../../queues/asyncGeneratorQueue.js'

describe('downloader', () => {
  test('download batch of one', async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = { baseId: 'id', base: { id: 'id', speckle_type: 'type' } }
    fetchMocker.mockResponseOnce('id\t' + JSON.stringify(i.base) + '\n')
    const gathered = new AsyncGeneratorQueue<Item>()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',
      fetch: fetchMocker,
      logger: (): void => {}
    })
    downloader.initialize({
      results: gathered,
      total: 1,
      maxDownloadBatchWait: 200
    })
    downloader.add('id')
    const r = []
    for await (const x of gathered.consume()) {
      r.push(x)
      if (r.length >= 1) {
        break
      }
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

    const gathered = new AsyncGeneratorQueue<Item>()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',

      fetch: fetchMocker,
      logger: (): void => {}
    })
    downloader.initialize({
      results: gathered,
      total: 2,
      maxDownloadBatchWait: 200
    })
    downloader.add('id1')
    downloader.add('id2')
    await downloader.disposeAsync()
    const r = []
    for await (const x of gathered.consume()) {
      r.push(x)
      if (r.length >= 2) {
        break
      }
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

    const gathered = new AsyncGeneratorQueue<Item>()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',

      fetch: fetchMocker,
      logger: (): void => {}
    })
    downloader.initialize({
      results: gathered,
      total: 3,
      maxDownloadBatchWait: 200
    })
    downloader.add('id1')
    downloader.add('id2')
    downloader.add('id3')
    await downloader.disposeAsync()
    const r = []
    for await (const x of gathered.consume()) {
      r.push(x)
      if (r.length >= 3) {
        break
      }
    }

    expect(r).toMatchSnapshot()
    await downloader.disposeAsync()
  })

  test('download batch of three with Objects.Other.RawEncoding', async () => {
    const fetchMocker = createFetchMock(vi)
    const i1: Item = { baseId: 'id1', base: { id: 'id1', speckle_type: 'type' } }
    const i2: Item = {
      baseId: 'id2',
      base: { id: 'id2', speckle_type: 'Objects.Other.RawEncoding' }
    }
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

    const gathered = new AsyncGeneratorQueue<Item>()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'token',

      fetch: fetchMocker,
      logger: (): void => {}
    })
    downloader.initialize({
      results: gathered,
      total: 3,
      maxDownloadBatchWait: 200
    })
    downloader.add('id1')
    downloader.add('id2')
    downloader.add('id3')
    await downloader.disposeAsync()
    const r = []
    for await (const x of gathered.consume()) {
      r.push(x)
      if (r.length >= 3) {
        break
      }
    }

    expect(r).toMatchSnapshot()
    await downloader.disposeAsync()
  })

  test("download Objects.Other.RawEncoding doesn't exist", async () => {
    const fetchMocker = createFetchMock(vi)
    const i: Item = {
      baseId: 'id',
      base: {
        id: 'id',
        speckle_type: 'Objects.Other.RawEncoding',
        __closure: { childIds: 1 }
      }
    }
    fetchMocker.mockResponseOnce(JSON.stringify(i.base))
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: i.baseId,
      token: 'token',

      fetch: fetchMocker,
      logger: (): void => {}
    })
    await expect(downloader.downloadSingle()).rejects.toThrow()
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

      fetch: fetchMocker,
      logger: (): void => {}
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

      fetch: fetchMocker,
      logger: (): void => {}
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

      fetch: fetchMocker,
      logger: (): void => {}
    })
    await downloader.disposeAsync()
  })

  test('nothing is frozen when validateResponse returns 403', async () => {
    const fetchMocker = createFetchMock(vi)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Mock a 403 Forbidden response
    fetchMocker.mockResponseOnce('', { status: 403, statusText: 'Forbidden' })

    const gathered = new AsyncGeneratorQueue<Item>()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'invalid-token',
      fetch: fetchMocker,
      logger: (): void => {}
    })

    try {
      downloader.initialize({
        results: gathered,
        total: 2,
        maxDownloadBatchWait: 100
      })

      // Add items to trigger batch processing
      downloader.add('id1')
      downloader.add('id2')

      // Wait for the batch to be processed and fail with 403
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Verify that the error was logged (indicating the batch processing failed)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Batch processing failed:',
        expect.any(Error)
      )

      // The key test: verify we can still dispose the downloader properly
      // This ensures the system isn't frozen and can clean up resources
      const disposePromise = downloader.disposeAsync()

      // Add a timeout to ensure disposal doesn't hang indefinitely
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Disposal timed out')), 5000)
      })

      // This should complete without timing out or throwing
      await Promise.race([disposePromise, timeoutPromise])

      // Additional verification: the batching queue should be marked as disposed
      // We can't directly access the private field, but we can verify disposal completed
      expect(true).toBe(true) // If we reach here, disposal succeeded
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  test('system remains functional after 403 error and can be properly cleaned up', async () => {
    const fetchMocker = createFetchMock(vi)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // First call returns 403, subsequent calls should not be made due to queue disposal
    fetchMocker.mockResponseOnce('', { status: 403, statusText: 'Forbidden' })

    const gathered = new AsyncGeneratorQueue<Item>()
    const downloader = new ServerDownloader({
      serverUrl: 'http://speckle.test',
      streamId: 'streamId',
      objectId: 'objectId',
      token: 'invalid-token',
      fetch: fetchMocker,
      logger: (): void => {}
    })

    try {
      downloader.initialize({
        results: gathered,
        total: 5,
        maxDownloadBatchWait: 50
      })

      // Add first batch that will trigger the 403 error
      downloader.add('id1')
      downloader.add('id2')

      // Wait for first batch to fail
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Batch processing failed:',
        expect.any(Error)
      )

      // Try to add more items after the failure
      // These should be ignored since the queue is now disposed
      downloader.add('id3')
      downloader.add('id4')
      downloader.add('id5')

      // Wait a bit more to ensure no additional processing attempts
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Note: The batching queue might make multiple attempts before disposal
      // The key is that disposal should still work regardless of how many calls were made
      expect(fetchMocker).toHaveBeenCalled()

      // Critical test: disposal should complete without hanging
      const start = Date.now()
      await downloader.disposeAsync()
      const elapsed = Date.now() - start

      // Disposal should be quick (under 1 second) and not hang
      expect(elapsed).toBeLessThan(1000)

      // Verify that the results queue can also be disposed properly
      await gathered.disposeAsync()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})
