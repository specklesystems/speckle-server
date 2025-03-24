import { AuthCheckContextLoaders } from '../domain/loaders.js'
import { canCreateProjectPolicyFactory } from './canCreateProject.js'
import { canQueryProjectPolicyFactory } from './canQueryProject.js'

export const authPoliciesFactory = (loaders: AuthCheckContextLoaders) => ({
  project: {
    canCreateProject: canCreateProjectPolicyFactory(loaders),
    canQuery: canQueryProjectPolicyFactory(loaders)
  }
})

export type AuthPolices = ReturnType<typeof authPoliciesFactory>
