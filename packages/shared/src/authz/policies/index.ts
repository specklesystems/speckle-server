import { AuthCheckContextLoaders } from '../domain/loaders.js'
import {
  createProjectPolicyFactory,
  queryProjectPolicyFactory
} from './projects/index.js'

export const authPoliciesFactory = (loaders: AuthCheckContextLoaders) => ({
  project: {
    create: createProjectPolicyFactory(loaders),
    query: queryProjectPolicyFactory(loaders)
  }
})

export type AuthPolices = ReturnType<typeof authPoliciesFactory>
