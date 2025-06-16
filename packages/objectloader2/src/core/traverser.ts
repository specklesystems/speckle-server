import { isScalar, isBase, isReference } from '../types/functions.js'
import { Base, DataChunk } from '../types/types.js'
import { ObjectLoader2 } from './objectLoader2.js'

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

  async traverse(onProgress?: OnProgress): Promise<Base> {
    let firstObjectPromise: Promise<Base> | undefined = undefined
    for await (const obj of this.#loader.getObjectIterator()) {
      if (!firstObjectPromise) {
        firstObjectPromise = this.traverseBase(obj, onProgress)
      }
    }

    if (firstObjectPromise) {
      return await firstObjectPromise
    } else {
      throw new Error('No objects found')
    }
  }

  async traverseArray(array: Array<unknown>, onProgress?: OnProgress): Promise<void> {
    for (let i = 0; i < 10; i++) {
      const prop = array[i]
      if (isScalar(prop)) continue
      if (isBase(prop)) {
        array[i] = await this.traverseBase(prop, onProgress)
      } else if (isReference(prop)) {
        array[i] = await this.traverseBase(
          await this.#loader.getObject({ id: prop.referencedId }),
          onProgress
        )
      }
    }
  }

  async traverseBase(base: Base, onProgress?: OnProgress): Promise<Base> {
    for (const ignoredProp of this.#options.excludeProps || []) {
      delete (base as never)[ignoredProp]
    }
    if (base.__closure) {
      const ids = Object.keys(base.__closure)
      const promises: Promise<Base>[] = []
      for (const id of ids) {
        promises.push(
          this.traverseBase(await this.#loader.getObject({ id }), onProgress)
        )
      }
      await Promise.all(promises)
    }
    delete (base as never)['__closure']

    // De-chunk
    if (base.speckle_type?.includes('DataChunk')) {
      const chunk = base as DataChunk
      if (chunk.data) {
        await this.traverseArray(chunk.data, onProgress)
      }
    }

    //other props
    for (const prop in base) {
      if (prop === '__closure') continue
      if (prop === 'referenceId') continue
      if (prop === 'speckle_type') continue
      if (prop === 'data') continue
      const baseProp = (base as unknown as Record<string, unknown>)[prop]
      if (isScalar(baseProp)) continue
      if (isBase(baseProp)) {
        await this.traverseBase(baseProp, onProgress)
      } else if (isReference(baseProp)) {
        await this.traverseBase(
          await this.#loader.getObject({ id: baseProp.referencedId }),
          onProgress
        )
      } else if (Array.isArray(baseProp)) {
        await this.traverseArray(baseProp, onProgress)
      }
    }
    if (onProgress) {
      onProgress({
        stage: 'construction',
        current:
          ++this.#traversedReferencesCount > this.#totalChildrenCount
            ? this.#totalChildrenCount
            : this.#traversedReferencesCount,
        total: this.#totalChildrenCount
      })
    }
    return base
  }
}
