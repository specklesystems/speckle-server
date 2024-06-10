/* eslint-disable camelcase */
import crs from 'crypto-random-string'
import md5 from 'md5'

export class Serializer {
  chunkSize: number
  detachLineage: boolean[]
  lineage: string[]
  familyTree: Record<string, Record<string, number>>
  closureTable: Record<string, unknown>
  transport: BatchServerSender | null

  constructor(chunkSize: number = 1000, transport: BatchServerSender | null = null) {
    this.chunkSize = chunkSize
    this.detachLineage = []
    this.lineage = []
    this.familyTree = {}
    this.closureTable = {}
    this.transport = transport
  }

  async traverse(obj: Record<string, unknown>) {
    this.lineage.push(crs({ length: 10 }))

    const traversed = { id: null, speckle_type: obj.speckle_type } as Record<
      string,
      unknown
    >

    for (const propKey in obj) {
      const value = obj[propKey]
      // 0. skip some props
      if (!value || propKey === 'id' || propKey.startsWith('_')) continue

      // 1. primitives (numbers, bools, strings)
      if (typeof value !== 'object') {
        traversed[propKey] = value
        continue
      }

      const isDetached = propKey.startsWith('@')

      // 2. chunked arrays
      const isArray = Array.isArray(value)
      const isChunked = isArray ? propKey.match(/^@\((\d*)\)/) : false // chunk syntax
      if (isArray && isChunked && value.length !== 0 && typeof value[0] !== 'object') {
        const chunkSize = isChunked[1] !== '' ? parseInt(isChunked[1]) : this.chunkSize
        const chunkRefs = []

        let chunk = new DataChunk()
        let count = 0
        for (const el of value) {
          if (count === chunkSize) {
            chunkRefs.push(this.handleChunk(chunk))
            chunk = new DataChunk()
            count = 0
          }
          chunk.data.push(el)
          count++
        }

        if (chunk.data.length !== 0) chunkRefs.push(this.handleChunk(chunk))
        traversed[propKey.replace(isChunked[0], '')] = chunkRefs // strip chunk syntax
        continue
      }

      // 3. speckle objects
      if ((value as Record<string, unknown>).speckle_type) {
        const child = (await this.traverseValue({ value, isDetached })) as {
          id: string
        }
        traversed[propKey] = isDetached ? this.detachHelper(child.id) : child
        continue
      }

      // 4. other objects (dicts/maps, lists)
      traversed[propKey] = this.traverseValue({ value, isDetached })
    }
    // We've finished going through all the properties of this object

    // Last rites
    const detached = this.detachLineage.pop()
    const parent = this.lineage.pop() as string
    const closure = {} as Record<string, number>
    if (this.familyTree[parent]) {
      Object.entries(this.familyTree[parent]).forEach(([ref, depth]) => {
        closure[ref] = depth - this.detachLineage.length
      })
    }
    traversed['totalChildrenCount'] = Object.keys(closure).length

    const { hash, serializedObject, size } = this.generateId(traversed)
    traversed.id = hash

    // Pop it in
    if (detached && this.transport) {
      await this.transport.write({ obj: serializedObject, size })
    }

    return { hash, traversed }
  }

  async traverseValue({
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
      if (!isDetached) return value.map((el) => this.traverseValue({ value: el }))

      const detachedList = [] as unknown[]
      value.forEach(async (el) => {
        if (typeof el === 'object' && el.speckle_type) {
          this.detachLineage.push(isDetached)
          const { hash } = await this.traverse(el)
          detachedList.push(this.detachHelper(hash))
        } else {
          detachedList.push(this.traverseValue({ value: el, isDetached }))
        }
      })
      return detachedList
    }

    // 3. dicts
    if (!(value as { speckle_type?: string }).speckle_type) return value

    // 4. base objects
    if ((value as { speckle_type?: string }).speckle_type) {
      this.detachLineage.push(isDetached)
      const res = await this.traverse(value as Record<string, unknown>)
      return await res.traversed
    }

    throw `Unsupported type '${typeof value}': ${value}`
  }

  detachHelper(refHash: string) {
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

  async handleChunk(chunk: DataChunk) {
    this.detachLineage.push(true)
    const { hash } = await this.traverse(chunk as unknown as Record<string, unknown>)
    return this.detachHelper(hash)
  }

  generateId(obj: Record<string, unknown>) {
    const s = JSON.stringify(obj)
    return {
      hash: md5(s),
      serializedObject: s,
      size: s.length // approx, good enough as we're just limiting artificially batch sizes based on this
    }
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

export class BatchServerSender {
  buffer: string[]
  maxSize: number
  currSize: number
  serverUrl: string
  projectId: string
  authToken: string

  constructor(
    maxSize: number = 100_000,
    serverUrl: string,
    projectId: string,
    authToken: string
  ) {
    this.maxSize = maxSize
    this.currSize = 0
    this.serverUrl = serverUrl
    this.projectId = projectId
    this.authToken = authToken
  }

  async write({ obj, size }: { obj: string; size: number }) {
    this.buffer.push(obj)
    this.currSize += size
    if (this.currSize < this.maxSize) return // return fast
    await this._flushCurrentBuffer() // block until we send objects
  }

  async _flushCurrentBuffer() {
    if (this.buffer.length === 0) return

    const formData = new FormData()
    const concat = '[' + this.buffer.join(',') + ']' // TODO: note incorrect format, need to concat buffer with ',' and pad it with []
    formData.append('object-batch', new Blob([concat], { type: 'application/json' }))

    const url = new URL(`/objects/${this.projectId}`, this.serverUrl)
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.authToken}` },
      body: formData
    })

    if (res.status !== 200) {
      throw new Error(
        `Unexpected error when sending data. Expected status 200, got ${res.status}`
      )
    }

    this.buffer = []
    this.currSize = 0
  }
}
