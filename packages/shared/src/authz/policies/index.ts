import { ChuckContextLoaders } from '../domain/loaders.js'
import { canQueryProjectPolicyFactory } from './canQueryProject.js'

export const authPolicyFactory = (loaders: ChuckContextLoaders) => ({
  project: {
    query: canQueryProjectPolicyFactory(loaders),
    createComment: canQueryProjectPolicyFactory(loaders)
  }
})

const policies = {} as AuthPolices

const readProject = await policies.project.query({ userId: '', projectId: '' })
if (!readProject.authorized) {
  console.log(readProject.message)
}

const canComment = await policies.project.createComment({ userId: '', projectId: '' })
if (!canComment.authorized) {
  console.log(canComment.message)
}

export type AuthPolices = ReturnType<typeof authPolicyFactory>
