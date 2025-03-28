import type { AuthCheckContextLoaders } from '@speckle/shared/authz'
import type { AuthLoaderFactory } from '~/lib/auth/helpers/authPolicies'

export const getEnvFactory: AuthLoaderFactory<AuthCheckContextLoaders['getEnv']> = (
  deps
) => {
  const { public: publicRuntimeConfig } = deps.nuxtApp.$config
  return async () => publicRuntimeConfig
}
