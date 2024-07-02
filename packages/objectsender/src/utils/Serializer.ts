/* eslint-disable camelcase */
import { SHA1 } from './Sha1'
import { ITransport } from '../transports/ITransport'
import { Base } from './Base'
import { IDisposable } from './IDisposable'
import { isObjectLike, get } from '#lodash'
import { getChunkSize, isChunkable, isDetached } from './Decorators'

type BasicSpeckleObject = Record<string, unknown> & {
  speckle_type: string
}

const isSpeckleObject = (obj: unknown): obj is BasicSpeckleObject =>
  isObjectLike(obj) && !!get(obj, 'speckle_type')

export class Serializer implements IDisposable {
  chunkSize: number
  detachLineage: boolean[]
  lineage: string[]
  familyTree: Record<string, Record<string, number>>
  closureTable: Record<string, unknown>
  transport: ITransport | null
  uniqueId: number
  hashingFunction: (s: string) => string

  constructor(
    transport: ITransport,
    chunkSize: number = 1000,
    hashingFunction: (s: string) => string = SHA1
  ) {
    this.chunkSize = chunkSize
    this.detachLineage = [true] // first ever call is always detached
    this.lineage = []
    this.familyTree = {}
    this.closureTable = {}
    this.transport = transport
    this.uniqueId = 0
    this.hashingFunction = hashingFunction || SHA1
  }

  async write(obj: Base) {
    return await this.#traverse(obj, true)
  }

  async #traverse(obj: Record<string, unknown>, root: boolean) {
    const temporaryId = `${this.uniqueId++}-obj`
    this.lineage.push(temporaryId)

    const traversed = { speckle_type: obj.speckle_type || 'Base' } as Record<
      string,
      unknown
    >

    for (const propKey in obj) {
      const value = obj[propKey]
      // 0. skip some props
      if (value === undefined || propKey === 'id' || propKey.startsWith('_')) continue

      // 1. primitives (numbers, bools, strings)
      if (typeof value !== 'object') {
        traversed[propKey] = value
        continue
      }

      const isDetachedProp = propKey.startsWith('@') || isDetached(obj, propKey)

      // 2. chunked arrays
      const isArray = Array.isArray(value)
      const isChunked = isArray
        ? isChunkable(obj, propKey) || propKey.match(/^@\((\d*)\)/)
        : false // chunk syntax

      if (isArray && isChunked && value.length !== 0 && typeof value[0] !== 'object') {
        let chunkSize = this.chunkSize
        if (typeof isChunked === 'boolean') {
          chunkSize = getChunkSize(obj, propKey)
        } else {
          chunkSize = isChunked[1] !== '' ? parseInt(isChunked[1]) : this.chunkSize
        }

        const chunkRefs = []

        let chunk = new DataChunk()
        let count = 0
        for (const el of value) {
          if (count === chunkSize) {
            chunkRefs.push(await this.#handleChunk(chunk))
            chunk = new DataChunk()
            count = 0
          }
          chunk.data.push(el)
          count++
        }

        if (chunk.data.length !== 0) chunkRefs.push(await this.#handleChunk(chunk))

        if (typeof isChunked === 'boolean') {
          traversed[propKey] = chunkRefs // no need to strip chunk syntax
        } else {
          traversed[propKey.replace(isChunked[0], '')] = chunkRefs // strip chunk syntax
        }

        continue
      }

      // 3. speckle objects
      if ((value as Record<string, unknown>).speckle_type) {
        const child = (await this.#traverseValue({
          value,
          isDetached: isDetachedProp
        })) as {
          id: string
        }
        traversed[propKey] = isDetachedProp ? this.#detachHelper(child.id) : child
        continue
      }

      // 4. other objects (dicts/maps, lists)
      traversed[propKey] = await this.#traverseValue({
        value,
        isDetached: isDetachedProp
      })
    }
    // We've finished going through all the properties of this object, now let's perform the last rites
    const detached = this.detachLineage.pop()
    const parent = this.lineage.pop() as string

    if (this.familyTree[parent]) {
      const closure = {} as Record<string, number>

      Object.entries(this.familyTree[parent]).forEach(([ref, depth]) => {
        closure[ref] = depth - this.detachLineage.length
      })

      traversed['totalChildrenCount'] = Object.keys(closure).length

      if (traversed['totalChildrenCount']) {
        traversed['__closure'] = closure
      }
    }

    const { hash, serializedObject, size } = this.#generateId(traversed)
    traversed.id = hash

    // Pop it in
    if ((detached || root) && this.transport) {
      await this.transport.write(serializedObject, size)
    }

    // We've reached the end, let's flush
    if (root && this.transport) {
      await this.transport.flush()
    }

    return { hash, traversed }
  }

  async #traverseValue({
    value,
    isDetached = false
  }: {
    value: unknown
    isDetached?: boolean
  }): Promise<unknown> {
    // 1. primitives
    if (typeof value !== 'object') return value

    // 2. arrays
    if (Array.isArray(value)) {
      const arr = value as unknown[]
      // 2.1 empty arrays
      if (arr.length === 0) return value as unknown

      // 2.2 primitive arrays
      if (typeof arr[0] !== 'object') return arr

      // 2.3. non-primitive non-detached arrays
      if (!isDetached) {
        return Promise.all(
          value.map(async (el) => await this.#traverseValue({ value: el }))
        )
      }

      // 2.4 non-primitive detached arrays
      const detachedList = [] as unknown[]
      for (const el of value) {
        if (isSpeckleObject(el)) {
          this.detachLineage.push(isDetached)
          const { hash } = await this.#traverse(el, false)
          detachedList.push(this.#detachHelper(hash))
        } else {
          detachedList.push(await this.#traverseValue({ value: el, isDetached }))
        }
      }
      return detachedList
    }

    // 3. dicts
    if (!(value as { speckle_type?: string }).speckle_type) return value

    // 4. base objects
    if ((value as { speckle_type?: string }).speckle_type) {
      this.detachLineage.push(isDetached)
      const res = await this.#traverse(value as Record<string, unknown>, false)
      return res.traversed
    }

    throw new Error(`Unsupported type '${typeof value}': ${value}.`)
  }

  #detachHelper(refHash: string) {
    this.lineage.forEach((parent) => {
      if (!this.familyTree[parent]) this.familyTree[parent] = {}

      if (
        !this.familyTree[parent][refHash] ||
        this.familyTree[parent][refHash] > this.detachLineage.length
      ) {
        this.familyTree[parent][refHash] = this.detachLineage.length
      }
    })
    return {
      referencedId: refHash,
      speckle_type: 'reference'
    }
  }

  async #handleChunk(chunk: DataChunk) {
    this.detachLineage.push(true)
    const { hash } = await this.#traverse(
      chunk as unknown as Record<string, unknown>,
      false
    )
    return this.#detachHelper(hash)
  }

  #generateId(obj: Record<string, unknown>) {
    const s = JSON.stringify(obj)
    const h = this.hashingFunction(s)
    const f = s.substring(0, 1) + `"id":"${h}",` + s.substring(1)
    return {
      hash: SHA1(s),
      serializedObject: f,
      size: s.length // approx, good enough as we're just limiting artificially batch sizes based on this
    }
  }

  dispose() {
    this.detachLineage = []
    this.lineage = []
    this.familyTree = {}
    this.closureTable = {}
    this.transport = null
  }
}

class DataChunk {
  speckle_type: 'Speckle.Core.Models.DataChunk'
  data: unknown[]
  constructor() {
    this.data = []
    this.speckle_type = 'Speckle.Core.Models.DataChunk'
  }
}
