import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canReadProjectPolicy } from './canReadProject.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    canRead: canReadProjectPolicy(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
