import { TypedArray } from 'type-fest'
import { DataChunk } from '../../IViewer.js'
import { MathUtils } from 'three'

export class VirtualArray {
  constructor(public chunks: Array<Array<number>>) {}

  get length() {
    return this.chunks.reduce((sum, c) => sum + c.length, 0)
  }

  get(index: number): number {
    let offset = 0
    for (const chunk of this.chunks) {
      if (index < offset + chunk.length) {
        return chunk[index - offset]
      }
      offset += chunk.length
    }
    throw new RangeError('Index out of bounds')
  }

  set(index: number, value: number) {
    let offset = 0
    for (const chunk of this.chunks) {
      if (index < offset + chunk.length) {
        chunk[index - offset] = value
        return
      }
      offset += chunk.length
    }
    throw new RangeError('Index out of bounds')
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
}
