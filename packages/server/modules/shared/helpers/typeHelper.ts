import {
  Nullable,
  Optional,
  MaybeNullOrUndefined,
  MaybeAsync,
  MaybeFalsy
} from '@speckle/shared'
import { RequestDataLoaders } from '@/modules/core/loaders'
import { AuthContext } from '@/modules/shared/authz'
import { Express } from 'express'
import { ConditionalKeys, SetRequired } from 'type-fest'
import pino from 'pino'

export type MarkNullableOptional<T> = SetRequired<
  Partial<T>,
  ConditionalKeys<T, NonNullable<unknown>>
>

export type SpeckleModule<T extends Record<string, unknown> = Record<string, unknown>> =
  {
    /**
     * Initialize the module
     */
    init?: (app: Express, isInitial: boolean) => MaybeAsync<void>
    /**
     * Finalize initialization. This is only invoked once all of the other modules' `init()`
     * hooks are run.
     */
    finalize?: (app: Express, isInitial: boolean) => MaybeAsync<void>

    /**
     * Cleanup resources before the server shuts down
     */
    shutdown?: () => MaybeAsync<void>
  } & T

export type GraphQLContext = AuthContext & {
  /**
   * Request-scoped GraphQL dataloaders
   * @see https://github.com/graphql/dataloader
   */
  loaders: RequestDataLoaders

  log: pino.Logger
}

export { Nullable, Optional, MaybeNullOrUndefined, MaybeAsync, MaybeFalsy }
