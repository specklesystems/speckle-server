import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canQueryProjectPolicyFactory } from './canQueryProject.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    canQuery: canQueryProjectPolicyFactory(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
