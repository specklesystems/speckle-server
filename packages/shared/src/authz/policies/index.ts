import { AuthCheckContextLoaders } from '../domain/loaders.js'
import { canQueryProjectPolicyFactory } from './canQueryProject.js'

export const authPoliciesFactory = (loaders: AuthCheckContextLoaders) => ({
  project: {
    canQuery: canQueryProjectPolicyFactory(loaders)
  }
})

export type AuthPolices = ReturnType<typeof authPoliciesFactory>
