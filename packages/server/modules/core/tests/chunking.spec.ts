import { ArgumentError, chunkInsertionObjectArray } from '@/modules/core/utils/chunking'
import { expect } from 'chai'

describe('ChunkInsertionObjectArray', () => {
  it('throws for invalid chunk length limits', () => {
    expect(() =>
      chunkInsertionObjectArray({
        objects: [],
        chunkLengthLimit: 0,
        chunkSizeLimitMb: 10
      })
    ).to.throw(ArgumentError, 'Chunks must have a length limit > 1')
  })

  it('throws for invalid chunk size limits', () => {
    expect(() =>
      chunkInsertionObjectArray({
        objects: [],
        chunkLengthLimit: 1,
        chunkSizeLimitMb: 0
      })
    ).to.throw(ArgumentError, 'Chunks must have a size in MB limit > 0')
  })
  it('creates an array-array of objects', () => {
    const objects = [
      {
        data: 'fake'
      }
    ]
    const chunkSizeLimitMb = 10
    const chunkLengthLimit = 10
    const insertionChunks = chunkInsertionObjectArray({
      objects,
      chunkSizeLimitMb,
      chunkLengthLimit
    })
    expect(insertionChunks).deep.equals([objects])
  })
  it('breaks into chunks based on length limit', () => {
    const object = { data: 'fake' }
    const chunkSizeLimitMb = 10
    const chunkLengthLimit = 2
    const insertionChunks = chunkInsertionObjectArray({
      objects: Array(10).fill(object),
      chunkSizeLimitMb,
      chunkLengthLimit
    })
    expect(insertionChunks).deep.equals(Array(5).fill([object, object]))
  })
  it('breaks into chunks based on size limit', () => {
    // use 4 chars, thats 8 bytes
    const object = { data: 'fake' }
    // using 16 bytes as limit should result in chunks of 2 objects
    const chunkSizeLimitMb = 8 / 1_000_000
    const chunkLengthLimit = 10000
    const insertionChunks = chunkInsertionObjectArray({
      objects: Array(11).fill(object),
      chunkSizeLimitMb,
      chunkLengthLimit
    })
    const expected = Array(6).fill([object, object]).fill([object], -1)
    expect(insertionChunks).deep.equals(expected)
  })
})
