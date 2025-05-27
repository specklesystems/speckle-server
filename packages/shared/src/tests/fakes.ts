import { merge } from '#lodash'
import { Project, ProjectVisibility } from '../authz/domain/projects/types.js'
import { Comment } from '../authz/domain/comments/types.js'
import { nanoid } from 'nanoid'
import { Model } from '../authz/domain/models/types.js'
import { Version } from '../authz/domain/versions/types.js'
import { Workspace } from '../authz/domain/workspaces/types.js'
import { FeatureFlags, parseFeatureFlags } from '../environment/index.js'
import { mapValues } from 'lodash'

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
  visibility: ProjectVisibility.Private,
  workspaceId: null,
  allowPublicComments: false
}))

export const getWorkspaceFake = fakeGetFactory<Workspace>(() => ({
  id: nanoid(10),
  slug: nanoid(10)
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

export const getVersionFake = fakeGetFactory<Version>(() => ({
  id: nanoid(10),
  projectId: nanoid(10),
  authorId: nanoid(10)
}))

export const getEnvFake = (overrides?: Partial<FeatureFlags>) =>
  parseFeatureFlags(mapValues(overrides || {}, (v) => `${v}` as 'true' | 'false'))
