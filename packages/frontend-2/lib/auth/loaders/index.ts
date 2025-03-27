import type { NuxtApp } from '#app'
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

export const buildAuthPolicyLoaders = async (params: {
  nuxtApp: NuxtApp
  options?: Partial<{
    /**
     * Whether loaders should skip cache and fetch results from server
     */
    noCache: boolean
  }>
}): Promise<Authz.AllAuthCheckContextLoaders> => {
  const apollo = params.nuxtApp['$apollo'].default
  if (!apollo) {
    throw new Error('Apollo client not found')
  }

  const deps: AuthLoaderDependencies = {
    nuxtApp: params.nuxtApp,
    fetchPolicy: params.options?.noCache ? 'network-only' : 'cache-first'
  }

  return {
    getEnv: getEnvFactory(deps),
    getProject: getProjectFactory(deps),
    getProjectRole: getProjectRoleFactory(deps),
    getServerRole: getServerRoleFactory(deps),
    getWorkspace: getWorkspaceFactory(deps),
    getWorkspaceRole: getWorkspaceRoleFactory(deps),
    getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory(deps),
    getWorkspaceSsoSession: getWorkspaceSsoSessionFactory(deps)
  }
}
