import { merge } from '#lodash'
import { Project, ProjectVisibility } from '../authz/domain/projects/types.js'
import { Comment } from '../authz/domain/comments/types.js'
import { nanoid } from 'nanoid'
import { Model } from '../authz/domain/models/types.js'
import { Version } from '../authz/domain/versions/types.js'
import {
  Workspace,
  WorkspaceSsoProvider,
  WorkspaceSsoSession
} from '../authz/domain/workspaces/types.js'
import { parseFeatureFlags } from '../environment/index.js'
import { mapValues } from 'lodash'
import { WorkspaceFeatureFlags, WorkspacePlan } from '../workspaces/index.js'
import { TIME_MS } from '../core/index.js'
import {
  SavedView,
  SavedViewGroup,
  SavedViewVisibility
} from '../authz/domain/savedViews/types.js'
import { FeatureFlags } from '../environment/featureFlags.js'

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
  slug: nanoid(10),
  isExclusive: false
}))

export const getWorkspacePlanFake = fakeGetFactory<WorkspacePlan>(() => ({
  name: 'team',
  status: 'valid',
  workspaceId: nanoid(10),
  createdAt: new Date(Date.now() - TIME_MS.day),
  updatedAt: new Date(Date.now() - TIME_MS.day),
  featureFlags: WorkspaceFeatureFlags.none
}))

export const getWorkspaceSsoProviderFake = fakeGetFactory<WorkspaceSsoProvider>(() => ({
  providerId: nanoid(10)
}))

export const getWorkspaceSsoSessionFake = fakeGetFactory<WorkspaceSsoSession>(() => ({
  userId: nanoid(10),
  providerId: nanoid(10),
  validUntil: new Date(Date.now() + TIME_MS.day)
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

export const getSavedViewFake = fakeGetFactory<SavedView>(() => ({
  id: nanoid(10),
  name: nanoid(10),
  authorId: nanoid(10),
  projectId: nanoid(10),
  groupId: null,
  visibility: SavedViewVisibility.public,
  resourceIds: [nanoid(10)]
}))

export const getSavedViewGroupFake = fakeGetFactory<SavedViewGroup>(() => ({
  id: nanoid(10),
  name: nanoid(10),
  projectId: nanoid(10),
  resourceIds: [nanoid(10)],
  authorId: nanoid(10)
}))

// eslint-disable-next-line @typescript-eslint/require-await
export const getEnvFake = (overrides?: Partial<FeatureFlags>) => async () =>
  parseFeatureFlags(mapValues(overrides || {}, (v) => `${v}` as 'true' | 'false'))
