/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NuxtApp } from '#app'
import type {
  ApolloQueryResult,
  MaybeMasked,
  OperationVariables,
  QueryOptions
} from '@apollo/client/core'

export type AuthLoaderDependencies = {
  nuxtApp: NuxtApp
  /**
   * Use this to query GQL, instead of taking apollo client from nuxtApp. This ensures
   * appropriate caching settings
   */
  query: <T = any, TVariables extends OperationVariables = OperationVariables>(
    options: QueryOptions<TVariables, T>
  ) => Promise<ApolloQueryResult<MaybeMasked<T>>>
}

export type AuthLoaderFactory<T> = (deps: AuthLoaderDependencies) => T

/**
 * Can be used in auth policy checks to reference the active user's id, whatever it is,
 * without having to resolve it
 */
export const ActiveUserId = <const>'__APP_ACTIVE_USER_ID__'
