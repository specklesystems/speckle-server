import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canCreateProjectPolicy } from './projects/canCreate.js'
import { canReadProjectPolicy } from './projects/canRead.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    canCreate: canCreateProjectPolicy(loaders),
    canRead: canReadProjectPolicy(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
