import { RequestDataLoaders } from '@/modules/core/loaders'
import { AuthContext } from '@/modules/shared/authz'
import { Express } from 'express'

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type MaybeNullOrUndefined<T> = T | null | undefined
export type MaybeAsync<T> = T | Promise<T>
export type MaybeFalsy<T> = T | null | undefined | false | '' | 0

export type SpeckleModule = {
  /**
   * Initialize the module
   * @param app The Express instance
   * @param isInitial Whether this initialization method is being invoked for the first time in this
   * process. In tests modules can be initialized multiple times.
   */
  init: (app: Express, isInitial: boolean) => MaybeAsync<void>
  /**
   * Finalize initialization. This is only invoked once all of the other modules' `init()`
   * hooks are run.
   * @param app The Express instance
   * @param isInitial Whether this initialization method is being invoked for the first time in this
   * process. In tests modules can be initialized multiple times.
   */
  finalize?: (app: Express, isInitial: boolean) => MaybeAsync<void>

  /**
   * Cleanup resources before the server shuts down
   */
  shutdown?: () => MaybeAsync<void>
}

export type GraphQLContext = AuthContext & {
  /**
   * Request-scoped GraphQL dataloaders
   * @see https://github.com/graphql/dataloader
   */
  loaders: RequestDataLoaders
}
