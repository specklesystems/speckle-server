import { merge } from 'lodash'
import { Project } from '../authz/domain/projects/types.js'
import { Comment } from '../authz/domain/comments/types.js'
import { nanoid } from 'nanoid'
import { Model } from '../authz/domain/models/types.js'

export const fakeGetFactory =
  <T extends Record<string, unknown>>(defaults: () => T) =>
  (overrides?: Partial<T>) =>
  (): Promise<T> => {
    if (overrides) {
      return Promise.resolve(merge({}, defaults(), overrides))
    }

    return Promise.resolve(defaults())
  }

export const getProjectFake = fakeGetFactory<Project>(() => ({
  id: nanoid(10),
  isPublic: false,
  isDiscoverable: false,
  workspaceId: null,
  allowPublicComments: false
}))

export const getCommentFake = fakeGetFactory<Comment>(() => ({
  id: nanoid(10),
  authorId: nanoid(10),
  projectId: nanoid(10)
}))

export const getModelFake = fakeGetFactory<Model>(() => ({
  id: nanoid(10),
  projectId: nanoid(10),
  name: nanoid(20),
  authorId: nanoid(10)
}))
