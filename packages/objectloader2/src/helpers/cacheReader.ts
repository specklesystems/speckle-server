import { Database } from '../operations/interfaces.js'
import { CacheOptions } from '../operations/options.js'
import { Base, CustomLogger } from '../types/types.js'
import { DefermentManager } from './defermentManager.js'

export class CacheReader {
  #database: Database
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions

  constructor(
    database: Database,
    defermentManager: DefermentManager,
    options: CacheOptions
  ) {
    this.#database = database
    this.#defermentManager = defermentManager
    this.#options = options
    this.#logger = options.logger || ((): void => {})
  }

  async getObject(params: { id: string }): Promise<Base> {
    if (!this.#defermentManager.isDeferred(params.id)) {
      await this.#database.findBatch([params.id])
    }
    return await this.#defermentManager.defer({ id: params.id })
  }

   disposeAsync(): Promise<void> {
    return Promise.resolve()
  }
}
