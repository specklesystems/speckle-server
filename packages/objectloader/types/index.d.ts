/**
 * This is written manually & should be kept up to date when the API changes
 */

export interface SpeckleObject extends Record<string, unknown> {
  totalChildrenCount?: number
}

type Logger = (...args: unknown[]) => void

export type ProgressStage = 'download' | 'construction'

/**
 * ObjectLoader class
 */
class ObjectLoader {
  constructor(params: {
    serverUrl: string
    streamId: string
    objectId: string
    token?: string
    options?: Partial<{
      /**
       * Whether IndexedDB caching is enabled (disabled by default in node envs where IndexedDB is not available)
       */
      enableCaching: boolean
      fullyTraverseArrays: boolean
      excludeProps: Array
      /**
       * Override fetch implementation (necessary in node environment)
       */
      fetch: GlobalFetch['fetch']
      /**
       * Optionally provide alternative for console.log
       */
      customLogger: Logger
      /**
       * Optionally provide alternative for console.warn
       */
      customWarner: Logger
    }>
  })

  async getTotalObjectCount(): Promise<number>
  async getAndConstructObject(
    onProgress: (e: { stage: ProgressStage; current: number; total: number }) => void
  ): SpeckleObject | SpeckleObject[]

  async *getObjectIterator(): Generator<SpeckleObject, SpeckleObject>
  async getObject(id: string): Promise<Record<string, unknown>>
  dispose(): void
}

export default ObjectLoader
