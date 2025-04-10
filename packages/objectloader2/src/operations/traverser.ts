import { Base, DataChunk, isBase } from '../types/types.js'
import ObjectLoader2 from './objectLoader2.js'

export type ProgressStage = 'download' | 'construction'
export type OnProgress = (e: {
  stage: ProgressStage
  current: number
  total: number
}) => void

export interface TraverserOptions {
  excludeProps?: string[]
}

export default class Traverser {
  #loader: ObjectLoader2
  #options: TraverserOptions

  #totalChildrenCount = 0
  #traversedReferencesCount = 0

  constructor(loader: ObjectLoader2, options?: TraverserOptions) {
    this.#options = options || {}
    this.#loader = loader
  }

  async getAndConstructObject(onProgress: OnProgress) {
    let firstObjectPromise: Promise<void> | undefined = undefined
    let first = true
    for await (const obj of this.#loader.getObjectIterator()) {
      if (first) {
        firstObjectPromise = this.traverseBase(obj, onProgress)
        first = false
      }
    }

    if (firstObjectPromise) {
      await firstObjectPromise
    }
  }

  async traverseArray(obj: Array<unknown>, onProgress: OnProgress): Promise<void> {
    const promises: Promise<void>[] = []
    for (const arrayItem of obj) {
      if (isBase(arrayItem)) {
        promises.push(this.traverseBase(arrayItem, onProgress))
      }
    }
    await Promise.all(promises)
  }

  async traverseBase(obj: Base, onProgress: OnProgress): Promise<void> {
    for (const ignoredProp of this.#options.excludeProps || []) {
      delete (obj as never)[ignoredProp]
    }
    if (obj.__closure) {
      const ids = Object.keys(obj.__closure)
      const promises: Promise<void>[] = []
      for (const id of ids) {
        promises.push(
          this.traverseBase(await this.#loader.getObject({ id }), onProgress)
        )
      }
      await Promise.all(promises)
    }
    if (obj.referenceId) {
      await this.traverseBase(
        await this.#loader.getObject({ id: obj.referenceId }),
        onProgress
      )
    }
    // De-chunk
    if (obj.speckle_type?.includes('DataChunk')) {
      const chunk = obj as DataChunk
      if (chunk.data) {
        await this.traverseArray(chunk.data, onProgress)
      }
    }

    //other props
    for (const prop in obj) {
      if (prop === '__closure') continue
      if (prop === 'referenceId') continue
      if (prop === 'speckle_type') continue
      const objProp = (obj as unknown as Record<string, unknown>)[prop]
      if (isBase(objProp)) {
        await this.traverseBase(objProp, onProgress)
      }
      if (Array.isArray(objProp)) {
        await this.traverseArray(objProp, onProgress)
      }
    }
    onProgress({
      stage: 'construction',
      current:
        ++this.#traversedReferencesCount > this.#totalChildrenCount
          ? this.#totalChildrenCount
          : this.#traversedReferencesCount,
      total: this.#totalChildrenCount
    })
  }
}
