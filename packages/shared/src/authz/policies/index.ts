import { AuthCheckContextLoaders } from '../domain/loaders.js'
import {
  canCreateProjectPolicyFactory,
  canReadProjectPolicyFactory
} from './project/index.js'

export const authPoliciesFactory = (loaders: AuthCheckContextLoaders) => ({
  project: {
    canCreate: canCreateProjectPolicyFactory(loaders),
    canRead: canReadProjectPolicyFactory(loaders)
  }
})

export type AuthPolices = ReturnType<typeof authPoliciesFactory>
