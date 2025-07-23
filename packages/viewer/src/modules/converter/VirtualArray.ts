import { TypedArray } from 'type-fest'
import { DataChunk } from '../../IViewer.js'
import { MathUtils } from 'three'

export class VirtualArray {
  private offsets: number[]

  constructor(public chunks: Array<Array<number>>) {
    this.updateOffsets()
  }

  get length() {
    if (this.chunks.length === 0) return 0
    const lastChunk = this.chunks[this.chunks.length - 1]
    return this.offsets[this.offsets.length - 1] + lastChunk.length
  }

  get(index: number): number {
    if (this.chunks.length === 1) return this.chunks[0][index]
    const chunkIndex = this.findChunkIndex(index)
    const localIndex = index - this.offsets[chunkIndex]
    return this.chunks[chunkIndex][localIndex]
  }

  set(index: number, value: number) {
    if (this.chunks.length === 1) {
      this.chunks[0][index] = value
      return
    }
    const chunkIndex = this.findChunkIndex(index)
    const localIndex = index - this.offsets[chunkIndex]
    this.chunks[chunkIndex][localIndex] = value
  }

  public findChunkIndex(index: number): number {
    let low = 0
    let high = this.offsets.length - 1

    while (low <= high) {
      const mid = (low + high) >> 1
      const start = this.offsets[mid]
      const end = mid + 1 < this.offsets.length ? this.offsets[mid + 1] : this.length
      if (index >= start && index < end) return mid
      if (index < start) high = mid - 1
      else low = mid + 1
    }

    throw new RangeError('Index out of bounds')
  }

  public updateOffsets() {
    this.offsets = []
    let sum = 0
    for (const chunk of this.chunks) {
      this.offsets.push(sum)
      sum += chunk.length
    }
  }
}

export class ChunkArray extends VirtualArray {
  public chunkArray: Array<DataChunk>
  protected flatArray: TypedArray

  constructor(chunks: Array<DataChunk>) {
    super(chunks && chunks.map((c: DataChunk) => c.data))
    this.chunkArray = chunks
  }

  public slice() {
    const copiesArray: Array<DataChunk> = []
    this.chunkArray.forEach((chunk: DataChunk) => {
      const chunkCopy = new Array<number>(chunk.data.length)
      for (let k = 0; k < chunk.data.length; k++) {
        chunkCopy[k] = chunk.data[k]
      }
      copiesArray.push({ data: chunkCopy, id: MathUtils.generateUUID(), references: 1 })
    })
    return new ChunkArray(copiesArray)
  }

  public copyToBuffer(buffer: TypedArray, offset: number) {
    let chunkOffset = 0

    this.chunkArray.forEach((chunk: DataChunk) => {
      buffer.set(
        chunk.data as unknown as ArrayLike<number> & ArrayLike<bigint>,
        offset + chunkOffset
      )
      chunkOffset += chunk.data.length
    })
  }

  protected getFlatArray<T extends TypedArray>(Type: { new (length: number): T }) {
    if (!this.flatArray || !(this.flatArray instanceof Type)) {
      this.flatArray = new Type(this.length)
      let chunkOffset = 0
      this.chunks.forEach((chunk: number[]) => {
        this.flatArray.set(
          chunk as unknown as ArrayLike<number> & ArrayLike<bigint>,
          chunkOffset
        )
        chunkOffset += chunk.length
      })
    }
    return this.flatArray as T
  }

  public getFloat32Array(): Float32Array {
    return this.getFlatArray(Float32Array)
  }

  public getFloat64Array(): Float64Array {
    return this.getFlatArray(Float64Array)
  }

  public getInt16Array(): Int16Array {
    return this.getFlatArray(Int16Array)
  }

  public getInt32Array(): Int32Array {
    return this.getFlatArray(Int32Array)
  }

  public getUint16Array(): Uint16Array {
    return this.getFlatArray(Uint16Array)
  }

  public getUint32Array(): Uint32Array {
    return this.getFlatArray(Uint32Array)
  }
}
