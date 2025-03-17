import { ChuckContextLoaders } from '../domain/loaders.js'
import { canQueryProjectPolicyFactory } from './canQueryProject.js'

export const authPolicyFactory = (loaders: ChuckContextLoaders) => ({
  project: {
    query: canQueryProjectPolicyFactory(loaders),
    createComment: canQueryProjectPolicyFactory(loaders)
  }
})

export type AuthPolices = ReturnType<typeof authPolicyFactory>
