/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NuxtApp } from '#app'
import type {
  DocumentNode,
  OperationVariables,
  QueryOptions
} from '@apollo/client/core'
import type { Authz } from '@speckle/shared'
import type { AuthLoaderDependencies } from '~/lib/auth/helpers/authPolicies'
import { getEnvFactory } from '~/lib/auth/loaders/env'
import { getProjectFactory, getProjectRoleFactory } from '~/lib/auth/loaders/project'
import { getServerRoleFactory } from '~/lib/auth/loaders/server'
import {
  getWorkspaceFactory,
  getWorkspaceRoleFactory,
  getWorkspaceSsoProviderFactory,
  getWorkspaceSsoSessionFactory
} from '~/lib/auth/loaders/workspace'

export const buildAuthPolicyLoaders = (params: {
  nuxtApp: NuxtApp
  options?: Partial<{
    /**
     * Whether loaders should skip cache and fetch results from server
     */
    noCache: boolean
  }>
}): Authz.AllAuthCheckContextLoaders => {
  const apollo = params.nuxtApp['$apollo'].default
  if (!apollo) {
    throw new Error('Apollo client not found')
  }

  const requestedQueryMap: WeakMap<DocumentNode, Set<string>> = new WeakMap()

  const query: (typeof apollo)['query'] = <
    T = any,
    TVariables extends OperationVariables = OperationVariables
  >(
    options: QueryOptions<TVariables, T>
  ) => {
    const op = options.query
    const vars = JSON.stringify(toValue(options.variables))

    // If noCache - we want fetchPolicy: network-only ONLY on the first load of a specific
    // gql query. network-only on subsequent loads within the same policy will be too heavy
    if (params.options?.noCache && !options.fetchPolicy) {
      if (!requestedQueryMap.has(op)) {
        requestedQueryMap.set(op, new Set())
      }

      const queryMap = requestedQueryMap.get(op)!
      if (!queryMap.has(vars)) {
        queryMap.add(vars)
        options.fetchPolicy = 'network-only'
      } else {
        options.fetchPolicy = 'cache-first'
      }
    }

    return apollo.query(options)
  }

  const deps: AuthLoaderDependencies = {
    nuxtApp: params.nuxtApp,
    query
  }

  return {
    getEnv: getEnvFactory(deps),
    getProject: getProjectFactory(deps),
    getProjectRole: getProjectRoleFactory(deps),
    getServerRole: getServerRoleFactory(deps),
    getWorkspace: getWorkspaceFactory(deps),
    getWorkspaceRole: getWorkspaceRoleFactory(deps),
    getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory(deps),
    getWorkspaceSsoSession: getWorkspaceSsoSessionFactory(deps),
    getWorkspaceLimits: () => {
      throw new Error('Not yet implemented.')
    },
    getWorkspacePlan: () => {
      throw new Error('Not yet implemented.')
    },
    getWorkspaceSeat: () => {
      throw new Error('Not yet implemented.')
    },
    getWorkspaceProjectCount: () => {
      throw new Error('Not yet implemented.')
    }
  }
}
