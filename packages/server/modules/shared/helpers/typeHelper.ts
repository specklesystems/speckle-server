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
import { BaseContext } from '@apollo/server'

export type MarkNullableOptional<T> = SetRequired<
  Partial<T>,
  ConditionalKeys<T, NonNullable<unknown>>
>

export type SpeckleModule<T extends Record<string, unknown> = Record<string, unknown>> =
  {
    /**
     * Initialize the module
     * @param app The Express instance
     * @param isInitial Whether this initialization method is being invoked for the first time in this
     * process. In tests modules can be initialized multiple times.
     */
    init?: (app: Express, isInitial: boolean) => MaybeAsync<void>
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
  } & T

export type GraphQLContext = BaseContext &
  AuthContext & {
    /**
     * Request-scoped GraphQL dataloaders
     * @see https://github.com/graphql/dataloader
     */
    loaders: RequestDataLoaders

    log: pino.Logger
  }

export { Nullable, Optional, MaybeNullOrUndefined, MaybeAsync, MaybeFalsy }
