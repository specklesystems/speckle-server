import type {
  Nullable,
  Optional,
  MaybeNullOrUndefined,
  MaybeAsync,
  MaybeFalsy
} from '@speckle/shared'
import type { RequestDataLoaders } from '@/modules/core/loaders'
import type { AuthContext } from '@/modules/shared/authz'
import type { Express } from 'express'
import type { ConditionalKeys, SetRequired } from 'type-fest'
import type { Logger } from 'pino'
import type { BaseContext } from '@apollo/server'
import type { Registry } from 'prom-client'
import { AuthPolicies } from '@speckle/shared/authz'

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
    init?: (params: {
      app: Express
      isInitial: boolean
      metricsRegister: Registry
    }) => MaybeAsync<void>
    /**
     * Finalize initialization. This is only invoked once all of the other modules' `init()`
     * hooks are run.
     * @param app The Express instance
     * @param isInitial Whether this initialization method is being invoked for the first time in this
     * process. In tests modules can be initialized multiple times.
     */
    finalize?: (params: {
      app: Express
      isInitial: boolean
      metricsRegister: Registry
    }) => MaybeAsync<void>

    /**
     * Cleanup resources before the server shuts down
     */
    shutdown?: () => MaybeAsync<void>
  } & T

export type GraphQLContext = BaseContext &
  AuthContext & {
    authPolicies: AuthPolicies & {
      clearCache: () => void
    }
    /**
     * Request-scoped GraphQL dataloaders
     * @see https://github.com/graphql/dataloader
     */
    loaders: RequestDataLoaders
    log: Logger
    /**
     * Clear dataloader, auth policy loader etc. caches. Usually necessary after mutations
     * are done in resolvers
     */
    clearCache: () => void
  }

export { Nullable, Optional, MaybeNullOrUndefined, MaybeAsync, MaybeFalsy }
