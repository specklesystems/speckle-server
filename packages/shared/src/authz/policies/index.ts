import {
  canCreateProjectPolicyFactory,
  canReadProjectPolicyFactory
} from './project/index.js'
import { AllAuthCheckContextLoaders } from '../domain/loaders.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    canCreate: canCreateProjectPolicyFactory(loaders),
    canRead: canReadProjectPolicyFactory(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
