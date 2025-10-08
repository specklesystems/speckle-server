import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryDownloader } from './memoryDownloader.js'
import BufferQueue from '../../../queues/bufferQueue.js'
import Queue from '../../../queues/queue.js'
import { Base, Item } from '../../../types/types.js'

const makeBase = (foo: string): Base => ({ foo } as unknown as Base)

describe('MemoryDownloader', () => {
  let items: Map<string, Base>
  let downloader: MemoryDownloader
  let results: Queue<Item>

  beforeEach(() => {
    items = new Map([
      ['id1', makeBase('foo')],
      ['id2', makeBase('bar')]
    ])
    downloader = new MemoryDownloader('id1', items)
    results = new BufferQueue<Item>()
  })

  it('should download the root item', async () => {
    const item = await downloader.downloadSingle()
    expect(item).toEqual({ baseId: 'id1', base: { foo: 'foo' } })
  })

  it('should throw if root item is missing', async () => {
    const missingDownloader = new MemoryDownloader('missing', items)
    await expect(missingDownloader.downloadSingle()).rejects.toThrow(
      'Method not implemented.'
    )
  })

  it('should add found item to results queue', () => {
    downloader.initialize({ results, total: 2 })
    downloader.add('id2')
    expect(items).toMatchSnapshot()
  })

  it('should throw if added item is missing', () => {
    downloader.initialize({ results, total: 2 })
    expect(() => downloader.add('missing')).toThrow()
  })

  it('disposeAsync should resolve', async () => {
    await expect(downloader.disposeAsync()).resolves.not.toThrow()
  })
})
