import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canQueryProjectPolicy } from './canQueryProject.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    canQuery: canQueryProjectPolicy(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
