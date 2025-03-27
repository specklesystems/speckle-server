import type { NuxtApp } from '#app'
import type { FetchPolicy } from '@apollo/client/core'

export type AuthLoaderDependencies = {
  nuxtApp: NuxtApp
  fetchPolicy: FetchPolicy
}

export type AuthLoaderFactory<T> = (deps: AuthLoaderDependencies) => T

/**
 * Can be used in auth policy checks to reference the active user's id, whatever it is,
 * without having to resolve it
 */
export const ActiveUserId = <const>'__APP_ACTIVE_USER_ID__'
